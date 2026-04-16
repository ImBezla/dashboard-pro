import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { TimeEntryService } from './timeentry.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';

@Controller('time-entries')
@UseGuards(JwtAuthGuard, OrgGuard)
export class TimeEntryController {
  constructor(private readonly timeEntryService: TimeEntryService) {}

  @Post()
  create(
    @Request() req: any,
    @Body()
    body: {
      description?: string;
      duration: number;
      taskId?: string;
      projectId?: string;
      date?: string;
    },
  ) {
    return this.timeEntryService.create(
      req.user.id,
      req.user.organizationId,
      body,
    );
  }

  @Get()
  findByUser(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeEntryService.findByUser(
      req.user.id,
      req.user.organizationId,
      startDate,
      endDate,
    );
  }

  @Get('stats')
  getStats(
    @Request() req: any,
    @Query('startDate') startDate?: string,
    @Query('endDate') endDate?: string,
  ) {
    return this.timeEntryService.getStats(
      req.user.id,
      req.user.organizationId,
      startDate,
      endDate,
    );
  }

  @Get('task/:taskId')
  findByTask(@Request() req: any, @Param('taskId') taskId: string) {
    return this.timeEntryService.findByTask(taskId, req.user.organizationId);
  }

  @Get('project/:projectId')
  findByProject(@Request() req: any, @Param('projectId') projectId: string) {
    return this.timeEntryService.findByProject(
      projectId,
      req.user.organizationId,
    );
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Request() req: any,
    @Body() body: { description?: string; duration?: number; date?: string },
  ) {
    return this.timeEntryService.update(
      id,
      req.user.id,
      req.user.organizationId,
      body,
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.timeEntryService.delete(
      id,
      req.user.id,
      req.user.organizationId,
    );
  }
}
