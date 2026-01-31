export interface Loan {
  id: string;
  name: string;
  bankId: string;
  totalAmount: number;
  installmentCount: number;
  firstInstallmentDate: string;
  annualInterestRate: number;
  bsmvRate: number;
  isActive: boolean;
  createdAt?: Date | string;
  createdBy?: string;
  updatedAt?: Date | string | null;
  updatedBy?: string | null;
  deletedAt?: Date | string | null;
  deletedBy?: string | null;
  bank?: {
    id: string;
    name: string;
  };
  installments?: LoanInstallment[];
}

export interface LoanInstallment {
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
  createdAt?: Date | string;
  createdBy?: string;
  updatedAt?: Date | string | null;
  updatedBy?: string | null;
  deletedAt?: Date | string | null;
  deletedBy?: string | null;
  loan?: {
    id: string;
    name: string;
  };
}
