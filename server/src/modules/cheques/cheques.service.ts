import { PrismaClient, ChequeStatus, ChequeDirection, DailyTransactionType, DailyTransactionSource } from '@prisma/client';
import prisma from '../../config/prisma';
import {
  CreateChequeDto,
  UpdateChequeDto,
  UpdateChequeStatusDto,
  ChequeListQuery,
  ChequeListResponse,
  ChequeDto,
} from './cheques.types';

/**
 * Get default status for a cheque based on direction
 */
function getDefaultStatus(direction: ChequeDirection): ChequeStatus {
  if (direction === 'ALACAK') {
    return 'KASADA';
  } else {
    return 'ODEMEDE';
  }
}

/**
 * Check if a status transition is allowed
 */
function isStatusTransitionAllowed(
  currentStatus: ChequeStatus,
  newStatus: ChequeStatus,
  direction: ChequeDirection
): boolean {
  // Any status can transition to KARSILIKSIZ
  if (newStatus === 'KARSILIKSIZ') {
    return true;
  }

  if (direction === 'ALACAK') {
    // For ALACAK cheques:
    // KASADA → BANKADA_TAHSILDE
    // KASADA → TAHSIL_EDILDI
    // BANKADA_TAHSILDE → TAHSIL_EDILDI
    const allowedTransitions: ChequeStatus[] = [];
    if (currentStatus === 'KASADA') {
      allowedTransitions.push('BANKADA_TAHSILDE', 'TAHSIL_EDILDI');
    } else if (currentStatus === 'BANKADA_TAHSILDE') {
      allowedTransitions.push('TAHSIL_EDILDI');
    }
    return allowedTransitions.includes(newStatus);
  } else {
    // For BORC cheques:
    // ODEMEDE → TAHSIL_EDILDI (paid)
    if (currentStatus === 'ODEMEDE' && newStatus === 'TAHSIL_EDILDI') {
      return true;
    }
    return false;
  }
}

/**
 * Calculate cash balance after a transaction
 * Gets all transactions up to this date (excluding the one being created),
 * calculates balance, then adds the new transaction's incoming/outgoing
 */
async function calculateBalanceAfter(
  isoDate: string,
  incoming: number,
  outgoing: number,
  excludeTransactionId?: string
): Promise<number> {
  // Get all non-deleted transactions up to this date
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

  // Calculate balance up to this point
  let balance = 0;
  for (const tx of transactions) {
    balance += Number(tx.incoming) - Number(tx.outgoing);
  }

  // Add the new transaction's effect
  balance += incoming - outgoing;

  return balance;
}

/**
 * Create a transaction for cheque collection/payment
 */
async function createChequeTransaction(
  chequeId: string,
  type: DailyTransactionType,
  source: DailyTransactionSource,
  isoDate: string,
  amount: number,
  counterparty: string | null,
  description: string | null,
  bankId: string | null,
  incoming: number,
  outgoing: number,
  bankDelta: number,
  displayIncoming: number | null,
  displayOutgoing: number | null,
  createdBy: string
): Promise<string> {
  const balanceAfter = await calculateBalanceAfter(isoDate, incoming, outgoing);

  const transaction = await prisma.transaction.create({
    data: {
      isoDate,
      documentNo: null, // Can be set later if needed
      type,
      source,
      counterparty,
      description,
      incoming: incoming,
      outgoing: outgoing,
      bankDelta: bankDelta,
      displayIncoming: displayIncoming,
      displayOutgoing: displayOutgoing,
      balanceAfter: balanceAfter,
      chequeId,
      bankId,
      createdBy,
    },
  });

  return transaction.id;
}

export class ChequesService {
  /**
   * Create a new cheque
   */
  async createCheque(data: CreateChequeDto, createdBy: string): Promise<ChequeDto> {
    const defaultStatus = getDefaultStatus(data.direction);

    const cheque = await prisma.cheque.create({
      data: {
        cekNo: data.cekNo,
        amount: data.amount,
        entryDate: data.entryDate,
        maturityDate: data.maturityDate,
        status: defaultStatus,
        direction: data.direction,
        customerId: data.customerId || null,
        supplierId: data.supplierId || null,
        bankId: data.bankId || null,
        description: data.description || null,
        attachmentId: data.attachmentId || null,
        createdBy,
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            accountNo: true,
            iban: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDto(cheque);
  }

  /**
   * Update a cheque (base fields only, no status change)
   */
  async updateCheque(id: string, data: UpdateChequeDto, updatedBy: string): Promise<ChequeDto> {
    const cheque = await prisma.cheque.findUnique({
      where: { id },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    if (cheque.deletedAt) {
      throw new Error('Cannot update deleted cheque');
    }

    const updated = await prisma.cheque.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
        updatedAt: new Date(),
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            accountNo: true,
            iban: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return this.mapToDto(updated);
  }

  /**
   * Update cheque status with transaction side-effects
   */
  async updateChequeStatus(
    id: string,
    data: UpdateChequeStatusDto,
    updatedBy: string
  ): Promise<{ cheque: ChequeDto; transactionId: string | null }> {
    const cheque = await prisma.cheque.findUnique({
      where: { id },
      include: {
        customer: true,
        supplier: true,
        bank: true,
      },
    });

    if (!cheque) {
      throw new Error('Cheque not found');
    }

    if (cheque.deletedAt) {
      throw new Error('Cannot update deleted cheque');
    }

    // Validate status transition
    if (!isStatusTransitionAllowed(cheque.status, data.newStatus, cheque.direction)) {
      throw new Error(
        `Invalid status transition from ${cheque.status} to ${data.newStatus} for direction ${cheque.direction}`
      );
    }

    let transactionId: string | null = null;

    // Handle transaction side-effects based on status change
    if (data.newStatus === 'TAHSIL_EDILDI') {
      if (cheque.direction === 'ALACAK') {
        // Customer cheque collected
        const amount = Number(cheque.amount);
        const counterparty = cheque.customer?.name || null;
        const description = data.description || `Çek No: ${cheque.cekNo}`;

        if (data.bankId) {
          // Collected into BANK
          transactionId = await createChequeTransaction(
            cheque.id,
            'CEK_TAHSIL_BANKA',
            'BANKA',
            data.isoDate,
            amount,
            counterparty,
            description,
            data.bankId,
            0, // incoming
            0, // outgoing
            amount, // bankDelta positive
            null, // displayIncoming
            null, // displayOutgoing
            updatedBy
          );
        } else {
          // Collected into CASH
          transactionId = await createChequeTransaction(
            cheque.id,
            'CEK_TAHSIL_BANKA',
            'KASA',
            data.isoDate,
            amount,
            counterparty,
            description,
            null, // bankId
            amount, // incoming
            0, // outgoing
            0, // bankDelta
            null, // displayIncoming
            null, // displayOutgoing
            updatedBy
          );
        }
      } else {
        // BORC cheque paid
        const amount = Number(cheque.amount);
        const counterparty = cheque.supplier?.name || null;
        const description = data.description || `Çek No: ${cheque.cekNo}`;

        if (data.bankId) {
          // Paid from BANK
          transactionId = await createChequeTransaction(
            cheque.id,
            'CEK_ODENMESI',
            'BANKA',
            data.isoDate,
            amount,
            counterparty,
            description,
            data.bankId,
            0, // incoming
            0, // outgoing
            -amount, // bankDelta negative
            null, // displayIncoming
            null, // displayOutgoing
            updatedBy
          );
        } else {
          // Paid from CASH
          transactionId = await createChequeTransaction(
            cheque.id,
            'CEK_ODENMESI',
            'KASA',
            data.isoDate,
            amount,
            counterparty,
            description,
            null, // bankId
            0, // incoming
            amount, // outgoing
            0, // bankDelta
            null, // displayIncoming
            null, // displayOutgoing
            updatedBy
          );
        }
      }
    } else if (data.newStatus === 'KARSILIKSIZ') {
      // Optional info-only row for bounced cheque
      const amount = Number(cheque.amount);
      const counterparty = cheque.direction === 'ALACAK' ? cheque.customer?.name : cheque.supplier?.name || null;
      const description = data.description || `Çek No: ${cheque.cekNo} - Karşılıksız`;

      transactionId = await createChequeTransaction(
        cheque.id,
        'CEK_KARSILIKSIZ',
        'CEK',
        data.isoDate,
        amount,
        counterparty,
        description,
        null, // bankId
        0, // incoming
        0, // outgoing
        0, // bankDelta
        null, // displayIncoming
        amount, // displayOutgoing (optional info)
        updatedBy
      );
    }

    // Update cheque status
    const updated = await prisma.cheque.update({
      where: { id },
      data: {
        status: data.newStatus,
        bankId: data.bankId !== undefined ? data.bankId : cheque.bankId,
        updatedBy,
        updatedAt: new Date(),
      },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            accountNo: true,
            iban: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    return {
      cheque: this.mapToDto(updated),
      transactionId,
    };
  }

  /**
   * Get cheque by ID
   */
  async getChequeById(id: string): Promise<ChequeDto | null> {
    const cheque = await prisma.cheque.findUnique({
      where: { id },
      include: {
        bank: {
          select: {
            id: true,
            name: true,
            accountNo: true,
            iban: true,
          },
        },
        customer: {
          select: {
            id: true,
            name: true,
          },
        },
        supplier: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!cheque || cheque.deletedAt) {
      return null;
    }

    return this.mapToDto(cheque);
  }

  /**
   * List cheques with filters
   */
  async listCheques(query: ChequeListQuery): Promise<ChequeListResponse> {
    const where: any = {
      deletedAt: null,
    };

    if (query.status) {
      where.status = query.status;
    }

    if (query.direction) {
      where.direction = query.direction;
    }

    if (query.entryFrom || query.entryTo) {
      where.entryDate = {};
      if (query.entryFrom) {
        where.entryDate.gte = query.entryFrom;
      }
      if (query.entryTo) {
        where.entryDate.lte = query.entryTo;
      }
    }

    if (query.maturityFrom || query.maturityTo) {
      where.maturityDate = {};
      if (query.maturityFrom) {
        where.maturityDate.gte = query.maturityFrom;
      }
      if (query.maturityTo) {
        where.maturityDate.lte = query.maturityTo;
      }
    }

    if (query.customerId) {
      where.customerId = query.customerId;
    }

    if (query.supplierId) {
      where.supplierId = query.supplierId;
    }

    if (query.bankId) {
      where.bankId = query.bankId;
    }

    if (query.search) {
      where.OR = [
        { cekNo: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    const skip = (page - 1) * pageSize;

    const [cheques, totalCount] = await Promise.all([
      prisma.cheque.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: [
          { maturityDate: 'asc' },
          { entryDate: 'asc' },
        ],
        include: {
          bank: {
            select: {
              id: true,
              name: true,
              accountNo: true,
              iban: true,
            },
          },
          customer: {
            select: {
              id: true,
              name: true,
            },
          },
          supplier: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      }),
      prisma.cheque.count({ where }),
    ]);

    const totalAmount = cheques.reduce((sum, c) => sum + Number(c.amount), 0);

    // Calculate upcoming maturities
    const today = new Date().toISOString().split('T')[0];
    const sevenDaysLater = new Date();
    sevenDaysLater.setDate(sevenDaysLater.getDate() + 7);
    const sevenDaysLaterStr = sevenDaysLater.toISOString().split('T')[0];
    const thirtyDaysLater = new Date();
    thirtyDaysLater.setDate(thirtyDaysLater.getDate() + 30);
    const thirtyDaysLaterStr = thirtyDaysLater.toISOString().split('T')[0];

    const allCheques = await prisma.cheque.findMany({
      where: {
        ...where,
        status: {
          in: ['KASADA', 'BANKADA_TAHSILDE', 'ODEMEDE'],
        },
      },
    });

    const within7Days = allCheques.filter(
      (c) => c.maturityDate >= today && c.maturityDate <= sevenDaysLaterStr
    ).length;
    const within30Days = allCheques.filter(
      (c) => c.maturityDate >= today && c.maturityDate <= thirtyDaysLaterStr
    ).length;
    const overdue = allCheques.filter((c) => c.maturityDate < today).length;

    return {
      items: cheques.map((c) => this.mapToDto(c)),
      totalCount,
      totalAmount,
      upcomingMaturities: {
        within7Days,
        within30Days,
        overdue,
      },
    };
  }

  /**
   * Map Prisma cheque to DTO
   */
  private mapToDto(cheque: any): ChequeDto {
    return {
      id: cheque.id,
      cekNo: cheque.cekNo,
      amount: Number(cheque.amount),
      entryDate: cheque.entryDate,
      maturityDate: cheque.maturityDate,
      status: cheque.status,
      direction: cheque.direction,
      customerId: cheque.customerId,
      supplierId: cheque.supplierId,
      bankId: cheque.bankId,
      description: cheque.description,
      attachmentId: cheque.attachmentId,
      createdAt: cheque.createdAt.toISOString(),
      createdBy: cheque.createdBy,
      updatedAt: cheque.updatedAt?.toISOString() || null,
      updatedBy: cheque.updatedBy || null,
      deletedAt: cheque.deletedAt?.toISOString() || null,
      deletedBy: cheque.deletedBy || null,
      bank: cheque.bank || null,
      customer: cheque.customer || null,
      supplier: cheque.supplier || null,
    };
  }
}

