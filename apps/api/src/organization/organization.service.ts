import {
  Injectable,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { AuthService } from '../auth/auth.service';
import { CreateOrganizationDto } from './dto/create-organization.dto';
import { JoinOrganizationDto } from './dto/join-organization.dto';
import { UpdateOrgPackDto } from './dto/update-org-pack.dto';
import { UpdateOrgModulesDto } from './dto/update-org-modules.dto';
import { SuggestModulesDto } from './dto/suggest-modules.dto';
import { UpdateWorkspaceAppearanceDto } from './dto/update-workspace-appearance.dto';
import { suggestModulesFromQuestionnaireInput } from './onboarding-suggest.util';
import {
  parseOrganizationSettings,
  serializeOrganizationSettings,
  resolveEnabledModules,
  needsPackOnboarding,
  organizationModuleSetupPending,
  resolveBrandingForUi,
  normalizeHex6,
  normalizeLogoUrl,
  type OrganizationSettingsJson,
  type OrganizationBrandingJson,
} from '../common/org-settings.util';
import {
  ALL_MODULE_KEYS,
  MODULE_PACKS,
  isPackId,
  modulesForPack,
  type ModuleKey,
} from '../common/module-packs';
import { assertOrgWithinCommercialLimits } from '../commercial/commercial.types';

const JOIN_CODE_ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';

function generateJoinCode(): string {
  let s = '';
  for (let i = 0; i < 8; i++) {
    s +=
      JOIN_CODE_ALPHABET[Math.floor(Math.random() * JOIN_CODE_ALPHABET.length)];
  }
  return s;
}

@Injectable()
export class OrganizationService {
  constructor(
    private prisma: PrismaService,
    private authService: AuthService,
  ) {}

  async createForUser(userId: string, dto: CreateOrganizationDto) {
    const kind = dto.kind ?? 'OPERATING';

    let joinCode = generateJoinCode();
    for (let attempt = 0; attempt < 10; attempt++) {
      const clash = await this.prisma.organization.findUnique({
        where: { joinCode },
      });
      if (!clash) break;
      joinCode = generateJoinCode();
    }

    const org = await this.prisma.$transaction(async (tx) => {
      const o = await tx.organization.create({
        data: {
          name: dto.name.trim(),
          kind,
          joinCode,
          settings: serializeOrganizationSettings({
            onboardingComplete: false,
          }),
        },
      });
      await tx.organizationMember.create({
        data: {
          userId,
          organizationId: o.id,
          role: 'OWNER',
        },
      });
      await tx.user.update({
        where: { id: userId },
        data: { activeOrganizationId: o.id },
      });
      return o;
    });

    const token = await this.authService.issueTokenForUser(userId, org.id);
    const user = await this.authService.buildAuthProfile(userId);
    return {
      organization: {
        id: org.id,
        name: org.name,
        kind: org.kind,
        joinCode: org.joinCode,
      },
      token,
      user,
    };
  }

  async joinWithCode(userId: string, dto: JoinOrganizationDto) {
    const normalized = dto.code.trim().toUpperCase().replace(/\s+/g, '');
    const org = await this.prisma.organization.findFirst({
      where: { joinCode: normalized },
    });
    if (!org) {
      throw new BadRequestException('Ungültiger Beitrittscode.');
    }

    const already = await this.prisma.organizationMember.findFirst({
      where: { userId, organizationId: org.id },
    });
    if (already) {
      throw new BadRequestException(
        'Du bist bereits Mitglied dieser Organisation.',
      );
    }

    await this.prisma.organizationMember.create({
      data: {
        userId,
        organizationId: org.id,
        role: 'MEMBER',
      },
    });

    await this.prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: org.id },
    });

    const token = await this.authService.issueTokenForUser(userId, org.id);
    const user = await this.authService.buildAuthProfile(userId);
    return {
      organization: {
        id: org.id,
        name: org.name,
        kind: org.kind,
      },
      token,
      user,
    };
  }

  async getWorkspaceForUser(
    userId: string,
    organizationId: string | null,
    orgRole: string | null,
  ) {
    if (!organizationId) {
      return { organization: null as null };
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      return { organization: null as null };
    }

    const showCode = orgRole === 'OWNER' || orgRole === 'ADMIN';
    const parsed = parseOrganizationSettings(org.settings);
    const enabledModules = resolveEnabledModules(org.settings);
    const needsPackSelection = needsPackOnboarding(orgRole, org.settings);
    const setupPending = organizationModuleSetupPending(org.settings);

    let moduleSetup:
      | { status: 'pending' }
      | { status: 'pack'; packId: string; label: string }
      | { status: 'custom' };

    if (setupPending) {
      moduleSetup = { status: 'pending' };
    } else if (parsed.packId && isPackId(parsed.packId)) {
      moduleSetup = {
        status: 'pack',
        packId: parsed.packId,
        label: MODULE_PACKS[parsed.packId].label,
      };
    } else {
      moduleSetup = { status: 'custom' };
    }

    const branding = resolveBrandingForUi(org.name, org.settings);

    return {
      organization: {
        id: org.id,
        name: org.name,
        packId: parsed.packId ?? null,
        onboardingComplete: parsed.onboardingComplete === true,
        needsPackSelection,
        enabledModules,
        moduleSetup,
        branding,
        ...(showCode ? { joinCode: org.joinCode } : {}),
      },
    };
  }

  async updateWorkspaceAppearance(
    userId: string,
    organizationId: string,
    orgRole: string,
    dto: UpdateWorkspaceAppearanceDto,
  ) {
    if (orgRole !== 'OWNER') {
      throw new ForbiddenException(
        'Nur die Organisations-Inhaber:in kann das Erscheinungsbild ändern.',
      );
    }

    const member = await this.prisma.organizationMember.findFirst({
      where: { userId, organizationId },
    });
    if (!member || member.role !== 'OWNER') {
      throw new ForbiddenException('Keine Berechtigung.');
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new BadRequestException('Organisation nicht gefunden.');
    }

    const prev = parseOrganizationSettings(org.settings);
    const nextBranding: OrganizationBrandingJson = { ...prev.branding };

    if (dto.displayName !== undefined) {
      const t = dto.displayName.trim();
      if (t.length === 0) {
        delete nextBranding.displayName;
      } else {
        nextBranding.displayName = t.slice(0, 80);
      }
    }

    if (dto.primaryColor !== undefined) {
      const n = normalizeHex6(dto.primaryColor);
      if (!n) {
        delete nextBranding.primaryColor;
      } else {
        nextBranding.primaryColor = n;
      }
    }

    if (dto.headingColor !== undefined) {
      const n = normalizeHex6(dto.headingColor);
      if (!n) {
        delete nextBranding.headingColor;
      } else {
        nextBranding.headingColor = n;
      }
    }

    if (dto.logoUrl !== undefined) {
      const t = dto.logoUrl.trim();
      if (t.length === 0) {
        delete nextBranding.logoUrl;
      } else {
        const n = normalizeLogoUrl(t);
        if (!n) {
          throw new BadRequestException('Ungültige Logo-URL.');
        }
        nextBranding.logoUrl = n;
      }
    }

    const hasBrandingKeys = Object.keys(nextBranding).length > 0;
    const nextSettings: OrganizationSettingsJson = { ...prev };
    if (hasBrandingKeys) {
      nextSettings.branding = nextBranding;
    } else {
      delete nextSettings.branding;
    }

    const newOrgName =
      dto.organizationName !== undefined
        ? dto.organizationName.trim().slice(0, 120)
        : org.name;
    if (dto.organizationName !== undefined && newOrgName.length === 0) {
      throw new BadRequestException(
        'Der Organisationsname darf nicht leer sein.',
      );
    }

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: {
        name: newOrgName,
        settings: serializeOrganizationSettings(nextSettings),
      },
    });

    const updated = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });

    return {
      name: updated.name,
      branding: resolveBrandingForUi(updated.name, updated.settings),
    };
  }

  async updateOrgPack(
    userId: string,
    organizationId: string,
    orgRole: string,
    dto: UpdateOrgPackDto,
  ) {
    if (orgRole !== 'OWNER' && orgRole !== 'ADMIN') {
      throw new ForbiddenException('Keine Berechtigung.');
    }
    const member = await this.prisma.organizationMember.findFirst({
      where: { userId, organizationId },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Keine Berechtigung.');
    }

    if (!isPackId(dto.packId)) {
      throw new BadRequestException('Ungültiges Paket.');
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new BadRequestException('Organisation nicht gefunden.');
    }

    assertOrgWithinCommercialLimits(organizationId);

    const prev = parseOrganizationSettings(org.settings);
    const next: OrganizationSettingsJson = {
      ...prev,
      packId: dto.packId,
      onboardingComplete: true,
      enabledModules: [...modulesForPack(dto.packId)],
    };

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { settings: serializeOrganizationSettings(next) },
    });

    return {
      packId: dto.packId,
      onboardingComplete: true,
      enabledModules: next.enabledModules,
    };
  }

  suggestModulesFromQuestionnaire(dto: SuggestModulesDto) {
    const modules = suggestModulesFromQuestionnaireInput(dto.focusAreas, {
      industry: dto.industry,
      teamSize: dto.teamSize,
    });
    return { modules };
  }

  private mergeRequiredModules(chosen: ModuleKey[]): ModuleKey[] {
    const required: ModuleKey[] = [
      'overview',
      'notifications',
      'security',
      'settings',
      'help',
    ];
    const set = new Set<ModuleKey>([...required, ...chosen]);
    return ALL_MODULE_KEYS.filter((k) => set.has(k));
  }

  async updateOrgModules(
    userId: string,
    organizationId: string,
    orgRole: string,
    dto: UpdateOrgModulesDto,
  ) {
    if (orgRole !== 'OWNER') {
      throw new ForbiddenException(
        'Nur die Organisations-Inhaber:in kann die App-Bereiche ändern.',
      );
    }

    const member = await this.prisma.organizationMember.findFirst({
      where: { userId, organizationId },
    });
    if (!member || member.role !== 'OWNER') {
      throw new ForbiddenException('Keine Berechtigung.');
    }

    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      throw new BadRequestException('Organisation nicht gefunden.');
    }

    assertOrgWithinCommercialLimits(organizationId);

    const prev = parseOrganizationSettings(org.settings);
    const merged = this.mergeRequiredModules(dto.modules);
    const next: OrganizationSettingsJson = {
      ...prev,
      packId: null,
      onboardingComplete: true,
      enabledModules: merged,
    };

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { settings: serializeOrganizationSettings(next) },
    });

    return {
      packId: null as null,
      onboardingComplete: true,
      enabledModules: merged,
    };
  }

  async regenerateJoinCode(
    userId: string,
    organizationId: string,
    orgRole: string,
  ) {
    if (orgRole !== 'OWNER' && orgRole !== 'ADMIN') {
      throw new ForbiddenException('Keine Berechtigung.');
    }

    const member = await this.prisma.organizationMember.findFirst({
      where: { userId, organizationId },
    });
    if (!member || (member.role !== 'OWNER' && member.role !== 'ADMIN')) {
      throw new ForbiddenException('Keine Berechtigung.');
    }

    let joinCode = generateJoinCode();
    for (let i = 0; i < 20; i++) {
      const hit = await this.prisma.organization.findUnique({
        where: { joinCode },
      });
      if (!hit) break;
      joinCode = generateJoinCode();
    }

    await this.prisma.organization.update({
      where: { id: organizationId },
      data: { joinCode },
    });

    return { joinCode };
  }

  async getOrgFeatureFields(
    organizationId: string | null,
    orgRole: string | null,
  ) {
    if (!organizationId) {
      return {
        enabledModules: [] as string[],
        needsPackSelection: false,
        branding: null as null,
      };
    }
    const org = await this.prisma.organization.findUnique({
      where: { id: organizationId },
    });
    if (!org) {
      return {
        enabledModules: [] as string[],
        needsPackSelection: false,
        branding: null as null,
      };
    }
    return {
      enabledModules: resolveEnabledModules(org.settings),
      needsPackSelection: needsPackOnboarding(orgRole, org.settings),
      branding: resolveBrandingForUi(org.name, org.settings),
    };
  }
}
