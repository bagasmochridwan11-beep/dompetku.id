import React, { useState } from 'react';
import { Plus, Bot, Camera, Edit3, X, Sparkles } from 'lucide-react';

interface FloatingActionButtonProps {
  onManualAdd: () => void;
  onChatAdd: () => void;
  onReceiptAdd: () => void;
}

export const FloatingActionButton: React.FC<FloatingActionButtonProps> = ({
  onManualAdd,
  onChatAdd,
  onReceiptAdd,
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="md:hidden fixed bottom-20 right-4 z-40 flex flex-col items-end">
      {/* Backdrop overlay when open */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 z-30 bg-black/40 backdrop-blur-2xs animate-in fade-in duration-100"
        />
      )}

      {/* Speed Dial Action Items */}
      {isOpen && (
        <div className="relative z-40 flex flex-col items-end gap-2.5 mb-3 animate-in slide-in-from-bottom-5 duration-150">
          {/* Scan Nota */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onReceiptAdd();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold active:scale-95 transition"
          >
            <span>Scan Nota / Struk</span>
            <div className="w-9 h-9 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-sm">
              <Camera className="w-4 h-4" />
            </div>
          </button>

          {/* Catat via Chat AI */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onChatAdd();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold active:scale-95 transition"
          >
            <span className="flex items-center gap-1">
              Catat via Chat AI <Sparkles className="w-3 h-3 text-amber-500" />
            </span>
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-emerald-600 to-teal-500 text-white flex items-center justify-center shadow-sm">
              <Bot className="w-4 h-4" />
            </div>
          </button>

          {/* Input Manual */}
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onManualAdd();
            }}
            className="flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-white dark:bg-slate-900 shadow-xl border border-slate-200 dark:border-slate-800 text-slate-800 dark:text-slate-100 text-xs font-bold active:scale-95 transition"
          >
            <span>Input Manual</span>
            <div className="w-9 h-9 rounded-xl bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 flex items-center justify-center shadow-sm">
              <Edit3 className="w-4 h-4" />
            </div>
          </button>
        </div>
      )}

      {/* Main Trigger Button */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className={`relative z-40 w-14 h-14 rounded-full text-white shadow-xl flex items-center justify-center transition-all active:scale-90 min-h-[48px] min-w-[48px] ${
          isOpen
            ? 'bg-slate-800 rotate-45 shadow-slate-900/40'
            : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/30'
        }`}
        title="Pilihan Tambah Transaksi"
        aria-label="Pilihan Tambah Transaksi"
      >
        <Plus className="w-7 h-7 stroke-[2.5]" />
      </button>
    </div>
  );
};
