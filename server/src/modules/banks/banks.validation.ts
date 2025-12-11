import { z } from 'zod';

const uuidSchema = z.string().uuid();

const baseBankSchema = z
  .object({
    name: z.string().trim().min(1, 'name is required'),
    accountNo: z.string().trim().optional().nullable(),
    iban: z.string().trim().optional().nullable(),
    initialBalance: z.number().optional().default(0), // Opening balance for the bank
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

export const bulkSaveBankSchema = z.array(
  z.object({
    id: z.string(), // Can be tmp-* for new banks or UUID for existing
    name: z.string().trim().min(1, 'name is required'),
    accountNo: z.string().trim().nullable().optional(),
    iban: z.string().trim().nullable().optional(),
    openingBalance: z.number().optional().default(0), // Frontend sends openingBalance
    isActive: z.boolean().optional().default(true),
  })
);

export type CreateBankInput = z.infer<typeof createBankSchema>;
export type UpdateBankInput = z.infer<typeof updateBankSchema>;
export type DeleteBankInput = z.infer<typeof deleteBankSchema>;
export type BulkSaveBankInput = z.infer<typeof bulkSaveBankSchema>;
