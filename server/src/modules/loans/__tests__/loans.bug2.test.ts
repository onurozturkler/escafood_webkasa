/**
 * BUG-2 Test: Loan installment payment removes from upcoming payments
 * 
 * Test that when a loan installment is paid, it is marked as ODEME_ALINDI
 * and does not appear in upcoming payments queries.
 */

import { PrismaClient } from '@prisma/client';
import { LoansService } from '../loans.service';

const prisma = new PrismaClient();
const service = new LoansService();

describe('BUG-2: Loan Installment Payment', () => {
  let testLoanId: string;
  let testInstallmentId: string;
  let testBankId: string;
  const testUserId = 'test-user-bug2';

  beforeAll(async () => {
    // Create a test bank
    const testBank = await prisma.bank.create({
      data: {
        name: 'Test Bank BUG2',
        accountNo: 'TEST002',
        isActive: true,
        createdBy: testUserId,
      },
    });
    testBankId = testBank.id;

    // Create a test loan with installments
    const loan = await prisma.loan.create({
      data: {
        name: 'Test Loan BUG2',
        bankId: testBank.id,
        totalAmount: 100000,
        installmentCount: 3,
        firstInstallmentDate: '2025-01-15',
        annualInterestRate: 12,
        bsmvRate: 5,
        isActive: true,
        createdBy: testUserId,
        installments: {
          create: [
            {
              installmentNumber: 1,
              dueDate: '2025-01-15',
              principal: 30000,
              interest: 1000,
              bsmv: 50,
              totalAmount: 31050,
              status: 'BEKLENIYOR',
              createdBy: testUserId,
            },
            {
              installmentNumber: 2,
              dueDate: '2025-02-15',
              principal: 35000,
              interest: 700,
              bsmv: 35,
              totalAmount: 35735,
              status: 'BEKLENIYOR',
              createdBy: testUserId,
            },
            {
              installmentNumber: 3,
              dueDate: '2025-03-15',
              principal: 35000,
              interest: 350,
              bsmv: 17.5,
              totalAmount: 35367.5,
              status: 'BEKLENIYOR',
              createdBy: testUserId,
            },
          ],
        },
      },
      include: {
        installments: true,
      },
    });

    testLoanId = loan.id;
    testInstallmentId = loan.installments[0].id; // First installment
  });

  afterAll(async () => {
    // Cleanup
    if (testLoanId) {
      await prisma.loanInstallment.deleteMany({ where: { loanId: testLoanId } });
      await prisma.loan.deleteMany({ where: { id: testLoanId } });
    }
    await prisma.transaction.deleteMany({ where: { loanInstallmentId: testInstallmentId } });
    await prisma.bank.deleteMany({ where: { id: testBankId } });
    await prisma.$disconnect();
  });

  it('should mark installment as ODEME_ALINDI after payment', async () => {
    // Pay the first installment
    const result = await service.payInstallment(
      testLoanId,
      testInstallmentId,
      '2025-01-15',
      'Test payment',
      testUserId
    );

    expect(result.loan).not.toBeNull();
    expect(result.transaction).not.toBeNull();

    // Verify installment status in DB
    const installment = await prisma.loanInstallment.findUnique({
      where: { id: testInstallmentId },
    });

    expect(installment).not.toBeNull();
    expect(installment!.status).toBe('ODEME_ALINDI');
    expect(installment!.paidDate).toBe('2025-01-15');
    expect(installment!.transactionId).toBe(result.transaction.id);
  });

  it('should not include paid installment in listLoans upcoming installments', async () => {
    // Get loan with installments
    const loan = await service.getLoanById(testLoanId);

    expect(loan).not.toBeNull();
    expect(loan!.installments).toBeDefined();
    expect(loan!.installments!.length).toBe(3);

    // Find paid installment
    const paidInstallment = loan!.installments!.find(
      (inst) => inst.installmentNumber === 1
    );
    expect(paidInstallment).not.toBeUndefined();
    expect(paidInstallment!.status).toBe('ODEME_ALINDI');

    // Find upcoming installments (should exclude paid one)
    const upcomingInstallments = loan!.installments!.filter(
      (inst) => inst.status === 'BEKLENIYOR' || inst.status === 'GECIKMIS'
    );

    expect(upcomingInstallments.length).toBe(2);
    expect(upcomingInstallments.every((inst) => inst.installmentNumber !== 1)).toBe(true);
  });

  it('should show next installment after payment', async () => {
    // Get loan
    const loan = await service.getLoanById(testLoanId);

    expect(loan).not.toBeNull();
    expect(loan!.installments).toBeDefined();

    // Find next upcoming installment (should be installment #2)
    const upcomingInstallments = loan!.installments!.filter(
      (inst) => inst.status === 'BEKLENIYOR' || inst.status === 'GECIKMIS'
    );

    expect(upcomingInstallments.length).toBeGreaterThan(0);

    // Sort by due date and get earliest
    const nextInstallment = [...upcomingInstallments].sort((a, b) =>
      a.dueDate.localeCompare(b.dueDate)
    )[0];

    expect(nextInstallment.installmentNumber).toBe(2);
    expect(nextInstallment.status).toBe('BEKLENIYOR');
  });

  it('should persist payment status across listLoans calls', async () => {
    // Get all loans
    const allLoans = await service.listLoans();
    const loan = allLoans.find((l) => l.id === testLoanId);

    expect(loan).not.toBeUndefined();
    expect(loan!.installments).toBeDefined();

    // Verify paid installment is marked correctly
    const paidInstallment = loan!.installments!.find(
      (inst) => inst.installmentNumber === 1
    );
    expect(paidInstallment).not.toBeUndefined();
    expect(paidInstallment!.status).toBe('ODEME_ALINDI');
  });
});

