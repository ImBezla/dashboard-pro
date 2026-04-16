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
import { CommentService } from './comment.service';
import { CreateCommentDto } from './dto/create-comment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';

@Controller('comments')
@UseGuards(JwtAuthGuard, OrgGuard)
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  @Post()
  create(@Request() req: any, @Body() dto: CreateCommentDto) {
    return this.commentService.create(
      req.user.id,
      dto,
      req.user.organizationId,
    );
  }

  @Get('task/:taskId')
  findByTask(@Request() req: any, @Param('taskId') taskId: string) {
    return this.commentService.findByTask(taskId, req.user.organizationId);
  }

  @Get('project/:projectId')
  findByProject(@Request() req: any, @Param('projectId') projectId: string) {
    return this.commentService.findByProject(
      projectId,
      req.user.organizationId,
    );
  }

  @Delete(':id')
  delete(@Param('id') id: string, @Request() req: any) {
    return this.commentService.delete(id, req.user.id, req.user.organizationId);
  }
}
