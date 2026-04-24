-- Bridge: Nach init + CRM/Calendar existieren Kern-Tabellen bereits.
-- Ergänzt Multi-Tenant (Organization), fehlende Tabellen und Spalten — ohne User/Team/… neu anzulegen.
--
-- Idempotent: Eine frühere fehlgeschlagene „baseline“-Version konnte bereits "Organization" o. ä. angelegt haben.

CREATE TABLE IF NOT EXISTS "Organization" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "kind" TEXT NOT NULL DEFAULT 'OPERATING',
    "joinCode" TEXT NOT NULL,
    "settings" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL
);

-- Alte Teil-Migration ohne Spalte kind
ALTER TABLE "Organization" ADD COLUMN IF NOT EXISTS "kind" TEXT NOT NULL DEFAULT 'OPERATING';

CREATE UNIQUE INDEX IF NOT EXISTS "Organization_joinCode_key" ON "Organization"("joinCode");

CREATE TABLE IF NOT EXISTS "OrganizationMember" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "userId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    CONSTRAINT "OrganizationMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "OrganizationMember_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "OrganizationMember_userId_organizationId_key" ON "OrganizationMember"("userId", "organizationId");

INSERT INTO "Organization" ("id", "name", "kind", "joinCode", "settings", "createdAt", "updatedAt")
VALUES (
    '00000000-0000-4000-8000-000000000001',
    'Default Organization',
    'OPERATING',
    'BOOTSTRAP-DEFAULT-ORG',
    NULL,
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT ("id") DO NOTHING;

INSERT INTO "OrganizationMember" ("id", "userId", "organizationId", "role")
SELECT gen_random_uuid()::text, u."id", '00000000-0000-4000-8000-000000000001', 'OWNER'
FROM "User" u
WHERE NOT EXISTS (
    SELECT 1 FROM "OrganizationMember" om
    WHERE om."userId" = u."id" AND om."organizationId" = '00000000-0000-4000-8000-000000000001'
);

-- OpsWorkspaceState + UserNotificationPreferences (vorher in postgres_baseline)
CREATE TABLE IF NOT EXISTS "OpsWorkspaceState" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "payloadJson" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "OpsWorkspaceState_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "OpsWorkspaceState_organizationId_key" ON "OpsWorkspaceState"("organizationId");

CREATE TABLE IF NOT EXISTS "UserNotificationPreferences" (
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
    "smsConsentAt" TIMESTAMP(3),
    "taskDueReminderDaysBefore" INTEGER NOT NULL DEFAULT 1,
    "lastWeeklyDigestSentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "UserNotificationPreferences_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "UserNotificationPreferences_userId_key" ON "UserNotificationPreferences"("userId");

ALTER TABLE "User" ADD COLUMN IF NOT EXISTS "activeOrganizationId" TEXT;

DO $$
BEGIN
    ALTER TABLE "User" ADD CONSTRAINT "User_activeOrganizationId_fkey" FOREIGN KEY ("activeOrganizationId") REFERENCES "Organization"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

UPDATE "User" SET "activeOrganizationId" = '00000000-0000-4000-8000-000000000001'
WHERE "activeOrganizationId" IS NULL;

-- Team / Project
ALTER TABLE "Team" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "Team" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;

ALTER TABLE "Team" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$
BEGIN
    ALTER TABLE "Team" ADD CONSTRAINT "Team_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Project" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "Project" p SET "organizationId" = t."organizationId"
FROM "Team" t
WHERE p."teamId" IS NOT NULL AND p."teamId" = t."id" AND p."organizationId" IS NULL;

UPDATE "Project" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;

ALTER TABLE "Project" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$
BEGIN
    ALTER TABLE "Project" ADD CONSTRAINT "Project_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Task (Felder aus späterem „Baseline“-Schema)
ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "isRecurring" BOOLEAN NOT NULL DEFAULT false;

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "recurrenceType" TEXT;

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "recurrenceInterval" INTEGER DEFAULT 1;

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "recurrenceEndDate" TIMESTAMP(3);

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "parentTaskId" TEXT;

ALTER TABLE "Task" ADD COLUMN IF NOT EXISTS "lastDeadlineReminderSentAt" TIMESTAMP(3);

-- ActivityLog / CalendarEvent / CRM-Tabellen: organizationId
ALTER TABLE "ActivityLog" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "ActivityLog" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;

ALTER TABLE "ActivityLog" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$
BEGIN
    ALTER TABLE "ActivityLog" ADD CONSTRAINT "ActivityLog_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "CalendarEvent" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "CalendarEvent" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;

ALTER TABLE "CalendarEvent" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$
BEGIN
    ALTER TABLE "CalendarEvent" ADD CONSTRAINT "CalendarEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "Customer" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;

ALTER TABLE "Customer" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$
BEGIN
    ALTER TABLE "Customer" ADD CONSTRAINT "Customer_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE "Invoice" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "Invoice" i SET "organizationId" = c."organizationId" FROM "Customer" c WHERE i."customerId" = c."id" AND i."organizationId" IS NULL;

UPDATE "Invoice" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;

ALTER TABLE "Invoice" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$
BEGIN
    ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DROP INDEX IF EXISTS "Invoice_invoiceNumber_key";

CREATE UNIQUE INDEX IF NOT EXISTS "Invoice_organizationId_invoiceNumber_key" ON "Invoice"("organizationId", "invoiceNumber");

ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "Product" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;

ALTER TABLE "Product" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$
BEGIN
    ALTER TABLE "Product" ADD CONSTRAINT "Product_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- PurchaseOrder: Spalten an Prisma-Schema anpassen (ältere Migration nutzte "item" + REAL quantity)
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'PurchaseOrder' AND column_name = 'item'
    ) AND NOT EXISTS (
        SELECT 1 FROM information_schema.columns
        WHERE table_schema = 'public' AND table_name = 'PurchaseOrder' AND column_name = 'product'
    ) THEN
        ALTER TABLE "PurchaseOrder" RENAME COLUMN "item" TO "product";
    END IF;
END $$;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "supplierId" TEXT;

ALTER TABLE "PurchaseOrder" ADD COLUMN IF NOT EXISTS "organizationId" TEXT;

UPDATE "PurchaseOrder" SET "organizationId" = '00000000-0000-4000-8000-000000000001' WHERE "organizationId" IS NULL;

ALTER TABLE "PurchaseOrder" ALTER COLUMN "organizationId" SET NOT NULL;

DO $$
BEGIN
    ALTER TABLE "PurchaseOrder" ALTER COLUMN "quantity" TYPE INTEGER USING GREATEST(1, ROUND("quantity")::integer);
EXCEPTION
    WHEN undefined_column THEN NULL;
    WHEN datatype_mismatch THEN NULL;
END $$;

DROP INDEX IF EXISTS "PurchaseOrder_orderNumber_key";

CREATE UNIQUE INDEX IF NOT EXISTS "PurchaseOrder_organizationId_orderNumber_key" ON "PurchaseOrder"("organizationId", "orderNumber");

CREATE TABLE IF NOT EXISTS "Supplier" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "name" TEXT NOT NULL,
    "email" TEXT,
    "phone" TEXT,
    "company" TEXT,
    "address" TEXT,
    "notes" TEXT,
    "status" TEXT NOT NULL DEFAULT 'active',
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Supplier_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

DO $$
BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Supplier"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

DO $$
BEGIN
    ALTER TABLE "PurchaseOrder" ADD CONSTRAINT "PurchaseOrder_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
    WHEN duplicate_object THEN NULL;
END $$;

-- Weitere Tabellen (vorher im „Baseline“-Duplikat)
CREATE TABLE IF NOT EXISTS "Comment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "content" TEXT NOT NULL,
    "taskId" TEXT,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "Comment_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "Tag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "color" TEXT NOT NULL DEFAULT '#6366f1',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "Tag_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "Tag_organizationId_name_key" ON "Tag"("organizationId", "name");

CREATE TABLE IF NOT EXISTS "TaskTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "taskId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "TaskTag_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "TaskTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "TaskTag_taskId_tagId_key" ON "TaskTag"("taskId", "tagId");

CREATE TABLE IF NOT EXISTS "ProjectTag" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "projectId" TEXT NOT NULL,
    "tagId" TEXT NOT NULL,
    CONSTRAINT "ProjectTag_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ProjectTag_tagId_fkey" FOREIGN KEY ("tagId") REFERENCES "Tag" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE UNIQUE INDEX IF NOT EXISTS "ProjectTag_projectId_tagId_key" ON "ProjectTag"("projectId", "tagId");

CREATE TABLE IF NOT EXISTS "TimeEntry" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "description" TEXT,
    "duration" INTEGER NOT NULL,
    "date" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "taskId" TEXT,
    "projectId" TEXT,
    "userId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "TimeEntry_taskId_fkey" FOREIGN KEY ("taskId") REFERENCES "Task" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeEntry_projectId_fkey" FOREIGN KEY ("projectId") REFERENCES "Project" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "TimeEntry_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE TABLE IF NOT EXISTS "FileAttachment" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "filename" TEXT NOT NULL,
    "originalName" TEXT NOT NULL,
    "mimeType" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "path" TEXT NOT NULL,
    "taskId" TEXT,
    "projectId" TEXT,
    "organizationId" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "FileAttachment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
