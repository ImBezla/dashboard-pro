import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class UserService {
  constructor(private prisma: PrismaService) {}

  async findAllForOrganization(organizationId: string) {
    const members = await this.prisma.organizationMember.findMany({
      where: { organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });
    return members.map((m) => ({
      ...m.user,
      orgRole: m.role,
    }));
  }

  async findOne(id: string) {
    return this.prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  async findOneInOrganization(id: string, organizationId: string) {
    const member = await this.prisma.organizationMember.findFirst({
      where: { userId: id, organizationId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
            role: true,
            avatar: true,
            createdAt: true,
          },
        },
      },
    });
    if (!member) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }
    return {
      ...member.user,
      orgRole: member.role,
    };
  }

  async update(
    id: string,
    data: { name?: string; email?: string; avatar?: string },
  ) {
    const payload: { name?: string; email?: string; avatar?: string | null } = { ...data };
    if (data.avatar !== undefined) {
      const trimmed = data.avatar?.trim();
      payload.avatar = trimmed && trimmed.length > 0 ? trimmed : null;
    }
    return this.prisma.user.update({
      where: { id },
      data: payload,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    });
  }

  /** DSGVO-orientierter Export personenbezogener Daten (ohne Passwort-Hash). */
  async buildPersonalDataExport(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        createdAt: true,
        updatedAt: true,
        emailVerifiedAt: true,
      },
    });
    if (!user) {
      throw new NotFoundException('Benutzer nicht gefunden');
    }

    const membership = await this.prisma.organizationMember.findFirst({
      where: { userId },
      include: {
        organization: {
          select: { id: true, name: true, createdAt: true },
        },
      },
    });

    const assignedTasks = await this.prisma.task.findMany({
      where: { assignedToId: userId },
      take: 50,
      orderBy: { updatedAt: 'desc' },
      select: {
        id: true,
        title: true,
        status: true,
        updatedAt: true,
        projectId: true,
      },
    });

    const commentsWritten = await this.prisma.comment.count({
      where: { userId },
    });

    const timeEntries = await this.prisma.timeEntry.findMany({
      where: { userId },
      take: 40,
      orderBy: { createdAt: 'desc' },
      select: {
        id: true,
        duration: true,
        date: true,
        description: true,
        createdAt: true,
        taskId: true,
        projectId: true,
      },
    });

    const calendarEvents = await this.prisma.calendarEvent.findMany({
      where: { userId },
      take: 30,
      orderBy: { startDate: 'desc' },
      select: {
        id: true,
        title: true,
        startDate: true,
        endDate: true,
        organizationId: true,
      },
    });

    return {
      exportVersion: 1,
      exportedAt: new Date().toISOString(),
      user,
      organizationMembership: membership,
      assignedTasksSample: assignedTasks,
      aggregates: {
        commentsWritten,
        timeEntriesReturned: timeEntries.length,
        calendarEventsReturned: calendarEvents.length,
      },
      timeEntriesSample: timeEntries,
      calendarEventsSample: calendarEvents,
    };
  }
}
