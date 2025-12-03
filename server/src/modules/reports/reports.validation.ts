import { z } from 'zod';
import { DailyTransactionType, DailyTransactionSource } from '@prisma/client';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

// Helper to transform empty strings to undefined and validate date format
const optionalDateString = z.preprocess(
  (val) => (val === '' || val === undefined ? undefined : val),
  z.string().regex(isoDateRegex, 'Geçerli bir tarih formatı gerekir (YYYY-MM-DD)').optional()
);

// Helper to transform empty strings to undefined
const optionalString = z.preprocess((val) => (val === '' || val === undefined ? undefined : val), z.string().optional());

export const kasaDefteriQuerySchema = z.object({
  from: optionalDateString,
  to: optionalDateString,
  documentNo: optionalString,
  type: z.nativeEnum(DailyTransactionType).optional(),
  counterparty: optionalString,
  description: optionalString,
  source: z.nativeEnum(DailyTransactionSource).optional(),
  sortKey: z.enum(['isoDate', 'documentNo', 'type', 'counterparty', 'incoming', 'outgoing', 'balanceAfter']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const nakitAkisQuerySchema = z.object({
  from: optionalDateString,
  to: optionalDateString,
  scope: z.enum(['HEPSI', 'NAKIT', 'BANKA']).optional(),
  user: optionalString,
  search: optionalString,
});

