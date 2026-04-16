import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class TagService {
  constructor(private prisma: PrismaService) {}

  async findAll(organizationId: string) {
    return this.prisma.tag.findMany({
      where: { organizationId },
      orderBy: { name: 'asc' },
    });
  }

  async create(
    name: string,
    organizationId: string,
    color: string = '#6366f1',
  ) {
    return this.prisma.tag.create({
      data: { name, color, organizationId },
    });
  }

  async delete(id: string, organizationId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id, organizationId },
    });
    if (!tag) {
      throw new NotFoundException('Tag nicht gefunden');
    }
    await this.prisma.tag.delete({ where: { id } });
    return { message: 'Tag gelöscht' };
  }

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

  private async assertTagInOrg(tagId: string, organizationId: string) {
    const tag = await this.prisma.tag.findFirst({
      where: { id: tagId, organizationId },
    });
    if (!tag) {
      throw new NotFoundException('Tag nicht gefunden');
    }
  }

  async addToTask(taskId: string, tagId: string, organizationId: string) {
    await this.assertTaskInOrg(taskId, organizationId);
    await this.assertTagInOrg(tagId, organizationId);
    return this.prisma.taskTag.create({
      data: { taskId, tagId },
      include: { tag: true },
    });
  }

  async removeFromTask(taskId: string, tagId: string, organizationId: string) {
    await this.assertTaskInOrg(taskId, organizationId);
    await this.prisma.taskTag.deleteMany({
      where: { taskId, tagId },
    });
    return { message: 'Tag entfernt' };
  }

  async getTaskTags(taskId: string, organizationId: string) {
    await this.assertTaskInOrg(taskId, organizationId);
    const taskTags = await this.prisma.taskTag.findMany({
      where: { taskId },
      include: { tag: true },
    });
    return taskTags.map((tt) => tt.tag);
  }

  async addToProject(projectId: string, tagId: string, organizationId: string) {
    await this.assertProjectInOrg(projectId, organizationId);
    await this.assertTagInOrg(tagId, organizationId);
    return this.prisma.projectTag.create({
      data: { projectId, tagId },
      include: { tag: true },
    });
  }

  async removeFromProject(
    projectId: string,
    tagId: string,
    organizationId: string,
  ) {
    await this.assertProjectInOrg(projectId, organizationId);
    await this.prisma.projectTag.deleteMany({
      where: { projectId, tagId },
    });
    return { message: 'Tag entfernt' };
  }

  async getProjectTags(projectId: string, organizationId: string) {
    await this.assertProjectInOrg(projectId, organizationId);
    const projectTags = await this.prisma.projectTag.findMany({
      where: { projectId },
      include: { tag: true },
    });
    return projectTags.map((pt) => pt.tag);
  }
}
