export interface BankDto {
  id: string;
  name: string;
  accountNo: string | null;
  iban: string | null;
  isActive: boolean;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
  // Computed fields
  currentBalance?: number;
}

export interface CreateBankDto {
  name: string;
  accountNo?: string | null;
  iban?: string | null;
  isActive?: boolean;
}

export interface UpdateBankDto {
  name?: string;
  accountNo?: string | null;
  iban?: string | null;
  isActive?: boolean;
}

export interface BankListResponse {
  items: BankDto[];
  totalCount: number;
}

