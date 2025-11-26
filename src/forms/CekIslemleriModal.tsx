import { useEffect, useMemo, useState } from 'react';
import FormRow from '../components/FormRow';
import DateInput from '../components/DateInput';
import MoneyInput from '../components/MoneyInput';
import SearchableSelect from '../components/SearchableSelect';
import { BankMaster } from '../models/bank';
import { Cheque, ChequeStatus } from '../models/cheque';
import { Customer } from '../models/customer';
import { DailyTransaction } from '../models/transaction';
import { Supplier } from '../models/supplier';
import { isoToDisplay, todayIso } from '../utils/date';
import { generateId } from '../utils/id';
import { formatTl } from '../utils/money';

export interface CekIslemPayload {
  updatedCheques: Cheque[];
  transaction?: DailyTransaction;
}

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSaved: (payload: CekIslemPayload) => void;
  cheques: Cheque[];
  customers: Customer[];
  suppliers: Supplier[];
  banks: BankMaster[];
  currentUserEmail: string;
  initialTab: 'GIRIS' | 'CIKIS' | 'YENI' | 'RAPOR';
}

type CikisReason =
  | 'TAHSIL_ELDEN'
  | 'TAHSIL_BANKADAN'
  | 'TEDARIKCI_VERILDI'
  | 'YAZILDI'
  | 'IADE'
  | 'DIGER';

type ReportSortKey = 'vadeTarihi' | 'tutar';

type QuickStatusFilter = ChequeStatus[];

const bankNameOptions = [
  'Akbank T.A.Ş.',
  'Burgan Bank A.Ş.',
  'DenizBank A.Ş.',
  'Fibabanka A.Ş.',
  'Garanti BBVA A.Ş.',
  'HSBC Bank A.Ş.',
  'ING Bank A.Ş.',
  'İstanbul Takas ve Saklama Bankası A.Ş.',
  'İller Bankası A.Ş.',
  'QNB Finansbank A.Ş.',
  'Şekerbank T.A.Ş.',
  'T.C. Ziraat Bankası A.Ş.',
  'TEB – Türk Ekonomi Bankası A.Ş.',
  'Türkiye Halk Bankası A.Ş.',
  'Türkiye İş Bankası A.Ş.',
  'Türkiye Kalkınma ve Yatırım Bankası A.Ş.',
  'Türkiye Sınai Kalkınma Bankası A.Ş. (TSKB)',
  'Türk Eximbank',
  'VakıfBank T.A.O.',
  'Yapı ve Kredi Bankası A.Ş.',
  'Diğer Banka',
];

const reasonLabels: Record<CikisReason, string> = {
  TAHSIL_ELDEN: 'Tahsil elden',
  TAHSIL_BANKADAN: 'Tahsil bankadan',
  TEDARIKCI_VERILDI: 'Tedarikçiye verildi',
  YAZILDI: 'Yazıldı',
  IADE: 'İade (İptal)',
  DIGER: 'Diğer',
};

export default function CekIslemleriModal({
  isOpen,
  onClose,
  onSaved,
  cheques,
  customers,
  suppliers,
  banks,
  currentUserEmail,
  initialTab,
}: Props) {
  const [activeTab, setActiveTab] = useState<Props['initialTab']>(initialTab);
  const [dirty, setDirty] = useState(false);

  const [girisCustomerId, setGirisCustomerId] = useState('');
  const [girisDuzenleyen, setGirisDuzenleyen] = useState('Esca Food AŞ');
  const [girisLehtar, setGirisLehtar] = useState('');
  const [girisBankaAdi, setGirisBankaAdi] = useState('');
  const [girisCekNo, setGirisCekNo] = useState('');
  const [girisTutar, setGirisTutar] = useState<number | null>(null);
  const [girisVadeTarihi, setGirisVadeTarihi] = useState(todayIso());
  const [girisAciklama, setGirisAciklama] = useState('');

  const [cikisIslemTarihi, setCikisIslemTarihi] = useState(todayIso());
  const [cikisFilterCustomerId, setCikisFilterCustomerId] = useState('');
  const [cikisFilterBanka, setCikisFilterBanka] = useState('');
  const [cikisFilterStart, setCikisFilterStart] = useState('');
  const [cikisFilterEnd, setCikisFilterEnd] = useState('');
  const [cikisSelectedChequeId, setCikisSelectedChequeId] = useState('');
  const [cikisReason, setCikisReason] = useState<CikisReason>('TAHSIL_ELDEN');
  const [cikisTahsilBankasi, setCikisTahsilBankasi] = useState('');
  const [cikisSupplierId, setCikisSupplierId] = useState('');
  const [cikisAciklama, setCikisAciklama] = useState('');

  const [yeniSupplierId, setYeniSupplierId] = useState('');
  const [yeniBankId, setYeniBankId] = useState('');
  const [yeniDuzenleyen, setYeniDuzenleyen] = useState('Esca Food AŞ');
  const [yeniLehtar, setYeniLehtar] = useState('');
  const [yeniCekNo, setYeniCekNo] = useState('');
  const [yeniTutar, setYeniTutar] = useState<number | null>(null);
  const [yeniVadeTarihi, setYeniVadeTarihi] = useState(todayIso());
  const [yeniAciklama, setYeniAciklama] = useState('');

  const [reportStart, setReportStart] = useState('');
  const [reportEnd, setReportEnd] = useState('');
  const [reportStatuses, setReportStatuses] = useState<QuickStatusFilter>([
    'KASADA',
    'BANKADA_TAHSILDE',
    'ODEMEDE',
    'TAHSIL_OLDU',
    'ODEME_YAPILDI',
    'KARSILIKSIZ',
    'IPTAL',
    'CIKMIS',
  ]);
  const [reportMusteriId, setReportMusteriId] = useState('');
  const [reportTedarikciId, setReportTedarikciId] = useState('');
  const [reportSortKey, setReportSortKey] = useState<ReportSortKey>('vadeTarihi');
  const [reportSortDir, setReportSortDir] = useState<'asc' | 'desc'>('asc');

  useEffect(() => {
    if (isOpen) {
      setActiveTab(initialTab);
      setDirty(false);
      setGirisCustomerId('');
      setGirisDuzenleyen('Esca Food AŞ');
      setGirisLehtar('');
      setGirisBankaAdi('');
      setGirisCekNo('');
      setGirisTutar(null);
      setGirisVadeTarihi(todayIso());
      setGirisAciklama('');

      setCikisIslemTarihi(todayIso());
      setCikisFilterCustomerId('');
      setCikisFilterBanka('');
      setCikisFilterStart('');
      setCikisFilterEnd('');
      setCikisSelectedChequeId('');
      setCikisReason('TAHSIL_ELDEN');
      setCikisTahsilBankasi('');
      setCikisSupplierId('');
      setCikisAciklama('');

      setYeniSupplierId('');
      setYeniBankId('');
      setYeniDuzenleyen('Esca Food AŞ');
      setYeniLehtar('');
      setYeniCekNo('');
      setYeniTutar(null);
      setYeniVadeTarihi(todayIso());
      setYeniAciklama('');
    }
  }, [isOpen, initialTab]);

  useEffect(() => {
    if (girisCustomerId) {
      const found = customers.find((c) => c.id === girisCustomerId);
      if (found) setGirisLehtar(found.ad);
    }
  }, [girisCustomerId, customers]);

  useEffect(() => {
    if (yeniSupplierId) {
      const found = suppliers.find((s) => s.id === yeniSupplierId);
      if (found) setYeniLehtar(found.ad);
    }
  }, [yeniSupplierId, suppliers]);

  const handleClose = () => {
    if (dirty && !window.confirm('Kaydedilmemiş bilgiler var. Kapatmak istiyor musunuz?')) return;
    onClose();
  };

  const customerOptions = customers.map((c) => ({ id: c.id, label: `${c.kod} - ${c.ad}` }));
  const supplierOptions = suppliers.map((s) => ({ id: s.id, label: `${s.kod} - ${s.ad}` }));

  const filteredCikisCheques = useMemo(() => {
    return cheques
      .filter((c) => c.status === 'KASADA' && c.kasaMi)
      .filter((c) => (cikisFilterCustomerId ? c.musteriId === cikisFilterCustomerId : true))
      .filter((c) => (cikisFilterBanka ? c.bankaAdi === cikisFilterBanka : true))
      .filter((c) => (cikisFilterStart ? c.vadeTarihi >= cikisFilterStart : true))
      .filter((c) => (cikisFilterEnd ? c.vadeTarihi <= cikisFilterEnd : true));
  }, [cheques, cikisFilterBanka, cikisFilterCustomerId, cikisFilterEnd, cikisFilterStart]);

  const reportRows = useMemo(() => {
    const base = cheques
      .filter((c) => (reportStart ? c.vadeTarihi >= reportStart : true))
      .filter((c) => (reportEnd ? c.vadeTarihi <= reportEnd : true))
      .filter((c) => reportStatuses.includes(c.status))
      .filter((c) => (reportMusteriId ? c.musteriId === reportMusteriId : true))
      .filter((c) => (reportTedarikciId ? c.tedarikciId === reportTedarikciId : true));

    const sorted = [...base].sort((a, b) => {
      const dir = reportSortDir === 'asc' ? 1 : -1;
      if (reportSortKey === 'vadeTarihi') {
        return a.vadeTarihi.localeCompare(b.vadeTarihi) * dir;
      }
      return (a.tutar - b.tutar) * dir;
    });
    return sorted;
  }, [
    cheques,
    reportEnd,
    reportMusteriId,
    reportSortDir,
    reportSortKey,
    reportStart,
    reportStatuses,
    reportTedarikciId,
  ]);

  const statusLabel = (status: ChequeStatus) => {
    switch (status) {
      case 'KASADA':
        return 'KASADA';
      case 'BANKADA_TAHSILDE':
        return 'BANKADA (TAHSİLDE)';
      case 'ODEMEDE':
        return 'ÖDEMEDE';
      case 'TAHSIL_OLDU':
        return 'TAHSİL OLDU';
      case 'ODEME_YAPILDI':
        return 'ÖDEME YAPILDI';
      case 'KARSILIKSIZ':
        return 'KARŞILIKSIZ';
      case 'IPTAL':
        return 'İPTAL';
      case 'CIKMIS':
      default:
        return 'ÇIKMIŞ';
    }
  };

  const getKonum = (c: Cheque) => {
    if (c.kasaMi) return 'Kasada';
    if (c.status === 'BANKADA_TAHSILDE') return 'Bankada';
    return 'Dolaşımda';
  };

  const handleSaveGiris = () => {
    if (!girisCustomerId || !girisCekNo || !girisBankaAdi || !girisTutar || girisTutar <= 0 || !girisVadeTarihi) return;
    const newCheque: Cheque = {
      id: generateId(),
      cekNo: girisCekNo,
      bankaAdi: girisBankaAdi,
      tutar: girisTutar,
      vadeTarihi: girisVadeTarihi,
      duzenleyen: girisDuzenleyen,
      lehtar: girisLehtar || girisDuzenleyen,
      musteriId: girisCustomerId,
      status: 'KASADA',
      kasaMi: true,
      aciklama: girisAciklama || undefined,
    };
    onSaved({ updatedCheques: [...cheques, newCheque] });
  };

  const handleSaveCikis = () => {
    const selectedCheque = cheques.find((c) => c.id === cikisSelectedChequeId && c.status === 'KASADA' && c.kasaMi);
    if (!selectedCheque) return;
    if (cikisReason === 'TAHSIL_BANKADAN' && !cikisTahsilBankasi) return;
    if (cikisReason === 'TEDARIKCI_VERILDI' && !cikisSupplierId) return;

    let newStatus: ChequeStatus = 'CIKMIS';
    switch (cikisReason) {
      case 'TAHSIL_ELDEN':
        newStatus = 'TAHSIL_OLDU';
        break;
      case 'TAHSIL_BANKADAN':
        newStatus = 'BANKADA_TAHSILDE';
        break;
      case 'TEDARIKCI_VERILDI':
      case 'YAZILDI':
        newStatus = 'ODEMEDE';
        break;
      case 'IADE':
        newStatus = 'IPTAL';
        break;
      case 'DIGER':
      default:
        newStatus = 'CIKMIS';
        break;
    }

    const updatedCheques = cheques.map((c) => {
      if (c.id !== selectedCheque.id) return c;
      return {
        ...c,
        status: newStatus,
        kasaMi: false,
        tedarikciId: cikisReason === 'TEDARIKCI_VERILDI' ? cikisSupplierId || c.tedarikciId : c.tedarikciId,
        bankaAdi: cikisReason === 'TAHSIL_BANKADAN' ? cikisTahsilBankasi || c.bankaAdi : c.bankaAdi,
        aciklama: cikisAciklama || c.aciklama,
      };
    });

    let counterparty = 'Diğer';
    if (cikisReason === 'TAHSIL_ELDEN') counterparty = 'Tahsil Elden';
    if (cikisReason === 'TAHSIL_BANKADAN') counterparty = cikisTahsilBankasi || 'Banka';
    if (cikisReason === 'TEDARIKCI_VERILDI') {
      const sup = suppliers.find((s) => s.id === cikisSupplierId);
      counterparty = sup ? `${sup.kod} - ${sup.ad}` : 'Tedarikçi';
    }
    if (cikisReason === 'IADE') counterparty = 'İade';

    const nowIso = new Date().toISOString();
    const tx: DailyTransaction = {
      id: generateId(),
      isoDate: cikisIslemTarihi,
      displayDate: isoToDisplay(cikisIslemTarihi),
      documentNo: `CEK-${selectedCheque.cekNo}`,
      type: 'Kasadan Çek Çıkışı',
      source: reasonLabels[cikisReason],
      counterparty,
      description: `Çek No: ${selectedCheque.cekNo} – ${cikisAciklama || ''}`.trim(),
      incoming: 0,
      outgoing: 0,
      balanceAfter: 0,
      createdAtIso: nowIso,
      createdBy: currentUserEmail,
    };

    onSaved({ updatedCheques, transaction: tx });
  };

  const handleSaveYeni = () => {
    const bank = banks.find((b) => b.id === yeniBankId && b.cekKarnesiVarMi);
    const supplier = suppliers.find((s) => s.id === yeniSupplierId);
    if (!bank || !supplier || !yeniCekNo || !yeniTutar || yeniTutar <= 0 || !yeniVadeTarihi) return;
    const newCheque: Cheque = {
      id: generateId(),
      cekNo: yeniCekNo,
      bankaId: bank.id,
      bankaAdi: bank.bankaAdi || bank.hesapAdi,
      tutar: yeniTutar,
      vadeTarihi: yeniVadeTarihi,
      duzenleyen: yeniDuzenleyen,
      lehtar: yeniLehtar || supplier.ad,
      tedarikciId: supplier.id,
      status: 'ODEMEDE',
      kasaMi: false,
      aciklama: yeniAciklama || undefined,
    };
    onSaved({ updatedCheques: [...cheques, newCheque] });
  };

  if (!isOpen) return null;

  return (
    <div className="modal-backdrop">
      <div className="modal max-w-5xl">
        <div className="flex items-center justify-between mb-4">
          <div className="text-lg font-semibold">Çek İşlemleri</div>
          <button onClick={handleClose}>✕</button>
        </div>

        <div className="flex space-x-2 mb-4 text-sm">
          {[
            { key: 'GIRIS', label: 'Kasaya Çek Girişi' },
            { key: 'CIKIS', label: 'Kasadan Çek Çıkışı' },
            { key: 'YENI', label: 'Yeni Düzenlenen Çek' },
            { key: 'RAPOR', label: 'Tüm Çekler Raporu' },
          ].map((tab) => (
            <button
              key={tab.key}
              className={`px-3 py-2 rounded ${activeTab === tab.key ? 'bg-orange-600 text-white' : 'bg-slate-200'}`}
              onClick={() => setActiveTab(tab.key as Props['initialTab'])}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {activeTab === 'GIRIS' && (
          <div className="space-y-4">
            <FormRow label="Müşteri" required>
              <SearchableSelect
                valueId={girisCustomerId || null}
                onChange={(id) => {
                  setGirisCustomerId(id || '');
                  setDirty(true);
                }}
                options={customerOptions}
                placeholder="Müşteri seçin"
              />
            </FormRow>
            <FormRow label="Düzenleyen" required>
              <input
                className="form-input"
                value={girisDuzenleyen}
                onChange={(e) => {
                  setGirisDuzenleyen(e.target.value);
                  setDirty(true);
                }}
              />
            </FormRow>
            <FormRow label="Lehtar" required>
              <input
                className="form-input"
                value={girisLehtar}
                onChange={(e) => {
                  setGirisLehtar(e.target.value);
                  setDirty(true);
                }}
              />
            </FormRow>
            <FormRow label="Banka" required>
              <select
                className="form-input"
                value={girisBankaAdi}
                onChange={(e) => {
                  setGirisBankaAdi(e.target.value);
                  setDirty(true);
                }}
              >
                <option value="">Seçiniz</option>
                {bankNameOptions.map((name) => (
                  <option key={name} value={name}>
                    {name}
                  </option>
                ))}
              </select>
            </FormRow>
            <FormRow label="Çek No" required>
              <input
                className="form-input"
                value={girisCekNo}
                onChange={(e) => {
                  setGirisCekNo(e.target.value);
                  setDirty(true);
                }}
              />
            </FormRow>
            <FormRow label="Tutar" required>
              <MoneyInput
                className="form-input"
                value={girisTutar}
                onChange={(v) => {
                  setGirisTutar(v);
                  setDirty(true);
                }}
              />
            </FormRow>
            <FormRow label="Vade Tarihi" required>
              <DateInput
                value={girisVadeTarihi}
                onChange={(v) => {
                  setGirisVadeTarihi(v);
                  setDirty(true);
                }}
              />
            </FormRow>
            <FormRow label="Açıklama">
              <input
                className="form-input"
                value={girisAciklama}
                onChange={(e) => {
                  setGirisAciklama(e.target.value);
                  setDirty(true);
                }}
              />
            </FormRow>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 bg-slate-200 rounded-lg" onClick={handleClose}>
                İptal
              </button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg" onClick={handleSaveGiris}>
                Kaydet
              </button>
            </div>
          </div>
        )}

        {activeTab === 'CIKIS' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormRow label="İşlem Tarihi" required>
                <DateInput
                  value={cikisIslemTarihi}
                  onChange={(v) => {
                    setCikisIslemTarihi(v);
                    setDirty(true);
                  }}
                />
              </FormRow>
              <FormRow label="Müşteri Filtresi">
                <SearchableSelect
                  valueId={cikisFilterCustomerId || null}
                  onChange={(id) => setCikisFilterCustomerId(id || '')}
                  options={customerOptions}
                  placeholder="Müşteri"
                />
              </FormRow>
              <FormRow label="Banka Filtresi">
                <select
                  className="form-input"
                  value={cikisFilterBanka}
                  onChange={(e) => setCikisFilterBanka(e.target.value)}
                >
                  <option value="">Tümü</option>
                  {bankNameOptions.map((b) => (
                    <option key={b} value={b}>
                      {b}
                    </option>
                  ))}
                </select>
              </FormRow>
              <FormRow label="Vade Başlangıç">
                <DateInput value={cikisFilterStart} onChange={(v) => setCikisFilterStart(v)} />
              </FormRow>
              <FormRow label="Vade Bitiş">
                <DateInput value={cikisFilterEnd} onChange={(v) => setCikisFilterEnd(v)} />
              </FormRow>
            </div>
            <div className="max-h-56 overflow-auto border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th className="py-2 px-2 text-left">Seç</th>
                    <th className="py-2 px-2 text-left">Çek No</th>
                    <th className="py-2 px-2 text-left">Müşteri/Lehtar</th>
                    <th className="py-2 px-2 text-left">Banka</th>
                    <th className="py-2 px-2 text-left">Vade</th>
                    <th className="py-2 px-2 text-left">Tutar</th>
                    <th className="py-2 px-2 text-left">Durum</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredCikisCheques.length === 0 && (
                    <tr>
                      <td colSpan={7} className="py-3 text-center text-slate-500">
                        Uygun çek bulunamadı.
                      </td>
                    </tr>
                  )}
                  {filteredCikisCheques.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="py-2 px-2">
                        <input
                          type="radio"
                          checked={cikisSelectedChequeId === c.id}
                          onChange={() => setCikisSelectedChequeId(c.id)}
                        />
                      </td>
                      <td className="py-2 px-2">{c.cekNo}</td>
                      <td className="py-2 px-2">{c.lehtar}</td>
                      <td className="py-2 px-2">{c.bankaAdi || '-'}</td>
                      <td className="py-2 px-2">{isoToDisplay(c.vadeTarihi)}</td>
                      <td className="py-2 px-2">{formatTl(c.tutar)}</td>
                      <td className="py-2 px-2">{statusLabel(c.status)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <FormRow label="Çıkış Nedeni" required>
                <select
                  className="form-input"
                  value={cikisReason}
                  onChange={(e) => {
                    setCikisReason(e.target.value as CikisReason);
                    setDirty(true);
                  }}
                >
                  {Object.entries(reasonLabels).map(([val, label]) => (
                    <option key={val} value={val}>
                      {label}
                    </option>
                  ))}
                </select>
              </FormRow>
              {cikisReason === 'TAHSIL_BANKADAN' && (
                <FormRow label="Tahsil Bankası" required>
                  <select
                    className="form-input"
                    value={cikisTahsilBankasi}
                    onChange={(e) => {
                      setCikisTahsilBankasi(e.target.value);
                      setDirty(true);
                    }}
                  >
                    <option value="">Seçiniz</option>
                    {bankNameOptions.map((b) => (
                      <option key={b} value={b}>
                        {b}
                      </option>
                    ))}
                  </select>
                </FormRow>
              )}
              {cikisReason === 'TEDARIKCI_VERILDI' && (
                <FormRow label="Tedarikçi" required>
                  <SearchableSelect
                    valueId={cikisSupplierId || null}
                    onChange={(id) => {
                      setCikisSupplierId(id || '');
                      setDirty(true);
                    }}
                    options={supplierOptions}
                    placeholder="Tedarikçi"
                  />
                </FormRow>
              )}
              <FormRow label="Açıklama">
                <input
                  className="form-input"
                  value={cikisAciklama}
                  onChange={(e) => {
                    setCikisAciklama(e.target.value);
                    setDirty(true);
                  }}
                />
              </FormRow>
            </div>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 bg-slate-200 rounded-lg" onClick={handleClose}>
                İptal
              </button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg" onClick={handleSaveCikis}>
                Kaydet
              </button>
            </div>
          </div>
        )}

        {activeTab === 'YENI' && (
          <div className="space-y-4">
            <FormRow label="Düzenleyen" required>
              <input
                className="form-input"
                value={yeniDuzenleyen}
                onChange={(e) => {
                  setYeniDuzenleyen(e.target.value);
                  setDirty(true);
                }}
              />
            </FormRow>
            <FormRow label="Lehtar (Tedarikçi)" required>
              <SearchableSelect
                valueId={yeniSupplierId || null}
                onChange={(id) => {
                  setYeniSupplierId(id || '');
                  setDirty(true);
                }}
                options={supplierOptions}
                placeholder="Tedarikçi seçin"
              />
            </FormRow>
            <FormRow label="Lehtar Adı" required>
              <input
                className="form-input"
                value={yeniLehtar}
                onChange={(e) => {
                  setYeniLehtar(e.target.value);
                  setDirty(true);
                }}
              />
            </FormRow>
            <FormRow label="Banka" required>
              <select
                className="form-input"
                value={yeniBankId}
                onChange={(e) => {
                  setYeniBankId(e.target.value);
                  setDirty(true);
                }}
              >
                <option value="">Seçiniz</option>
                {banks
                  .filter((b) => b.cekKarnesiVarMi)
                  .map((b) => (
                    <option key={b.id} value={b.id}>
                      {b.hesapAdi}
                    </option>
                  ))}
              </select>
            </FormRow>
            <FormRow label="Çek No" required>
              <input
                className="form-input"
                value={yeniCekNo}
                onChange={(e) => {
                  setYeniCekNo(e.target.value);
                  setDirty(true);
                }}
              />
            </FormRow>
            <FormRow label="Tutar" required>
              <MoneyInput
                className="form-input"
                value={yeniTutar}
                onChange={(v) => {
                  setYeniTutar(v);
                  setDirty(true);
                }}
              />
            </FormRow>
            <FormRow label="Vade Tarihi" required>
              <DateInput
                value={yeniVadeTarihi}
                onChange={(v) => {
                  setYeniVadeTarihi(v);
                  setDirty(true);
                }}
              />
            </FormRow>
            <FormRow label="Açıklama">
              <input
                className="form-input"
                value={yeniAciklama}
                onChange={(e) => {
                  setYeniAciklama(e.target.value);
                  setDirty(true);
                }}
              />
            </FormRow>
            <div className="flex justify-end space-x-3">
              <button className="px-4 py-2 bg-slate-200 rounded-lg" onClick={handleClose}>
                İptal
              </button>
              <button className="px-4 py-2 bg-orange-600 text-white rounded-lg" onClick={handleSaveYeni}>
                Kaydet
              </button>
            </div>
          </div>
        )}

        {activeTab === 'RAPOR' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <FormRow label="Vade Başlangıç">
                <DateInput value={reportStart} onChange={(v) => setReportStart(v)} />
              </FormRow>
              <FormRow label="Vade Bitiş">
                <DateInput value={reportEnd} onChange={(v) => setReportEnd(v)} />
              </FormRow>
              <FormRow label="Müşteri">
                <SearchableSelect
                  valueId={reportMusteriId || null}
                  onChange={(id) => setReportMusteriId(id || '')}
                  options={customerOptions}
                  placeholder="Müşteri"
                />
              </FormRow>
              <FormRow label="Tedarikçi">
                <SearchableSelect
                  valueId={reportTedarikciId || null}
                  onChange={(id) => setReportTedarikciId(id || '')}
                  options={supplierOptions}
                  placeholder="Tedarikçi"
                />
              </FormRow>
              <FormRow label="Durumlar">
                <div className="flex flex-wrap gap-2">
                  {(
                    [
                      'KASADA',
                      'BANKADA_TAHSILDE',
                      'ODEMEDE',
                      'TAHSIL_OLDU',
                      'ODEME_YAPILDI',
                      'KARSILIKSIZ',
                      'IPTAL',
                      'CIKMIS',
                    ] as ChequeStatus[]
                  ).map((st) => (
                    <label key={st} className="flex items-center space-x-1 text-xs">
                      <input
                        type="checkbox"
                        checked={reportStatuses.includes(st)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setReportStatuses((prev) => [...prev, st]);
                          } else {
                            setReportStatuses((prev) => prev.filter((s) => s !== st));
                          }
                        }}
                      />
                      <span>{statusLabel(st)}</span>
                    </label>
                  ))}
                </div>
              </FormRow>
            </div>
            <div className="overflow-auto max-h-96 border rounded-lg">
              <table className="w-full text-sm">
                <thead className="bg-slate-50 sticky top-0">
                  <tr>
                    <th
                      className="py-2 px-2 text-left cursor-pointer"
                      onClick={() => {
                        if (reportSortKey === 'vadeTarihi') {
                          setReportSortDir(reportSortDir === 'asc' ? 'desc' : 'asc');
                        } else {
                          setReportSortKey('vadeTarihi');
                          setReportSortDir('asc');
                        }
                      }}
                    >
                      Vade Tarihi
                    </th>
                    <th className="py-2 px-2 text-left">Çek No</th>
                    <th className="py-2 px-2 text-left">Banka</th>
                    <th className="py-2 px-2 text-left">Düzenleyen</th>
                    <th className="py-2 px-2 text-left">Lehtar</th>
                    <th
                      className="py-2 px-2 text-left cursor-pointer"
                      onClick={() => {
                        if (reportSortKey === 'tutar') {
                          setReportSortDir(reportSortDir === 'asc' ? 'desc' : 'asc');
                        } else {
                          setReportSortKey('tutar');
                          setReportSortDir('asc');
                        }
                      }}
                    >
                      Tutar
                    </th>
                    <th className="py-2 px-2 text-left">Durum</th>
                    <th className="py-2 px-2 text-left">Konum</th>
                  </tr>
                </thead>
                <tbody>
                  {reportRows.length === 0 && (
                    <tr>
                      <td colSpan={8} className="py-3 text-center text-slate-500">
                        Kayıt bulunamadı.
                      </td>
                    </tr>
                  )}
                  {reportRows.map((c) => (
                    <tr key={c.id} className="border-t">
                      <td className="py-2 px-2">{isoToDisplay(c.vadeTarihi)}</td>
                      <td className="py-2 px-2">{c.cekNo}</td>
                      <td className="py-2 px-2">{c.bankaAdi || '-'}</td>
                      <td className="py-2 px-2">{c.duzenleyen}</td>
                      <td className="py-2 px-2">{c.lehtar}</td>
                      <td className="py-2 px-2">{formatTl(c.tutar)}</td>
                      <td className="py-2 px-2">{statusLabel(c.status)}</td>
                      <td className="py-2 px-2">{getKonum(c)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
