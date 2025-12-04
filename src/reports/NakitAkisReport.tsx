import { useMemo, useState } from 'react';
import {
  DailyTransaction,
  getTransactionSourceLabel,
  getTransactionTypeLabel,
} from '../models/transaction';
import { BankMaster } from '../models/bank';
import { isoToDisplay, todayIso } from '../utils/date';
import { formatTl } from '../utils/money';
import { HomepageIcon } from '../components/HomepageIcon';
import { printReport } from '../utils/pdfExport';

interface Props {
  transactions: DailyTransaction[];
  banks: BankMaster[];
  onBackToDashboard?: () => void;
}

type Scope = 'HEPSI' | 'NAKIT' | 'BANKA';

function getMonthRange() {
  const today = new Date(`${todayIso()}T00:00:00Z`);
  const year = today.getUTCFullYear();
  const month = today.getUTCMonth();
  const first = new Date(Date.UTC(year, month, 1)).toISOString().slice(0, 10);
  const last = new Date(Date.UTC(year, month + 1, 0)).toISOString().slice(0, 10);
  return { first, last };
}

export function NakitAkisReport({ transactions, banks, onBackToDashboard }: Props) {
  const monthRange = getMonthRange();
  const [fromDate, setFromDate] = useState(monthRange.first);
  const [toDate, setToDate] = useState(monthRange.last);
  const [scope, setScope] = useState<Scope>('HEPSI');
  const [userFilter, setUserFilter] = useState<string>('HEPSI');
  const [searchText, setSearchText] = useState('');

  // Safeguard: ensure transactions is always an array
  const safeTransactions = transactions ?? [];

  const distinctUsers = useMemo(() => {
    return Array.from(new Set(safeTransactions.map((t) => t.createdBy).filter(Boolean))) as string[];
  }, [safeTransactions]);

  const resolveIncomingAmount = (tx: DailyTransaction) => {
    const bankDelta = tx.bankDelta || 0;
    return Math.max(tx.displayIncoming || 0, tx.incoming || 0, bankDelta > 0 ? bankDelta : 0);
  };

  const resolveOutgoingAmount = (tx: DailyTransaction) => {
    const bankDelta = tx.bankDelta || 0;
    if (tx.type === 'POS_KOMISYONU') {
      return tx.displayOutgoing || 0;
    }
    return Math.max(tx.displayOutgoing || 0, tx.outgoing || 0, bankDelta < 0 ? Math.abs(bankDelta) : 0);
  };

  const filtered = useMemo(() => {
    const term = searchText.trim().toLowerCase();
    return safeTransactions.filter((tx) => {
      if (!fromDate || !toDate) return false;
      if (tx.isoDate < fromDate || tx.isoDate > toDate) return false;

      if (userFilter !== 'HEPSI') {
        if (!tx.createdBy || tx.createdBy !== userFilter) return false;
      }

      if (scope === 'NAKIT') {
        const cashMovement = (tx.incoming || 0) !== 0 || (tx.outgoing || 0) !== 0;
        const bankMovement = !!tx.bankDelta && tx.bankDelta !== 0;
        if (!cashMovement || bankMovement) return false;
      } else if (scope === 'BANKA') {
        if (!tx.bankDelta || tx.bankDelta === 0) return false;
      }

      if (term) {
        const combined = `${getTransactionTypeLabel(tx.type)} ${getTransactionSourceLabel(tx.source)} ${tx.counterparty || ''} ${
          tx.description || ''
        }`.toLowerCase();
        if (!combined.includes(term)) return false;
      }
      return true;
    });
  }, [fromDate, scope, searchText, toDate, safeTransactions, userFilter]);

  const totals = useMemo(() => {
    return filtered.reduce(
      (acc, tx) => {
        const incoming = resolveIncomingAmount(tx);
        const outgoing = resolveOutgoingAmount(tx);
        // POS komisyonları kasa/banka bakiyesine dokunmadan raporda gider olarak gösterilir.
        acc.totalIn += incoming;
        acc.totalOut += outgoing;
        return acc;
      },
      { totalIn: 0, totalOut: 0 }
    );
  }, [filtered]);

  const net = totals.totalIn - totals.totalOut;

  const girisler = useMemo(() => {
    return filtered.filter((tx) => resolveIncomingAmount(tx) > 0);
  }, [filtered]);

  const cikislar = useMemo(() => {
    return filtered.filter((tx) => resolveOutgoingAmount(tx) > 0);
  }, [filtered]);

  const resolveBankName = (bankId?: string) => banks.find((b) => b.id === bankId)?.bankaAdi || 'Banka';

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-3 mb-2">
        <h1 className="text-lg md:text-xl font-semibold text-slate-800">Nakit Akış Raporu</h1>
        {onBackToDashboard && (
          <div className="no-print flex items-center gap-2">
            <button
              className="inline-flex items-center gap-2 px-3 py-2 rounded-lg border border-slate-300 bg-white text-slate-700 hover:bg-slate-100 text-sm"
              onClick={onBackToDashboard}
            >
              <HomepageIcon className="w-4 h-4" />
              <span>Ana Sayfaya Dön</span>
            </button>
            <button
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white hover:bg-indigo-700 text-sm font-medium"
              onClick={() => printReport()}
            >
              📄 PDF / Döküm Al
            </button>
          </div>
        )}
      </div>
      <div className="card p-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700">Başlangıç</label>
            <input
              type="date"
              className="form-input"
              value={fromDate}
              onChange={(e) => setFromDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Bitiş</label>
            <input
              type="date"
              className="form-input"
              value={toDate}
              onChange={(e) => setToDate(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Kapsam</label>
            <select className="form-input" value={scope} onChange={(e) => setScope(e.target.value as Scope)}>
              <option value="HEPSI">Hepsi</option>
              <option value="NAKIT">Sadece Nakit</option>
              <option value="BANKA">Sadece Banka</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700">Kullanıcı</label>
            <select className="form-input" value={userFilter} onChange={(e) => setUserFilter(e.target.value)}>
              <option value="HEPSI">Hepsi</option>
              {distinctUsers.map((u) => (
                <option key={u} value={u}>
                  {u}
                </option>
              ))}
            </select>
          </div>
          <div className="md:col-span-2 lg:col-span-3 xl:col-span-4">
            <label className="block text-sm font-medium text-slate-700">Serbest Arama</label>
            <input
              className="form-input"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Tür, kaynak, muhatap veya açıklama"
            />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="card p-3 text-sm">
          <div className="text-slate-500">Toplam Giriş</div>
          <div className="text-lg font-semibold text-emerald-700">{formatTl(totals.totalIn)}</div>
        </div>
        <div className="card p-3 text-sm">
          <div className="text-slate-500">Toplam Çıkış</div>
          <div className="text-lg font-semibold text-rose-700">{formatTl(totals.totalOut)}</div>
        </div>
        <div className="card p-3 text-sm">
          <div className="text-slate-500">Net</div>
          <div className="text-lg font-semibold text-slate-800">{formatTl(net)}</div>
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <div className="card p-4 overflow-x-auto">
          <div className="text-base font-semibold text-slate-800 mb-2">Girişler</div>
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Tarih</th>
                <th className="px-3 py-2 text-left">Tür</th>
                <th className="px-3 py-2 text-left">Kaynak</th>
                <th className="px-3 py-2 text-left">Muhatap</th>
                <th className="px-3 py-2 text-left">Açıklama</th>
                <th className="px-3 py-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {girisler.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center text-slate-500">
                    Kayıt yok.
                  </td>
                </tr>
              )}
              {girisler.map((tx) => {
                const bankDelta = tx.bankDelta || 0;
                const amount = resolveIncomingAmount(tx);
                // Fix Bug 5: Use bankName from backend if available, otherwise lookup from banks
                let kaynak = getTransactionSourceLabel(tx.source);
                if (tx.bankId) {
                  const bankName = (tx as any).bankName || resolveBankName(tx.bankId);
                  if (bankName && bankName !== 'Banka') {
                    kaynak = bankName;
                  } else if (tx.source === 'BANKA') {
                    kaynak = resolveBankName(tx.bankId);
                  }
                }
                // Fix Bug 5: Show credit card name if available
                const creditCardName = (tx as any).creditCardName;
                if (creditCardName) {
                  kaynak = `${kaynak} - ${creditCardName}`;
                }
                return (
                  <tr key={tx.id} className="border-t">
                    <td className="px-3 py-2">{isoToDisplay(tx.isoDate)}</td>
                    <td className="px-3 py-2">{getTransactionTypeLabel(tx.type)}</td>
                    <td className="px-3 py-2">{kaynak}</td>
                    <td className="px-3 py-2">{tx.counterparty}</td>
                    <td className="px-3 py-2 truncate max-w-[160px]" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className="px-3 py-2 text-right text-emerald-700">{formatTl(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div className="card p-4 overflow-x-auto">
          <div className="text-base font-semibold text-slate-800 mb-2">Çıkışlar</div>
          <table className="min-w-full text-xs md:text-sm">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-3 py-2 text-left">Tarih</th>
                <th className="px-3 py-2 text-left">Tür</th>
                <th className="px-3 py-2 text-left">Kaynak</th>
                <th className="px-3 py-2 text-left">Muhatap</th>
                <th className="px-3 py-2 text-left">Açıklama</th>
                <th className="px-3 py-2 text-right">Tutar</th>
              </tr>
            </thead>
            <tbody>
              {cikislar.length === 0 && (
                <tr>
                  <td colSpan={6} className="px-3 py-3 text-center text-slate-500">
                    Kayıt yok.
                  </td>
                </tr>
              )}
              {cikislar.map((tx) => {
                const bankDelta = tx.bankDelta || 0;
                const amount = resolveOutgoingAmount(tx);
                // Fix Bug 5: Use bankName from backend if available, otherwise lookup from banks
                let kaynak = getTransactionSourceLabel(tx.source);
                if (tx.type === 'POS_KOMISYONU' && tx.bankId) {
                  const bankName = (tx as any).bankName || resolveBankName(tx.bankId);
                  kaynak = `POS (${bankName})`;
                } else if (tx.source === 'BANKA' && tx.bankId) {
                  const bankName = (tx as any).bankName || resolveBankName(tx.bankId);
                  kaynak = bankName;
                }
                // Fix Bug 5: Show credit card name if available
                const creditCardName = (tx as any).creditCardName;
                if (creditCardName) {
                  kaynak = `${kaynak} - ${creditCardName}`;
                }
                return (
                  <tr key={tx.id} className="border-t">
                    <td className="px-3 py-2">{isoToDisplay(tx.isoDate)}</td>
                    <td className="px-3 py-2">{getTransactionTypeLabel(tx.type)}</td>
                    <td className="px-3 py-2">{kaynak}</td>
                    <td className="px-3 py-2">{tx.counterparty}</td>
                    <td className="px-3 py-2 truncate max-w-[160px]" title={tx.description}>
                      {tx.description}
                    </td>
                    <td className="px-3 py-2 text-right text-rose-700">{formatTl(amount)}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
