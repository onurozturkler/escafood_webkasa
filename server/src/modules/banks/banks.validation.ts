import { z } from 'zod';

const uuidSchema = z.string().uuid();

const baseBankSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required'),
    accountNo: z.string().trim().optional().nullable(),
    iban: z.string().trim().optional().nullable(),
  })
  .strict();

export const createBankSchema = baseBankSchema;

export const updateBankSchema = baseBankSchema.partial().extend({
  isActive: z.boolean().optional(),
});

export const deleteBankSchema = z.object({}).strict();

export const bankIdParamSchema = z.object({
  id: uuidSchema,
});

export type CreateBankInput = z.infer<typeof createBankSchema>;
export type UpdateBankInput = z.infer<typeof updateBankSchema>;
export type DeleteBankInput = z.infer<typeof deleteBankSchema>;
