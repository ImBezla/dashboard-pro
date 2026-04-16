import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Legacy-Pfad: Bitte `apps/api/prisma/seed.ts` nutzen (wird von npm run db:seed verwendet).
 * Keine Demo-Daten.
 */
async function main() {
  console.log('Seed: übersprungen (keine Demo-Daten).');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
