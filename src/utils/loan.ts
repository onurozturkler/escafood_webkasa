import { Loan } from '../models/loan';

export function buildAmortizationSchedule(loan: Loan) {
  const rMonthly = loan.faizOraniYillik / 12;
  const efektifFaiz = rMonthly * (1 + loan.bsmvOrani);
  const sabitTaksit =
    loan.toplamKrediTutari * (efektifFaiz / (1 - Math.pow(1 + efektifFaiz, -loan.vadeSayisi)));

  let bakiye = loan.toplamKrediTutari;
  const schedule: {
    taksitNo: number;
    dueDateIso: string;
    principal: number;
    interest: number;
    bsmv: number;
    installmentAmount: number;
  }[] = [];

  for (let ay = 1; ay <= loan.vadeSayisi; ay += 1) {
    const faiz = bakiye * rMonthly;
    const bsmv = faiz * loan.bsmvOrani;
    const toplamFaiz = faiz + bsmv;
    let taksit: number;
    if (ay < loan.vadeSayisi) {
      taksit = sabitTaksit;
    } else {
      taksit = bakiye + toplamFaiz;
    }
    const anapara = taksit - toplamFaiz;
    bakiye -= anapara;

    const date = new Date(loan.ilkTaksitTarihi);
    date.setMonth(date.getMonth() + (ay - 1));
    const iso = date.toISOString().slice(0, 10);

    schedule.push({
      taksitNo: ay,
      dueDateIso: iso,
      principal: anapara,
      interest: faiz,
      bsmv,
      installmentAmount: taksit,
    });
  }

  return schedule;
}
