import { PrismaClient } from '@prisma/client';
import prisma from '../../config/prisma';
import {
  CreateBankDto,
  UpdateBankDto,
  BankDto,
  BankListResponse,
} from './banks.types';

export class BanksService {
  /**
   * Get all banks
   */
  async listBanks(): Promise<BankListResponse> {
    const banks = await prisma.bank.findMany({
      where: {
        deletedAt: null,
      },
      orderBy: {
        name: 'asc',
      },
    });

    // Calculate current balance for each bank
    const banksWithBalance = await Promise.all(
      banks.map(async (bank) => {
        const transactions = await prisma.transaction.findMany({
          where: {
            deletedAt: null,
            bankId: bank.id,
          },
        });

        const currentBalance = transactions.reduce(
          (sum, tx) => sum + Number(tx.bankDelta),
          0
        );

        return {
          ...this.mapToDto(bank),
          currentBalance,
        };
      })
    );

    return {
      items: banksWithBalance,
      totalCount: banksWithBalance.length,
    };
  }

  /**
   * Get bank by ID
   */
  async getBankById(id: string): Promise<BankDto | null> {
    const bank = await prisma.bank.findUnique({
      where: { id },
    });

    if (!bank || bank.deletedAt) {
      return null;
    }

    // Calculate current balance
    const transactions = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        bankId: bank.id,
      },
    });

    const currentBalance = transactions.reduce(
      (sum, tx) => sum + Number(tx.bankDelta),
      0
    );

    return {
      ...this.mapToDto(bank),
      currentBalance,
    };
  }

  /**
   * Create a new bank
   */
  async createBank(data: CreateBankDto, createdBy: string): Promise<BankDto> {
    const bank = await prisma.bank.create({
      data: {
        name: data.name,
        accountNo: data.accountNo || null,
        iban: data.iban || null,
        isActive: data.isActive !== undefined ? data.isActive : true,
        createdBy,
      },
    });

    return {
      ...this.mapToDto(bank),
      currentBalance: 0,
    };
  }

  /**
   * Update a bank
   */
  async updateBank(id: string, data: UpdateBankDto, updatedBy: string): Promise<BankDto> {
    const bank = await prisma.bank.findUnique({
      where: { id },
    });

    if (!bank) {
      throw new Error('Bank not found');
    }

    if (bank.deletedAt) {
      throw new Error('Cannot update deleted bank');
    }

    const updated = await prisma.bank.update({
      where: { id },
      data: {
        ...data,
        updatedBy,
        updatedAt: new Date(),
      },
    });

    // Calculate current balance
    const transactions = await prisma.transaction.findMany({
      where: {
        deletedAt: null,
        bankId: updated.id,
      },
    });

    const currentBalance = transactions.reduce(
      (sum, tx) => sum + Number(tx.bankDelta),
      0
    );

    return {
      ...this.mapToDto(updated),
      currentBalance,
    };
  }

  /**
   * Soft delete a bank
   */
  async deleteBank(id: string, deletedBy: string): Promise<void> {
    const bank = await prisma.bank.findUnique({
      where: { id },
    });

    if (!bank) {
      throw new Error('Bank not found');
    }

    if (bank.deletedAt) {
      throw new Error('Bank already deleted');
    }

    await prisma.bank.update({
      where: { id },
      data: {
        deletedAt: new Date(),
        deletedBy,
      },
    });
  }

  /**
   * Map Prisma bank to DTO
   */
  private mapToDto(bank: any): BankDto {
    return {
      id: bank.id,
      name: bank.name,
      accountNo: bank.accountNo,
      iban: bank.iban,
      isActive: bank.isActive,
      createdAt: bank.createdAt.toISOString(),
      createdBy: bank.createdBy,
      updatedAt: bank.updatedAt?.toISOString() || null,
      updatedBy: bank.updatedBy || null,
      deletedAt: bank.deletedAt?.toISOString() || null,
      deletedBy: bank.deletedBy || null,
    };
  }
}

