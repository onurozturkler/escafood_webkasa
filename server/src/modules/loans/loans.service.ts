import { PrismaClient, LoanInstallmentStatus } from '@prisma/client';
import { prisma } from '../../config/prisma';
import {
  LoanDto,
  LoanInstallmentDto,
  CreateLoanDto,
  PayInstallmentDto,
  UpcomingInstallmentsQuery,
} from './loans.types';
import { TransactionsService } from '../transactions/transactions.service';

const transactionsService = new TransactionsService();

/**
 * Calculate loan schedule (same logic as frontend)
 */
function buildLoanSchedule(
  totalAmount: number,
  installmentCount: number,
  firstInstallmentDate: string,
  interestRate: number,
  bsmvRate: number
): Array<{ index: number; dateIso: string; principal: number; interest: number; bsmv: number; totalPayment: number }> {
  const r = interestRate / 12;
  const b = bsmvRate;
  const rEff = r * (1 + b);
  const n = installmentCount;
  const P = totalAmount;
  const schedule: Array<{ index: number; dateIso: string; principal: number; interest: number; bsmv: number; totalPayment: number }> = [];

  const factor = Math.pow(1 + rEff, n);
  const installment = rEff === 0 ? P / n : (P * (rEff * factor)) / (factor - 1);

  let remaining = P;

  for (let i = 1; i <= n; i += 1) {
    const interest = remaining * r;
    const bsmv = interest * b;
    let principal = installment - interest - bsmv;
    let totalPayment = installment;

    if (i === n && Math.abs(remaining - principal) > 0.01) {
      principal = remaining;
      totalPayment = principal + interest + bsmv;
    }

    remaining = remaining - principal;
    if (Math.abs(remaining) < 0.01) {
      remaining = 0;
    }

    // Calculate date: add (i-1) months to firstInstallmentDate
    const firstDate = new Date(firstInstallmentDate + 'T00:00:00Z');
    const installmentDate = new Date(firstDate);
    installmentDate.setUTCMonth(installmentDate.getUTCMonth() + (i - 1));
    const dateIso = installmentDate.toISOString().slice(0, 10);

    schedule.push({
      index: i,
      dateIso,
      principal,
      interest,
      bsmv,
      totalPayment,
    });
  }

  return schedule;
}

export class LoansService {
  /**
   * Create a loan and generate all installments
   */
  async createLoan(data: CreateLoanDto, createdBy: string): Promise<LoanDto> {
    const schedule = buildLoanSchedule(
      data.totalAmount,
      data.installmentCount,
      data.firstInstallmentDate,
      data.interestRate,
      data.bsmvRate
    );

    const loan = await prisma.loan.create({
      data: {
        name: data.name,
        bankId: data.bankId,
        totalAmount: data.totalAmount,
        installmentCount: data.installmentCount,
        firstInstallmentDate: data.firstInstallmentDate,
        interestRate: data.interestRate,
        bsmvRate: data.bsmvRate,
        isActive: true,
        createdBy,
        installments: {
          create: schedule.map((inst) => ({
            bankId: data.bankId,
            installmentIndex: inst.index,
            dueDate: inst.dateIso,
            amount: inst.totalPayment,
            principal: inst.principal,
            interest: inst.interest,
            status: 'PENDING',
            createdBy,
          })),
        },
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
      },
    });

    return this.mapLoanToDto(loan);
  }

  /**
   * Get upcoming installments for a bank
   */
  async getUpcomingInstallments(query: UpcomingInstallmentsQuery): Promise<LoanInstallmentDto[]> {
    const today = new Date().toISOString().slice(0, 10);
    const where: any = {
      deletedAt: null,
      status: 'PENDING',
      dueDate: { gte: today },
    };

    if (query.bankId) {
      where.bankId = query.bankId;
    }

    if (query.from) {
      where.dueDate = { ...where.dueDate, gte: query.from };
    }

    if (query.to) {
      where.dueDate = { ...where.dueDate, lte: query.to };
    }

    const installments = await prisma.loanInstallment.findMany({
      where,
      include: {
        loan: {
          select: {
            id: true,
            name: true,
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
      orderBy: [
        { dueDate: 'asc' },
        { installmentIndex: 'asc' },
      ],
    });

    return installments.map(this.mapInstallmentToDto);
  }

  /**
   * Pay an installment
   */
  async payInstallment(id: string, data: PayInstallmentDto, updatedBy: string): Promise<{ installment: LoanInstallmentDto; transactionId: string }> {
    const installment = await prisma.loanInstallment.findUnique({
      where: { id },
      include: {
        loan: {
          select: {
            id: true,
            name: true,
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    if (!installment) {
      throw new Error('Installment not found');
    }

    if (installment.deletedAt) {
      throw new Error('Cannot pay deleted installment');
    }

    if (installment.status === 'PAID') {
      throw new Error('Installment already paid');
    }

    // Update installment status
    const updated = await prisma.loanInstallment.update({
      where: { id },
      data: {
        status: 'PAID',
        paidDate: data.isoDate,
        updatedBy,
        updatedAt: new Date(),
      },
      include: {
        loan: {
          select: {
            id: true,
            name: true,
          },
        },
        bank: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    // Create transaction
    const description = data.description || `${installment.loan.name} - ${installment.installmentIndex}. taksit`;
    const transaction = await transactionsService.createTransaction(
      {
        isoDate: data.isoDate,
        documentNo: null,
        type: 'KREDI_TAKSIT_ODEME',
        source: 'BANKA',
        counterparty: installment.loan.name,
        description,
        incoming: 0,
        outgoing: Number(installment.amount),
        bankDelta: -Number(installment.amount),
        displayIncoming: null,
        displayOutgoing: null,
        bankId: installment.bankId,
        loanInstallmentId: id,
      },
      updatedBy
    );

    return {
      installment: this.mapInstallmentToDto(updated),
      transactionId: transaction.id,
    };
  }

  private mapLoanToDto(loan: any): LoanDto {
    return {
      id: loan.id,
      name: loan.name,
      bankId: loan.bankId,
      totalAmount: Number(loan.totalAmount),
      installmentCount: loan.installmentCount,
      firstInstallmentDate: loan.firstInstallmentDate,
      interestRate: Number(loan.interestRate),
      bsmvRate: Number(loan.bsmvRate),
      isActive: loan.isActive,
      createdAt: loan.createdAt.toISOString(),
      createdBy: loan.createdBy,
      updatedAt: loan.updatedAt?.toISOString() || null,
      updatedBy: loan.updatedBy || null,
      deletedAt: loan.deletedAt?.toISOString() || null,
      deletedBy: loan.deletedBy || null,
      bank: loan.bank
        ? {
            id: loan.bank.id,
            name: loan.bank.name,
            accountNo: loan.bank.accountNo,
            iban: loan.bank.iban,
          }
        : null,
    };
  }

  private mapInstallmentToDto(installment: any): LoanInstallmentDto {
    return {
      id: installment.id,
      loanId: installment.loanId,
      bankId: installment.bankId,
      installmentIndex: installment.installmentIndex,
      dueDate: installment.dueDate,
      amount: Number(installment.amount),
      principal: Number(installment.principal),
      interest: Number(installment.interest),
      status: installment.status,
      paidDate: installment.paidDate,
      createdAt: installment.createdAt.toISOString(),
      createdBy: installment.createdBy,
      loan: installment.loan
        ? {
            id: installment.loan.id,
            name: installment.loan.name,
          }
        : null,
      bank: installment.bank
        ? {
            id: installment.bank.id,
            name: installment.bank.name,
          }
        : null,
    };
  }
}

