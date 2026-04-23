import { Controller, Post, UseGuards, Get } from '@nestjs/common';
import { EmailService } from './email.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { CurrentUser } from '../auth/decorators/current-user.decorator';
import { OrgGuard } from '../auth/guards/org.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';
import {
  EMAIL_FONT_STACK,
  emailBrandWordmarkRow,
  escapeHtmlPlain,
  layoutTransactionEmail,
} from './email-brand';

@Controller('email')
@UseGuards(JwtAuthGuard, OrgGuard, RolesGuard)
export class EmailController {
  constructor(private emailService: EmailService) {}

  @Post('test')
  @Roles('ADMIN', 'MANAGER')
  async sendTestEmail(@CurrentUser() user: any) {
    const baseUrl = (
      process.env.FRONTEND_URL || 'http://localhost:8000'
    ).replace(/\/$/, '');
    const safeName = escapeHtmlPlain(user.name || 'Sie');

    const inner = `
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0">
  <tr>
    <td style="background:linear-gradient(135deg,#4f46e5 0%,#6366f1 100%);padding:32px 28px;text-align:center;">
      ${emailBrandWordmarkRow('onDark')}
      <p style="margin:12px 0 0;font-family:${EMAIL_FONT_STACK};font-size:20px;font-weight:700;color:#ffffff;">Test-E-Mail</p>
      <p style="margin:8px 0 0;font-family:${EMAIL_FONT_STACK};font-size:14px;color:rgba(255,255,255,0.9);">E-Mail-Versand prüfen</p>
    </td>
  </tr>
  <tr>
    <td style="padding:28px;font-family:${EMAIL_FONT_STACK};font-size:16px;line-height:1.65;color:#334155;">
      <p style="margin:0 0 16px;">Hallo ${safeName},</p>
      <p style="margin:0 0 16px;">dies ist eine Test-E-Mail, um zu bestätigen, dass Benachrichtigungen aus <strong style="color:#0f172a;">Dashboard Pro</strong> bei Ihnen ankommen.</p>
      <p style="margin:0;">Wenn Sie diese Nachricht sehen, ist das SMTP-Setup in der Regel korrekt.</p>
    </td>
  </tr>
</table>`;

    const html = layoutTransactionEmail(
      inner,
      'Dashboard Pro – Test der E-Mail-Zustellung.',
      baseUrl,
    );

    const success = await this.emailService.sendEmail({
      to: user.email,
      subject: 'Dashboard Pro – Test-E-Mail',
      html,
      text: [
        `Hallo ${user.name || 'Sie'},`,
        '',
        'Test-E-Mail von Dashboard Pro – der Versand funktioniert.',
        `App: ${baseUrl}`,
      ].join('\n'),
    });

    return {
      success,
      message: success
        ? 'Test-E-Mail wurde gesendet'
        : 'E-Mail konnte nicht gesendet werden. API-Log prüfen; RESEND_API_KEY oder SMTP/Gmail.',
    };
  }

  @Get('status')
  getEmailStatus() {
    const configured = this.emailService.isEmailOutboundConfigured();
    const passRaw = process.env.SMTP_PASS ?? process.env.GMAIL_APP_PASSWORD;
    const hasPass = Boolean(passRaw?.replace(/\s/g, ''));
    const resend = Boolean(process.env.RESEND_API_KEY?.trim());
    return {
      configured,
      message: configured
        ? resend
          ? 'Resend ist aktiv (API-Key gesetzt; hat Vorrang vor SMTP).'
          : 'SMTP-Transporter ist geladen (Registrierung nutzt dieselbe Verbindung).'
        : 'Kein Versand: RESEND_API_KEY oder SMTP_HOST + SMTP_USER + SMTP_PASS bzw. Gmail ohne SMTP_HOST. Siehe GET /health/email-env.',
      envPresent: {
        RESEND_API_KEY: resend,
        SMTP_HOST: Boolean(process.env.SMTP_HOST?.trim()),
        SMTP_USER: Boolean(process.env.SMTP_USER?.trim()),
        SMTP_PASS_or_GMAIL_APP_PASSWORD: hasPass,
      },
    };
  }
}
