import React from 'react';
import { formatMonthName, shiftMonthString, getCurrentMonthString } from '../../utils/formatters';
import { ChevronLeft, ChevronRight, Calendar } from 'lucide-react';

interface MonthSelectorProps {
  currentMonth: string; // YYYY-MM
  onChange: (month: string) => void;
}

export const MonthSelector: React.FC<MonthSelectorProps> = ({ currentMonth, onChange }) => {
  const isCurrentActualMonth = currentMonth === getCurrentMonthString();

  return (
    <div className="flex items-center gap-1.5 bg-white dark:bg-slate-800/90 border border-slate-200 dark:border-slate-700/80 rounded-2xl p-1 shadow-xs">
      <button
        type="button"
        onClick={() => onChange(shiftMonthString(currentMonth, -1))}
        className="w-9 h-9 min-w-[36px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        title="Bulan sebelumnya"
      >
        <ChevronLeft className="w-4 h-4" />
      </button>

      <div className="relative flex items-center gap-1.5 px-2 py-1 cursor-pointer">
        <Calendar className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
        <span className="text-sm font-semibold text-slate-800 dark:text-slate-100 whitespace-nowrap">
          {formatMonthName(currentMonth)}
        </span>
        <input
          type="month"
          value={currentMonth}
          onChange={(e) => {
            if (e.target.value) onChange(e.target.value);
          }}
          className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
          title="Pilih Bulan"
        />
      </div>

      <button
        type="button"
        onClick={() => onChange(shiftMonthString(currentMonth, 1))}
        className="w-9 h-9 min-w-[36px] flex items-center justify-center rounded-xl text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-700 transition"
        title="Bulan berikutnya"
      >
        <ChevronRight className="w-4 h-4" />
      </button>

      {!isCurrentActualMonth && (
        <button
          type="button"
          onClick={() => onChange(getCurrentMonthString())}
          className="text-[11px] font-medium px-2 py-1 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-100 dark:hover:bg-emerald-900 transition"
          title="Kembali ke bulan ini"
        >
          Kini
        </button>
      )}
    </div>
  );
};
