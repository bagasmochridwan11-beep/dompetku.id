import React, { useState, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/finance';
import { CurrencyInput } from '../common/CurrencyInput';
import { CategoryModal } from '../categories/CategoryModal';
import { SubcategoryModal } from '../categories/SubcategoryModal';
import { getTodayDateString, formatCurrency } from '../../utils/formatters';
import { X, Plus, AlertCircle, ArrowRightLeft, Sparkles } from 'lucide-react';

interface TransactionFormModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialData?: Transaction | null;
  defaultType?: TransactionType;
}

export const TransactionFormModal: React.FC<TransactionFormModalProps> = ({
  isOpen,
  onClose,
  initialData,
  defaultType = 'pengeluaran',
}) => {
  const {
    categories,
    subcategories,
    wallets,
    quickTemplates,
    addTransaction,
    updateTransaction,
    addCategory,
    addSubcategory,
  } = useFinance();

  const [tipe, setTipe] = useState<TransactionType>(defaultType);
  const [nominal, setNominal] = useState<number>(0);
  const [tanggal, setTanggal] = useState<string>(getTodayDateString());
  const [kategoriId, setKategoriId] = useState<string>('');
  const [subkategoriId, setSubkategoriId] = useState<string>('');
  const [dompetId, setDompetId] = useState<string>('');
  const [tujuanDompetId, setTujuanDompetId] = useState<string>('');
  const [biayaAdmin, setBiayaAdmin] = useState<number>(0);
  const [catatan, setCatatan] = useState<string>('');
  const [error, setError] = useState<string | null>(null);

  // Sub-modal triggers for adding category or subcategory directly from this form
  const [isAddCatModalOpen, setIsAddCatModalOpen] = useState(false);
  const [isAddSubModalOpen, setIsAddSubModalOpen] = useState(false);

  const activeWallets = wallets.filter((w) => !w.diarsipkan);

  // Available categories for selected type
  const availableCategories = categories
    .filter((c) => (tipe === 'transfer' ? c.tipe === 'pengeluaran' : c.tipe === tipe) && !c.diarsipkan)
    .sort((a, b) => a.urutan - b.urutan);

  // Available subcategories for selected category
  const availableSubcategories = subcategories
    .filter((s) => s.kategoriId === kategoriId && !s.diarsipkan)
    .sort((a, b) => a.urutan - b.urutan);

  useEffect(() => {
    if (initialData) {
      setTipe(initialData.tipe);
      setNominal(initialData.nominal);
      setTanggal(initialData.tanggal);
      setKategoriId(initialData.kategoriId);
      setSubkategoriId(initialData.subkategoriId || '');
      setDompetId(initialData.dompetId || activeWallets[0]?.id || '');
      setTujuanDompetId(initialData.tujuanDompetId || activeWallets[1]?.id || '');
      setBiayaAdmin(initialData.biayaAdmin || 0);
      setCatatan(initialData.catatan || '');
    } else {
      setTipe(defaultType);
      setNominal(0);
      setTanggal(getTodayDateString());
      setCatatan('');
      setBiayaAdmin(0);
      setDompetId(activeWallets[0]?.id || '');
      setTujuanDompetId(activeWallets[1]?.id || '');

      const firstCat = categories.find((c) => c.tipe === (defaultType === 'transfer' ? 'pengeluaran' : defaultType) && !c.diarsipkan);
      setKategoriId(firstCat ? firstCat.id : '');
      setSubkategoriId('');
    }
    setError(null);
  }, [initialData, defaultType, isOpen, categories, wallets]);

  // When type changes, adjust category selection
  const handleTypeChange = (newType: TransactionType) => {
    setTipe(newType);
    if (newType === 'transfer') {
      const otherCat = categories.find((c) => c.id === 'cat-exp-other') || categories[0];
      setKategoriId(otherCat ? otherCat.id : '');
      setSubkategoriId('');
    } else {
      const firstCat = categories.find((c) => c.tipe === newType && !c.diarsipkan);
      setKategoriId(firstCat ? firstCat.id : '');
      setSubkategoriId('');
    }
  };

  const handleApplyTemplate = (tpl: typeof quickTemplates[0]) => {
    setTipe(tpl.tipe);
    setNominal(tpl.nominal);
    setKategoriId(tpl.kategoriId);
    setSubkategoriId(tpl.subkategoriId || '');
    if (tpl.dompetId) setDompetId(tpl.dompetId);
    setCatatan(tpl.catatan);
    setError(null);
  };

  const handleCategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      setIsAddCatModalOpen(true);
      return;
    }
    setKategoriId(val);
    setSubkategoriId('');
  };

  const handleSubcategoryChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const val = e.target.value;
    if (val === '__ADD_NEW__') {
      setIsAddSubModalOpen(true);
      return;
    }
    setSubkategoriId(val);
  };

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (nominal <= 0) {
      setError('Nominal harus lebih dari 0.');
      return;
    }
    if (tipe === 'transfer' && dompetId === tujuanDompetId) {
      setError('Dompet asal dan tujuan transfer tidak boleh sama.');
      return;
    }
    if (!kategoriId && tipe !== 'transfer') {
      setError('Pilih kategori transaksi.');
      return;
    }
    if (!tanggal) {
      setError('Pilih tanggal transaksi.');
      return;
    }

    if (initialData) {
      updateTransaction(initialData.id, {
        tipe,
        nominal,
        tanggal,
        kategoriId,
        subkategoriId: subkategoriId ? subkategoriId : null,
        dompetId: dompetId || undefined,
        tujuanDompetId: tipe === 'transfer' ? tujuanDompetId : undefined,
        biayaAdmin: tipe === 'transfer' ? biayaAdmin : undefined,
        catatan: catatan.trim(),
      });
    } else {
      addTransaction({
        tipe,
        nominal,
        tanggal,
        kategoriId,
        subkategoriId: subkategoriId ? subkategoriId : null,
        dompetId: dompetId || undefined,
        tujuanDompetId: tipe === 'transfer' ? tujuanDompetId : undefined,
        biayaAdmin: tipe === 'transfer' ? biayaAdmin : undefined,
        catatan: catatan.trim(),
      });
    }

    onClose();
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
        <div className="w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[92vh] overflow-y-auto space-y-4">
          {/* Header */}
          <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {initialData ? 'Ubah Transaksi' : 'Tambah Transaksi'}
            </h3>
            <button
              onClick={onClose}
              className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[40px] min-w-[40px] flex items-center justify-center cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Quick Templates Chip Bar */}
          {!initialData && quickTemplates.length > 0 && (
            <div className="space-y-1.5 pt-1">
              <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                <Sparkles className="w-3 h-3 text-emerald-500" />
                <span>Pilihan Kilat (1-Tap):</span>
              </span>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1.5 scrollbar-none">
                {quickTemplates.map((tpl) => (
                  <button
                    key={tpl.id}
                    type="button"
                    onClick={() => handleApplyTemplate(tpl)}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/80 hover:border-emerald-500 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:text-emerald-600 transition shrink-0 cursor-pointer min-h-[34px]"
                  >
                    <span>{tpl.ikon}</span>
                    <span>{tpl.nama}</span>
                    <span className="text-[10px] text-slate-400 font-mono">({formatCurrency(tpl.nominal)})</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {error && (
              <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-900">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{error}</span>
              </div>
            )}

            {/* Type Switcher: 3 tabs */}
            <div>
              <div className="grid grid-cols-3 gap-1.5 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => handleTypeChange('pengeluaran')}
                  className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer min-h-[38px] ${
                    tipe === 'pengeluaran'
                      ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Pengeluaran
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('pemasukan')}
                  className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer min-h-[38px] ${
                    tipe === 'pemasukan'
                      ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Pemasukan
                </button>
                <button
                  type="button"
                  onClick={() => handleTypeChange('transfer')}
                  className={`py-2 text-xs font-bold rounded-xl transition cursor-pointer min-h-[38px] ${
                    tipe === 'transfer'
                      ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  Transfer Dana
                </button>
              </div>
            </div>

            {/* Nominal */}
            <div>
              <CurrencyInput
                value={nominal}
                onChange={(val) => {
                  setNominal(val);
                  setError(null);
                }}
                label="Nominal Transaksi"
                required
                autoFocus={!initialData}
              />

              {/* Quick Add Chips */}
              <div className="flex items-center gap-1.5 mt-2 overflow-x-auto pb-1 scrollbar-none">
                {[10000, 20000, 50000, 100000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setNominal((prev) => prev + amt)}
                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-[11px] font-semibold text-slate-600 dark:text-slate-300 hover:border-emerald-500 hover:text-emerald-600 shrink-0 cursor-pointer min-h-[28px]"
                  >
                    +{formatCurrency(amt)}
                  </button>
                ))}
              </div>
            </div>

            {/* Wallet Selection */}
            {tipe === 'transfer' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 p-3.5 rounded-2xl bg-indigo-50/60 dark:bg-indigo-950/30 border border-indigo-200/60 dark:border-indigo-800/60">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Dari Dompet Sumber
                  </label>
                  <select
                    required
                    value={dompetId}
                    onChange={(e) => setDompetId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {activeWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama} ({formatCurrency(w.saldo)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1">
                    Ke Dompet Tujuan
                  </label>
                  <select
                    required
                    value={tujuanDompetId}
                    onChange={(e) => setTujuanDompetId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  >
                    {activeWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Biaya Admin Transfer (Opsional)
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={biayaAdmin || ''}
                    onChange={(e) => setBiayaAdmin(Number(e.target.value))}
                    className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>
            ) : (
              <div>
                <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                  Rekening / Dompet yang Digunakan
                </label>
                <select
                  value={dompetId}
                  onChange={(e) => setDompetId(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px]"
                >
                  {activeWallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.ikon} {w.nama} — Saldo: {formatCurrency(w.saldo)}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Tanggal */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Tanggal Transaksi <span className="text-rose-500">*</span>
              </label>
              <input
                type="date"
                required
                value={tanggal}
                onChange={(e) => setTanggal(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
              />
            </div>

            {/* Kategori Dropdown (Hidden or Optional for Transfer) */}
            {tipe !== 'transfer' && (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Kategori <span className="text-rose-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => setIsAddCatModalOpen(true)}
                      className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                    >
                      <Plus className="w-3 h-3" /> Baru
                    </button>
                  </div>
                  <select
                    required
                    value={kategoriId}
                    onChange={handleCategoryChange}
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px]"
                  >
                    <option value="" disabled>
                      Pilih Kategori
                    </option>
                    {availableCategories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.ikon} {c.nama}
                      </option>
                    ))}
                    <option value="__ADD_NEW__">+ Tambah Kategori Baru...</option>
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-medium text-slate-700 dark:text-slate-300">
                      Subkategori (Opsional)
                    </label>
                    {kategoriId && (
                      <button
                        type="button"
                        onClick={() => setIsAddSubModalOpen(true)}
                        className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-0.5"
                      >
                        <Plus className="w-3 h-3" /> Baru
                      </button>
                    )}
                  </div>
                  <select
                    value={subkategoriId}
                    onChange={handleSubcategoryChange}
                    disabled={!kategoriId || availableSubcategories.length === 0}
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50 min-h-[44px]"
                  >
                    <option value="">(Tanpa Subkategori)</option>
                    {availableSubcategories.map((s) => (
                      <option key={s.id} value={s.id}>
                        {s.ikon} {s.nama}
                      </option>
                    ))}
                    {kategoriId && <option value="__ADD_NEW__">+ Tambah Subkategori Baru...</option>}
                  </select>
                </div>
              </div>
            )}

            {/* Catatan */}
            <div>
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1.5">
                Catatan / Keterangan
              </label>
              <input
                type="text"
                placeholder="Misal: Makan siang ayam geprek, bensin, dll"
                value={catatan}
                onChange={(e) => setCatatan(e.target.value)}
                className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px]"
              />
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-slate-100 dark:border-slate-800">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2.5 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-2xl transition min-h-[42px] cursor-pointer"
              >
                Batal
              </button>
              <button
                type="submit"
                className={`px-6 py-2.5 text-xs font-bold text-white rounded-2xl shadow-md transition active:scale-95 min-h-[42px] cursor-pointer ${
                  tipe === 'pengeluaran'
                    ? 'bg-rose-600 hover:bg-rose-700 shadow-rose-600/20'
                    : tipe === 'pemasukan'
                    ? 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
                    : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                }`}
              >
                {initialData ? 'Simpan Perubahan' : 'Catat Transaksi'}
              </button>
            </div>
          </form>
        </div>
      </div>

      {/* Nested Category Modal */}
      <CategoryModal
        isOpen={isAddCatModalOpen}
        onClose={() => setIsAddCatModalOpen(false)}
        defaultType={tipe === 'transfer' ? 'pengeluaran' : (tipe as 'pemasukan' | 'pengeluaran')}
        onSave={(data) => {
          const res = addCategory(data);
          if (res.newId) setKategoriId(res.newId);
          return res;
        }}
      />

      {/* Nested Subcategory Modal */}
      {kategoriId && (
        <SubcategoryModal
          isOpen={isAddSubModalOpen}
          onClose={() => setIsAddSubModalOpen(false)}
          categories={categories}
          defaultCategoryId={kategoriId}
          onSave={(data) => {
            const res = addSubcategory(data);
            if (res.newId) setSubkategoriId(res.newId);
            return res;
          }}
        />
      )}
    </>
  );
};
