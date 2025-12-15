import { prisma } from '../../config/prisma';
import { DailyTransactionSource } from '@prisma/client';
import { DashboardSummary } from './dashboard.types';

export class DashboardService {
  /**
   * Get authoritative dashboard summary
   * 
   * Calculates:
   * - cashBalance: Sum of (incoming - outgoing) for all KASA transactions
   * - totalBankBalance: Sum of all bankDelta values across all banks
   * - bankBalances: Per-bank balance breakdown
   * - creditCardSummary: Optional credit card debt summary
   */
  async getSummary(): Promise<DashboardSummary> {
    // 1. Calculate cash balance (only KASA transactions)
    const cashTransactions = await prisma.transaction.aggregate({
      where: {
        deletedAt: null,
        source: DailyTransactionSource.KASA,
      },
      _sum: {
        incoming: true,
        outgoing: true,
      },
    });

    const cashBalance =
      (cashTransactions._sum.incoming?.toNumber() ?? 0) -
      (cashTransactions._sum.outgoing?.toNumber() ?? 0);

    // 2. Calculate bank balances (group by bankId)
    const bankBalanceGroups = await prisma.transaction.groupBy({
      by: ['bankId'],
      where: {
        deletedAt: null,
        bankId: { not: null },
      },
      _sum: {
        bankDelta: true,
      },
    });

    // 3. Get bank names for each bankId
    const bankIds = bankBalanceGroups
      .map((g) => g.bankId)
      .filter((id): id is string => id !== null);

    const banks = bankIds.length > 0
      ? await prisma.bank.findMany({
          where: {
            id: { in: bankIds },
            deletedAt: null,
          },
          select: {
            id: true,
            name: true,
          },
        })
      : [];

    const bankMap = new Map(banks.map((b) => [b.id, b.name]));

    // 4. Build bankBalances array
    const bankBalances = bankBalanceGroups
      .filter((g) => g.bankId !== null)
      .map((g) => ({
        bankId: g.bankId!,
        bankName: bankMap.get(g.bankId!) || 'Bilinmeyen Banka',
        balance: g._sum.bankDelta?.toNumber() ?? 0,
      }));

    // 5. Calculate total bank balance
    const totalBankBalance = bankBalances.reduce((sum, b) => sum + b.balance, 0);

    // 6. Optional: Get credit card summary
    const creditCards = await prisma.creditCard.findMany({
      where: {
        deletedAt: null,
        isActive: true,
      },
      select: {
        id: true,
        name: true,
        limit: true,
        manualGuncelBorc: true,
      },
    });

    const creditCardSummary = creditCards.map((card) => {
      const currentDebt = card.manualGuncelBorc?.toNumber() ?? 0;
      const limit = card.limit?.toNumber() ?? 0;
      const availableLimit = Math.max(0, limit - currentDebt);

      return {
        creditCardId: card.id,
        creditCardName: card.name,
        currentDebt,
        limit,
        availableLimit,
      };
    });

    return {
      cashBalance,
      totalBankBalance,
      bankBalances,
      creditCardSummary,
    };
  }
}

