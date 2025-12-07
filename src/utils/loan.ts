import { Loan } from '../models/loan';
import { addMonths } from './date';

export interface LoanInstallment {
  index: number;
  dateIso: string;
  principal: number;
  interest: number;
  bsmv: number;
  totalPayment: number;
  remainingPrincipal: number;
}

export interface LoanScheduleItem {
  index: number;
  dateIso: string;
  principal: number;
  interest: number;
  bsmv: number;
  totalPayment: number;
  remainingPrincipal: number;
}

export function buildLoanSchedule(loan: Loan): LoanScheduleItem[] {
  const r = loan.annualInterestRate / 12;
  const b = loan.bsmvRate;
  const rEff = r * (1 + b);
  const n = loan.installmentCount;
  const P = loan.totalAmount;
  const schedule: LoanScheduleItem[] = [];

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

    schedule.push({
      index: i,
      dateIso: addMonths(loan.firstInstallmentDate, i - 1),
      principal,
      interest,
      bsmv,
      totalPayment,
      remainingPrincipal: remaining,
    });
  }

  return schedule;
}
