import {
  BadRequestException,
  Injectable,
  ServiceUnavailableException,
} from '@nestjs/common';
import * as crypto from 'crypto';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

const CONFIRM_HOURS = 48;
const RESEND_COOLDOWN_MS = 2 * 60 * 1000;

@Injectable()
export class NewsletterService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly emailService: EmailService,
  ) {}

  private hashToken(raw: string): string {
    return crypto.createHash('sha256').update(raw, 'utf8').digest('hex');
  }

  private generateRawToken(): string {
    return crypto.randomBytes(32).toString('hex');
  }

  private adminNotifyEmail(): string | null {
    const v = process.env.NEWSLETTER_ADMIN_EMAIL?.trim().toLowerCase();
    return v || null;
  }

  /**
   * Double-Opt-in: Bestätigungsmail. Bereits bestätigt → gleiche Antwort (kein Enumeration).
   * Ohne konfigurierten E-Mail-Versand: 400.
   */
  async subscribe(email: string): Promise<{ ok: true }> {
    if (!this.emailService.isEmailOutboundConfigured()) {
      throw new BadRequestException(
        'Newsletter-Anmeldung ist derzeit nicht möglich (E-Mail-Versand nicht konfiguriert).',
      );
    }

    const now = new Date();
    const existing = await this.prisma.newsletterSubscription.findUnique({
      where: { email },
    });

    if (existing?.confirmedAt) {
      return { ok: true };
    }

    if (existing && !existing.confirmedAt) {
      const last = existing.lastConfirmationSentAt?.getTime() ?? 0;
      if (now.getTime() - last < RESEND_COOLDOWN_MS) {
        return { ok: true };
      }
    }

    const raw = this.generateRawToken();
    const hash = this.hashToken(raw);
    const expires = new Date(
      now.getTime() + CONFIRM_HOURS * 60 * 60 * 1000,
    );

    try {
      if (existing) {
        await this.prisma.newsletterSubscription.update({
          where: { id: existing.id },
          data: {
            verificationTokenHash: hash,
            verificationExpiresAt: expires,
            lastConfirmationSentAt: now,
          },
        });
      } else {
        await this.prisma.newsletterSubscription.create({
          data: {
            email,
            verificationTokenHash: hash,
            verificationExpiresAt: expires,
            lastConfirmationSentAt: now,
          },
        });
      }
    } catch (e) {
      if (
        e instanceof Prisma.PrismaClientKnownRequestError &&
        e.code === 'P2002'
      ) {
        return { ok: true };
      }
      throw e;
    }

    const sent = await this.emailService.sendNewsletterConfirmEmail(
      email,
      raw,
    );
    if (!sent) {
      throw new ServiceUnavailableException(
        'Bestätigungsmail konnte nicht gesendet werden. Bitte später erneut versuchen.',
      );
    }

    return { ok: true };
  }

  async confirm(rawToken: string): Promise<{ ok: true; message: string }> {
    const hash = this.hashToken(rawToken.trim());
    const row = await this.prisma.newsletterSubscription.findFirst({
      where: {
        verificationTokenHash: hash,
        confirmedAt: null,
      },
    });

    if (
      !row ||
      !row.verificationExpiresAt ||
      row.verificationExpiresAt.getTime() < Date.now()
    ) {
      throw new BadRequestException(
        'Link ungültig oder abgelaufen. Bitte erneut auf der Startseite anmelden.',
      );
    }

    const now = new Date();
    await this.prisma.newsletterSubscription.update({
      where: { id: row.id },
      data: {
        confirmedAt: now,
        verificationTokenHash: null,
        verificationExpiresAt: null,
      },
    });

    const admin = this.adminNotifyEmail();
    if (admin) {
      await this.emailService.sendNewsletterAdminNewSubscriber(
        admin,
        row.email,
      );
    }

    return {
      ok: true,
      message:
        'Newsletter bestätigt. Sie erhalten gelegentlich Produkt-Updates per E-Mail.',
    };
  }
}
