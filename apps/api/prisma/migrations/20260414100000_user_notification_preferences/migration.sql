-- CreateTable
CREATE TABLE "UserNotificationPreferences" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "pushEnabled" BOOLEAN NOT NULL DEFAULT true,
    "emailEnabled" BOOLEAN NOT NULL DEFAULT true,
    "smsEnabled" BOOLEAN NOT NULL DEFAULT false,
    "phoneE164" TEXT,
    "emailTaskAssigned" BOOLEAN NOT NULL DEFAULT true,
    "emailTaskDue" BOOLEAN NOT NULL DEFAULT true,
    "emailProjectUpdate" BOOLEAN NOT NULL DEFAULT true,
    "emailMentions" BOOLEAN NOT NULL DEFAULT true,
    "emailWeeklyDigest" BOOLEAN NOT NULL DEFAULT false,
    "emailCalendarEvents" BOOLEAN NOT NULL DEFAULT true,
    "smsTaskAssigned" BOOLEAN NOT NULL DEFAULT false,
    "smsTaskDue" BOOLEAN NOT NULL DEFAULT false,
    "smsCalendarEvents" BOOLEAN NOT NULL DEFAULT false,
    "taskDueReminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "lastWeeklyDigestSentAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "UserNotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX "UserNotificationPreferences_userId_key" ON "UserNotificationPreferences"("userId");

-- AlterTable
ALTER TABLE "Task" ADD COLUMN "lastDeadlineReminderSentAt" DATETIME;
