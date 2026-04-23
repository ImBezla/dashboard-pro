import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  Query,
  Request,
} from '@nestjs/common';
import { TaskService } from './task.service';
import { CreateTaskDto } from './dto/create-task.dto';
import { UpdateTaskDto } from './dto/update-task.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { getRequestIp } from '../common/request-ip.util';

@Controller('tasks')
@UseGuards(JwtAuthGuard, OrgGuard)
export class TaskController {
  constructor(private taskService: TaskService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateTaskDto) {
    return this.taskService.create(
      dto,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Get()
  findAll(
    @Request() req: any,
    @Query('status') status?: string,
    @Query('priority') priority?: string,
    @Query('projectId') projectId?: string,
    @Query('assignedToId') assignedToId?: string,
    @Query('search') search?: string,
    @Query('sortBy') sortBy?: string,
    @Query('sortOrder') sortOrder?: 'asc' | 'desc',
  ) {
    return this.taskService.findAll(req.user.organizationId, {
      status,
      priority,
      projectId,
      assignedToId,
      search,
      sortBy: sortBy || 'createdAt',
      sortOrder: sortOrder || 'desc',
    });
  }

  @Post('bulk-update')
  bulkUpdate(
    @Request() req: any,
    @Body() body: { taskIds: string[]; data: UpdateTaskDto },
  ) {
    return this.taskService.bulkUpdate(
      body.taskIds,
      body.data,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Post('bulk-delete')
  bulkDelete(@Request() req: any, @Body() body: { taskIds: string[] }) {
    return this.taskService.bulkDelete(
      body.taskIds,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Post(':id/nudge')
  nudge(@Request() req: any, @Param('id') id: string) {
    return this.taskService.nudgeAssignee(
      id,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Get(':id')
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.taskService.findOne(id, req.user.organizationId);
  }

  @Patch(':id')
  update(
    @Request() req: any,
    @Param('id') id: string,
    @Body() dto: UpdateTaskDto,
  ) {
    return this.taskService.update(
      id,
      dto,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }

  @Delete(':id')
  remove(@Request() req: any, @Param('id') id: string) {
    return this.taskService.remove(
      id,
      req.user.organizationId,
      req.user.id,
      getRequestIp(req),
    );
  }
}
