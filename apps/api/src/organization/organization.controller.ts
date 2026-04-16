import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { OrganizationService } from './organization.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { JoinOrganizationDto } from './dto/join-organization.dto';
import { UpdateOrgPackDto } from './dto/update-org-pack.dto';
import { UpdateOrgModulesDto } from './dto/update-org-modules.dto';
import { SuggestModulesDto } from './dto/suggest-modules.dto';
import { UpdateWorkspaceAppearanceDto } from './dto/update-workspace-appearance.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { AuditService } from '../audit/audit.service';
import { getRequestIp } from '../common/request-ip.util';

@Controller('organizations')
export class OrganizationController {
  constructor(
    private organizationService: OrganizationService,
    private auditService: AuditService,
  ) {}

  @Throttle({ default: { limit: 12, ttl: 3_600_000 } })
  @UseGuards(JwtAuthGuard)
  @Post()
  create(@Request() req: any, @Body() dto: CreateOrganizationDto) {
    return this.organizationService.createForUser(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Post('join')
  join(@Request() req: any, @Body() dto: JoinOrganizationDto) {
    return this.organizationService.joinWithCode(req.user.id, dto);
  }

  @UseGuards(JwtAuthGuard)
  @Get('workspace')
  workspace(@Request() req: any) {
    return this.organizationService.getWorkspaceForUser(
      req.user.id,
      req.user.organizationId ?? null,
      req.user.orgRole ?? null,
    );
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post('workspace/regenerate-code')
  async regenerateCode(@Request() req: any) {
    const out = await this.organizationService.regenerateJoinCode(
      req.user.id,
      req.user.organizationId,
      req.user.orgRole,
    );
    await this.auditService.log({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'workspace.join_code.regenerate',
      ipAddress: getRequestIp(req),
    });
    return out;
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch('workspace/pack')
  async updatePack(@Request() req: any, @Body() dto: UpdateOrgPackDto) {
    const out = await this.organizationService.updateOrgPack(
      req.user.id,
      req.user.organizationId,
      req.user.orgRole,
      dto,
    );
    await this.auditService.log({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'workspace.pack.update',
      metadata: { packId: dto.packId },
      ipAddress: getRequestIp(req),
    });
    return out;
  }

  @Throttle({ default: { limit: 45, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Post('workspace/suggest-modules')
  suggestModules(@Body() dto: SuggestModulesDto) {
    return this.organizationService.suggestModulesFromQuestionnaire(dto);
  }

  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch('workspace/modules')
  async updateModules(@Request() req: any, @Body() dto: UpdateOrgModulesDto) {
    const out = await this.organizationService.updateOrgModules(
      req.user.id,
      req.user.organizationId,
      req.user.orgRole,
      dto,
    );
    await this.auditService.log({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'workspace.modules.update',
      metadata: { count: dto.modules?.length ?? 0 },
      ipAddress: getRequestIp(req),
    });
    return out;
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Patch('workspace/appearance')
  async updateAppearance(
    @Request() req: any,
    @Body() dto: UpdateWorkspaceAppearanceDto,
  ) {
    const out = await this.organizationService.updateWorkspaceAppearance(
      req.user.id,
      req.user.organizationId,
      req.user.orgRole,
      dto,
    );
    await this.auditService.log({
      userId: req.user.id,
      organizationId: req.user.organizationId,
      action: 'workspace.appearance.update',
      metadata: { fields: Object.keys(dto) },
      ipAddress: getRequestIp(req),
    });
    return out;
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @UseGuards(JwtAuthGuard, OrgGuard)
  @Get('workspace/security-audit-log')
  async securityAuditLog(@Request() req: any) {
    if (req.user.orgRole !== 'OWNER' && req.user.orgRole !== 'ADMIN') {
      throw new ForbiddenException(
        'Keine Berechtigung für das Sicherheitsprotokoll.',
      );
    }
    return this.auditService.listForOrganization(req.user.organizationId, 80);
  }
}
