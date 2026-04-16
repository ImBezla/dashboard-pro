import { PrismaClient } from '@prisma/client';
import * as bcrypt from 'bcrypt';

// Set DATABASE_URL if not set
if (!process.env.DATABASE_URL) {
  process.env.DATABASE_URL = 'file:./prisma/dev.db';
}

const prisma = new PrismaClient();

async function main() {
  const email = 'valentin@dashboardpro.com';
  const password = 'admin123';
  const name = 'Valentin Manager';

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    // Update password
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email },
      data: { password: hashedPassword },
    });
    console.log('✅ Passwort für Benutzer aktualisiert:', email);
  } else {
    // Create new user
    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: 'ADMIN',
      },
    });
    console.log('✅ Neuer Benutzer erstellt:', email);
  }

  console.log('📧 Email:', email);
  console.log('🔑 Passwort:', password);
}

main()
  .catch((e) => {
    console.error('❌ Fehler:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

