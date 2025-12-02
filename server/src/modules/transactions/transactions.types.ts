import { DailyTransactionType, DailyTransactionSource } from '@prisma/client';

export interface TransactionDto {
  id: string;
  isoDate: string;
  documentNo: string | null;
  type: DailyTransactionType;
  source: DailyTransactionSource;
  counterparty: string | null;
  description: string | null;
  incoming: number;
  outgoing: number;
  bankDelta: number;
  displayIncoming: number | null;
  displayOutgoing: number | null;
  balanceAfter: number;
  cashAccountId: string | null;
  bankId: string | null;
  creditCardId: string | null;
  chequeId: string | null;
  customerId: string | null;
  supplierId: string | null;
  attachmentId: string | null;
  createdAt: string;
  createdBy: string;
  updatedAt: string | null;
  updatedBy: string | null;
  deletedAt: string | null;
  deletedBy: string | null;
}

export interface CreateTransactionDto {
  isoDate: string;
  documentNo?: string | null;
  type: DailyTransactionType;
  source: DailyTransactionSource;
  counterparty?: string | null;
  description?: string | null;
  incoming?: number;
  outgoing?: number;
  bankDelta?: number;
  displayIncoming?: number | null;
  displayOutgoing?: number | null;
  cashAccountId?: string | null;
  bankId?: string | null;
  creditCardId?: string | null;
  chequeId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  attachmentId?: string | null;
}

export interface UpdateTransactionDto {
  isoDate?: string;
  documentNo?: string | null;
  type?: DailyTransactionType;
  source?: DailyTransactionSource;
  counterparty?: string | null;
  description?: string | null;
  incoming?: number;
  outgoing?: number;
  bankDelta?: number;
  displayIncoming?: number | null;
  displayOutgoing?: number | null;
  cashAccountId?: string | null;
  bankId?: string | null;
  creditCardId?: string | null;
  chequeId?: string | null;
  customerId?: string | null;
  supplierId?: string | null;
  attachmentId?: string | null;
}

export interface TransactionListQuery {
  from?: string;
  to?: string;
  documentNo?: string;
  type?: DailyTransactionType;
  source?: DailyTransactionSource;
  counterparty?: string;
  description?: string;
  bankId?: string;
  creditCardId?: string;
  createdBy?: string;
  search?: string;
  sortKey?: 'isoDate' | 'documentNo' | 'type' | 'counterparty' | 'incoming' | 'outgoing' | 'balanceAfter';
  sortDir?: 'asc' | 'desc';
  page?: number;
  pageSize?: number;
}

export interface TransactionListResponse {
  items: TransactionDto[];
  totalCount: number;
}

