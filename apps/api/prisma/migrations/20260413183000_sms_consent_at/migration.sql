-- SMS-Einwilligung (Nachweis / Compliance)
ALTER TABLE "UserNotificationPreferences" ADD COLUMN "smsConsentAt" DATETIME;

-- Bestehende SMS-Nutzer: Zeitpunkt für Rückwärtskompatibilität setzen
UPDATE "UserNotificationPreferences"
SET "smsConsentAt" = COALESCE("updatedAt", CURRENT_TIMESTAMP)
WHERE "smsEnabled" = 1 AND "smsConsentAt" IS NULL;
