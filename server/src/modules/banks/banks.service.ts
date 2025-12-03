import { prisma } from '../../config/prisma';
import { BankRecord, BankWithBalance, CreateBankDTO, DeleteBankDTO, UpdateBankDTO } from './banks.types';

export class BanksService {
  async getAllBanksWithBalances(): Promise<BankWithBalance[]> {
    const [banks, balanceGroups] = await prisma.$transaction([
      prisma.bank.findMany({
        where: { deletedAt: null },
        orderBy: { name: 'asc' },
      }),
      prisma.transaction.groupBy({
        by: ['bankId'],
        _sum: { bankDelta: true },
        where: {
          deletedAt: null,
          bankId: {
            not: null,
          },
        },
        orderBy: {
          bankId: 'asc',
        },
      }),
    ]);

    const balanceMap = new Map<string, number>();
    for (const group of balanceGroups) {
      if (group.bankId && group._sum) {
        balanceMap.set(group.bankId, Number(group._sum.bankDelta ?? 0));
      }
    }

    return banks.map((bank) => ({
      ...bank,
      currentBalance: balanceMap.get(bank.id) ?? 0,
    }));
  }

  async createBank(payload: CreateBankDTO, createdBy: string): Promise<BankRecord> {
    const created = await prisma.bank.create({
      data: {
        name: payload.name,
        accountNo: payload.accountNo ?? null,
        iban: payload.iban ?? null,
        createdBy,
      },
    });

    return created;
  }

  async updateBank(id: string, payload: UpdateBankDTO, updatedBy: string): Promise<BankRecord> {
    const existing = await prisma.bank.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new Error('Bank not found.');
    }

    const data: Record<string, unknown> = {
      updatedAt: new Date(),
      updatedBy,
    };

    if (payload.name !== undefined) {
      data.name = payload.name;
    }

    if (payload.accountNo !== undefined) {
      data.accountNo = payload.accountNo ?? null;
    }

    if (payload.iban !== undefined) {
      data.iban = payload.iban ?? null;
    }

    if (payload.isActive !== undefined) {
      data.isActive = payload.isActive;
    }

    const updated = await prisma.bank.update({
      where: { id },
      data,
    });

    return updated;
  }

  async softDeleteBank(id: string, deletedBy: string): Promise<BankRecord> {
    const existing = await prisma.bank.findUnique({ where: { id } });
    if (!existing || existing.deletedAt) {
      throw new Error('Bank not found.');
    }

    const deleted = await prisma.bank.update({
      where: { id },
      data: {
        isActive: false,
        deletedAt: new Date(),
        deletedBy,
      },
    });

    return deleted;
  }
}
