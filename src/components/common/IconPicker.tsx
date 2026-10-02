import React, { useState } from 'react';

const POPULAR_ICONS = [
  // Makanan & Minuman
  '🍔', '🍕', '🍜', '🍱', '🍳', '🍲', '☕', '🥤', '🥨', '🍰', '🍎', '🥩',
  // Transportasi
  '🚗', '🛵', '🚆', '✈️', '⛽', '🅿️', '🚲', '🚕', '🚌', '🚢',
  // Tagihan & Rumah
  '💡', '⚡', '💧', '📶', '📱', '🏠', '🛋️', '🧹', '🔧', '📦',
  // Belanja & Fashion
  '🛍️', '🛒', '👕', '👗', '👟', '💻', '⌚', '💄', '💍', '🎁',
  // Hiburan & Hobi
  '🎮', '🎬', '🍿', '🎧', '🏖️', '⚽', '🎨', '🎸', '🎟️', '📸',
  // Kesehatan & Edukasi
  '💊', '🩺', '🍊', '🏋️', '📚', '🎓', '✏️', '📝', '🧘', '🩹',
  // Finansial & Kerja
  '💼', '💵', '💰', '🪙', '📈', '💳', '🏦', '🏬', '⏰', '🎊', '⭐', '🔥'
];

interface IconPickerProps {
  value: string;
  onChange: (icon: string) => void;
  label?: string;
}

export const IconPicker: React.FC<IconPickerProps> = ({ value, onChange, label = 'Pilih Ikon' }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [customInput, setCustomInput] = useState('');

  const handleSelect = (icon: string) => {
    onChange(icon);
    setIsOpen(false);
  };

  const handleCustomApply = () => {
    if (customInput.trim()) {
      onChange(customInput.trim());
      setCustomInput('');
      setIsOpen(false);
    }
  };

  return (
    <div className="relative">
      {label && <label className="block text-xs font-medium text-slate-600 dark:text-slate-400 mb-1.5">{label}</label>}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2.5 px-3 py-2 border border-slate-200 dark:border-slate-700 rounded-xl bg-white dark:bg-slate-800 hover:border-slate-300 dark:hover:border-slate-600 transition min-h-[44px] text-left w-full"
      >
        <span className="text-2xl leading-none flex items-center justify-center w-8 h-8 rounded-lg bg-slate-100 dark:bg-slate-700">
          {value || '📁'}
        </span>
        <span className="text-sm font-medium text-slate-700 dark:text-slate-200">
          {value ? `Ikon: ${value}` : 'Klik untuk memilih'}
        </span>
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 p-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-2xl shadow-xl w-72 max-w-xs left-0">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100 dark:border-slate-700">
            <span className="text-xs font-semibold text-slate-700 dark:text-slate-200">Pilihan Ikon</span>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-xs text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 p-1"
            >
              ✕
            </button>
          </div>

          <div className="grid grid-cols-6 gap-1.5 max-h-48 overflow-y-auto p-1">
            {POPULAR_ICONS.map((icon) => (
              <button
                key={icon}
                type="button"
                onClick={() => handleSelect(icon)}
                className={`text-xl p-2 rounded-lg transition hover:scale-110 flex items-center justify-center ${
                  value === icon
                    ? 'bg-emerald-100 dark:bg-emerald-950/60 ring-2 ring-emerald-500'
                    : 'hover:bg-slate-100 dark:hover:bg-slate-700'
                }`}
              >
                {icon}
              </button>
            ))}
          </div>

          <div className="mt-3 pt-2 border-t border-slate-100 dark:border-slate-700 flex gap-2">
            <input
              type="text"
              placeholder="Emoji custom..."
              value={customInput}
              maxLength={4}
              onChange={(e) => setCustomInput(e.target.value)}
              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 text-slate-900 dark:text-slate-100"
            />
            <button
              type="button"
              onClick={handleCustomApply}
              disabled={!customInput.trim()}
              className="px-2.5 py-1.5 text-xs font-medium rounded-lg bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 disabled:opacity-50 whitespace-nowrap"
            >
              Pakai
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
