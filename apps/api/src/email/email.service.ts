import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import * as nodemailer from 'nodemailer';
import {
  EMAIL_FONT_STACK,
  emailBrandWordmarkRow,
  layoutTransactionEmail,
} from './email-brand';
import { NotificationPreferencesService } from '../notification-preferences/notification-preferences.service';
import { SmsService } from '../sms/sms.service';

interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter | null = null;
  /** Zuletzt bei sendMail() aufgetretener Fehler (nur für Diagnose in nicht-produktiven Umgebungen). */
  private lastTransportError: string | null = null;

  constructor(
    private prisma: PrismaService,
    private prefs: NotificationPreferencesService,
    private sms: SmsService,
  ) {
    this.transporter = this.buildTransporter();
  }

  /** Google zeigt App-Passwörter oft mit Leerzeichen – SMTP braucht sie ohne. */
  private normalizeSmtpPass(raw: string | undefined): string | undefined {
    const t = raw?.replace(/\s/g, '');
    return t || undefined;
  }

  private buildTransporter(): nodemailer.Transporter | null {
    const smtpHost = process.env.SMTP_HOST?.trim();
    const smtpUser = process.env.SMTP_USER?.trim();
    const explicitSmtpPass = process.env.SMTP_PASS?.trim();
    /** Nicht-leeres SMTP_PASS gewinnt; leerer String zählt als „nicht gesetzt“ (sonst blockiert ?? das App-Passwort). */
    const authPass = this.normalizeSmtpPass(
      explicitSmtpPass && explicitSmtpPass.length > 0
        ? explicitSmtpPass
        : process.env.GMAIL_APP_PASSWORD,
    );
    const gmailAppPass = this.normalizeSmtpPass(process.env.GMAIL_APP_PASSWORD);

    if (smtpHost && smtpUser && authPass) {
      return nodemailer.createTransport({
        host: smtpHost,
        port: parseInt(process.env.SMTP_PORT || '587', 10),
        secure: process.env.SMTP_SECURE === 'true',
        auth: { user: smtpUser, pass: authPass },
      });
    }

    // Gmail / Google-Mail ohne eigenen SMTP_HOST
    const passForGmail = gmailAppPass ?? (!smtpHost ? authPass : undefined);
    const useGmailService =
      !!smtpUser &&
      !!passForGmail &&
      !smtpHost &&
      (!!gmailAppPass ||
        smtpUser.toLowerCase().includes('@gmail.com') ||
        smtpUser.toLowerCase().includes('@googlemail.com'));

    if (useGmailService) {
      // Expliziter Host statt service:'gmail' — gleiche Logik, teils weniger 535-Probleme hinter Firewalls/IPv6
      return nodemailer.createTransport({
        host: 'smtp.gmail.com',
        port: 587,
        secure: false,
        requireTLS: true,
        auth: { user: smtpUser, pass: passForGmail },
      });
    }

    return null;
  }

  private getFromHeader(): string {
    const from = process.env.SMTP_FROM?.trim();
    const user = process.env.SMTP_USER?.trim();
    if (from) {
      return from.includes('<') ? from : `DashboardPro <${from}>`;
    }
    if (user) {
      return `DashboardPro <${user}>`;
    }
    return 'DashboardPro <noreply@localhost>';
  }

  private isConfigured(): boolean {
    return this.transporter !== null;
  }

  private hasResendKey(): boolean {
    return Boolean(process.env.RESEND_API_KEY?.trim());
  }

  /**
   * Resend zuerst, außer EMAIL_PROVIDER=smtp — dann nur SMTP/Gmail (z. B. wenn Resend-Sandbox
   * nur die Konto-Mail erlaubt, ihr aber Gmail an beliebige Adressen nutzen wollt).
   */
  private useResendFirst(): boolean {
    const p = process.env.EMAIL_PROVIDER?.trim().toLowerCase();
    if (p === 'smtp') {
      return false;
    }
    return this.hasResendKey();
  }

  /**
   * True, wenn Versand möglich ist: Resend (API) oder klassisches SMTP/Gmail.
   * Bei EMAIL_PROVIDER=smtp zählt nur SMTP (Resend-Key allein reicht dann nicht).
   */
  isEmailOutboundConfigured(): boolean {
    if (process.env.EMAIL_PROVIDER?.trim().toLowerCase() === 'smtp') {
      return this.isConfigured();
    }
    return this.hasResendKey() || this.isConfigured();
  }

  /** @deprecated Nutzen Sie isEmailOutboundConfigured() — umfasst jetzt auch Resend. */
  isSmtpConfigured(): boolean {
    return this.isEmailOutboundConfigured();
  }

  private defaultResendFrom(): string {
    const r = process.env.RESEND_FROM?.trim();
    if (r) {
      return r.includes('<') ? r : `DashboardPro <${r}>`;
    }
    const smtpFrom = process.env.SMTP_FROM?.trim();
    if (smtpFrom) {
      return smtpFrom.includes('<') ? smtpFrom : `DashboardPro <${smtpFrom}>`;
    }
    return 'DashboardPro <onboarding@resend.dev>';
  }

  private async sendViaResend(options: EmailOptions): Promise<boolean> {
    const key = process.env.RESEND_API_KEY!.trim();
    const from = this.defaultResendFrom();
    try {
      const res = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${key}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: [options.to],
          subject: options.subject,
          html: options.html,
          ...(options.text ? { text: options.text } : {}),
        }),
      });
      const json = (await res.json().catch(() => ({}))) as Record<
        string,
        unknown
      >;
      if (!res.ok) {
        const raw =
          typeof json.message === 'string'
            ? json.message
            : JSON.stringify(json);
        this.lastTransportError =
          raw.length > 400 ? `${raw.slice(0, 400)}…` : raw;
        console.error('[email] Resend HTTP', res.status, json);
        return false;
      }
      console.log('📧 Email sent via Resend:', json.id);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.lastTransportError =
        msg.length > 400 ? `${msg.slice(0, 400)}…` : msg;
      console.error('[email] Resend fetch failed:', error);
      return false;
    }
  }

  /** Kurztext des letzten Versandfehlers (SMTP oder Resend). */
  getLastTransportError(): string | null {
    return this.lastTransportError;
  }

  private frontendBaseUrl(): string {
    return (process.env.FRONTEND_URL || 'http://localhost:8000').replace(
      /\/$/,
      '',
    );
  }

  private escapeHtml(s: string): string {
    return s
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;');
  }

  /** Nodemailer (Gmail/SMTP); setzt lastTransportError bei Fehler. */
  private async sendViaSmtpMail(options: EmailOptions): Promise<boolean> {
    try {
      if (!this.isConfigured()) {
        if (process.env.NODE_ENV !== 'production') {
          console.log('📧 [DEV MODE] Email would be sent:');
          console.log(`   To: ${options.to}`);
          console.log(`   Subject: ${options.subject}`);
          console.log(
            `   (RESEND_API_KEY oder SMTP_HOST/SMTP_USER/SMTP_PASS bzw. Gmail-App-Passwort)`,
          );
          return true;
        }
        console.warn(
          '[email] Kein Versand konfiguriert — transaktionale E-Mail wird nicht versendet (keine Empfängerdaten geloggt).',
        );
        return false;
      }

      const mailOptions = {
        from: this.getFromHeader(),
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter!.sendMail(mailOptions);
      console.log('📧 Email sent successfully:', result.messageId);
      return true;
    } catch (error) {
      const msg = error instanceof Error ? error.message : String(error);
      this.lastTransportError =
        msg.length > 400 ? `${msg.slice(0, 400)}…` : msg;
      console.error(
        `❌ Failed to send email to ${options.to} (${options.subject}): ${msg}`,
        error,
      );
      if (/ECONNREFUSED|ETIMEDOUT|ENOTFOUND|getaddrinfo/i.test(msg)) {
        console.error(
          '[email] Netzwerk/DNS: SMTP_HOST erreichbar? Firewall/VPN? Bei Gmail: Port 587 + SMTP_SECURE=false oder 465 + SMTP_SECURE=true.',
        );
      }
      if (/Invalid login|535|authentication failed|535-5\.7\.8/i.test(msg)) {
        console.error(
          '[email] Auth: SMTP_USER/SMTP_PASS prüfen. Gmail braucht ein App-Passwort (2FA), nicht das normale Passwort.',
        );
      }
      return false;
    }
  }

  /**
   * Bestätigung & Passwort-Reset: bei Sandbox-Absender + Gmail lieber **sofort SMTP**,
   * damit die Verifizierung zuverlässig an jede Adresse geht (ohne Resend-Fehler-Roundtrip).
   */
  private smtpPreferredForAuthMail(): boolean {
    if (process.env.EMAIL_PROVIDER?.trim().toLowerCase() === 'smtp') {
      return true;
    }
    if (!this.isConfigured()) {
      return false;
    }
    if (!this.hasResendKey()) {
      return true;
    }
    return this.defaultResendFrom().toLowerCase().includes('onboarding@resend.dev');
  }

  private async sendAuthTransactionalMail(
    options: EmailOptions,
  ): Promise<boolean> {
    this.lastTransportError = null;
    if (this.smtpPreferredForAuthMail()) {
      const ok = await this.sendViaSmtpMail(options);
      if (ok) {
        return true;
      }
      if (
        this.hasResendKey() &&
        process.env.EMAIL_PROVIDER?.trim().toLowerCase() !== 'smtp'
      ) {
        this.lastTransportError = null;
        return this.sendViaResend(options);
      }
      return false;
    }
    return this.sendEmail(options);
  }

  /**
   * Resend zuerst (wenn Key + nicht EMAIL_PROVIDER=smtp), sonst SMTP.
   * Bei Resend-Sandbox (nur Konto-Mail erlaubt): automatischer Versuch über SMTP/Gmail, falls konfiguriert.
   */
  async sendEmail(options: EmailOptions): Promise<boolean> {
    this.lastTransportError = null;
    if (this.useResendFirst()) {
      const ok = await this.sendViaResend(options);
      if (ok) {
        return true;
      }
      const err = this.lastTransportError ?? '';
      const resendSandboxBlock =
        /only send testing emails|your own email address/i.test(err);
      if (resendSandboxBlock && this.isConfigured()) {
        console.warn(
          '[email] Resend-Sandbox blockiert diesen Empfänger — Versand über SMTP/Gmail (Fallback).',
        );
        this.lastTransportError = null;
        return this.sendViaSmtpMail(options);
      }
      return false;
    }
    return this.sendViaSmtpMail(options);
  }

  async sendEmailVerificationEmail(to: string, name: string, rawToken: string) {
    const base = this.frontendBaseUrl();
    const link = `${base}/verify-email?token=${encodeURIComponent(rawToken)}`;
    const safeName = this.escapeHtml(name || 'Sie');
    const inner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background-color:#4f46e5;background-image:linear-gradient(135deg,#4f46e5 0%,#6366f1 45%,#7c3aed 100%);padding:32px 28px;text-align:center;">
      ${emailBrandWordmarkRow('onDark')}
      <p style="margin:0;font-family:${EMAIL_FONT_STACK};font-size:22px;font-weight:700;line-height:1.3;color:#ffffff;">E-Mail-Adresse bestätigen</p>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 28px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#334155;">
      <p style="margin:0 0 16px;">Hallo ${safeName},</p>
      <p style="margin:0 0 20px;">schön, dass Sie dabei sind. Ein letzter Schritt: Bitte bestätigen Sie Ihre E-Mail-Adresse, damit wir Ihr Konto aktivieren können.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td style="border-radius:10px;background-color:#4f46e5;">
            <a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Jetzt bestätigen</a>
          </td>
        </tr>
      </table>
      <p style="margin:0 0 8px;font-size:14px;color:#64748b;">Der Link ist <strong style="color:#475569;">48&nbsp;Stunden</strong> gültig. Wenn Sie sich nicht registriert haben, können Sie diese E-Mail ignorieren.</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 28px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.55;color:#64748b;">
      <p style="margin:0 0 8px;">Funktioniert der Button nicht? Kopieren Sie diese Adresse in die Adresszeile Ihres Browsers:</p>
      <p style="margin:0;padding:12px 14px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;word-break:break-all;color:#475569;font-size:12px;">${this.escapeHtml(link)}</p>
    </td>
  </tr>
</table>`;
    const html = layoutTransactionEmail(
      inner,
      'Bitte bestätigen Sie Ihre E-Mail für DashboardPro.',
      this.frontendBaseUrl(),
    );
    const text = [
      `Hallo ${name || 'Sie'},`,
      '',
      'bitte bestätigen Sie Ihre E-Mail-Adresse für DashboardPro (48 Stunden gültig):',
      link,
      '',
      'Wenn Sie sich nicht registriert haben, ignorieren Sie diese Nachricht.',
    ].join('\n');
    return this.sendAuthTransactionalMail({
      to,
      subject: 'Bitte E-Mail bestätigen – DashboardPro',
      html,
      text,
    });
  }

  async sendPasswordResetEmail(to: string, name: string, rawToken: string) {
    const base = this.frontendBaseUrl();
    const link = `${base}/reset-password?token=${encodeURIComponent(rawToken)}`;
    const safeName = this.escapeHtml(name || 'Sie');
    const inner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background-color:#0f172a;background-image:linear-gradient(135deg,#0f172a 0%,#1e293b 50%,#334155 100%);padding:32px 28px;text-align:center;">
      ${emailBrandWordmarkRow('onDark')}
      <p style="margin:0 0 6px;font-family:${EMAIL_FONT_STACK};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Sicherheit</p>
      <p style="margin:0;font-family:${EMAIL_FONT_STACK};font-size:22px;font-weight:700;line-height:1.3;color:#ffffff;">Passwort zurücksetzen</p>
    </td>
  </tr>
  <tr>
    <td style="padding:32px 28px 8px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;line-height:1.6;color:#334155;">
      <p style="margin:0 0 16px;">Hallo ${safeName},</p>
      <p style="margin:0 0 20px;">Sie haben angefordert, Ihr Passwort für DashboardPro zurückzusetzen. Klicken Sie auf den Button – der Link ist nur <strong style="color:#475569;">1&nbsp;Stunde</strong> gültig.</p>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px;">
        <tr>
          <td style="border-radius:10px;background-color:#4f46e5;">
            <a href="${link}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:16px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">Neues Passwort wählen</a>
          </td>
        </tr>
      </table>
      <p style="margin:0;font-size:14px;color:#64748b;">Wenn Sie diese Anfrage nicht gestellt haben, ändern Sie Ihr Passwort nicht – Ihr Konto bleibt geschützt. Sie können diese E-Mail ignorieren.</p>
    </td>
  </tr>
  <tr>
    <td style="padding:0 28px 28px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,'Helvetica Neue',Arial,sans-serif;font-size:13px;line-height:1.55;color:#64748b;">
      <p style="margin:0 0 8px;">Button funktioniert nicht? Link manuell öffnen:</p>
      <p style="margin:0;padding:12px 14px;background-color:#f8fafc;border-radius:8px;border:1px solid #e2e8f0;word-break:break-all;color:#475569;font-size:12px;">${this.escapeHtml(link)}</p>
    </td>
  </tr>
</table>`;
    const html = layoutTransactionEmail(
      inner,
      'Link zum Zurücksetzen Ihres Passworts (1 Stunde gültig).',
      this.frontendBaseUrl(),
    );
    const text = [
      `Hallo ${name || 'Sie'},`,
      '',
      'Passwort zurücksetzen (1 Stunde gültig):',
      link,
      '',
      'Wenn Sie das nicht waren, ignorieren Sie diese E-Mail.',
    ].join('\n');
    return this.sendAuthTransactionalMail({
      to,
      subject: 'Passwort zurücksetzen – DashboardPro',
      html,
      text,
    });
  }

  /**
   * Send task assignment notification
   * @returns true wenn mindestens E-Mail oder SMS versucht wurde
   */
  async sendTaskAssignedEmail(
    userId: string,
    taskId: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });

    if (!user || !task) return false;

    const wantEmail = await this.prefs.shouldSendEmail(userId, 'taskAssigned');
    const wantSms = await this.prefs.shouldSendSms(userId, 'taskAssigned');
    if (!wantEmail && !wantSms) return false;

    const base = this.frontendBaseUrl();
    const taskLink = `${base}/tasks/${encodeURIComponent(taskId)}`;
    const safeName = this.escapeHtml(user.name || 'Sie');
    const safeTitle = this.escapeHtml(task.title);
    const safeDesc = task.description ? this.escapeHtml(task.description) : '';
    const deadlineLine = task.deadline
      ? `<p style="margin:12px 0 0;font-size:14px;color:#64748b;">Deadline: <strong style="color:#475569;">${this.escapeHtml(new Date(task.deadline).toLocaleDateString('de-DE'))}</strong></p>`
      : '';

    const inner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background-color:#4f46e5;background-image:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:28px 24px;text-align:center;">
      ${emailBrandWordmarkRow('onDark')}
      <p style="margin:0;font-family:${EMAIL_FONT_STACK};font-size:20px;font-weight:700;color:#ffffff;">Neue Aufgabe für Sie</p>
    </td>
  </tr>
  <tr>
    <td style="padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#334155;">
      <p style="margin:0 0 16px;">Hallo ${safeName},</p>
      <p style="margin:0 0 20px;">Ihnen wurde eine Aufgabe zugewiesen:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f8fafc;border:1px solid #e2e8f0;border-radius:12px;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#0f172a;">${safeTitle}</p>
            ${safeDesc ? `<p style="margin:0;font-size:15px;color:#475569;line-height:1.55;">${safeDesc}</p>` : ''}
            ${deadlineLine}
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
        <tr>
          <td style="border-radius:10px;background-color:#4f46e5;">
            <a href="${taskLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;">Zur Aufgabe</a>
          </td>
        </tr>
      </table>
      <p style="margin:20px 0 0;font-size:13px;color:#94a3b8;">Viel Erfolg bei der Umsetzung.</p>
    </td>
  </tr>
</table>`;

    const html = layoutTransactionEmail(
      inner,
      `Neue Aufgabe: ${task.title}`,
      this.frontendBaseUrl(),
    );

    let emailed = false;
    if (wantEmail) {
      emailed = await this.sendEmail({
        to: user.email,
        subject: `Neue Aufgabe zugewiesen: ${task.title}`,
        html,
        text: [
          `Hallo ${user.name},`,
          '',
          `Neue Aufgabe: ${task.title}`,
          task.description ? String(task.description) : '',
          task.deadline
            ? `Deadline: ${new Date(task.deadline).toLocaleDateString('de-DE')}`
            : '',
          '',
          taskLink,
        ]
          .filter(Boolean)
          .join('\n'),
      });
    }

    if (wantSms) {
      const phone = await this.prefs.getPhoneE164(userId);
      if (phone) {
        const dl = task.deadline
          ? new Date(task.deadline).toLocaleDateString('de-DE')
          : 'ohne Datum';
        await this.sms.sendE164(
          phone,
          `DashboardPro: Neue Aufgabe „${task.title.slice(0, 80)}“ — ${dl}. ${taskLink}`,
        );
      }
    }

    return emailed || wantSms;
  }

  /**
   * Send deadline reminder email
   * @returns true wenn mindestens ein Kanal versucht wurde
   */
  async sendDeadlineReminderEmail(
    userId: string,
    taskId: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const task = await this.prisma.task.findUnique({ where: { id: taskId } });

    if (!user || !task) return false;

    const wantEmail = await this.prefs.shouldSendEmail(userId, 'taskDue');
    const wantSms = await this.prefs.shouldSendSms(userId, 'taskDue');
    if (!wantEmail && !wantSms) return false;

    const base = this.frontendBaseUrl();
    const taskLink = `${base}/tasks/${encodeURIComponent(taskId)}`;
    const safeName = this.escapeHtml(user.name || 'Sie');
    const safeTitle = this.escapeHtml(task.title);
    const dl = task.deadline
      ? new Date(task.deadline).toLocaleDateString('de-DE')
      : 'Nicht gesetzt';

    const inner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background-color:#b45309;background-image:linear-gradient(135deg,#d97706 0%,#f59e0b 100%);padding:28px 24px;text-align:center;">
      ${emailBrandWordmarkRow('onWarm')}
      <p style="margin:0 0 6px;font-family:${EMAIL_FONT_STACK};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:#78350f;">Erinnerung</p>
      <p style="margin:0;font-family:${EMAIL_FONT_STACK};font-size:20px;font-weight:700;color:#451a03;">Deadline steht bevor</p>
    </td>
  </tr>
  <tr>
    <td style="padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#334155;">
      <p style="margin:0 0 16px;">Hallo ${safeName},</p>
      <p style="margin:0 0 20px;">Bitte denken Sie an diese Aufgabe:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:12px;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0 0 8px;font-size:18px;font-weight:700;color:#78350f;">${safeTitle}</p>
            <p style="margin:0;font-size:15px;color:#92400e;">Deadline: <strong>${this.escapeHtml(dl)}</strong></p>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
        <tr>
          <td style="border-radius:10px;background-color:#d97706;">
            <a href="${taskLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Aufgabe öffnen</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

    const html = layoutTransactionEmail(
      inner,
      `Deadline: ${task.title}`,
      this.frontendBaseUrl(),
    );

    let emailed = false;
    if (wantEmail) {
      emailed = await this.sendEmail({
        to: user.email,
        subject: `Deadline-Erinnerung: ${task.title}`,
        html,
        text: `Hallo ${user.name},\n\nDeadline für „${task.title}“: ${dl}\n\n${taskLink}`,
      });
    }
    if (wantSms) {
      const phone = await this.prefs.getPhoneE164(userId);
      if (phone) {
        await this.sms.sendE164(
          phone,
          `DashboardPro: Deadline „${task.title.slice(0, 70)}“ am ${dl}. ${taskLink}`,
        );
      }
    }
    return emailed || wantSms;
  }

  /**
   * Kommentar-Erwähnung: Nutzer-IDs im Klartext als <code>@uuid</code> (UUID v4).
   */
  async sendCommentMentionEmail(
    mentionedUserId: string,
    params: {
      authorName: string;
      excerpt: string;
      resourceLabel: string;
      path: string;
    },
  ): Promise<boolean> {
    if (!(await this.prefs.shouldSendEmail(mentionedUserId, 'mentions')))
      return false;
    const user = await this.prisma.user.findUnique({
      where: { id: mentionedUserId },
    });
    if (!user) return false;
    const base = this.frontendBaseUrl();
    const path = params.path.startsWith('/') ? params.path : `/${params.path}`;
    const url = `${base}${path}`;
    const safeAuthor = this.escapeHtml(params.authorName || 'Jemand');
    const safeLabel = this.escapeHtml(params.resourceLabel);
    const safeExcerpt = this.escapeHtml(
      params.excerpt.replace(/\s+/g, ' ').slice(0, 400),
    );
    const inner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background-color:#0f766e;background-image:linear-gradient(135deg,#0d9488 0%,#14b8a6 100%);padding:28px 24px;text-align:center;">
      ${emailBrandWordmarkRow('onDark')}
      <p style="margin:0;font-family:${EMAIL_FONT_STACK};font-size:20px;font-weight:700;color:#ffffff;">Sie wurden erwähnt</p>
    </td>
  </tr>
  <tr>
    <td style="padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#334155;">
      <p style="margin:0 0 12px;">Hallo ${this.escapeHtml(user.name || 'Sie')},</p>
      <p style="margin:0 0 16px;"><strong>${safeAuthor}</strong> hat Sie bei <strong>${safeLabel}</strong> erwähnt.</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#f0fdfa;border:1px solid #99f6e4;border-radius:12px;">
        <tr><td style="padding:16px;font-size:14px;color:#115e59;">${safeExcerpt}</td></tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
        <tr>
          <td style="border-radius:10px;background-color:#0d9488;">
            <a href="${url}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Im Browser öffnen</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;
    return this.sendEmail({
      to: user.email,
      subject: `Erwähnung: ${params.resourceLabel}`,
      html: layoutTransactionEmail(inner, `Erwähnung`, base),
      text: [
        `Hallo ${user.name || 'Sie'},`,
        '',
        `${params.authorName || 'Jemand'} hat Sie bei „${params.resourceLabel}“ erwähnt:`,
        '',
        params.excerpt,
        '',
        url,
      ].join('\n'),
    });
  }

  /** Bestätigung für eigene Kalendertermine (E-Mail/SMS laut Präferenzen „Kalender“). */
  async notifyCalendarPersonalEvent(
    userId: string,
    event: { id: string; title: string; startDate: Date },
    kind: 'created' | 'updated',
  ): Promise<void> {
    const wantEmail = await this.prefs.shouldSendEmail(userId, 'calendar');
    const wantSms = await this.prefs.shouldSendSms(userId, 'calendar');
    if (!wantEmail && !wantSms) return;
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return;
    const base = this.frontendBaseUrl();
    const when = new Date(event.startDate).toLocaleString('de-DE');
    const link = `${base}/calendar`;
    const verb = kind === 'created' ? 'angelegt' : 'aktualisiert';
    if (wantEmail) {
      await this.sendEmail({
        to: user.email,
        subject: `Kalender: „${event.title}“ ${verb}`,
        html: layoutTransactionEmail(
          `<p style="margin:0 0 12px;">Ihr Termin <strong>${this.escapeHtml(event.title)}</strong> wurde ${verb}.</p><p style="margin:0 0 16px;">Start: <strong>${this.escapeHtml(when)}</strong></p><p style="margin:0;"><a href="${link}" style="color:#0d9488;font-weight:600;">Zum Kalender</a></p>`,
          'Kalender',
          base,
        ),
        text: `Termin „${event.title}“ ${verb}. Start: ${when}\n${link}`,
      });
    }
    if (wantSms) {
      const phone = await this.prefs.getPhoneE164(userId);
      if (phone) {
        await this.sms.sendE164(
          phone,
          `DashboardPro: Termin „${event.title.slice(0, 60)}“ ${verb}, ${when}`,
        );
      }
    }
  }

  /**
   * Send project update notification
   */
  async sendProjectUpdateEmail(
    userId: string,
    projectId: string,
    updateType: string,
  ): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    const project = await this.prisma.project.findUnique({
      where: { id: projectId },
    });

    if (!user || !project) return false;
    if (!(await this.prefs.shouldSendEmail(userId, 'projectUpdate')))
      return false;

    const base = this.frontendBaseUrl();
    const projectLink = `${base}/projects/${encodeURIComponent(projectId)}`;
    const safeName = this.escapeHtml(user.name || 'Sie');
    const safeProject = this.escapeHtml(project.name);
    const safeUpdate = this.escapeHtml(updateType);

    const inner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background-color:#0e7490;background-image:linear-gradient(135deg,#0e7490 0%,#06b6d4 100%);padding:28px 24px;text-align:center;">
      ${emailBrandWordmarkRow('onDark')}
      <p style="margin:0 0 6px;font-family:${EMAIL_FONT_STACK};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.9);">Projekt</p>
      <p style="margin:0;font-family:${EMAIL_FONT_STACK};font-size:20px;font-weight:700;color:#ffffff;">Neues Update</p>
    </td>
  </tr>
  <tr>
    <td style="padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#334155;">
      <p style="margin:0 0 16px;">Hallo ${safeName},</p>
      <p style="margin:0 0 16px;">Es gibt Neuigkeiten zu <strong style="color:#0f172a;">${safeProject}</strong>:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ecfeff;border:1px solid #a5f3fc;border-radius:12px;">
        <tr>
          <td style="padding:20px;">
            <p style="margin:0;font-size:15px;color:#164e63;line-height:1.55;">${safeUpdate}</p>
          </td>
        </tr>
      </table>
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:24px 0 0;">
        <tr>
          <td style="border-radius:10px;background-color:#0891b2;">
            <a href="${projectLink}" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Zum Projekt</a>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>`;

    const html = layoutTransactionEmail(
      inner,
      `Update: ${project.name}`,
      this.frontendBaseUrl(),
    );

    return await this.sendEmail({
      to: user.email,
      subject: `Projekt-Update: ${project.name}`,
      html,
      text: `Projekt-Update: ${project.name}\n\n${updateType}\n\n${projectLink}`,
    });
  }

  /**
   * Send weekly digest email
   */
  async sendWeeklyDigestEmail(userId: string): Promise<boolean> {
    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user) return false;
    if (!(await this.prefs.shouldSendEmail(userId, 'weeklyDigest')))
      return false;

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const completedTasks = await this.prisma.task.count({
      where: {
        assignedToId: userId,
        status: 'DONE',
        updatedAt: { gte: oneWeekAgo },
      },
    });

    const pendingTasks = await this.prisma.task.count({
      where: {
        assignedToId: userId,
        status: { not: 'DONE' },
      },
    });

    const upcomingDeadlines = await this.prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: { not: 'DONE' },
        deadline: {
          gte: new Date(),
          lte: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        },
      },
      orderBy: { deadline: 'asc' },
      take: 5,
    });

    const recentlyTouchedOpen = await this.prisma.task.findMany({
      where: {
        assignedToId: userId,
        status: { not: 'DONE' },
      },
      orderBy: { updatedAt: 'desc' },
      take: 5,
      include: {
        project: { select: { name: true } },
      },
    });

    const safeName = this.escapeHtml(user.name || 'Sie');
    const base = this.frontendBaseUrl();
    const deadlinesList =
      upcomingDeadlines.length > 0
        ? `
      <p style="margin:28px 0 12px;font-size:15px;font-weight:700;color:#0f172a;">Anstehende Deadlines</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        ${upcomingDeadlines
          .map((t) => {
            const st = this.escapeHtml(t.title);
            const dd = t.deadline
              ? this.escapeHtml(
                  new Date(t.deadline).toLocaleDateString('de-DE'),
                )
              : '—';
            return `<tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#334155;">${st}</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:14px;color:#64748b;white-space:nowrap;">${dd}</td></tr>`;
          })
          .join('')}
      </table>`
        : '';

    const openTasksList =
      recentlyTouchedOpen.length > 0
        ? `
      <p style="margin:28px 0 12px;font-size:15px;font-weight:700;color:#0f172a;">Zuletzt bearbeitete offene Aufgaben</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border:1px solid #e2e8f0;border-radius:12px;overflow:hidden;">
        ${recentlyTouchedOpen
          .map((t) => {
            const st = this.escapeHtml(t.title);
            const pn = t.project?.name ? this.escapeHtml(t.project.name) : '—';
            return `<tr><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:14px;color:#334155;">${st}</td><td style="padding:12px 16px;border-bottom:1px solid #f1f5f9;text-align:right;font-size:13px;color:#64748b;">${pn}</td></tr>`;
          })
          .join('')}
      </table>`
        : '';

    const inner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background-color:#4338ca;background-image:linear-gradient(135deg,#4f46e5 0%,#7c3aed 100%);padding:28px 24px;text-align:center;">
      ${emailBrandWordmarkRow('onDark')}
      <p style="margin:0 0 6px;font-family:${EMAIL_FONT_STACK};font-size:12px;font-weight:600;letter-spacing:0.08em;text-transform:uppercase;color:rgba(255,255,255,0.88);">Wochenbericht</p>
      <p style="margin:0;font-family:${EMAIL_FONT_STACK};font-size:20px;font-weight:700;color:#ffffff;">Ihre Übersicht</p>
    </td>
  </tr>
  <tr>
    <td style="padding:28px 24px;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;font-size:16px;line-height:1.6;color:#334155;">
      <p style="margin:0 0 20px;">Hallo ${safeName},</p>
      <p style="margin:0 0 24px;">Kurz zusammengefasst – Ihre letzte Woche bei DashboardPro:</p>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
        <tr>
          <td width="50%" style="padding:0 8px 16px 0;vertical-align:top;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#ecfdf5;border:1px solid #a7f3d0;border-radius:12px;text-align:center;">
              <tr><td style="padding:20px 12px;">
                <p style="margin:0;font-size:28px;font-weight:800;color:#047857;">${completedTasks}</p>
                <p style="margin:8px 0 0;font-size:13px;font-weight:600;color:#065f46;">Erledigt (7 Tage)</p>
              </td></tr>
            </table>
          </td>
          <td width="50%" style="padding:0 0 16px 8px;vertical-align:top;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color:#fffbeb;border:1px solid #fde68a;border-radius:12px;text-align:center;">
              <tr><td style="padding:20px 12px;">
                <p style="margin:0;font-size:28px;font-weight:800;color:#b45309;">${pendingTasks}</p>
                <p style="margin:8px 0 0;font-size:13px;font-weight:600;color:#92400e;">Noch offen</p>
              </td></tr>
            </table>
          </td>
        </tr>
      </table>
      ${openTasksList}
      ${deadlinesList}
      <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:28px 0 0;">
        <tr>
          <td style="border-radius:10px;background-color:#4f46e5;">
            <a href="${base}/tasks" target="_blank" rel="noopener noreferrer" style="display:inline-block;padding:14px 24px;font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,sans-serif;">Zu den Aufgaben</a>
          </td>
        </tr>
      </table>
      <p style="margin:24px 0 0;font-size:14px;color:#64748b;">Viel Erfolg in dieser Woche!</p>
    </td>
  </tr>
</table>`;

    const html = layoutTransactionEmail(
      inner,
      `Wochenbericht: ${completedTasks} erledigt, ${pendingTasks} offen`,
      this.frontendBaseUrl(),
    );

    return this.sendEmail({
      to: user.email,
      subject: 'Ihr wöchentlicher Bericht – DashboardPro',
      html,
      text: `Wöchentlicher Bericht: ${completedTasks} erledigt, ${pendingTasks} offen${
        recentlyTouchedOpen.length
          ? '\n\nOffene Aufgaben (zuletzt bearbeitet):\n' +
            recentlyTouchedOpen
              .map(
                (t) =>
                  `- ${t.title}${t.project?.name ? ` (${t.project.name})` : ''}`,
              )
              .join('\n')
          : ''
      }${upcomingDeadlines.length ? '\n\nAnstehende Deadlines:\n' + upcomingDeadlines.map((t) => `- ${t.title}`).join('\n') : ''}\n\n${base}/tasks`,
    });
  }
}
