import { PrismaClient } from '@prisma/client';
import { DEV_USER_ID, DEV_USER_EMAIL, DEV_USER_NAME } from './devUser';

/**
 * Seed all system users (dev user + real users)
 * Idempotent - safe to run on every server startup
 */
export async function seedUsers(prisma: PrismaClient): Promise<void> {
  try {
    // Seed dev user
    await prisma.user.upsert({
      where: { id: DEV_USER_ID },
      update: {
        email: DEV_USER_EMAIL,
        name: DEV_USER_NAME,
        isActive: true,
      },
      create: {
        id: DEV_USER_ID,
        email: DEV_USER_EMAIL,
        name: DEV_USER_NAME,
        passwordHash: 'dev-only-no-auth', // Placeholder, not used in dev
        isActive: true,
      },
    });
    // eslint-disable-next-line no-console
    console.log(`Dev user seeded: ${DEV_USER_EMAIL} (${DEV_USER_ID})`);

    // Seed Onur Öztürkler
    await prisma.user.upsert({
      where: { id: 'user-onur' },
      update: {
        email: 'onur@esca-food.com',
        name: 'Onur Öztürkler',
        isActive: true,
      },
      create: {
        id: 'user-onur',
        email: 'onur@esca-food.com',
        name: 'Onur Öztürkler',
        passwordHash: '248624', // TODO: Hash password properly when auth is implemented
        isActive: true,
      },
    });
    // eslint-disable-next-line no-console
    console.log('User seeded: Onur Öztürkler (user-onur)');

    // Seed Hayrullah Öztürkler
    await prisma.user.upsert({
      where: { id: 'user-hayrullah' },
      update: {
        email: 'hayrullah@esca-food.com',
        name: 'Hayrullah Öztürkler',
        isActive: true,
      },
      create: {
        id: 'user-hayrullah',
        email: 'hayrullah@esca-food.com',
        name: 'Hayrullah Öztürkler',
        passwordHash: '397139', // TODO: Hash password properly when auth is implemented
        isActive: true,
      },
    });
    // eslint-disable-next-line no-console
    console.log('User seeded: Hayrullah Öztürkler (user-hayrullah)');
  } catch (error) {
    // eslint-disable-next-line no-console
    console.error('Failed to seed users:', error);
    throw error;
  }
}

