import {
  Controller,
  Post,
  Get,
  Delete,
  Param,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  Res,
  Request,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { Response } from 'express';
import { UploadService } from './upload.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { createReadStream } from 'fs';

interface UploadedFileType {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

@Controller('uploads')
@UseGuards(JwtAuthGuard, OrgGuard)
export class UploadController {
  constructor(private uploadService: UploadService) {}

  @Get('list/recent')
  async listRecent(@Request() req: any, @Query('limit') limit?: string) {
    const n = parseInt(limit || '10', 10);
    return this.uploadService.findRecent(
      req.user.organizationId,
      Number.isFinite(n) ? n : 10,
    );
  }

  @Post()
  @UseInterceptors(FileInterceptor('file'))
  async uploadFile(
    @Request() req: any,
    @UploadedFile() file: UploadedFileType,
    @Query('taskId') taskId?: string,
    @Query('projectId') projectId?: string,
  ) {
    return this.uploadService.saveFile(
      file,
      req.user.organizationId,
      taskId,
      projectId,
    );
  }

  @Get('task/:taskId')
  async getTaskFiles(@Request() req: any, @Param('taskId') taskId: string) {
    return this.uploadService.getFilesByTask(taskId, req.user.organizationId);
  }

  @Get('project/:projectId')
  async getProjectFiles(
    @Request() req: any,
    @Param('projectId') projectId: string,
  ) {
    return this.uploadService.getFilesByProject(
      projectId,
      req.user.organizationId,
    );
  }

  @Get(':id')
  async getFile(@Request() req: any, @Param('id') id: string) {
    return this.uploadService.getFile(id, req.user.organizationId);
  }

  @Get(':id/download')
  async downloadFile(
    @Request() req: any,
    @Param('id') id: string,
    @Res() res: Response,
  ) {
    const file = await this.uploadService.getFile(id, req.user.organizationId);

    res.setHeader('Content-Type', file.mimeType);
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="${file.originalName}"`,
    );

    const fileStream = createReadStream(file.path);
    fileStream.pipe(res);
  }

  @Delete(':id')
  async deleteFile(@Request() req: any, @Param('id') id: string) {
    return this.uploadService.deleteFile(id, req.user.organizationId);
  }
}
