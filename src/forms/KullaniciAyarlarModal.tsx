import { useEffect, useState } from 'react';
import Modal from '../components/ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function KullaniciAyarlarModal({ isOpen, onClose }: Props) {
  const [email, setEmail] = useState('');
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setEmail('');
      setDirty(false);
    }
  }, [isOpen]);

  const handleClose = () => {
    if (dirty && !window.confirm('Kaydedilmemiş bilgiler var. Kapatmak istiyor musunuz?')) return;
    onClose();
  };

  const handleInvite = () => {
    setDirty(false);
    alert(`Kullanıcı daveti gönderildi: ${email}`);
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="Kullanıcı Ayarları"
      size="sm"
    >
      <div className="space-y-4">
        <div className="space-y-2">
          <label className="block text-sm font-medium text-slate-700">Kullanıcı E-posta</label>
          <input
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
            value={email}
            onChange={(e) => {
              setEmail(e.target.value);
              setDirty(true);
            }}
            placeholder="user@example.com"
          />
        </div>
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button
            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors w-full sm:w-auto"
            onClick={handleInvite}
          >
            Davet Gönder
          </button>
          <button
            className="px-4 py-2 bg-slate-200 rounded-lg hover:bg-slate-300 transition-colors w-full sm:w-auto"
            onClick={() => alert('Şifre sıfırlama linki gönderildi')}
          >
            Şifre Sıfırlama
          </button>
        </div>
      </div>
    </Modal>
  );
}
