import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';
import { NotificationPreferencesService } from '../notification-preferences/notification-preferences.service';

@Injectable()
export class RemindersScheduler {
  private readonly log = new Logger(RemindersScheduler.name);

  constructor(
    private prisma: PrismaService,
    private emailService: EmailService,
    private prefs: NotificationPreferencesService,
  ) {}

  /**
   * Stündlich: Aufgaben mit Deadline innerhalb der nächsten 24 h (nicht erledigt),
   * höchstens alle ~36 h pro Aufgabe. E-Mail/SMS und „Tage vorher“ werten die
   * {@link EmailService}-Schicht anhand der Nutzerpräferenzen aus.
   */
  @Cron(CronExpression.EVERY_HOUR)
  async deadlineReminders(): Promise<void> {
    const now = new Date();
    /** Bis zu 8 Tage im Voraus laden; pro Nutzer begrenzt durch taskDueReminderDaysBefore. */
    const horizon = new Date(now.getTime() + 8 * 24 * 60 * 60 * 1000);
    const staleBefore = new Date(now.getTime() - 36 * 60 * 60 * 1000);

    const tasks = await this.prisma.task.findMany({
      where: {
        status: { not: 'DONE' },
        deadline: { gt: now, lte: horizon },
        assignedToId: { not: null },
        OR: [
          { lastDeadlineReminderSentAt: null },
          { lastDeadlineReminderSentAt: { lt: staleBefore } },
        ],
      },
      take: 200,
    });

    for (const t of tasks) {
      const uid = t.assignedToId!;
      const eff = await this.prefs.getEffective(uid);
      const wantEmail = eff.emailEnabled && eff.emailTaskDue;
      const wantSms =
        eff.smsEnabled &&
        eff.smsTaskDue &&
        eff.phoneE164 &&
        eff.phoneE164.length > 3;
      if (!wantEmail && !wantSms) continue;

      const deadline = t.deadline ? new Date(t.deadline) : null;
      if (!deadline) continue;

      const msPerDay = 24 * 60 * 60 * 1000;
      const daysUntil = (deadline.getTime() - now.getTime()) / msPerDay;
      if (daysUntil > eff.taskDueReminderDaysBefore) continue;
      if (daysUntil < 0) continue;

      const sent = await this.emailService.sendDeadlineReminderEmail(uid, t.id);
      if (sent) {
        await this.prisma.task.update({
          where: { id: t.id },
          data: { lastDeadlineReminderSentAt: new Date() },
        });
      }
    }
  }

  /** Montags 08:00 UTC: wöchentlicher Digest (max. 1× pro 6 Tage). */
  @Cron('0 8 * * 1')
  async weeklyDigest(): Promise<void> {
    const sixDaysAgo = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000);
    const rows = await this.prisma.userNotificationPreferences.findMany({
      where: {
        emailEnabled: true,
        emailWeeklyDigest: true,
        OR: [
          { lastWeeklyDigestSentAt: null },
          { lastWeeklyDigestSentAt: { lt: sixDaysAgo } },
        ],
      },
    });

    for (const row of rows) {
      try {
        await this.emailService.sendWeeklyDigestEmail(row.userId);
        await this.prisma.userNotificationPreferences.update({
          where: { userId: row.userId },
          data: { lastWeeklyDigestSentAt: new Date() },
        });
      } catch (e) {
        this.log.warn(`Weekly digest für ${row.userId}: ${e}`);
      }
    }
  }
}
