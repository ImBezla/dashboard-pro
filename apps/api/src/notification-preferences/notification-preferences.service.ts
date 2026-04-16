import { Injectable } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import type { UserNotificationPreferences } from '@prisma/client';
import { UpdateNotificationPreferencesDto } from './dto/update-notification-preferences.dto';

/** Effektive Werte inkl. Defaults (wenn noch kein DB-Eintrag). */
export type EffectiveNotificationPreferences = {
  pushEnabled: boolean;
  emailEnabled: boolean;
  smsEnabled: boolean;
  phoneE164: string | null;
  emailTaskAssigned: boolean;
  emailTaskDue: boolean;
  emailProjectUpdate: boolean;
  emailMentions: boolean;
  emailWeeklyDigest: boolean;
  emailCalendarEvents: boolean;
  smsTaskAssigned: boolean;
  smsTaskDue: boolean;
  smsCalendarEvents: boolean;
  taskDueReminderDaysBefore: number;
  lastWeeklyDigestSentAt: string | null;
  smsConsentAt: string | null;
};

const defaults: EffectiveNotificationPreferences = {
  pushEnabled: true,
  emailEnabled: true,
  smsEnabled: false,
  phoneE164: null,
  emailTaskAssigned: true,
  emailTaskDue: true,
  emailProjectUpdate: true,
  emailMentions: true,
  emailWeeklyDigest: false,
  emailCalendarEvents: true,
  smsTaskAssigned: false,
  smsTaskDue: false,
  smsCalendarEvents: false,
  taskDueReminderDaysBefore: 1,
  lastWeeklyDigestSentAt: null,
  smsConsentAt: null,
};

function fromRow(
  row: UserNotificationPreferences | null,
): EffectiveNotificationPreferences {
  if (!row) return { ...defaults };
  return {
    pushEnabled: row.pushEnabled,
    emailEnabled: row.emailEnabled,
    smsEnabled: row.smsEnabled,
    phoneE164: row.phoneE164,
    emailTaskAssigned: row.emailTaskAssigned,
    emailTaskDue: row.emailTaskDue,
    emailProjectUpdate: row.emailProjectUpdate,
    emailMentions: row.emailMentions,
    emailWeeklyDigest: row.emailWeeklyDigest,
    emailCalendarEvents: row.emailCalendarEvents,
    smsTaskAssigned: row.smsTaskAssigned,
    smsTaskDue: row.smsTaskDue,
    smsCalendarEvents: row.smsCalendarEvents,
    taskDueReminderDaysBefore: row.taskDueReminderDaysBefore,
    lastWeeklyDigestSentAt: row.lastWeeklyDigestSentAt
      ? row.lastWeeklyDigestSentAt.toISOString()
      : null,
    smsConsentAt: row.smsConsentAt ? row.smsConsentAt.toISOString() : null,
  };
}

@Injectable()
export class NotificationPreferencesService {
  constructor(private prisma: PrismaService) {}

  async getEffective(userId: string): Promise<EffectiveNotificationPreferences> {
    const row = await this.prisma.userNotificationPreferences.findUnique({
      where: { userId },
    });
    return fromRow(row);
  }

  async upsert(
    userId: string,
    dto: UpdateNotificationPreferencesDto,
  ): Promise<EffectiveNotificationPreferences> {
    const raw: Record<string, unknown> = { ...(dto as object) };
    delete raw.acceptSmsConsent;
    delete raw.smsConsentAt;
    if (dto.acceptSmsConsent === true) {
      raw.smsConsentAt = new Date();
    }
    if (dto.phoneE164 !== undefined) {
      const t =
        typeof dto.phoneE164 === 'string' ? dto.phoneE164.trim() : dto.phoneE164;
      raw.phoneE164 = t === '' || t === null ? null : t;
    }
    delete raw.lastWeeklyDigestSentAt;
    const updateData = Object.fromEntries(
      Object.entries(raw).filter(([, v]) => v !== undefined),
    ) as Record<string, unknown>;
    await this.prisma.userNotificationPreferences.upsert({
      where: { userId },
      create: { userId, ...(updateData as object) },
      update: updateData as object,
    });
    return this.getEffective(userId);
  }

  async shouldSendEmail(
    userId: string,
    key:
      | 'taskAssigned'
      | 'taskDue'
      | 'projectUpdate'
      | 'mentions'
      | 'weeklyDigest'
      | 'calendar',
  ): Promise<boolean> {
    const p = await this.getEffective(userId);
    if (!p.emailEnabled) return false;
    switch (key) {
      case 'taskAssigned':
        return p.emailTaskAssigned;
      case 'taskDue':
        return p.emailTaskDue;
      case 'projectUpdate':
        return p.emailProjectUpdate;
      case 'mentions':
        return p.emailMentions;
      case 'weeklyDigest':
        return p.emailWeeklyDigest;
      case 'calendar':
        return p.emailCalendarEvents;
      default:
        return false;
    }
  }

  async shouldSendSms(
    userId: string,
    key: 'taskAssigned' | 'taskDue' | 'calendar',
  ): Promise<boolean> {
    const p = await this.getEffective(userId);
    if (!p.smsEnabled || !p.phoneE164) return false;
    switch (key) {
      case 'taskAssigned':
        return p.smsTaskAssigned;
      case 'taskDue':
        return p.smsTaskDue;
      case 'calendar':
        return p.smsCalendarEvents;
      default:
        return false;
    }
  }

  async getPhoneE164(userId: string): Promise<string | null> {
    const p = await this.getEffective(userId);
    return p.phoneE164;
  }
}
