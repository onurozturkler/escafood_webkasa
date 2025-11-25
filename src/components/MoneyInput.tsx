import { useEffect, useState } from 'react';
import { formatTlPlain, parseTl } from '../utils/money';

interface MoneyInputProps {
  value: number | null;
  onChange: (value: number | null) => void;
  placeholder?: string;
}

export default function MoneyInput({ value, onChange, placeholder }: MoneyInputProps) {
  const [displayValue, setDisplayValue] = useState('');

  useEffect(() => {
    if (value === null || Number.isNaN(value)) {
      setDisplayValue('');
    } else {
      setDisplayValue(formatTlPlain(value));
    }
  }, [value]);

  const handleChange = (val: string) => {
    setDisplayValue(val);
    if (!val.trim()) {
      onChange(null);
      return;
    }
    const parsed = parseTl(val);
    if (parsed === null) {
      onChange(null);
    } else {
      onChange(parsed);
    }
  };

  return (
    <input
      className="w-full rounded-lg border border-slate-300 px-3 py-2 focus:outline-none focus:ring-2 focus:ring-emerald-500"
      value={displayValue}
      onChange={(e) => handleChange(e.target.value)}
      placeholder={placeholder}
    />
  );
}
