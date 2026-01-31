// --- FILE: server/prisma/seed.ts
import { PrismaClient } from '@prisma/client';
import { seedUsers } from '../src/config/seedUsers';

const prisma = new PrismaClient();

/**
 * Prisma seed script
 * This is called by `npx prisma db seed` or automatically during migrations
 * 
 * Only seeds user records - no other data is seeded.
 * All other data (banks, credit cards, cheques, customers, suppliers, transactions)
 * must be created through the application UI or API.
 */
async function main() {
  console.log('Starting database seed...');
  await seedUsers(prisma);
  console.log('Database seed completed successfully.');
}

main()
  .catch((e) => {
    console.error('Database seed failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

