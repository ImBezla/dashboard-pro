import {
  Controller,
  Get,
  UseGuards,
  Query,
  Res,
  Request,
} from '@nestjs/common';
import { ReportsService } from './reports.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { Response } from 'express';

@Controller('reports')
@UseGuards(JwtAuthGuard, OrgGuard)
export class ReportsController {
  constructor(private reportsService: ReportsService) {}

  @Get('financial')
  getFinancialReport(
    @Request() req: any,
    @Query('timeRange') timeRange?: 'week' | 'month' | 'quarter' | 'year',
  ) {
    return this.reportsService.getFinancialReport(
      req.user.organizationId,
      timeRange || 'month',
    );
  }

  @Get('export')
  async exportReport(
    @Request() req: any,
    @Query('type') type: string,
    @Query('format') format: 'pdf' | 'excel' | 'csv',
    @Res() res: Response,
  ) {
    if (format === 'csv') {
      const csv = await this.reportsService.exportReport(
        req.user.organizationId,
        type,
        'csv',
      );
      const filename = `${type}-${Date.now()}.csv`;

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', `attachment; filename=${filename}`);
      res.send('\ufeff' + csv);
      return;
    }

    return {
      message: `Export als ${format.toUpperCase()} wird vorbereitet...`,
      note: 'PDF und Excel Export erfordern zusätzliche Bibliotheken',
    };
  }
}
