import { z } from 'zod';

export const createBankSchema = z.object({
  name: z.string().min(1, 'Banka adı gereklidir'),
  accountNo: z.string().max(100).nullable().optional(),
  iban: z.string().max(34).nullable().optional(),
  isActive: z.boolean().optional(),
});

export const updateBankSchema = z.object({
  name: z.string().min(1).optional(),
  accountNo: z.string().max(100).nullable().optional(),
  iban: z.string().max(34).nullable().optional(),
  isActive: z.boolean().optional(),
});

