import { NotificationPreferencesService } from './notification-preferences.service';

describe('NotificationPreferencesService', () => {
  it('shouldSendEmail: ohne DB-Zeile — Weekly Digest aus, Zuweisung an', async () => {
    const prisma = {
      userNotificationPreferences: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;
    const svc = new NotificationPreferencesService(prisma);
    expect(await svc.shouldSendEmail('u1', 'weeklyDigest')).toBe(false);
    expect(await svc.shouldSendEmail('u1', 'taskAssigned')).toBe(true);
  });

  it('shouldSendSms: ohne Nummer immer false', async () => {
    const prisma = {
      userNotificationPreferences: {
        findUnique: jest.fn().mockResolvedValue(null),
      },
    } as any;
    const svc = new NotificationPreferencesService(prisma);
    expect(await svc.shouldSendSms('u1', 'taskDue')).toBe(false);
  });
});
