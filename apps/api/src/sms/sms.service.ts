import { Injectable, Logger } from '@nestjs/common';

/**
 * SMS über Twilio REST (ohne SDK). Ohne Env-Variablen: nur Log (DEV).
 *
 * TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER (+1…)
 */
@Injectable()
export class SmsService {
  private readonly log = new Logger(SmsService.name);

  private isConfigured(): boolean {
    return Boolean(
      process.env.TWILIO_ACCOUNT_SID?.trim() &&
        process.env.TWILIO_AUTH_TOKEN?.trim() &&
        process.env.TWILIO_FROM_NUMBER?.trim(),
    );
  }

  async sendE164(to: string, body: string): Promise<boolean> {
    const sid = process.env.TWILIO_ACCOUNT_SID?.trim();
    const token = process.env.TWILIO_AUTH_TOKEN?.trim();
    const from = process.env.TWILIO_FROM_NUMBER?.trim();

    if (!this.isConfigured() || !sid || !token || !from) {
      this.log.log(`[SMS nicht konfiguriert] an ${to}: ${body.slice(0, 120)}…`);
      return true;
    }

    try {
      const auth = Buffer.from(`${sid}:${token}`).toString('base64');
      const params = new URLSearchParams({
        To: to,
        From: from,
        Body: body.slice(0, 1400),
      });
      const res = await fetch(
        `https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`,
        {
          method: 'POST',
          headers: {
            Authorization: `Basic ${auth}`,
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        },
      );
      if (!res.ok) {
        const errText = await res.text();
        this.log.warn(`Twilio SMS fehlgeschlagen: ${res.status} ${errText}`);
        return false;
      }
      this.log.log(`SMS gesendet an ${to}`);
      return true;
    } catch (e) {
      this.log.error(`SMS Versandfehler: ${e}`);
      return false;
    }
  }
}
