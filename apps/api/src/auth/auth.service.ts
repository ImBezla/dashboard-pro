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
import { isPlatformAdminUser } from '../common/platform-admin.util';

const VERIFY_HOURS = 48;
const RESET_HOURS = 1;
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

/** Bcrypt-Hash von „x“ (cost 10) — nur `compare()`, wenn User fehlt (Timing vs. Existenz). */
const BCRYPT_TIMING_DUMMY_HASH =
  '$2b$10$dSjmeToflepx2.Z/xUz0qONOGC5hEu4X5HFGW7DIl/hqZFlTN9f5O';

function bcryptRounds(): number {
  const n = Number(process.env.BCRYPT_ROUNDS);
  if (Number.isFinite(n) && n >= 10 && n <= 14) {
    return Math.trunc(n);
  }
  return process.env.NODE_ENV === 'production' ? 12 : 10;
}

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

  /** Kurzer Gmail-Hinweis bei 535 / BadCredentials (Google SMTP). */
  private gmailBadCredentialsHint(detail: string): string {
    if (!detail) return '';
    if (!/535|badcredentials|invalid login|not accepted/i.test(detail)) {
      return '';
    }
    if (!/gsmtp|google\.com\/mail|support\.google\.com\/mail/i.test(detail)) {
      return '';
    }
    return (
      'Hinweis (Gmail/Google-Mail): Für den SMTP-Versand brauchen Sie ein App-Passwort ' +
      '(Google-Konto → Sicherheit → 2‑Schritt‑Bestätigung aktivieren → App-Passwörter unter myaccount.google.com/apppasswords), ' +
      'nicht Ihr normales Google-Passwort. SMTP_USER muss dieselbe Adresse sein wie das Gmail-/Google-Mail-Konto. ' +
      'Leerzeichen im 16-stelligen App-Passwort werden von der API automatisch entfernt. ' +
      'Alternative: RESEND_API_KEY in apps/api/.env (ohne Gmail-SMTP).'
    );
  }

  private resendSetupHint(detail: string): string {
    if (!detail) return '';
    if (!/resend|domain|verify|not valid|testing emails|own email/i.test(detail)) {
      return '';
    }
    if (/only send testing emails|your own email address/i.test(detail)) {
      return (
        'Hinweis (Resend-Sandbox): Mit Absender onboarding@resend.dev erlaubt Resend nur Mails an die Adresse, die bei Ihrem Resend-Konto hinterlegt ist (steht in der englischen Meldung). ' +
        'Zum Testen: Registrierung mit genau dieser E-Mail — oder eine Domain unter resend.com/domains verifizieren und RESEND_FROM auf z. B. notify@ihre-domain.de setzen; danach sind beliebige Empfänger möglich.'
      );
    }
    return (
      'Hinweis (Resend): Domain unter resend.com/domains verifizieren und RESEND_FROM auf eine Absenderadresse dieser Domain setzen (nicht onboarding@ bei produktiven Empfängern).'
    );
  }

  /**
   * Nicht-Produktion: volle Fehlermeldung + ggf. Gmail-/Resend-Hinweis.
   * Produktion: kein Rohdump, nur kurze Hinweise bei erkannten Mustern.
   */
  private smtpFailureSuffixForResponse(): string {
    const detail = this.emailService.getLastTransportError() ?? '';
    const gmailHint = this.gmailBadCredentialsHint(detail);
    const resendHint = this.resendSetupHint(detail);

    if (process.env.NODE_ENV === 'production') {
      const hints = [gmailHint, resendHint].filter(Boolean).join(' ');
      return hints ? ` ${hints}` : '';
    }

    const parts: string[] = [];
    if (detail) {
      parts.push(` Technische Meldung: ${detail}`);
    }
    if (gmailHint) {
      parts.push(` ${gmailHint}`);
    }
    if (resendHint) {
      parts.push(` ${resendHint}`);
    }
    return parts.join('');
  }

  /** Einheitliche Normalisierung (Login/Registrierung, Unicode-kompatibel). */
  private normalizeAuthEmail(email: string): string {
    return email.trim().toLowerCase().normalize('NFKC');
  }

  async register(dto: RegisterDto) {
    const normalizedEmail = this.normalizeAuthEmail(dto.email);

    const existingUser = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const hashedPassword = await bcrypt.hash(dto.password, bcryptRounds());
    const now = new Date();
    const trimmedName = dto.name.trim();

    if (existingUser) {
      if (existingUser.emailVerifiedAt) {
        throw new ConflictException(
          'Ein Konto mit dieser E-Mail existiert bereits. Bitte melden Sie sich an oder nutzen Sie „Passwort vergessen“.',
        );
      }
      if (this.skipEmailVerification()) {
        const user = await this.prisma.user.update({
          where: { id: existingUser.id },
          data: {
            password: hashedPassword,
            name: trimmedName,
            emailVerifiedAt: now,
            emailVerificationTokenHash: null,
            emailVerificationExpiresAt: null,
            lastVerificationEmailSentAt: null,
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
        return { user: profile, token };
      }
      if (!this.emailService.isEmailOutboundConfigured()) {
        throw new ConflictException(
          'Diese E-Mail ist bereits für ein noch nicht bestätigtes Konto vergeben. Ohne konfigurierten E-Mail-Versand (Resend API-Key oder SMTP) können wir keine Bestätigungs-E-Mail erneut senden. Bitte RESEND_API_KEY oder SMTP einrichten, den Benutzer in der Datenbank entfernen oder SKIP_EMAIL_VERIFICATION=true (nur Entwicklung) setzen.',
        );
      }
      await this.resendVerification(normalizedEmail);
      return {
        message:
          'Diese E-Mail ist bereits registriert, aber noch nicht bestätigt. Wir haben eine neue Bestätigungs-E-Mail gesendet. Bitte prüfen Sie Ihren Posteingang.',
        email: normalizedEmail,
      };
    }

    if (this.skipEmailVerification()) {
      const user = await this.prisma.user.create({
        data: {
          email: normalizedEmail,
          password: hashedPassword,
          name: trimmedName,
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

    if (!this.emailService.isEmailOutboundConfigured()) {
      throw new BadRequestException(
        'E-Mail-Bestätigung ist aktiv, aber kein Versand konfiguriert. Bitte RESEND_API_KEY (empfohlen) oder SMTP_HOST/SMTP_USER/SMTP_PASS bzw. Gmail-App-Passwort setzen. Für lokale Tests ohne Mail: SKIP_EMAIL_VERIFICATION=true.',
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
        name: trimmedName,
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
        'Die Bestätigungs-E-Mail konnte nicht versendet werden. In der API-Konsole steht oft der genaue Fehler (SMTP oder Resend). ' +
          'SMTP: Host/Port/SMTP_SECURE, SMTP_USER, SMTP_PASS bzw. GMAIL_APP_PASSWORD. Alternative ohne Gmail-SMTP: RESEND_API_KEY (+ optional RESEND_FROM mit verifizierter Domain). ' +
          'Lokal ohne Mailserver: apps/api/.env SKIP_EMAIL_VERIFICATION=true und API neu starten.' +
          this.smtpFailureSuffixForResponse(),
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
    const normalizedEmail = this.normalizeAuthEmail(email);
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

    if (!this.emailService.isEmailOutboundConfigured()) {
      throw new BadRequestException(
        'E-Mail-Versand ist nicht konfiguriert — eine neue Bestätigungs-E-Mail kann nicht versendet werden (RESEND_API_KEY oder SMTP).',
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
        'Die Bestätigungs-E-Mail konnte nicht versendet werden. API-Log prüfen (SMTP oder Resend). ' +
          'Lokal ohne Mail: SKIP_EMAIL_VERIFICATION=true in apps/api/.env.' +
          this.smtpFailureSuffixForResponse(),
      );
    }

    return generic;
  }

  async login(dto: LoginDto) {
    const normalizedEmail = dto.email
      ? this.normalizeAuthEmail(dto.email)
      : '';

    if (!normalizedEmail || !dto.password) {
      throw new UnauthorizedException(
        'E-Mail oder Passwort ist nicht korrekt. Bitte prüfen Sie Ihre Eingabe.',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { email: normalizedEmail },
    });

    const hashForCompare = user?.password ?? BCRYPT_TIMING_DUMMY_HASH;
    const passwordOk = await bcrypt.compare(dto.password, hashForCompare);

    if (!user || !passwordOk) {
      throw new UnauthorizedException(
        'E-Mail oder Passwort ist nicht korrekt. Bitte prüfen Sie Ihre Eingabe.',
      );
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
    const normalizedEmail = this.normalizeAuthEmail(email);
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

    if (!this.emailService.isEmailOutboundConfigured()) {
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
        'Die E-Mail zum Zurücksetzen des Passworts konnte nicht versendet werden. Bitte prüfen Sie die SMTP-Einstellungen oder versuchen Sie es später erneut.' +
          this.smtpFailureSuffixForResponse(),
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

    const hashedPassword = await bcrypt.hash(newPassword, bcryptRounds());

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
      globalRole: user.role,
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
    const isPlatformAdmin = isPlatformAdminUser(rest.email, rest.role);

    return {
      ...rest,
      emailVerified: !!emailVerifiedAt,
      organizationId: membership?.organizationId ?? null,
      orgRole: membership?.role ?? null,
      organization,
      organizations,
      isPlatformAdmin,
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

    const hashedPassword = await bcrypt.hash(dto.newPassword, bcryptRounds());

    await this.prisma.user.update({
      where: { id: userId },
      data: { password: hashedPassword },
    });

    return { message: 'Password changed successfully' };
  }
}
