-- AlterTable
ALTER TABLE "User" ADD COLUMN "emailVerifiedAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "emailVerificationTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "emailVerificationExpiresAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "passwordResetTokenHash" TEXT;
ALTER TABLE "User" ADD COLUMN "passwordResetExpiresAt" DATETIME;
ALTER TABLE "User" ADD COLUMN "lastVerificationEmailSentAt" DATETIME;

-- Bestehende Nutzer als verifiziert markieren (kein Lock-out)
UPDATE "User" SET "emailVerifiedAt" = datetime('now') WHERE "emailVerifiedAt" IS NULL;
