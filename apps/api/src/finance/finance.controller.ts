import { Controller, Get, UseGuards, Request } from '@nestjs/common';
import { FinanceService } from './finance.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';

@Controller('finance')
@UseGuards(JwtAuthGuard, OrgGuard)
export class FinanceController {
  constructor(private financeService: FinanceService) {}

  @Get('overview')
  getOverview(@Request() req: any) {
    return this.financeService.getOverview(req.user.organizationId);
  }
}
