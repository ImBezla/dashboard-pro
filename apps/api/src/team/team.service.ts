import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTeamDto } from './dto/create-team.dto';
import { AddMemberDto } from './dto/add-member.dto';
import { defaultTeamSyncRequired } from './team-default-sync.policy';

@Injectable()
export class TeamService {
  constructor(private prisma: PrismaService) {}

  /**
   * Bestehende Workspaces: sicherstellen, dass es genau ein Hauptteam gibt und
   * alle Organisationsmitglieder dort als TeamMember vorkommen (Backfill bei GET /team).
   */
  private async ensureDefaultTeamAndOrgMembers(organizationId: string) {
    await this.prisma.$transaction(async (tx) => {
      let defaultTeams = await tx.team.findMany({
        where: { organizationId, defaultMemberTeam: true },
        orderBy: { createdAt: 'asc' },
      });
      if (defaultTeams.length > 1) {
        const keep = defaultTeams[0]!;
        await tx.team.updateMany({
          where: {
            organizationId,
            defaultMemberTeam: true,
            id: { not: keep.id },
          },
          data: { defaultMemberTeam: false },
        });
        defaultTeams = [keep];
      }

      let defaultTeam = defaultTeams[0] ?? null;

      if (!defaultTeam) {
        const oldest = await tx.team.findFirst({
          where: { organizationId },
          orderBy: { createdAt: 'asc' },
        });
        if (oldest) {
          await tx.team.updateMany({
            where: { organizationId },
            data: { defaultMemberTeam: false },
          });
          defaultTeam = await tx.team.update({
            where: { id: oldest.id },
            data: { defaultMemberTeam: true },
          });
        } else {
          const org = await tx.organization.findUnique({
            where: { id: organizationId },
            select: { name: true },
          });
          defaultTeam = await tx.team.create({
            data: {
              name: `${org?.name?.trim() || 'Workspace'} — Hauptteam`,
              organizationId,
              defaultMemberTeam: true,
            },
          });
        }
      }

      const orgMembers = await tx.organizationMember.findMany({
        where: { organizationId },
        select: { userId: true, role: true },
      });
      if (orgMembers.length === 0) return;

      const existingRows = await tx.teamMember.findMany({
        where: { teamId: defaultTeam.id },
        select: { userId: true },
      });
      const existingUserIds = new Set(existingRows.map((r) => r.userId));
      const missing = orgMembers.filter((m) => !existingUserIds.has(m.userId));
      if (missing.length > 0) {
        await tx.teamMember.createMany({
          data: missing.map((m) => ({
            teamId: defaultTeam.id,
            userId: m.userId,
            role: 'MEMBER',
          })),
          skipDuplicates: true,
        });
      }

      const managerUserIds = orgMembers
        .filter((m) => m.role === 'OWNER' || m.role === 'ADMIN')
        .map((m) => m.userId);
      if (managerUserIds.length > 0) {
        await tx.teamMember.updateMany({
          where: {
            teamId: defaultTeam.id,
            userId: { in: managerUserIds },
          },
          data: { role: 'MANAGER' },
        });
      }
    });
  }

  private async shouldRunDefaultTeamSync(organizationId: string): Promise<boolean> {
    const [orgCount, defaultTeams] = await Promise.all([
      this.prisma.organizationMember.count({ where: { organizationId } }),
      this.prisma.team.findMany({
        where: { organizationId, defaultMemberTeam: true },
        select: { id: true },
        orderBy: { createdAt: 'asc' },
      }),
    ]);
    const defaultCount = defaultTeams.length;
    if (defaultCount !== 1) {
      return defaultTeamSyncRequired({
        organizationMemberCount: orgCount,
        defaultMemberTeamCount: defaultCount,
        membersOnCanonicalDefaultTeam: 0,
      });
    }
    const tmCount = await this.prisma.teamMember.count({
      where: { teamId: defaultTeams[0]!.id },
    });
    return defaultTeamSyncRequired({
      organizationMemberCount: orgCount,
      defaultMemberTeamCount: defaultCount,
      membersOnCanonicalDefaultTeam: tmCount,
    });
  }

  private async maybeEnsureDefaultTeamAndOrgMembers(organizationId: string) {
    if (await this.shouldRunDefaultTeamSync(organizationId)) {
      await this.ensureDefaultTeamAndOrgMembers(organizationId);
    }
  }

  async create(dto: CreateTeamDto, organizationId: string) {
    return this.prisma.team.create({
      data: {
        name: dto.name,
        organizationId,
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
              },
            },
          },
        },
      },
    });
  }

  async findAll(organizationId: string) {
    await this.maybeEnsureDefaultTeamAndOrgMembers(organizationId);
    return this.prisma.team.findMany({
      where: { organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        projects: true,
      },
    });
  }

  async findOne(id: string, organizationId: string) {
    await this.maybeEnsureDefaultTeamAndOrgMembers(organizationId);
    const team = await this.prisma.team.findFirst({
      where: { id, organizationId },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                name: true,
                email: true,
                avatar: true,
                role: true,
              },
            },
          },
        },
        projects: {
          include: {
            tasks: true,
          },
        },
      },
    });

    if (!team) {
      throw new NotFoundException(`Team with ID ${id} not found`);
    }

    return team;
  }

  async addMember(teamId: string, dto: AddMemberDto, organizationId: string) {
    await this.findOne(teamId, organizationId);

    const orgMember = await this.prisma.organizationMember.findFirst({
      where: { userId: dto.userId, organizationId },
    });
    if (!orgMember) {
      throw new BadRequestException(
        'Nutzer ist kein Mitglied des Workspace — zuerst per Einladungscode beitreten.',
      );
    }

    return this.prisma.teamMember.create({
      data: {
        teamId,
        userId: dto.userId,
        role: dto.role,
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async updateMember(memberId: string, role: string, organizationId: string) {
    const member = await this.prisma.teamMember.findFirst({
      where: { id: memberId, team: { organizationId } },
    });
    if (!member) {
      throw new NotFoundException('Team-Mitglied nicht gefunden');
    }
    return this.prisma.teamMember.update({
      where: { id: memberId },
      data: { role },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });
  }

  async removeMember(memberId: string, organizationId: string) {
    const member = await this.prisma.teamMember.findFirst({
      where: { id: memberId, team: { organizationId } },
    });
    if (!member) {
      throw new NotFoundException('Team-Mitglied nicht gefunden');
    }
    await this.prisma.teamMember.delete({
      where: { id: memberId },
    });

    return { message: 'Member removed successfully' };
  }
}
