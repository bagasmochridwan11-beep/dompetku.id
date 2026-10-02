import React from 'react';

const PRESET_COLORS = [
  '#10b981', // Emerald
  '#059669', // Dark Emerald
  '#f97316', // Orange
  '#3b82f6', // Blue
  '#6366f1', // Indigo
  '#8b5cf6', // Violet
  '#ec4899', // Pink
  '#ef4444', // Red
  '#eab308', // Amber
  '#14b8a6', // Teal
  '#0284c7', // Sky
  '#84cc16', // Lime
  '#64748b', // Slate
  '#78716c', // Stone
];

interface ColorPickerProps {
  value: string;
  onChange: (color: string) => void;
  label?: string;
  inheritedFromParent?: boolean;
}

export const ColorPicker: React.FC<ColorPickerProps> = ({
  value,
  onChange,
  label = 'Pilih Warna',
  inheritedFromParent,
}) => {
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <label className="block text-xs font-medium text-slate-600 dark:text-slate-400">
          {label}
        </label>
        {inheritedFromParent && (
          <span className="text-[11px] text-slate-400 italic">
            Default mewarisi induk
          </span>
        )}
      </div>

      <div className="flex flex-wrap gap-2 items-center">
        {PRESET_COLORS.map((c) => (
          <button
            key={c}
            type="button"
            onClick={() => onChange(c)}
            style={{ backgroundColor: c }}
            className={`w-7 h-7 rounded-full transition-transform flex items-center justify-center ${
              value?.toLowerCase() === c.toLowerCase()
                ? 'scale-110 ring-2 ring-offset-2 ring-slate-900 dark:ring-offset-slate-900'
                : 'hover:scale-105 opacity-90 hover:opacity-100'
            }`}
          >
            {value?.toLowerCase() === c.toLowerCase() && (
              <svg className="w-3.5 h-3.5 text-white drop-shadow-sm" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </button>
        ))}

        <div className="flex items-center gap-1.5 ml-1">
          <input
            type="color"
            value={value || '#10b981'}
            onChange={(e) => onChange(e.target.value)}
            className="w-7 h-7 rounded-full cursor-pointer border-0 p-0 bg-transparent overflow-hidden"
            title="Pilih warna kustom"
          />
          <span className="text-xs font-mono text-slate-500 uppercase">{value}</span>
        </div>
      </div>
    </div>
  );
};
