import { z } from 'zod';
import { DailyTransactionType, DailyTransactionSource } from '@prisma/client';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const kasaDefteriQuerySchema = z.object({
  from: z.string().regex(isoDateRegex).optional(),
  to: z.string().regex(isoDateRegex).optional(),
  documentNo: z.string().optional(),
  type: z.nativeEnum(DailyTransactionType).optional(),
  counterparty: z.string().optional(),
  description: z.string().optional(),
  source: z.nativeEnum(DailyTransactionSource).optional(),
  sortKey: z.enum(['isoDate', 'documentNo', 'type', 'counterparty', 'incoming', 'outgoing', 'balanceAfter']).optional(),
  sortDir: z.enum(['asc', 'desc']).optional(),
  page: z.coerce.number().int().positive().optional(),
  pageSize: z.coerce.number().int().positive().max(100).optional(),
});

export const nakitAkisQuerySchema = z.object({
  from: z.string().regex(isoDateRegex).optional(),
  to: z.string().regex(isoDateRegex).optional(),
  scope: z.enum(['HEPSI', 'NAKIT', 'BANKA']).optional(),
  user: z.string().optional(),
  search: z.string().optional(),
});

