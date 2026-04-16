import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { PrismaService } from '../../prisma/prisma.service';
import {
  resolveBrandingForUi,
  type ResolvedOrganizationBranding,
} from '../../common/org-settings.util';
import { pickOrganizationMembership } from '../../organization/active-org.util';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(private prisma: PrismaService) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey:
        process.env.JWT_SECRET || 'your-secret-key-change-in-production',
    });
  }

  async validate(payload: {
    userId: string;
    email: string;
    organizationId?: string | null;
    orgRole?: string | null;
  }) {
    const user = await this.prisma.user.findUnique({
      where: { id: payload.userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
        emailVerifiedAt: true,
      },
    });

    if (!user) {
      throw new UnauthorizedException();
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException('EMAIL_NOT_VERIFIED');
    }

    const { membership } = await pickOrganizationMembership(
      this.prisma,
      user.id,
      payload.organizationId ?? undefined,
    );

    let organization: {
      id: string;
      name: string;
      kind: string;
      joinCode?: string;
      branding: ResolvedOrganizationBranding;
    } | null = null;

    if (membership?.organization) {
      const showCode =
        membership.role === 'OWNER' || membership.role === 'ADMIN';
      organization = {
        id: membership.organization.id,
        name: membership.organization.name,
        kind: membership.organization.kind,
        branding: resolveBrandingForUi(
          membership.organization.name,
          membership.organization.settings,
        ),
        ...(showCode ? { joinCode: membership.organization.joinCode } : {}),
      };
    }

    const { emailVerifiedAt, ...publicUser } = user;

    return {
      ...publicUser,
      emailVerified: !!emailVerifiedAt,
      organizationId: membership?.organizationId ?? null,
      orgRole: membership?.role ?? null,
      organization,
    };
  }
}
