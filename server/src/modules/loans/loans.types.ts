import { z } from 'zod';
import { createLoanSchema, updateLoanSchema, deleteLoanSchema, loanIdParamSchema, payInstallmentSchema } from './loans.validation';

export type CreateLoanDTO = z.infer<typeof createLoanSchema>;
export type UpdateLoanDTO = z.infer<typeof updateLoanSchema>;
export type DeleteLoanDTO = z.infer<typeof deleteLoanSchema>;
export type LoanIdParamDTO = z.infer<typeof loanIdParamSchema>;
export type PayInstallmentDTO = z.infer<typeof payInstallmentSchema>;

export interface LoanRecord {
  id: string;
  name: string;
  bankId: string;
  totalAmount: number;
  installmentCount: number;
  firstInstallmentDate: string;
  annualInterestRate: number;
  bsmvRate: number;
  isActive: boolean;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date | null;
  updatedBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export interface LoanInstallmentRecord {
  id: string;
  loanId: string;
  installmentNumber: number;
  dueDate: string;
  principal: number;
  interest: number;
  bsmv: number;
  totalAmount: number;
  status: 'BEKLENIYOR' | 'ODEME_ALINDI' | 'GECIKMIS';
  paidDate: string | null;
  transactionId: string | null;
  createdAt: Date;
  createdBy: string;
  updatedAt: Date | null;
  updatedBy: string | null;
  deletedAt: Date | null;
  deletedBy: string | null;
}

export interface LoanDto extends LoanRecord {
  bank?: {
    id: string;
    name: string;
  };
  installments?: LoanInstallmentDto[];
}

export interface LoanInstallmentDto extends LoanInstallmentRecord {
  loan?: {
    id: string;
    name: string;
  };
}

