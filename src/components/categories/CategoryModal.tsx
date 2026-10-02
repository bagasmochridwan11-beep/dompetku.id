import React, { useState, useEffect } from 'react';
import { Category, TransactionType } from '../../types/finance';
import { IconPicker } from '../common/IconPicker';
import { ColorPicker } from '../common/ColorPicker';
import { X, AlertCircle } from 'lucide-react';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (cat: { nama: string; tipe: 'pemasukan' | 'pengeluaran'; ikon: string; warna: string }) => { success: boolean; error?: string; newId?: string };
  initialData?: Category | null;
  defaultType?: 'pemasukan' | 'pengeluaran';
}

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  onSave,
  initialData,
  defaultType = 'pengeluaran',
}) => {
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<'pemasukan' | 'pengeluaran'>(defaultType);
  const [ikon, setIkon] = useState('📁');
  const [warna, setWarna] = useState('#10b981');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setNama(initialData.nama);
      setTipe(initialData.tipe);
      setIkon(initialData.ikon);
      setWarna(initialData.warna);
    } else {
      setNama('');
      setTipe(defaultType);
      setIkon(defaultType === 'pengeluaran' ? '🍔' : '💼');
      setWarna(defaultType === 'pengeluaran' ? '#f97316' : '#10b981');
    }
    setError(null);
  }, [initialData, defaultType, isOpen]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setError('Nama kategori harus diisi.');
      return;
    }

    const res = onSave({
      nama: nama.trim(),
      tipe,
      ikon,
      warna,
    });

    if (!res.success) {
      setError(res.error || 'Gagal menyimpan kategori.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {initialData ? 'Ubah Kategori' : 'Tambah Kategori Baru'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 rounded-xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Tipe Kategori */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Jenis Kategori
            </label>
            <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl">
              <button
                type="button"
                onClick={() => {
                  setTipe('pengeluaran');
                  if (!initialData && ikon === '💼') setIkon('🍔');
                  if (!initialData && warna === '#10b981') setWarna('#f97316');
                }}
                disabled={!!initialData}
                className={`py-2 text-xs font-semibold rounded-lg transition min-h-[40px] ${
                  tipe === 'pengeluaran'
                    ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                } ${initialData ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                Pengeluaran
              </button>
              <button
                type="button"
                onClick={() => {
                  setTipe('pemasukan');
                  if (!initialData && ikon === '🍔') setIkon('💼');
                  if (!initialData && warna === '#f97316') setWarna('#10b981');
                }}
                disabled={!!initialData}
                className={`py-2 text-xs font-semibold rounded-lg transition min-h-[40px] ${
                  tipe === 'pemasukan'
                    ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                    : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                } ${initialData ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                Pemasukan
              </button>
            </div>
          </div>

          {/* Nama Kategori */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Kategori <span className="text-rose-500">*</span>
            </label>
            <input
              type="text"
              required
              autoFocus
              value={nama}
              onChange={(e) => {
                setNama(e.target.value);
                setError(null);
              }}
              placeholder="Contoh: Makanan, Transportasi, Gaji..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Ikon Picker */}
          <IconPicker value={ikon} onChange={setIkon} label="Ikon Kategori" />

          {/* Color Picker */}
          <ColorPicker value={warna} onChange={setWarna} label="Warna Kategori" />

          {/* Actions */}
          <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition min-h-[44px]"
            >
              Batal
            </button>
            <button
              type="submit"
              className="px-5 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition min-h-[44px] active:scale-95"
            >
              {initialData ? 'Simpan Perubahan' : 'Tambah Kategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
