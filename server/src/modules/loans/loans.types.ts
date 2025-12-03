export interface LoanDto {
  id: string;
  name: string;
  bankId: string;
  totalAmount: number;
  installmentCount: number;
  firstInstallmentDate: string;
  interestRate: number;
  bsmvRate: number;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  bank?: {
    id: string;
    name: string;
    accountNo: string | null;
    iban: string | null;
  } | null;
}

export interface LoanInstallmentDto {
  id: string;
  loanId: string;
  bankId: string;
  installmentIndex: number;
  dueDate: string;
  amount: number;
  principal: number;
  interest: number;
  status: 'PENDING' | 'PAID' | 'OVERDUE';
  paidDate: string | null;
  createdAt: string;
  createdBy: string;
  loan?: {
    id: string;
    name: string;
  } | null;
  bank?: {
    id: string;
    name: string;
  } | null;
}

export interface CreateLoanDto {
  name: string;
  bankId: string;
  totalAmount: number;
  installmentCount: number;
  firstInstallmentDate: string;
  interestRate: number;
  bsmvRate: number;
}

export interface PayInstallmentDto {
  isoDate: string;
  description?: string | null;
}

export interface UpcomingInstallmentsQuery {
  bankId?: string;
  from?: string;
  to?: string;
}

