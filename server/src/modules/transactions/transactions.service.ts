import { PrismaClient } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  CreateTransactionDto,
  UpdateTransactionDto,
  TransactionListQuery,
  TransactionListResponse,
  TransactionDto,
} from './transactions.types';

/**
 * Calculate cash balance after a transaction
 */
async function calculateBalanceAfter(
  isoDate: string,
  incoming: number,
  outgoing: number,
  excludeTransactionId?: string
): Promise<number> {
  const where: any = {
    deletedAt: null,
    isoDate: { lte: isoDate },
  };

  if (excludeTransactionId) {
    where.id = { not: excludeTransactionId };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: [
      { isoDate: 'asc' },
      { createdAt: 'asc' },
    ],
  });

  let balance = 0;
  for (const tx of transactions) {
    balance += Number(tx.incoming) - Number(tx.outgoing);
  }

  balance += incoming - outgoing;

  return balance;
}

export class TransactionsService {
  /**
   * Create a new transaction
   */
  async createTransaction(data: CreateTransactionDto, createdBy: string): Promise<TransactionDto> {
    const incoming = data.incoming || 0;
    const outgoing = data.outgoing || 0;
    const balanceAfter = await calculateBalanceAfter(data.isoDate, incoming, outgoing);

    const transaction = await prisma.transaction.create({
      data: {
        isoDate: data.isoDate,
        documentNo: data.documentNo || null,
        type: data.type,
        source: data.source,
        counterparty: data.counterparty || null,
        description: data.description || null,
        incoming: incoming,
        outgoing: outgoing,
        bankDelta: data.bankDelta || 0,
        displayIncoming: data.displayIncoming || null,
        displayOutgoing: data.displayOutgoing || null,
        balanceAfter: balanceAfter,
        cashAccountId: data.cashAccountId || null,
        bankId: data.bankId || null,
        creditCardId: data.creditCardId || null,
        chequeId: data.chequeId || null,
        loanInstallmentId: data.loanInstallmentId || null,
        customerId: data.customerId || null,
        supplierId: data.supplierId || null,
        attachmentId: data.attachmentId || null,
        createdBy,
      },
    });

    return this.mapToDto(transaction);
  }

  /**
   * Update a transaction
   */
  async updateTransaction(
    id: string,
    data: UpdateTransactionDto,
    updatedBy: string
  ): Promise<TransactionDto> {
    const existing = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new Error('Transaction not found');
    }

    if (existing.deletedAt) {
      throw new Error('Cannot update deleted transaction');
    }

    // Recalculate balance if amounts changed
    const incoming = data.incoming !== undefined ? data.incoming : Number(existing.incoming);
    const outgoing = data.outgoing !== undefined ? data.outgoing : Number(existing.outgoing);
    const isoDate = data.isoDate || existing.isoDate;
    const balanceAfter = await calculateBalanceAfter(isoDate, incoming, outgoing, id);

    const updated = await prisma.transaction.update({
      where: { id },
      data: {
        ...data,
        incoming: data.incoming !== undefined ? data.incoming : existing.incoming,
        outgoing: data.outgoing !== undefined ? data.outgoing : existing.outgoing,
        bankDelta: data.bankDelta !== undefined ? data.bankDelta : existing.bankDelta,
        balanceAfter,
        updatedBy,
        updatedAt: new Date(),
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Get transaction by ID
   */
  async getTransactionById(id: string): Promise<TransactionDto | null> {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction || transaction.deletedAt) {
      return null;
    }

    return this.mapToDto(transaction);
  }

  /**
   * List transactions with filters
   */
  async listTransactions(query: TransactionListQuery): Promise<TransactionListResponse> {
    const where: any = {
      deletedAt: null,
    };

    if (query.from || query.to) {
      where.isoDate = {};
      if (query.from) {
        where.isoDate.gte = query.from;
      }
      if (query.to) {
        where.isoDate.lte = query.to;
      }
    }

    if (query.documentNo) {
      where.documentNo = { contains: query.documentNo, mode: 'insensitive' };
    }

    if (query.type) {
      where.type = query.type;
    }

    if (query.source) {
      where.source = query.source;
    }

    if (query.counterparty) {
      where.counterparty = { contains: query.counterparty, mode: 'insensitive' };
    }

    if (query.description) {
      where.description = { contains: query.description, mode: 'insensitive' };
    }

    if (query.bankId) {
      where.bankId = query.bankId;
    }

    if (query.creditCardId) {
      where.creditCardId = query.creditCardId;
    }

    if (query.createdBy) {
      where.createdBy = query.createdBy;
    }

    if (query.search) {
      where.OR = [
        { documentNo: { contains: query.search, mode: 'insensitive' } },
        { counterparty: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    const skip = (page - 1) * pageSize;

    // Determine sort order - Prisma requires orderBy to be an array
    const sortKey = query.sortKey || 'isoDate';
    const sortDir = query.sortDir || 'desc';
    
    // Build orderBy array based on sortKey
    const orderBy: any[] = [];
    if (sortKey === 'isoDate') {
      // For date sorting, use isoDate first, then createdAt as secondary sort
      orderBy.push({ isoDate: sortDir });
      orderBy.push({ createdAt: sortDir });
    } else {
      // For other fields, use the sortKey directly
      orderBy.push({ [sortKey]: sortDir });
      // Add isoDate as secondary sort for consistency
      orderBy.push({ isoDate: 'asc' });
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
      }),
      prisma.transaction.count({ where }),
    ]);

    // Calculate totals from ALL matching transactions (not just current page)
    const allTransactions = await prisma.transaction.findMany({
      where,
      select: {
        incoming: true,
        outgoing: true,
      },
    });

    const totalIncoming = allTransactions.reduce((sum: number, tx) => sum + Number(tx.incoming), 0);
    const totalOutgoing = allTransactions.reduce((sum: number, tx) => sum + Number(tx.outgoing), 0);

    return {
      items: transactions.map((tx) => this.mapToDto(tx)),
      totalCount,
      totalIncoming,
      totalOutgoing,
    };
  }

  /**
   * Soft delete a transaction
   */
  async deleteTransaction(id: string, deletedBy: string): Promise<void> {
    const transaction = await prisma.transaction.findUnique({
      where: { id },
    });

    if (!transaction) {
      throw new Error('Transaction not found');
    }

    if (transaction.deletedAt) {
      throw new Error('Transaction already deleted');
    }

    await prisma.transaction.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  /**
   * Map Prisma transaction to DTO
   */
  private mapToDto(transaction: any): TransactionDto {
    return {
      id: transaction.id,
      isoDate: transaction.isoDate,
      documentNo: transaction.documentNo,
      type: transaction.type,
      source: transaction.source,
      counterparty: transaction.counterparty,
      description: transaction.description,
      incoming: Number(transaction.incoming),
      outgoing: Number(transaction.outgoing),
      bankDelta: Number(transaction.bankDelta),
      displayIncoming: transaction.displayIncoming ? Number(transaction.displayIncoming) : null,
      displayOutgoing: transaction.displayOutgoing ? Number(transaction.displayOutgoing) : null,
      balanceAfter: Number(transaction.balanceAfter),
      cashAccountId: transaction.cashAccountId,
      bankId: transaction.bankId,
      creditCardId: transaction.creditCardId,
      chequeId: transaction.chequeId,
      loanInstallmentId: transaction.loanInstallmentId,
      customerId: transaction.customerId,
      supplierId: transaction.supplierId,
      attachmentId: transaction.attachmentId,
      createdAt: transaction.createdAt.toISOString(),
      createdBy: transaction.createdBy,
      updatedAt: transaction.updatedAt?.toISOString() || null,
      updatedBy: transaction.updatedBy || null,
      deletedAt: transaction.deletedAt?.toISOString() || null,
      deletedBy: transaction.deletedBy || null,
    };
  }
}

