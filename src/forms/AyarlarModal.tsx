import { useEffect, useRef, useState, type ChangeEvent } from 'react';
import FormRow from '../components/FormRow';
import DateInput from '../components/DateInput';
import MoneyInput from '../components/MoneyInput';
import { BankMaster } from '../models/bank';
import { PosTerminal } from '../models/pos';
import { Customer } from '../models/customer';
import { Supplier } from '../models/supplier';
import { CreditCard } from '../models/card';
import { Loan } from '../models/loan';
import { GlobalSettings } from '../models/settings';
import { formatTl } from '../utils/money';
import { generateId } from '../utils/id';
import { apiPost, apiPut, apiDelete, apiGet } from '../utils/api';

function LoansTab({ banks, loans, setLoans, onDirty }: { banks: BankMaster[]; loans: Loan[]; setLoans: (l: Loan[]) => void; onDirty: () => void }) {
  const [editingId, setEditingId] = useState<string | null>(null);
  const [form, setForm] = useState({
    name: '',
    bankId: '',
    totalAmount: 0,
    installmentCount: 1,
    firstInstallmentDate: '',
    annualInterestRate: 0,
    bsmvRate: 0.05,
    isActive: true,
  });

  useEffect(() => {
    if (editingId) {
      const loan = loans.find((l) => l.id === editingId);
      if (loan) {
        setForm({
          name: loan.name,
          bankId: loan.bankId,
          totalAmount: loan.totalAmount,
          installmentCount: loan.installmentCount,
          firstInstallmentDate: loan.firstInstallmentDate,
          annualInterestRate: loan.annualInterestRate,
          bsmvRate: loan.bsmvRate,
          isActive: loan.isActive,
        });
      }
    } else {
      const today = new Date().toISOString().slice(0, 10);
      setForm({
        name: '',
        bankId: '',
        totalAmount: 0,
        installmentCount: 1,
        firstInstallmentDate: today,
        annualInterestRate: 0,
        bsmvRate: 0.05,
        isActive: true,
      });
    }
  }, [editingId, loans]);

  const save = async () => {
    if (!form.name || !form.bankId || form.totalAmount <= 0 || form.installmentCount <= 0) return;

    try {
      if (editingId) {
        const updated = await apiPut<Loan>(`/api/loans/${editingId}`, {
          name: form.name,
          bankId: form.bankId,
          totalAmount: form.totalAmount,
          installmentCount: form.installmentCount,
          firstInstallmentDate: form.firstInstallmentDate,
          annualInterestRate: form.annualInterestRate,
          bsmvRate: form.bsmvRate,
          isActive: form.isActive,
        });
        setLoans(loans.map((l) => (l.id === editingId ? updated : l)));
      } else {
        const created = await apiPost<Loan>('/api/loans', {
          name: form.name,
          bankId: form.bankId,
          totalAmount: form.totalAmount,
          installmentCount: form.installmentCount,
          firstInstallmentDate: form.firstInstallmentDate,
          annualInterestRate: form.annualInterestRate,
          bsmvRate: form.bsmvRate,
        });
        setLoans([...loans, created]);
      }
      setEditingId(null);
      onDirty();
    } catch (error: any) {
      alert(`Hata: ${error.message || 'Kredi kaydedilemedi'}`);
    }
  };

  const remove = async (id: string) => {
    if (!window.confirm('Bu krediyi silmek istediğinizden emin misiniz?')) return;
    try {
      await apiDelete(`/api/loans/${id}`);
      setLoans(loans.filter((l) => l.id !== id));
      onDirty();
    } catch (error: any) {
      alert(`Hata: ${error.message || 'Kredi silinemedi'}`);
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="max-h-96 overflow-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-slate-50">
              <th className="text-left px-2 py-1">Kredi Adı</th>
              <th className="text-left px-2 py-1">Banka</th>
              <th className="text-right px-2 py-1">Tutar</th>
              <th className="text-right px-2 py-1">Vade</th>
              <th className="px-2 py-1" />
            </tr>
          </thead>
          <tbody>
            {loans.map((loan) => (
              <tr key={loan.id} className="border-b hover:bg-slate-50 cursor-pointer" onClick={() => setEditingId(loan.id)}>
                <td className="px-2 py-1">{loan.name}</td>
                <td className="px-2 py-1">{banks.find((b) => b.id === loan.bankId)?.bankaAdi || '-'}</td>
                <td className="px-2 py-1 text-right">{formatTl(loan.totalAmount)}</td>
                <td className="px-2 py-1 text-right">{loan.installmentCount}</td>
                <td className="px-2 py-1 text-right">
                  <button className="text-rose-600" onClick={(e) => { e.stopPropagation(); remove(loan.id); }}>
                    Sil
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <div className="font-semibold">{editingId ? 'Kredi Düzenle' : 'Yeni Kredi'}</div>
          <button className="text-sm text-indigo-600" onClick={() => setEditingId(null)}>
            Yeni
          </button>
        </div>
        <FormRow label="Kredi Adı" required>
          <input className="input" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
        </FormRow>
        <FormRow label="Banka" required>
          <select className="input" value={form.bankId} onChange={(e) => setForm({ ...form, bankId: e.target.value })}>
            <option value="">Seçiniz</option>
            {banks.map((b) => (
              <option key={b.id} value={b.id}>
                {b.bankaAdi}
              </option>
            ))}
          </select>
        </FormRow>
        <FormRow label="Toplam Kredi Tutarı" required>
          <MoneyInput className="input" value={form.totalAmount} onChange={(val) => setForm({ ...form, totalAmount: val || 0 })} />
        </FormRow>
        <FormRow label="Vade Sayısı" required>
          <input
            className="input"
            type="number"
            min="1"
            value={form.installmentCount}
            onChange={(e) => setForm({ ...form, installmentCount: Number(e.target.value) })}
          />
        </FormRow>
        <FormRow label="İlk Taksit Tarihi" required>
          <DateInput value={form.firstInstallmentDate} onChange={(val) => setForm({ ...form, firstInstallmentDate: val })} />
        </FormRow>
        <FormRow label="Yıllık Faiz Oranı (%)" required>
          <input
            className="input"
            type="number"
            step="0.01"
            value={form.annualInterestRate}
            onChange={(e) => setForm({ ...form, annualInterestRate: Number(e.target.value) })}
          />
        </FormRow>
        <FormRow label="BSMV Oranı" required>
          <input
            className="input"
            type="number"
            step="0.01"
            value={form.bsmvRate}
            onChange={(e) => setForm({ ...form, bsmvRate: Number(e.target.value) })}
          />
        </FormRow>
        <label className="inline-flex items-center space-x-2 text-sm">
          <input type="checkbox" checked={form.isActive} onChange={(e) => setForm({ ...form, isActive: e.target.checked })} />
          <span>Aktif</span>
        </label>
        <div className="flex justify-end">
          <button className="btn-primary" onClick={save}>
            Kaydet
          </button>
        </div>
      </div>
    </div>
  );
}
