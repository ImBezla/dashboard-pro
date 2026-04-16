import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateProjectDto } from './dto/create-project.dto';
import { UpdateProjectDto } from './dto/update-project.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { EmailService } from '../email/email.service';

@Injectable()
export class ProjectService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private emailService: EmailService,
  ) {}

  async create(dto: CreateProjectDto, organizationId: string) {
    if (dto.teamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: dto.teamId, organizationId },
      });
      if (!team) {
        throw new NotFoundException('Team nicht gefunden');
      }
    }
    const project = await this.prisma.project.create({
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status || 'ACTIVE',
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        teamId: dto.teamId,
        organizationId,
      },
      include: {
        team: true,
        tasks: true,
      },
    });
    this.notificationsGateway.emitProjectCreated(project);
    return project;
  }

  async findAll(organizationId: string) {
    return this.prisma.project.findMany({
      where: { organizationId },
      include: {
        team: true,
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findOne(id: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id, organizationId },
      include: {
        team: {
          include: {
            members: {
              include: {
                user: {
                  select: { id: true, name: true, email: true, avatar: true },
                },
              },
            },
          },
        },
        tasks: {
          include: {
            assignedTo: {
              select: { id: true, name: true, email: true },
            },
          },
        },
      },
    });

    if (!project) {
      throw new NotFoundException(`Project with ID ${id} not found`);
    }

    return project;
  }

  async update(
    id: string,
    dto: UpdateProjectDto,
    organizationId: string,
    actorUserId: string,
  ) {
    const existing = await this.findOne(id, organizationId);
    if (dto.teamId) {
      const team = await this.prisma.team.findFirst({
        where: { id: dto.teamId, organizationId },
      });
      if (!team) {
        throw new NotFoundException('Team nicht gefunden');
      }
    }
    const project = await this.prisma.project.update({
      where: { id },
      data: {
        name: dto.name,
        description: dto.description,
        status: dto.status,
        deadline: dto.deadline ? new Date(dto.deadline) : undefined,
        teamId: dto.teamId,
      },
      include: {
        team: true,
        tasks: true,
      },
    });

    const parts: string[] = [];
    if (dto.name !== undefined && dto.name !== existing.name) {
      parts.push(`Name geändert`);
    }
    if (dto.description !== undefined && dto.description !== existing.description) {
      parts.push(`Beschreibung angepasst`);
    }
    if (dto.status !== undefined && dto.status !== existing.status) {
      parts.push(`Status: ${dto.status}`);
    }
    if (dto.deadline !== undefined) {
      const prev = existing.deadline
        ? new Date(existing.deadline).toISOString()
        : '';
      const next = dto.deadline ? new Date(dto.deadline).toISOString() : '';
      if (prev !== next) parts.push(`Deadline angepasst`);
    }
    if (dto.teamId !== undefined && dto.teamId !== existing.teamId) {
      parts.push(`Team geändert`);
    }
    if (parts.length > 0) {
      const summary = parts.join(' · ');
      const members = await this.prisma.organizationMember.findMany({
        where: { organizationId },
        select: { userId: true },
      });
      for (const { userId } of members) {
        if (userId === actorUserId) continue;
        void this.emailService.sendProjectUpdateEmail(userId, id, summary);
      }
    }

    this.notificationsGateway.emitProjectUpdated(project);
    return project;
  }

  async remove(id: string, organizationId: string) {
    await this.findOne(id, organizationId);
    await this.prisma.project.delete({ where: { id } });
    this.notificationsGateway.emitProjectDeleted(id, organizationId);
    return { message: 'Project deleted successfully' };
  }
}
