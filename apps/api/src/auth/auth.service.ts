import {
  Injectable,
  UnauthorizedException,
  ConflictException,
  BadRequestException,
  ForbiddenException,
  Inject,
  forwardRef,
  HttpException,
  HttpStatus,
  ServiceUnavailableException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcrypt';
import * as crypto from 'crypto';
import { PrismaService } from '../prisma/prisma.service';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';
import { ChangePasswordDto } from './dto/change-password.dto';
import { EmailService } from '../email/email.service';
import {
  resolveBrandingForUi,
  type ResolvedOrganizationBranding,
} from '../common/org-settings.util';
import { pickOrganizationMembership } from '../organization/active-org.util';

const VERIFY_HOURS = 48;
const RESET_HOURS = 1;
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

export const EMAIL_NOT_VERIFIED_CODE = 'EMAIL_NOT_VERIFIED';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    @Inject(forwardRef(() => EmailService))
    private emailService: EmailService,
  ) {}

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
  }

  private generateRawToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private skipEmailVerification(): boolean {
    return process.env.SKIP_EMAIL_VERIFICATION === 'true';
  }

  async register(dto: RegisterDto) {
    const normalizedEmail = dto.email.trim().toLowerCase();

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (existingUser) {
      throw new ConflictException('User with this email already exists');
    }

    const hashedPassword = await bcrypt.hash(dto.password, 10);
    const now = new Date();

    if (this.skipEmailVerification()) {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: dto.name,
          role: 'MEMBER',
          emailVerifiedAt: now,
        },
        select: {
          id: true,
          email: true,
          name: true,
          role: true,
          avatar: true,
        },
      });

      const token = await this.issueTokenForUser(user.id);
      const profile = await this.buildAuthProfile(user.id);

      return {
        user: profile,
        token,
      };
    }

    if (!this.emailService.isSmtpConfigured()) {
      throw new BadRequestException(
        'E-Mail-Bestätigung ist aktiv, aber SMTP ist nicht konfiguriert. Bitte SMTP_HOST, SMTP_USER und SMTP_PASS setzen (oder Gmail mit App-Passwort). Für Test-/Beta-Umgebungen ohne Mailserver: SKIP_EMAIL_VERIFICATION=true.',
      );
    }

    const rawVerify = this.generateRawToken();
    const verifyHash = this.hashToken(rawVerify);
    const verifyExpires = new Date(
      now.getTime() + VERIFY_HOURS * 60 * 60 * 1000,
    );

    const user = await this.prisma.user.create({
      data: {
        email: normalizedEmail,
        password: hashedPassword,
        name: dto.name,
        role: 'MEMBER',
        emailVerifiedAt: null,
        emailVerificationTokenHash: verifyHash,
        emailVerificationExpiresAt: verifyExpires,
        lastVerificationEmailSentAt: now,
      },
      select: {
        id: true,
        email: true,
        name: true,
      },
    });

    const sent = await this.emailService.sendEmailVerificationEmail(
      user.email,
      user.name,
      rawVerify,
    );

    if (!sent) {
      await this.prisma.user.delete({ where: { id: user.id } });
      throw new ServiceUnavailableException(
        'Die Bestätigungs-E-Mail konnte nicht versendet werden (SMTP-Verbindung oder Provider). Bitte später erneut versuchen oder SMTP-Einstellungen prüfen.',
      );
    }

    return {
      message:
        'Wir haben Ihnen eine Bestätigungs-E-Mail gesendet. Bitte prüfen Sie Ihren Posteingang.',
      email: user.email,
    };
  }

  async verifyEmail(token: string) {
    const hash = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: { emailVerificationTokenHash: hash },
    });

    if (!user) {
      throw new BadRequestException(
        'Ungültiger oder abgelaufener Bestätigungslink.',
      );
    }

    if (user.emailVerifiedAt) {
      return { message: 'E-Mail-Adresse war bereits bestätigt.' };
    }

    if (
      !user.emailVerificationExpiresAt ||
      user.emailVerificationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Ungültiger oder abgelaufener Bestätigungslink.',
      );
    }

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerifiedAt: new Date(),
        emailVerificationTokenHash: null,
        emailVerificationExpiresAt: null,
      },
    });

    return { message: 'E-Mail-Adresse erfolgreich bestätigt.' };
  }

  async resendVerification(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const generic = {
      message:
        'Wenn ein Konto mit dieser E-Mail existiert und noch nicht bestätigt ist, haben wir eine neue E-Mail gesendet.',
    };

    if (!user || user.emailVerifiedAt) {
      return generic;
    }

    if (!this.emailService.isSmtpConfigured()) {
      throw new BadRequestException(
        'SMTP ist nicht konfiguriert — eine neue Bestätigungs-E-Mail kann nicht versendet werden.',
      );
    }

    const last = user.lastVerificationEmailSentAt;
    if (last && Date.now() - last.getTime() < RESEND_COOLDOWN_MS) {
      throw new HttpException(
        'Bitte warten Sie einige Minuten, bevor Sie erneut eine E-Mail anfordern.',
        HttpStatus.TOO_MANY_REQUESTS,
      );
    }

    const rawVerify = this.generateRawToken();
    const verifyHash = this.hashToken(rawVerify);
    const verifyExpires = new Date(Date.now() + VERIFY_HOURS * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        emailVerificationTokenHash: verifyHash,
        emailVerificationExpiresAt: verifyExpires,
        lastVerificationEmailSentAt: new Date(),
      },
    });

    const sent = await this.emailService.sendEmailVerificationEmail(
      user.email,
      user.name,
      rawVerify,
    );

    if (!sent) {
      throw new ServiceUnavailableException(
        'Die Bestätigungs-E-Mail konnte nicht versendet werden. Bitte prüfen Sie die SMTP-Einstellungen oder versuchen Sie es später erneut.',
      );
    }

    return generic;
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email?.trim().toLowerCase() || '';

    if (!normalizedEmail || !dto.password) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await bcrypt.compare(dto.password, user.password);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(EMAIL_NOT_VERIFIED_CODE);
    }

    const token = await this.issueTokenForUser(user.id);
    const profile = await this.buildAuthProfile(user.id);

    return {
      user: profile,
      token,
    };
  }

  async forgotPassword(email: string) {
    const normalizedEmail = email.trim().toLowerCase();
    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const ok = {
      message:
        'Wenn ein Konto mit dieser E-Mail existiert, haben wir Anweisungen zum Zurücksetzen des Passworts gesendet.',
    };

    if (!user || !user.emailVerifiedAt) {
      return ok;
    }

    if (!this.emailService.isSmtpConfigured()) {
      return ok;
    }

    const raw = this.generateRawToken();
    const tokenHash = this.hashToken(raw);
    const expiresAt = new Date(Date.now() + RESET_HOURS * 60 * 60 * 1000);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        passwordResetTokenHash: tokenHash,
        passwordResetExpiresAt: expiresAt,
      },
    });

    const sent = await this.emailService.sendPasswordResetEmail(
      user.email,
      user.name,
      raw,
    );

    if (!sent) {
      await this.prisma.user.update({
        where: { id: user.id },
        data: {
          passwordResetTokenHash: null,
          passwordResetExpiresAt: null,
        },
      });
      throw new ServiceUnavailableException(
        'Die E-Mail zum Zurücksetzen des Passworts konnte nicht versendet werden. Bitte prüfen Sie die SMTP-Einstellungen oder versuchen Sie es später erneut.',
      );
    }

    return ok;
  }

  async resetPassword(token: string, newPassword: string) {
    const hash = this.hashToken(token);
    const user = await this.prisma.user.findFirst({
      where: { passwordResetTokenHash: hash },
    });

    if (
      !user ||
      !user.passwordResetExpiresAt ||
      user.passwordResetExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Ungültiger oder abgelaufener Link zum Zurücksetzen.',
      );
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);

    await this.prisma.user.update({
      where: { id: user.id },
      data: {
        password: hashedPassword,
        passwordResetTokenHash: null,
        passwordResetExpiresAt: null,
      },
    });

    return { message: 'Passwort wurde erfolgreich geändert.' };
  }

  /**
   * @param jwtOrgHint – z. B. nach Org-Wechsel: gewählte Organisation erzwingen (muss Membership sein).
   */
  async issueTokenForUser(userId: string, jwtOrgHint?: string | null) {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) {
      throw new UnauthorizedException();
    }
    if (!user.emailVerifiedAt) {
      throw new UnauthorizedException(EMAIL_NOT_VERIFIED_CODE);
    }
    const { membership } = await pickOrganizationMembership(
      this.prisma,
      userId,
      jwtOrgHint ?? undefined,
    );
    return this.jwtService.sign({
      userId: user.id,
      email: user.email,
      organizationId: membership?.organizationId ?? null,
      orgRole: membership?.role ?? null,
    });
  }

  async switchActiveOrganization(
    userId: string,
    organizationId: string,
  ): Promise<string> {
    const m = await this.prisma.organizationMember.findFirst({
      where: { userId, organizationId },
    });
    if (!m) {
      throw new ForbiddenException(
        'Keine Mitgliedschaft in dieser Organisation.',
      );
    }
    await this.prisma.user.update({
      where: { id: userId },
      data: { activeOrganizationId: organizationId },
    });
    return this.issueTokenForUser(userId, organizationId);
  }

  async getUserPublic(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });
  }

  /** Profil inkl. Organisation (wie JWT-Strategy / users/me). */
  async buildAuthProfile(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
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

    const { membership, all } = await pickOrganizationMembership(
      this.prisma,
      userId,
      null,
    );

    const organizations = all.map((m) => ({
      id: m.organization.id,
      name: m.organization.name,
      kind: m.organization.kind,
      role: m.role,
    }));

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

    const { emailVerifiedAt, ...rest } = user;

    return {
      ...rest,
      emailVerified: !!emailVerifiedAt,
      organizationId: membership?.organizationId ?? null,
      orgRole: membership?.role ?? null,
      organization,
      organizations,
    };
  }

  async validateUser(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        avatar: true,
      },
    });
  }

  async changePassword(userId: string, dto: ChangePasswordDto) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
    });

    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const isPasswordValid = await bcrypt.compare(
      dto.currentPassword,
      user.password,
    );

    if (!isPasswordValid) {
      throw new BadRequestException('Current password is incorrect');
    }

    const hashedPassword = await bcrypt.hash(dto.newPassword, 10);

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }
}
