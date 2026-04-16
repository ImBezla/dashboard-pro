import {
  Controller,
  Get,
  Post,
  Delete,
  Body,
  Param,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TagService } from './tag.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';

@Controller('tags')
@UseGuards(JwtAuthGuard, OrgGuard)
export class TagController {
  constructor(private readonly tagService: TagService) {}

  @Get()
  findAll(@Request() req: any) {
    return this.tagService.findAll(req.user.organizationId);
  }

  @Post()
  create(@Request() req: any, @Body() body: { name: string; color?: string }) {
    return this.tagService.create(
      body.name,
      req.user.organizationId,
      body.color,
    );
  }

  @Delete(':id')
  delete(@Request() req: any, @Param('id') id: string) {
    return this.tagService.delete(id, req.user.organizationId);
  }

  @Get('task/:taskId')
  getTaskTags(@Request() req: any, @Param('taskId') taskId: string) {
    return this.tagService.getTaskTags(taskId, req.user.organizationId);
  }

  @Post('task/:taskId/:tagId')
  addToTask(
    @Request() req: any,
    @Param('taskId') taskId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagService.addToTask(taskId, tagId, req.user.organizationId);
  }

  @Delete('task/:taskId/:tagId')
  removeFromTask(
    @Request() req: any,
    @Param('taskId') taskId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagService.removeFromTask(
      taskId,
      tagId,
      req.user.organizationId,
    );
  }

  @Get('project/:projectId')
  getProjectTags(@Request() req: any, @Param('projectId') projectId: string) {
    return this.tagService.getProjectTags(projectId, req.user.organizationId);
  }

  @Post('project/:projectId/:tagId')
  addToProject(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagService.addToProject(
      projectId,
      tagId,
      req.user.organizationId,
    );
  }

  @Delete('project/:projectId/:tagId')
  removeFromProject(
    @Request() req: any,
    @Param('projectId') projectId: string,
    @Param('tagId') tagId: string,
  ) {
    return this.tagService.removeFromProject(
      projectId,
      tagId,
      req.user.organizationId,
    );
  }
}
