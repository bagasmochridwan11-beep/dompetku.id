import React from 'react';
import { formatNumberWithDots, parseNumberFromDots } from '../../utils/formatters';

interface CurrencyInputProps {
  value: number;
  onChange: (val: number) => void;
  label?: string;
  placeholder?: string;
  id?: string;
  required?: boolean;
  autoFocus?: boolean;
}

export const CurrencyInput: React.FC<CurrencyInputProps> = ({
  value,
  onChange,
  label = 'Nominal (Rp)',
  placeholder = '0',
  id,
  required,
  autoFocus,
}) => {
  const displayValue = value > 0 ? formatNumberWithDots(value) : '';

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const raw = e.target.value;
    const numeric = parseNumberFromDots(raw);
    onChange(numeric);
  };

  return (
    <div>
      {label && (
        <label htmlFor={id} className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
          {label} {required && <span className="text-rose-500">*</span>}
        </label>
      )}
      <div className="relative rounded-xl shadow-xs">
        <div className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3.5">
          <span className="text-slate-500 dark:text-slate-400 font-semibold text-sm">Rp</span>
        </div>
        <input
          type="text"
          inputMode="numeric"
          id={id}
          value={displayValue}
          onChange={handleChange}
          autoFocus={autoFocus}
          placeholder={placeholder}
          className="block w-full rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-11 pr-4 py-2.5 text-base font-semibold text-slate-900 dark:text-white tabular-nums tracking-wide focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px]"
        />
      </div>
    </div>
  );
};
