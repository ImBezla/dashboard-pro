import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Leerer Seed: keine Demo-Benutzer, keine Beispiel-Projekte.
 * Ersten Account bitte über /register anlegen.
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
