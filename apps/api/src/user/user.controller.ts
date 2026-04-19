import {
  Controller,
  Get,
  Param,
  Patch,
  Body,
  UseGuards,
  Request,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { UserService } from './user.service';
import { OrganizationService } from '../organization/organization.service';
import { AuthService } from '../auth/auth.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { OrgGuard } from '../auth/guards/org.guard';
import { UpdateUserDto } from './dto/update-user.dto';
import { SwitchActiveOrganizationDto } from './dto/switch-active-organization.dto';
import { NotificationPreferencesService } from '../notification-preferences/notification-preferences.service';
import { UpdateNotificationPreferencesDto } from '../notification-preferences/dto/update-notification-preferences.dto';
import { AuditService } from '../audit/audit.service';

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UserController {
  constructor(
    private userService: UserService,
    private organizationService: OrganizationService,
    private authService: AuthService,
    private notificationPreferences: NotificationPreferencesService,
    private audit: AuditService,
  ) {}

  @Get()
  @UseGuards(JwtAuthGuard, OrgGuard)
  findAll(@Request() req: any) {
    return this.userService.findAllForOrganization(req.user.organizationId);
  }

  @Throttle({ default: { limit: 8, ttl: 3_600_000 } })
  @Get('me/data-export')
  exportMyData(@Request() req: any) {
    return this.userService.buildPersonalDataExport(req.user.id);
  }

  @Get('me')
  async getMe(@Request() req: any) {
    const profile = await this.authService.buildAuthProfile(req.user.id);
    const { enabledModules, needsPackSelection, branding } =
      await this.organizationService.getOrgFeatureFields(
        profile.organizationId ?? null,
        profile.orgRole ?? null,
      );
    const notificationPreferences =
      await this.notificationPreferences.getEffective(req.user.id);
    return {
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatar: profile.avatar,
      emailVerified: profile.emailVerified ?? true,
      organizationId: profile.organizationId ?? null,
      orgRole: profile.orgRole ?? null,
      organization: profile.organization
        ? {
            ...profile.organization,
            branding: branding ?? profile.organization.branding,
          }
        : null,
      organizations: profile.organizations,
      enabledModules,
      needsPackSelection,
      notificationPreferences,
    };
  }

  @Get('me/notification-preferences')
  getMyNotificationPreferences(@Request() req: any) {
    return this.notificationPreferences.getEffective(req.user.id);
  }

  @Patch('me/notification-preferences')
  async patchMyNotificationPreferences(
    @Request() req: any,
    @Body() dto: UpdateNotificationPreferencesDto,
  ) {
    const p = await this.notificationPreferences.getEffective(req.user.id);
    const nextSmsEnabled = dto.smsEnabled ?? p.smsEnabled;
    if (nextSmsEnabled && !p.smsConsentAt && dto.acceptSmsConsent !== true) {
      throw new BadRequestException(
        'Bitte die Einwilligung zum SMS-Versand bestätigen (Feld acceptSmsConsent: true), um SMS zu aktivieren.',
      );
    }
    if (
      dto.smsEnabled === true ||
      (dto.smsEnabled === undefined && p.smsEnabled)
    ) {
      const nextPhone =
        dto.phoneE164 !== undefined ? dto.phoneE164 : p.phoneE164;
      const anySmsTopic =
        dto.smsTaskAssigned === true ||
        dto.smsTaskDue === true ||
        dto.smsCalendarEvents === true ||
        (dto.smsTaskAssigned === undefined && p.smsTaskAssigned) ||
        (dto.smsTaskDue === undefined && p.smsTaskDue) ||
        (dto.smsCalendarEvents === undefined && p.smsCalendarEvents);
      if (anySmsTopic && !nextPhone) {
        throw new BadRequestException(
          'Für SMS-Benachrichtigungen bitte eine gültige Telefonnummer (E.164, z. B. +491701234567) speichern.',
        );
      }
    }
    const hadConsent = !!p.smsConsentAt;
    const result = await this.notificationPreferences.upsert(req.user.id, dto);
    if (dto.acceptSmsConsent === true && !hadConsent) {
      await this.audit.log({
        userId: req.user.id,
        organizationId: req.user.organizationId ?? null,
        action: 'NOTIFICATION_SMS_CONSENT_ACCEPTED',
        metadata: { source: 'notification-preferences' },
      });
    }
    return result;
  }

  @Throttle({ default: { limit: 30, ttl: 60_000 } })
  @Patch('me/active-organization')
  async switchActiveOrganization(
    @Request() req: any,
    @Body() dto: SwitchActiveOrganizationDto,
  ) {
    const token = await this.authService.switchActiveOrganization(
      req.user.id,
      dto.organizationId,
    );
    const profile = await this.authService.buildAuthProfile(req.user.id);
    const { enabledModules, needsPackSelection, branding } =
      await this.organizationService.getOrgFeatureFields(
        profile.organizationId ?? null,
        profile.orgRole ?? null,
      );
    const notificationPreferences =
      await this.notificationPreferences.getEffective(req.user.id);
    return {
      token,
      id: profile.id,
      email: profile.email,
      name: profile.name,
      role: profile.role,
      avatar: profile.avatar,
      emailVerified: profile.emailVerified ?? true,
      organizationId: profile.organizationId ?? null,
      orgRole: profile.orgRole ?? null,
      organization: profile.organization
        ? {
            ...profile.organization,
            branding: branding ?? profile.organization.branding,
          }
        : null,
      organizations: profile.organizations,
      enabledModules,
      needsPackSelection,
      notificationPreferences,
    };
  }

  @Patch('me')
  updateMe(@Request() req: any, @Body() dto: UpdateUserDto) {
    return this.userService.update(req.user.id, dto);
  }

  @Get(':id')
  @UseGuards(JwtAuthGuard, OrgGuard)
  findOne(@Request() req: any, @Param('id') id: string) {
    return this.userService.findOneInOrganization(id, req.user.organizationId);
  }
}
