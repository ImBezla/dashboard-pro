import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { NotificationsGateway } from '../notifications/notifications.gateway';
import { ActivityService } from '../activity/activity.service';
import { EmailService } from '../email/email.service';

@Injectable()
export class TaskService {
  constructor(
    private prisma: PrismaService,
    private notificationsGateway: NotificationsGateway,
    private activityService: ActivityService,
    private emailService: EmailService,
  ) {}

  private async assertProjectInOrg(
    projectId: string | null | undefined,
    organizationId: string,
  ) {
    if (!projectId) {
      throw new BadRequestException(
        'Aufgaben benötigen ein Projekt in deinem Arbeitsbereich.',
      );
    }
    const p = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!p) {
      throw new NotFoundException('Projekt nicht gefunden');
    }
  }

  async create(dto: CreateTaskDto, organizationId: string) {
    await this.assertProjectInOrg(dto.projectId, organizationId);

    const task = await this.prisma.task.create({
      data: {
        title: dto.title,
        description: dto.description,
        status: dto.status,
        priority: dto.priority,
        deadline: dto.deadline ? new Date(dto.deadline) : null,
        projectId: dto.projectId,
        assignedToId: dto.assignedToId,
      },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    this.notificationsGateway.emitTaskCreated(task);

    await this.activityService.create({
      type: 'TASK_CREATED',
      userId: dto.assignedToId || null,
      resourceType: 'Task',
      resourceId: task.id,
      metadata: JSON.stringify({
        title: task.title,
        projectId: task.projectId,
      }),
      organizationId,
    });

    if (dto.assignedToId) {
      void this.emailService.sendTaskAssignedEmail(dto.assignedToId, task.id);
    }

    return task;
  }

  async findAll(
    organizationId: string,
    options?: {
      status?: string;
      priority?: string;
      projectId?: string;
      assignedToId?: string;
      search?: string;
      sortBy?: string;
      sortOrder?: 'asc' | 'desc';
    },
  ) {
    const parts: any[] = [{ project: { organizationId } }];

    if (options?.status) {
      parts.push({ status: options.status });
    }
    if (options?.priority) {
      parts.push({ priority: options.priority });
    }
    if (options?.projectId) {
      parts.push({ projectId: options.projectId });
    }
    if (options?.assignedToId) {
      parts.push({ assignedToId: options.assignedToId });
    }
    if (options?.search) {
      parts.push({
        OR: [
          { title: { contains: options.search } },
          { description: { contains: options.search } },
        ],
      });
    }

    const orderBy: any = {};
    if (options?.sortBy) {
      orderBy[options.sortBy] = options.sortOrder || 'desc';
    } else {
      orderBy.createdAt = 'desc';
    }

    return this.prisma.task.findMany({
      where: { AND: parts },
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
      orderBy,
    });
  }

  async findOne(id: string, organizationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id, project: { organizationId } },
      include: {
        project: {
          include: {
            team: true,
          },
        },
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    if (!task) {
      throw new NotFoundException(`Task with ID ${id} not found`);
    }

    return task;
  }

  async update(id: string, dto: UpdateTaskDto, organizationId: string) {
    await this.findOne(id, organizationId);
    const before = await this.prisma.task.findFirst({
      where: { id, project: { organizationId } },
      select: { assignedToId: true },
    });
    if (dto.projectId !== undefined) {
      await this.assertProjectInOrg(dto.projectId, organizationId);
    }

    const updateData: any = {};
    if (dto.title !== undefined) updateData.title = dto.title;
    if (dto.description !== undefined) updateData.description = dto.description;
    if (dto.status !== undefined) updateData.status = dto.status;
    if (dto.priority !== undefined) updateData.priority = dto.priority;
    if (dto.deadline !== undefined) {
      updateData.deadline = dto.deadline
        ? new Date(dto.deadline)
        : dto.deadline;
    }
    if (dto.projectId !== undefined) updateData.projectId = dto.projectId;
    if (dto.assignedToId !== undefined)
      updateData.assignedToId = dto.assignedToId;

    const task = await this.prisma.task.update({
      where: { id },
      data: updateData,
      include: {
        project: true,
        assignedTo: {
          select: {
            id: true,
            name: true,
            email: true,
            avatar: true,
          },
        },
      },
    });

    this.notificationsGateway.emitTaskUpdated(task);

    await this.activityService.create({
      type: 'TASK_UPDATED',
      userId: task.assignedToId || null,
      resourceType: 'Task',
      resourceId: task.id,
      metadata: JSON.stringify({ title: task.title, status: task.status }),
      organizationId,
    });

    if (task.assignedToId && task.assignedToId !== before?.assignedToId) {
      void this.emailService.sendTaskAssignedEmail(task.assignedToId, task.id);
    }

    return task;
  }

  async remove(id: string, organizationId: string) {
    const task = await this.findOne(id, organizationId);

    await this.prisma.task.delete({
      where: { id },
    });

    this.notificationsGateway.emitTaskDeleted(id, organizationId);

    await this.activityService.create({
      type: 'TASK_DELETED',
      userId: task.assignedToId || null,
      resourceType: 'Task',
      resourceId: id,
      metadata: JSON.stringify({ title: task.title }),
      organizationId,
    });

    return { message: 'Task deleted successfully' };
  }

  async bulkUpdate(
    taskIds: string[],
    data: UpdateTaskDto,
    organizationId: string,
  ) {
    const updateData: any = {};

    if (data.title !== undefined) updateData.title = data.title;
    if (data.description !== undefined)
      updateData.description = data.description;
    if (data.status !== undefined) updateData.status = data.status;
    if (data.priority !== undefined) updateData.priority = data.priority;
    if (data.deadline !== undefined) {
      updateData.deadline = data.deadline ? new Date(data.deadline) : null;
    }
    if (data.projectId !== undefined) updateData.projectId = data.projectId;
    if (data.assignedToId !== undefined)
      updateData.assignedToId = data.assignedToId;

    if (data.projectId !== undefined) {
      await this.assertProjectInOrg(data.projectId, organizationId);
    }

    const result = await this.prisma.task.updateMany({
      where: {
        id: { in: taskIds },
        project: { organizationId },
      },
      data: updateData,
    });

    const updatedTasks = await this.prisma.task.findMany({
      where: { id: { in: taskIds }, project: { organizationId } },
    });

    updatedTasks.forEach((task) => {
      this.notificationsGateway.emitTaskUpdated(task, organizationId);
    });

    return {
      count: result.count,
      message: `${result.count} tasks updated successfully`,
    };
  }

  async bulkDelete(taskIds: string[], organizationId: string) {
    const result = await this.prisma.task.deleteMany({
      where: {
        id: { in: taskIds },
        project: { organizationId },
      },
    });

    taskIds.forEach((id) => {
      this.notificationsGateway.emitTaskDeleted(id, organizationId);
    });

    return {
      count: result.count,
      message: `${result.count} tasks deleted successfully`,
    };
  }
}
