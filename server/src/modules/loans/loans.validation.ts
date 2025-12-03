import { z } from 'zod';

const isoDateRegex = /^\d{4}-\d{2}-\d{2}$/;

export const createLoanSchema = z.object({
  name: z.string().min(1, 'Kredi adı gereklidir'),
  bankId: z.string().uuid('Geçerli bir banka ID gereklidir'),
  totalAmount: z.number().positive('Toplam kredi tutarı pozitif olmalıdır'),
  installmentCount: z.number().int().positive('Vade sayısı pozitif bir tam sayı olmalıdır'),
  firstInstallmentDate: z.string().regex(isoDateRegex, 'Geçerli bir tarih formatı gerekir (YYYY-MM-DD)'),
  interestRate: z.number().nonnegative('Faiz oranı negatif olamaz'),
  bsmvRate: z.number().nonnegative('BSMV oranı negatif olamaz'),
});

export const payInstallmentSchema = z.object({
  isoDate: z.string().regex(isoDateRegex, 'Geçerli bir tarih formatı gerekir (YYYY-MM-DD)'),
  description: z.string().max(500).nullable().optional(),
});

export const upcomingInstallmentsQuerySchema = z.object({
  bankId: z.string().uuid().optional(),
  from: z.string().regex(isoDateRegex).optional(),
  to: z.string().regex(isoDateRegex).optional(),
});

export const loanIdParamSchema = z.object({
  id: z.string().uuid(),
});

export const installmentIdParamSchema = z.object({
  id: z.string().uuid(),
});

