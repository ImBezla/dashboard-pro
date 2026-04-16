import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TimeEntryService {
  constructor(private prisma: PrismaService) {}

  private async assertTaskInOrg(taskId: string, organizationId: string) {
    const t = await this.prisma.task.findFirst({
      where: { id: taskId, project: { organizationId } },
    });
    if (!t) {
      throw new NotFoundException('Aufgabe nicht gefunden');
    }
  }

  private async assertProjectInOrg(projectId: string, organizationId: string) {
    const p = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!p) {
      throw new NotFoundException('Projekt nicht gefunden');
    }
  }

  async create(
    userId: string,
    organizationId: string,
    data: {
      description?: string;
      duration: number;
      taskId?: string;
      projectId?: string;
      date?: string;
    },
  ) {
    if (data.taskId) {
      await this.assertTaskInOrg(data.taskId, organizationId);
    } else if (data.projectId) {
      await this.assertProjectInOrg(data.projectId, organizationId);
    } else {
      throw new BadRequestException('taskId oder projectId erforderlich');
    }

    return this.prisma.timeEntry.create({
      data: {
        description: data.description,
        duration: data.duration,
        date: data.date ? new Date(data.date) : new Date(),
        taskId: data.taskId,
        projectId: data.projectId,
        userId,
      },
      include: {
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
        user: { select: { id: true, name: true } },
      },
    });
  }

  async findByUser(
    userId: string,
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const dateFilter: any = {};
    if (startDate || endDate) {
      dateFilter.date = {};
      if (startDate) dateFilter.date.gte = new Date(startDate);
      if (endDate) dateFilter.date.lte = new Date(endDate);
    }

    return this.prisma.timeEntry.findMany({
      where: {
        userId,
        AND: [
          {
            OR: [
              { task: { project: { organizationId } } },
              { project: { organizationId } },
            ],
          },
          ...(Object.keys(dateFilter).length ? [dateFilter] : []),
        ],
      },
      include: {
        task: { select: { id: true, title: true } },
        project: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByTask(taskId: string, organizationId: string) {
    await this.assertTaskInOrg(taskId, organizationId);
    return this.prisma.timeEntry.findMany({
      where: { taskId },
      include: {
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  async findByProject(projectId: string, organizationId: string) {
    await this.assertProjectInOrg(projectId, organizationId);
    return this.prisma.timeEntry.findMany({
      where: { projectId },
      include: {
        task: { select: { id: true, title: true } },
        user: { select: { id: true, name: true } },
      },
      orderBy: { date: 'desc' },
    });
  }

  private async assertEntryOwnedInOrg(
    id: string,
    userId: string,
    organizationId: string,
  ) {
    const entry = await this.prisma.timeEntry.findFirst({
      where: { id, userId },
      include: {
        task: { include: { project: true } },
        project: true,
      },
    });
    if (!entry) {
      throw new NotFoundException('Zeiteintrag nicht gefunden');
    }
    const ok =
      entry.task?.project?.organizationId === organizationId ||
      entry.project?.organizationId === organizationId;
    if (!ok) {
      throw new NotFoundException('Zeiteintrag nicht gefunden');
    }
    return entry;
  }

  async update(
    id: string,
    userId: string,
    organizationId: string,
    data: { description?: string; duration?: number; date?: string },
  ) {
    await this.assertEntryOwnedInOrg(id, userId, organizationId);
    return this.prisma.timeEntry.updateMany({
      where: { id, userId },
      data: {
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.duration !== undefined && { duration: data.duration }),
        ...(data.date && { date: new Date(data.date) }),
      },
    });
  }

  async delete(id: string, userId: string, organizationId: string) {
    await this.assertEntryOwnedInOrg(id, userId, organizationId);
    await this.prisma.timeEntry.deleteMany({
      where: { id, userId },
    });
    return { message: 'Zeiteintrag gelöscht' };
  }

  async getStats(
    userId: string,
    organizationId: string,
    startDate?: string,
    endDate?: string,
  ) {
    const entries = await this.findByUser(
      userId,
      organizationId,
      startDate,
      endDate,
    );

    const totalMinutes = entries.reduce((sum, e) => sum + e.duration, 0);
    const byProject = entries.reduce((acc: any, e) => {
      const key = e.projectId || 'none';
      if (!acc[key]) {
        acc[key] = {
          projectId: e.projectId,
          projectName: e.project?.name || 'Kein Projekt',
          minutes: 0,
        };
      }
      acc[key].minutes += e.duration;
      return acc;
    }, {});

    return {
      totalMinutes,
      totalHours: Math.round((totalMinutes / 60) * 10) / 10,
      entriesCount: entries.length,
      byProject: Object.values(byProject),
    };
  }
}
