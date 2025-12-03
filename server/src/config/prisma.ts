import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

// Default export for backward compatibility
export default prisma;
