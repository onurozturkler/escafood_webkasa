import { PrismaClient, DailyTransactionType, DailyTransactionSource } from '@prisma/client';
import prisma from '../../config/prisma';
import {
  KasaDefteriQuery,
  KasaDefteriResponse,
  NakitAkisQuery,
  NakitAkisResponse,
} from './reports.types';

export class ReportsService {
  /**
   * Get Kasa Defteri (Cash Book) report
   */
  async getKasaDefteri(query: KasaDefteriQuery): Promise<KasaDefteriResponse> {
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

    // Calculate opening balance (before from date)
    let openingBalance = 0;
    if (query.from) {
      const beforeTransactions = await prisma.transaction.findMany({
        where: {
          deletedAt: null,
          isoDate: { lt: query.from },
        },
        orderBy: [
          { isoDate: 'asc' },
          { createdAt: 'asc' },
        ],
      });
      openingBalance = beforeTransactions.reduce(
        (sum, tx) => sum + Number(tx.incoming) - Number(tx.outgoing),
        0
      );
    }

    const page = query.page || 1;
    const pageSize = query.pageSize || 50;
    const skip = (page - 1) * pageSize;

    // Determine sort order
    const sortKey = query.sortKey || 'isoDate';
    const sortDir = query.sortDir || 'asc';
    const orderBy: any = {};
    orderBy[sortKey] = sortDir;

    // For date sorting, add createdAt as secondary sort
    if (sortKey === 'isoDate') {
      orderBy.createdAt = sortDir;
    }

    const [transactions, totalCount] = await Promise.all([
      prisma.transaction.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: Object.keys(orderBy).length > 0 ? orderBy : [{ isoDate: 'asc' }, { createdAt: 'asc' }],
      }),
      prisma.transaction.count({ where }),
    ]);

    const totalIncoming = transactions.reduce((sum, tx) => sum + Number(tx.incoming), 0);
    const totalOutgoing = transactions.reduce((sum, tx) => sum + Number(tx.outgoing), 0);

    // Closing balance is the last transaction's balanceAfter, or opening + net
    const closingBalance =
      transactions.length > 0
        ? Number(transactions[transactions.length - 1].balanceAfter)
        : openingBalance + totalIncoming - totalOutgoing;

    return {
      items: transactions.map((tx) => ({
        id: tx.id,
        isoDate: tx.isoDate,
        documentNo: tx.documentNo,
        type: tx.type,
        source: tx.source,
        counterparty: tx.counterparty,
        description: tx.description,
        incoming: Number(tx.incoming),
        outgoing: Number(tx.outgoing),
        balanceAfter: Number(tx.balanceAfter),
      })),
      totalCount,
      totalIncoming,
      totalOutgoing,
      openingBalance,
      closingBalance,
    };
  }

  /**
   * Get Nakit Akış (Cash Flow) report
   */
  async getNakitAkis(query: NakitAkisQuery): Promise<NakitAkisResponse> {
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

    if (query.user) {
      where.createdBy = query.user;
    }

    if (query.search) {
      where.OR = [
        { documentNo: { contains: query.search, mode: 'insensitive' } },
        { counterparty: { contains: query.search, mode: 'insensitive' } },
        { description: { contains: query.search, mode: 'insensitive' } },
      ];
    }

    // Filter by scope
    if (query.scope === 'NAKIT') {
      where.source = 'KASA';
    } else if (query.scope === 'BANKA') {
      where.source = 'BANKA';
    }
    // 'HEPSI' means no source filter

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: [
        { isoDate: 'asc' },
        { createdAt: 'asc' },
      ],
    });

    const girisler: NakitAkisResponse['girisler'] = [];
    const cikislar: NakitAkisResponse['cikislar'] = [];

    for (const tx of transactions) {
      const giris = this.getNakitAkisGiris(tx);
      const cikis = this.getNakitAkisCikis(tx);

      if (giris > 0) {
        girisler.push({
          isoDate: tx.isoDate,
          type: tx.type,
          source: tx.source,
          counterparty: tx.counterparty,
          description: tx.description,
          amount: giris,
        });
      }

      if (cikis > 0) {
        cikislar.push({
          isoDate: tx.isoDate,
          type: tx.type,
          source: tx.source,
          counterparty: tx.counterparty,
          description: tx.description,
          amount: cikis,
        });
      }
    }

    const totalIn = girisler.reduce((sum, g) => sum + g.amount, 0);
    const totalOut = cikislar.reduce((sum, c) => sum + c.amount, 0);
    const net = totalIn - totalOut;

    return {
      totalIn,
      totalOut,
      net,
      girisler,
      cikislar,
    };
  }

  /**
   * Get cashflow contribution for a transaction (giris)
   */
  private getNakitAkisGiris(tx: any): number {
    switch (tx.type) {
      case 'NAKIT_TAHSILAT':
        return Number(tx.incoming);

      case 'BANKA_HAVALE_GIRIS':
        if (Number(tx.bankDelta) > 0) {
          return Number(tx.bankDelta);
        }
        return 0;

      case 'POS_TAHSILAT_BRUT':
        return Number(tx.displayIncoming) || 0;

      case 'BANKA_KASA_TRANSFER':
        // Internal movements do NOT affect net cashflow in the report
        return 0;

      case 'KASA_BANKA_TRANSFER':
        // Internal movements do NOT affect net cashflow in the report
        return 0;

      case 'CEK_TAHSIL_BANKA':
        if (tx.source === 'KASA' && Number(tx.incoming) > 0) {
          return Number(tx.incoming);
        }
        if (tx.source === 'BANKA' && Number(tx.bankDelta) > 0) {
          return Number(tx.bankDelta);
        }
        return 0;

      case 'DEVIR_BAKIYE':
      case 'DUZELTME':
        // Optional: exclude or handle separately
        return 0;

      default:
        return 0;
    }
  }

  /**
   * Get cashflow contribution for a transaction (cikis)
   * Uses explicit per-type rules from the spec
   */
  private getNakitAkisCikis(tx: any): number {
    switch (tx.type) {
      case 'NAKIT_ODEME':
        return Number(tx.outgoing);

      case 'BANKA_HAVALE_CIKIS':
        if (Number(tx.bankDelta) < 0) {
          return Math.abs(Number(tx.bankDelta));
        }
        return 0;

      case 'POS_KOMISYONU':
        // Always use displayOutgoing for commission
        return Number(tx.displayOutgoing) || 0;

      case 'KREDI_KARTI_HARCAMA':
        return Number(tx.displayOutgoing) || 0;

      case 'KREDI_KARTI_EKSTRE_ODEME':
        if (Number(tx.bankDelta) < 0) {
          return Math.abs(Number(tx.bankDelta));
        }
        if (Number(tx.outgoing) > 0) {
          return Number(tx.outgoing);
        }
        return 0;

      case 'KASA_BANKA_TRANSFER':
        // Internal movements do NOT affect net cashflow in the report
        return 0;

      case 'BANKA_KASA_TRANSFER':
        // Internal movements do NOT affect net cashflow in the report
        return 0;

      case 'CEK_ODENMESI':
        if (tx.source === 'KASA' && Number(tx.outgoing) > 0) {
          return Number(tx.outgoing);
        }
        if (tx.source === 'BANKA' && Number(tx.bankDelta) < 0) {
          return Math.abs(Number(tx.bankDelta));
        }
        return 0;

      case 'DEVIR_BAKIYE':
      case 'DUZELTME':
        // Optional: exclude or handle separately
        return 0;

      default:
        return 0;
    }
  }
}

