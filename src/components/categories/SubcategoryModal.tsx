import React, { useState, useEffect } from 'react';
import { Category, Subcategory } from '../../types/finance';
import { IconPicker } from '../common/IconPicker';
import { ColorPicker } from '../common/ColorPicker';
import { X, AlertCircle } from 'lucide-react';

interface SubcategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  defaultCategoryId?: string;
  initialData?: Subcategory | null;
  onSave: (sub: {
    kategoriId: string;
    nama: string;
    ikon: string;
    warna?: string;
  }) => { success: boolean; error?: string; newId?: string };
}

export const SubcategoryModal: React.FC<SubcategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  defaultCategoryId,
  initialData,
  onSave,
}) => {
  const [kategoriId, setKategoriId] = useState(defaultCategoryId || categories[0]?.id || '');
  const [nama, setNama] = useState('');
  const [ikon, setIkon] = useState('🏷️');
  const [warna, setWarna] = useState('');
  const [error, setError] = useState<string | null>(null);

  const selectedParentCategory = categories.find((c) => c.id === kategoriId);

  useEffect(() => {
    if (initialData) {
      setKategoriId(initialData.kategoriId);
      setNama(initialData.nama);
      setIkon(initialData.ikon);
      setWarna(initialData.warna);
    } else {
      const activeParentId = defaultCategoryId || categories[0]?.id || '';
      const parent = categories.find((c) => c.id === activeParentId);
      setKategoriId(activeParentId);
      setNama('');
      setIkon(parent ? parent.ikon : '🏷️');
      setWarna(parent ? parent.warna : '#10b981');
    }
    setError(null);
  }, [initialData, defaultCategoryId, categories, isOpen]);

  // When parent category changes in new mode, sync default color
  const handleCategoryChange = (newCatId: string) => {
    setKategoriId(newCatId);
    if (!initialData) {
      const parent = categories.find((c) => c.id === newCatId);
      if (parent) {
        setWarna(parent.warna);
      }
    }
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setError('Nama subkategori harus diisi.');
      return;
    }
    if (!kategoriId) {
      setError('Pilih kategori induk.');
      return;
    }

    const res = onSave({
      kategoriId,
      nama: nama.trim(),
      ikon,
      warna: warna || selectedParentCategory?.warna || '#10b981',
    });

    if (!res.success) {
      setError(res.error || 'Gagal menyimpan subkategori.');
    } else {
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {initialData ? 'Ubah Subkategori' : 'Tambah Subkategori Baru'}
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

          {/* Kategori Induk */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Kategori Induk <span className="text-rose-500">*</span>
            </label>
            <select
              value={kategoriId}
              onChange={(e) => handleCategoryChange(e.target.value)}
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
            >
              <optgroup label="Pengeluaran">
                {categories
                  .filter((c) => c.tipe === 'pengeluaran' && !c.diarsipkan)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ikon} {c.nama}
                    </option>
                  ))}
              </optgroup>
              <optgroup label="Pemasukan">
                {categories
                  .filter((c) => c.tipe === 'pemasukan' && !c.diarsipkan)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ikon} {c.nama}
                    </option>
                  ))}
              </optgroup>
            </select>
          </div>

          {/* Nama Subkategori */}
          <div>
            <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
              Nama Subkategori <span className="text-rose-500">*</span>
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
              placeholder="Contoh: Bensin, Pulsa, Nonton..."
              className="w-full text-sm px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
            />
          </div>

          {/* Ikon Picker */}
          <IconPicker value={ikon} onChange={setIkon} label="Ikon Subkategori" />

          {/* Color Picker */}
          <ColorPicker
            value={warna || selectedParentCategory?.warna || '#10b981'}
            onChange={setWarna}
            label="Warna Subkategori"
            inheritedFromParent={!initialData && warna === selectedParentCategory?.warna}
          />

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
              {initialData ? 'Simpan Perubahan' : 'Tambah Subkategori'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
