import { PrismaClient, DailyTransactionType, DailyTransactionSource } from '@prisma/client';
import prisma from '../../config/prisma';
import {
  CreateCreditCardDto,
  UpdateCreditCardDto,
  CreateExpenseDto,
  CreatePaymentDto,
  CreditCardDto,
  CreditCardOperationDto,
  ExpenseResponse,
  PaymentResponse,
} from './creditCards.types';

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

export class CreditCardsService {
  /**
   * Get all credit cards with computed currentDebt
   */
  async listCreditCards(): Promise<CreditCardDto[]> {
    const cards = await prisma.creditCard.findMany({
      where: {
        deletedAt: null,
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
        operations: {
          where: {
            deletedAt: null,
          },
          select: {
            isoDate: true,
            amount: true,
          },
          orderBy: {
            isoDate: 'desc',
          },
        },
      },
      orderBy: {
        name: 'asc',
      },
    });

    return cards.map((card) => {
      const currentDebt = card.operations.reduce((sum, op) => sum + Number(op.amount), 0);
      const lastOperationDate =
        card.operations.length > 0 ? card.operations[0].isoDate : null;

      return {
        id: card.id,
        name: card.name,
        bankId: card.bankId,
        limit: card.limit ? Number(card.limit) : null,
        closingDay: card.closingDay,
        dueDay: card.dueDay,
        isActive: card.isActive,
        createdAt: card.createdAt.toISOString(),
        createdBy: card.createdBy,
        updatedAt: card.updatedAt?.toISOString() || null,
        updatedBy: card.updatedBy || null,
        deletedAt: card.deletedAt?.toISOString() || null,
        deletedBy: card.deletedBy || null,
        currentDebt,
        lastOperationDate,
        bank: card.bank || null,
      };
    });
  }

  /**
   * Get credit card by ID
   */
  async getCreditCardById(id: string): Promise<CreditCardDto | null> {
    const card = await prisma.creditCard.findUnique({
      where: { id },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
        operations: {
          where: {
            deletedAt: null,
          },
          select: {
            isoDate: true,
            amount: true,
          },
          orderBy: {
            isoDate: 'desc',
          },
        },
      },
    });

    if (!card || card.deletedAt) {
      return null;
    }

    const currentDebt = card.operations.reduce((sum, op) => sum + Number(op.amount), 0);
    const lastOperationDate =
      card.operations.length > 0 ? card.operations[0].isoDate : null;

    return {
      id: card.id,
      name: card.name,
      bankId: card.bankId,
      limit: card.limit ? Number(card.limit) : null,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      isActive: card.isActive,
      createdAt: card.createdAt.toISOString(),
      createdBy: card.createdBy,
      updatedAt: card.updatedAt?.toISOString() || null,
      updatedBy: card.updatedBy || null,
      deletedAt: card.deletedAt?.toISOString() || null,
      deletedBy: card.deletedBy || null,
      currentDebt,
      lastOperationDate,
      bank: card.bank || null,
    };
  }

  /**
   * Create a new credit card
   */
  async createCreditCard(data: CreateCreditCardDto, createdBy: string): Promise<CreditCardDto> {
    const card = await prisma.creditCard.create({
      data: {
        name: data.name,
        bankId: data.bankId || null,
        limit: data.limit !== undefined ? data.limit : null,
        closingDay: data.closingDay || null,
        dueDay: data.dueDay || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy,
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      id: card.id,
      name: card.name,
      bankId: card.bankId,
      limit: card.limit ? Number(card.limit) : null,
      closingDay: card.closingDay,
      dueDay: card.dueDay,
      isActive: card.isActive,
      createdAt: card.createdAt.toISOString(),
      createdBy: card.createdBy,
      updatedAt: card.updatedAt?.toISOString() || null,
      updatedBy: card.updatedBy || null,
      deletedAt: card.deletedAt?.toISOString() || null,
      deletedBy: card.deletedBy || null,
      currentDebt: 0,
      lastOperationDate: null,
      bank: card.bank || null,
    };
  }

  /**
   * Update a credit card
   */
  async updateCreditCard(
    id: string,
    data: UpdateCreditCardDto,
    updatedBy: string
  ): Promise<CreditCardDto> {
    const card = await prisma.creditCard.findUnique({
      where: { id },
    });

    if (!card) {
      throw new Error('Credit card not found');
    }

    if (card.deletedAt) {
      throw new Error('Cannot update deleted credit card');
    }

    const updated = await prisma.creditCard.update({
      where: { id },
      data: {
        ...data,
        limit: data.limit !== undefined ? data.limit : card.limit,
        updatedBy,
        updatedAt: new Date(),
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
        operations: {
          where: {
            deletedAt: null,
          },
          select: {
            isoDate: true,
            amount: true,
          },
          orderBy: {
            isoDate: 'desc',
          },
        },
      },
    });

    const currentDebt = updated.operations.reduce((sum, op) => sum + Number(op.amount), 0);
    const lastOperationDate =
      updated.operations.length > 0 ? updated.operations[0].isoDate : null;

    return {
      id: updated.id,
      name: updated.name,
      bankId: updated.bankId,
      limit: updated.limit ? Number(updated.limit) : null,
      closingDay: updated.closingDay,
      dueDay: updated.dueDay,
      isActive: updated.isActive,
      createdAt: updated.createdAt.toISOString(),
      createdBy: updated.createdBy,
      updatedAt: updated.updatedAt?.toISOString() || null,
      updatedBy: updated.updatedBy || null,
      deletedAt: updated.deletedAt?.toISOString() || null,
      deletedBy: updated.deletedBy || null,
      currentDebt,
      lastOperationDate,
      bank: updated.bank || null,
    };
  }

  /**
   * Create an expense (HARCAMA)
   */
  async createExpense(data: CreateExpenseDto, createdBy: string): Promise<ExpenseResponse> {
    // Verify credit card exists
    const card = await prisma.creditCard.findUnique({
      where: { id: data.creditCardId },
    });

    if (!card || card.deletedAt) {
      throw new Error('Credit card not found');
    }

    // Create transaction first (to get its ID)
    const balanceAfter = await calculateBalanceAfter(data.isoDate, 0, 0);

    const transaction = await prisma.transaction.create({
      data: {
        isoDate: data.isoDate,
        documentNo: null,
        type: 'KREDI_KARTI_HARCAMA',
        source: 'KREDI_KARTI',
        creditCardId: data.creditCardId,
        counterparty: data.counterparty || null,
        description: data.description || null,
        incoming: 0,
        outgoing: 0,
        bankDelta: 0,
        displayIncoming: null,
        displayOutgoing: data.amount,
        balanceAfter,
        createdBy,
      },
    });

    // Create credit card operation
    const operation = await prisma.creditCardOperation.create({
      data: {
        creditCardId: data.creditCardId,
        isoDate: data.isoDate,
        type: 'HARCAMA',
        amount: data.amount, // Positive for HARCAMA
        description: data.description || null,
        relatedTransactionId: transaction.id,
        createdBy,
      },
    });

    return {
      operation: {
        id: operation.id,
        creditCardId: operation.creditCardId,
        isoDate: operation.isoDate,
        type: operation.type,
        amount: Number(operation.amount),
        description: operation.description,
        relatedTransactionId: operation.relatedTransactionId,
        createdAt: operation.createdAt.toISOString(),
        createdBy: operation.createdBy,
        updatedAt: operation.updatedAt?.toISOString() || null,
        updatedBy: operation.updatedBy || null,
        deletedAt: operation.deletedAt?.toISOString() || null,
        deletedBy: operation.deletedBy || null,
      },
      transaction: {
        id: transaction.id,
        isoDate: transaction.isoDate,
        type: transaction.type,
        source: transaction.source,
        creditCardId: transaction.creditCardId,
        counterparty: transaction.counterparty,
        description: transaction.description,
        displayOutgoing: transaction.displayOutgoing ? Number(transaction.displayOutgoing) : null,
      },
    };
  }

  /**
   * Create a payment (ODEME)
   */
  async createPayment(data: CreatePaymentDto, createdBy: string): Promise<PaymentResponse> {
    // Verify credit card exists
    const card = await prisma.creditCard.findUnique({
      where: { id: data.creditCardId },
    });

    if (!card || card.deletedAt) {
      throw new Error('Credit card not found');
    }

    // Validate bankId if paymentSource is BANKA
    if (data.paymentSource === 'BANKA' && !data.bankId) {
      throw new Error('bankId is required when paymentSource is BANKA');
    }

    // Determine transaction fields based on paymentSource
    let incoming = 0;
    let outgoing = 0;
    let bankDelta = 0;
    let bankId: string | null = null;

    if (data.paymentSource === 'BANKA') {
      bankId = data.bankId || null;
      bankDelta = -data.amount; // Negative for bank outflow
      outgoing = 0;
    } else {
      // KASA
      bankId = null;
      bankDelta = 0;
      outgoing = data.amount;
    }

    const balanceAfter = await calculateBalanceAfter(data.isoDate, incoming, outgoing);

    // Create transaction
    const transaction = await prisma.transaction.create({
      data: {
        isoDate: data.isoDate,
        documentNo: null,
        type: 'KREDI_KARTI_EKSTRE_ODEME',
        source: 'KREDI_KARTI',
        creditCardId: data.creditCardId,
        bankId,
        counterparty: null,
        description: data.description || null,
        incoming,
        outgoing,
        bankDelta,
        displayIncoming: null,
        displayOutgoing: null,
        balanceAfter,
        createdBy,
      },
    });

    // Create credit card operation
    const operation = await prisma.creditCardOperation.create({
      data: {
        creditCardId: data.creditCardId,
        isoDate: data.isoDate,
        type: 'ODEME',
        amount: -data.amount, // Negative for ODEME (reduces debt)
        description: data.description || null,
        relatedTransactionId: transaction.id,
        createdBy,
      },
    });

    return {
      operation: {
        id: operation.id,
        creditCardId: operation.creditCardId,
        isoDate: operation.isoDate,
        type: operation.type,
        amount: Number(operation.amount),
        description: operation.description,
        relatedTransactionId: operation.relatedTransactionId,
        createdAt: operation.createdAt.toISOString(),
        createdBy: operation.createdBy,
        updatedAt: operation.updatedAt?.toISOString() || null,
        updatedBy: operation.updatedBy || null,
        deletedAt: operation.deletedAt?.toISOString() || null,
        deletedBy: operation.deletedBy || null,
      },
      transaction: {
        id: transaction.id,
        isoDate: transaction.isoDate,
        type: transaction.type,
        source: transaction.source,
        creditCardId: transaction.creditCardId,
        counterparty: transaction.counterparty,
        description: transaction.description,
        bankId: transaction.bankId,
        bankDelta: Number(transaction.bankDelta),
        outgoing: Number(transaction.outgoing),
      },
    };
  }
}

