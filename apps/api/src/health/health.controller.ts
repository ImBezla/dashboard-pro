import { Controller, Get } from '@nestjs/common';
import { SkipThrottle } from '@nestjs/throttler';
import { EmailService } from '../email/email.service';

@SkipThrottle()
@Controller()
export class HealthController {
  constructor(private readonly emailService: EmailService) {}
  @Get()
  health() {
    return {
      status: 'ok',
      message: 'DashboardPro API is running',
      timestamp: new Date().toISOString(),
    };
  }

  @Get('health')
  healthCheck() {
    return {
      status: 'ok',
      message: 'DashboardPro API is running',
      timestamp: new Date().toISOString(),
    };
  }

  /**
   * Öffentliche Diagnose: ob Versand möglich ist (Resend API-Key oder SMTP-Transporter).
   * Keine Secrets — nur booleans. Hilft z. B. wenn .env am falschen Ort liegt.
   */
  @Get('health/email-env')
  emailEnv() {
    const passRaw = process.env.SMTP_PASS ?? process.env.GMAIL_APP_PASSWORD;
    const hasPass = Boolean(passRaw?.replace(/\s/g, ''));
    const smtpHost = Boolean(process.env.SMTP_HOST?.trim());
    const smtpUser = Boolean(process.env.SMTP_USER?.trim());
    const resendKey = Boolean(process.env.RESEND_API_KEY?.trim());
    const configured = this.emailService.isEmailOutboundConfigured();
    const emailProvider = process.env.EMAIL_PROVIDER?.trim() || '(unset = resend wenn Key)';
    return {
      smtpTransporterReady: configured,
      skipEmailVerification: process.env.SKIP_EMAIL_VERIFICATION === 'true',
      emailProvider,
      envPresent: {
        RESEND_API_KEY: resendKey,
        RESEND_FROM: Boolean(process.env.RESEND_FROM?.trim()),
        SMTP_HOST: smtpHost,
        SMTP_USER: smtpUser,
        SMTP_PASS_or_GMAIL_APP_PASSWORD: hasPass,
        GMAIL_APP_PASSWORD_set: Boolean(
          process.env.GMAIL_APP_PASSWORD?.replace(/\s/g, ''),
        ),
        SMTP_PASS_set: Boolean(process.env.SMTP_PASS?.replace(/\s/g, '')),
      },
      hint: configured
        ? process.env.EMAIL_PROVIDER?.trim().toLowerCase() === 'smtp'
          ? 'EMAIL_PROVIDER=smtp — Versand nur über SMTP/Gmail (Resend wird übersprungen).'
          : resendKey
            ? 'Resend zuerst; bei Sandbox-Empfänger-Block automatisch SMTP/Gmail-Fallback, falls SMTP konfiguriert. Produktiv: Domain + RESEND_FROM.'
            : 'SMTP-Transporter geladen. Wenn Versand fehlschlägt: Zugangsdaten/Port/Firewall — API-Log bei sendMail.'
        : smtpHost && smtpUser && !hasPass
          ? 'SMTP_HOST und SMTP_USER sind gesetzt, aber es fehlt SMTP_PASS (oder GMAIL_APP_PASSWORD).'
          : !smtpHost && smtpUser && !hasPass && !resendKey
            ? 'Gmail: SMTP_USER + GMAIL_APP_PASSWORD — oder stattdessen RESEND_API_KEY (ohne Gmail-SMTP).'
            : 'Siehe apps/api/.env.example — oder SKIP_EMAIL_VERIFICATION=true nur lokal.',
    };
  }
}
