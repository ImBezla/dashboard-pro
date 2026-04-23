-- AlterTable
ALTER TABLE "NewsletterSubscription" ADD COLUMN     "confirmedAt" TIMESTAMP(3),
ADD COLUMN "verificationTokenHash" TEXT,
ADD COLUMN "verificationExpiresAt" TIMESTAMP(3),
ADD COLUMN "lastConfirmationSentAt" TIMESTAMP(3),
ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Bestehende Einträge (ohne Double-Opt-in) als bereits bestätigt behandeln
UPDATE "NewsletterSubscription"
SET "confirmedAt" = "createdAt",
    "updatedAt"   = "createdAt"
WHERE "confirmedAt" IS NULL;

-- CreateIndex
CREATE INDEX "NewsletterSubscription_verificationTokenHash_idx" ON "NewsletterSubscription"("verificationTokenHash");
