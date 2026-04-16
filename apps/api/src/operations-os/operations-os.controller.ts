import { Body, Controller, Get, Put, Request, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { OperationsOsService } from './operations-os.service';

/** Persistenter Flow-Workspace pro Organisation (früher unter `/operations-os`). */
@Controller('flow')
@UseGuards(JwtAuthGuard, OrgGuard)
export class OperationsOsController {
  constructor(private readonly operationsOsService: OperationsOsService) {}

  @Get('workspace')
  getWorkspace(@Request() req: { user: { organizationId: string } }) {
    return this.operationsOsService.getWorkspace(req.user.organizationId);
  }

  @Put('workspace')
  putWorkspace(
    @Request() req: { user: { organizationId: string } },
    @Body() body: unknown,
  ) {
    return this.operationsOsService.putWorkspace(req.user.organizationId, body);
  }
}
