import { useEffect, useState } from 'react';
import Modal from '../components/ui/Modal';

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

export default function EpostaLogsModal({ isOpen, onClose }: Props) {
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (isOpen) setDirty(false);
  }, [isOpen]);

  const handleClose = () => {
    if (dirty && !window.confirm('Kaydedilmemiş bilgiler var. Kapatmak istiyor musunuz?')) return;
    onClose();
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={handleClose}
      title="E-posta Logs"
      size="sm"
    >
      <div className="space-y-2 text-sm">
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <span className="font-medium">25.11.2025</span>
          <span className="text-slate-500">Ekstre Gönderimi</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <span className="font-medium">18.11.2025</span>
          <span className="text-slate-500">Tahsilat Hatırlatması</span>
        </div>
        <div className="flex justify-between items-center border-b border-slate-200 pb-2">
          <span className="font-medium">10.11.2025</span>
          <span className="text-slate-500">Kullanıcı Daveti</span>
        </div>
      </div>
    </Modal>
  );
}
