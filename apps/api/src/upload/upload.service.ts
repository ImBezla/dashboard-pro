import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { unlink } from 'fs/promises';

interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

@Injectable()
export class UploadService {
  constructor(private prisma: PrismaService) {}

  async saveFile(
    file: UploadedFile,
    organizationId: string,
    taskId?: string,
    projectId?: string,
  ) {
    if (taskId) {
      const task = await this.prisma.task.findFirst({
        where: { id: taskId, project: { organizationId } },
      });
      if (!task) {
        throw new NotFoundException('Aufgabe nicht gefunden');
      }
    } else if (projectId) {
      const project = await this.prisma.project.findFirst({
        where: { id: projectId, organizationId },
      });
      if (!project) {
        throw new NotFoundException('Projekt nicht gefunden');
      }
    } else {
      throw new BadRequestException('taskId oder projectId erforderlich');
    }

    return this.prisma.fileAttachment.create({
      data: {
        filename: file.filename,
        originalName: file.originalname,
        mimeType: file.mimetype,
        size: file.size,
        path: file.path,
        taskId,
        projectId,
        organizationId,
      },
    });
  }

  async getFilesByTask(taskId: string, organizationId: string) {
    const task = await this.prisma.task.findFirst({
      where: { id: taskId, project: { organizationId } },
    });
    if (!task) {
      throw new NotFoundException('Aufgabe nicht gefunden');
    }
    return this.prisma.fileAttachment.findMany({
      where: { taskId, organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getFilesByProject(projectId: string, organizationId: string) {
    const project = await this.prisma.project.findFirst({
      where: { id: projectId, organizationId },
    });
    if (!project) {
      throw new NotFoundException('Projekt nicht gefunden');
    }
    return this.prisma.fileAttachment.findMany({
      where: { projectId, organizationId },
      orderBy: { createdAt: 'desc' },
    });
  }

  async findRecent(organizationId: string, limit = 10) {
    const take = Math.min(Math.max(limit, 1), 50);
    return this.prisma.fileAttachment.findMany({
      where: { organizationId },
      orderBy: { createdAt: 'desc' },
      take,
    });
  }

  async getFile(id: string, organizationId: string) {
    const file = await this.prisma.fileAttachment.findFirst({
      where: { id, organizationId },
    });

    if (!file) {
      throw new NotFoundException('File not found');
    }

    return file;
  }

  async deleteFile(id: string, organizationId: string) {
    const file = await this.getFile(id, organizationId);

    try {
      await unlink(file.path);
    } catch (error) {
      console.error('Failed to delete file from disk:', error);
    }

    await this.prisma.fileAttachment.delete({
      where: { id },
    });

    return { message: 'File deleted successfully' };
  }
}
