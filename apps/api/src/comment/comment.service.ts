import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { EmailService } from '../email/email.service';

/** Erwähnungen im Format <code>@&lt;uuid&gt;</code> (UUID v4). */
function extractMentionedUserIds(content: string): string[] {
  const re =
    /@([0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12})/gi;
  const ids = new Set<string>();
  let m: RegExpExecArray | null;
  while ((m = re.exec(content)) !== null) {
    ids.add(m[1]);
  }
  return [...ids];
}

@Injectable()
export class CommentService {
  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
  ) {}

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

  async create(userId: string, dto: CreateCommentDto, organizationId: string) {
    if (dto.taskId) {
      await this.assertTaskInOrg(dto.taskId, organizationId);
    } else if (dto.projectId) {
      await this.assertProjectInOrg(dto.projectId, organizationId);
    } else {
      throw new BadRequestException('taskId oder projectId erforderlich');
    }

    const comment = await this.prisma.comment.create({
      data: {
        content: dto.content,
        taskId: dto.taskId,
        projectId: dto.projectId,
        userId,
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

    let resourceLabel = 'Aufgabe';
    let path = '/tasks';
    if (dto.taskId) {
      const t = await this.prisma.task.findFirst({
        where: { id: dto.taskId },
        select: { title: true },
      });
      resourceLabel = t?.title ?? resourceLabel;
      path = `/tasks/${dto.taskId}`;
    } else if (dto.projectId) {
      const p = await this.prisma.project.findFirst({
        where: { id: dto.projectId },
        select: { name: true },
      });
      resourceLabel = p?.name ?? 'Projekt';
      path = `/projects/${dto.projectId}`;
    }

    const authorName = comment.user?.name || 'Jemand';
    const mentioned = extractMentionedUserIds(dto.content);
    if (mentioned.length > 0) {
      const valid = await this.prisma.organizationMember.findMany({
        where: { organizationId, userId: { in: mentioned } },
        select: { userId: true },
      });
      const ok = new Set(valid.map((v) => v.userId));
      for (const mid of mentioned) {
        if (mid === userId || !ok.has(mid)) continue;
        void this.emailService.sendCommentMentionEmail(mid, {
          authorName,
          excerpt: dto.content,
          resourceLabel,
          path,
        });
      }
    }

    return comment;
  }

  async findByTask(taskId: string, organizationId: string) {
    await this.assertTaskInOrg(taskId, organizationId);
    return this.prisma.comment.findMany({
      where: { taskId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async findByProject(projectId: string, organizationId: string) {
    await this.assertProjectInOrg(projectId, organizationId);
    return this.prisma.comment.findMany({
      where: { projectId },
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
      orderBy: { createdAt: 'desc' },
    });
  }

  async delete(id: string, userId: string, organizationId: string) {
    const comment = await this.prisma.comment.findUnique({
      where: { id },
    });

    if (!comment) {
      throw new NotFoundException('Kommentar nicht gefunden');
    }

    if (comment.userId !== userId) {
      throw new NotFoundException('Nicht berechtigt');
    }

    if (comment.taskId) {
      await this.assertTaskInOrg(comment.taskId, organizationId);
    } else if (comment.projectId) {
      await this.assertProjectInOrg(comment.projectId, organizationId);
    }

    await this.prisma.comment.delete({
      where: { id },
    });

    return { message: 'Kommentar gelöscht' };
  }
}
