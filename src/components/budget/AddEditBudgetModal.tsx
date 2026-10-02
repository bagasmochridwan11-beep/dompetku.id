import React, { useState, useEffect, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { CurrencyInput } from '../common/CurrencyInput';
import { formatRupiah, formatMonthName } from '../../utils/formatters';
import {
  X,
  Target,
  Trash2,
  AlertTriangle,
  Sparkles,
  PieChart,
  Percent,
  TrendingDown,
  Info,
  Check,
} from 'lucide-react';
import { Category, Subcategory } from '../../types/finance';

interface AddEditBudgetModalProps {
  isOpen: boolean;
  onClose: () => void;
  // If provided, we are editing this specific budget target
  initialTarget?: {
    kategoriId: string;
    subkategoriId?: string | null;
    nominal: number;
    persentase?: number | null;
    nama?: string;
  } | null;
  activeMonth: string;
  onDeleteRequest?: (kategoriId: string, subkategoriId: string | null, nama: string, nominal: number) => void;
}

export const AddEditBudgetModal: React.FC<AddEditBudgetModalProps> = ({
  isOpen,
  onClose,
  initialTarget,
  activeMonth,
  onDeleteRequest,
}) => {
  const {
    categories,
    subcategories,
    transactions,
    budgets,
    setBudget,
  } = useFinance();

  const isEditing = !!initialTarget;

  // Selected Category & Subcategory state
  const [selectedCatId, setSelectedCatId] = useState<string>('');
  const [selectedSubId, setSelectedSubId] = useState<string>(''); // '' means parent category
  const [nominal, setNominal] = useState<number>(0);
  const [percentageVal, setPercentageVal] = useState<number>(20);
  const [subBudgetMode, setSubBudgetMode] = useState<'nominal' | 'percentage'>('nominal');
  const [selectedMonth, setSelectedMonth] = useState<string>(activeMonth);
  const [categoryType, setCategoryType] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');

  // Filter active categories
  const activeExpenseCats = useMemo(
    () => categories.filter((c) => c.tipe === 'pengeluaran' && !c.diarsipkan).sort((a, b) => a.urutan - b.urutan),
    [categories]
  );
  const activeIncomeCats = useMemo(
    () => categories.filter((c) => c.tipe === 'pemasukan' && !c.diarsipkan).sort((a, b) => a.urutan - b.urutan),
    [categories]
  );

  const displayedCats = categoryType === 'pengeluaran' ? activeExpenseCats : activeIncomeCats;

  // Subcategories for selected category
  const availableSubcategories = useMemo(() => {
    if (!selectedCatId) return [];
    return subcategories
      .filter((s) => s.kategoriId === selectedCatId && !s.diarsipkan)
      .sort((a, b) => a.urutan - b.urutan);
  }, [selectedCatId, subcategories]);

  // Parent Category's budget in the active month
  const parentCategoryBudget = useMemo(() => {
    if (!selectedCatId) return 0;
    const b = budgets.find(
      (bg) => bg.bulan === selectedMonth && bg.kategoriId === selectedCatId && !bg.subkategoriId
    );
    return b ? b.nominal : 0;
  }, [budgets, selectedMonth, selectedCatId]);

  // Other subcategories' allocated budgets under this parent category
  const otherSubBudgets = useMemo(() => {
    if (!selectedCatId) return [];
    return budgets.filter(
      (b) =>
        b.bulan === selectedMonth &&
        b.kategoriId === selectedCatId &&
        b.subkategoriId &&
        b.subkategoriId !== selectedSubId
    );
  }, [budgets, selectedMonth, selectedCatId, selectedSubId]);

  const otherSubAllocatedNominal = useMemo(() => {
    return otherSubBudgets.reduce((sum, b) => sum + b.nominal, 0);
  }, [otherSubBudgets]);

  const otherSubAllocatedPct = useMemo(() => {
    if (parentCategoryBudget <= 0) return 0;
    return Math.round((otherSubAllocatedNominal / parentCategoryBudget) * 100);
  }, [otherSubAllocatedNominal, parentCategoryBudget]);

  const remainingQuotaPct = useMemo(() => {
    return Math.max(0, 100 - otherSubAllocatedPct);
  }, [otherSubAllocatedPct]);

  const remainingQuotaNominal = useMemo(() => {
    return Math.max(0, parentCategoryBudget - otherSubAllocatedNominal);
  }, [parentCategoryBudget, otherSubAllocatedNominal]);

  // Existing budget for the currently selected category & subcategory
  const existingBudgetForSelection = useMemo(() => {
    if (!selectedCatId) return null;
    return budgets.find(
      (b) =>
        b.bulan === selectedMonth &&
        b.kategoriId === selectedCatId &&
        (selectedSubId ? b.subkategoriId === selectedSubId : !b.subkategoriId)
    );
  }, [budgets, selectedMonth, selectedCatId, selectedSubId]);

  // Calculate current month's spent or income for this selection
  const currentActualSpent = useMemo(() => {
    if (!selectedCatId) return 0;
    return transactions
      .filter((t) => {
        if (!t.tanggal.startsWith(selectedMonth)) return false;
        if (t.kategoriId !== selectedCatId) return false;
        if (selectedSubId && t.subkategoriId !== selectedSubId) return false;
        return true;
      })
      .reduce((sum, t) => sum + t.nominal, 0);
  }, [transactions, selectedMonth, selectedCatId, selectedSubId]);

  // Synchronize state when opening or initialTarget changes
  useEffect(() => {
    if (isOpen) {
      if (initialTarget) {
        setSelectedCatId(initialTarget.kategoriId);
        setSelectedSubId(initialTarget.subkategoriId || '');
        setSelectedMonth(activeMonth);

        const cat = categories.find((c) => c.id === initialTarget.kategoriId);
        if (cat) {
          setCategoryType(cat.tipe);
        }

        const initialNom = initialTarget.nominal || 0;
        setNominal(initialNom);

        // Check if there is an existing percentage or initialTarget has persentase
        const parentB = budgets.find(
          (b) => b.bulan === activeMonth && b.kategoriId === initialTarget.kategoriId && !b.subkategoriId
        );
        const parentNom = parentB ? parentB.nominal : 0;

        if (initialTarget.subkategoriId) {
          if (initialTarget.persentase && initialTarget.persentase > 0) {
            setSubBudgetMode('percentage');
            setPercentageVal(initialTarget.persentase);
          } else if (parentNom > 0 && initialNom > 0) {
            const calculatedPct = Math.round((initialNom / parentNom) * 100);
            setPercentageVal(calculatedPct);
            setSubBudgetMode('nominal');
          } else {
            setSubBudgetMode('nominal');
            setPercentageVal(20);
          }
        } else {
          setSubBudgetMode('nominal');
        }
      } else {
        // Mode Add
        const defaultCat = activeExpenseCats[0]?.id || '';
        setSelectedCatId(defaultCat);
        setSelectedSubId('');
        setNominal(0);
        setPercentageVal(20);
        setSubBudgetMode('nominal');
        setSelectedMonth(activeMonth);
        setCategoryType('pengeluaran');
      }
    }
  }, [isOpen, initialTarget, activeMonth, activeExpenseCats, categories, budgets]);

  // When subcategory or mode changes, auto-recalculate nominal if in percentage mode
  useEffect(() => {
    if (selectedSubId && subBudgetMode === 'percentage') {
      if (parentCategoryBudget > 0) {
        const computed = Math.round((parentCategoryBudget * percentageVal) / 100);
        setNominal(computed);
      }
    }
  }, [selectedSubId, subBudgetMode, percentageVal, parentCategoryBudget]);

  // Handler for percentage change
  const handlePercentageChange = (newPct: number) => {
    const clamped = Math.max(0, Math.min(100, newPct));
    setPercentageVal(clamped);
    if (parentCategoryBudget > 0) {
      setNominal(Math.round((parentCategoryBudget * clamped) / 100));
    }
  };

  // Quick preset chips for nominal mode
  const quickAddNominal = (amount: number) => {
    setNominal((prev) => prev + amount);
  };

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCatId) return;

    const isSubcategory = !!selectedSubId;
    let savedPct: number | null = null;

    if (isSubcategory) {
      if (subBudgetMode === 'percentage') {
        savedPct = percentageVal;
      } else if (parentCategoryBudget > 0 && nominal > 0) {
        savedPct = Math.round((nominal / parentCategoryBudget) * 100);
      }
    }

    setBudget(
      selectedMonth,
      selectedCatId,
      selectedSubId ? selectedSubId : null,
      nominal,
      savedPct
    );
    onClose();
  };

  const handleDelete = () => {
    if (!selectedCatId) return;
    const catObj = categories.find((c) => c.id === selectedCatId);
    const subObj = subcategories.find((s) => s.id === selectedSubId);
    const catName = subObj
      ? `${catObj?.nama} › ${subObj.nama}`
      : catObj?.nama || 'Budget';

    if (onDeleteRequest) {
      onDeleteRequest(
        selectedCatId,
        selectedSubId ? selectedSubId : null,
        catName,
        nominal
      );
    } else {
      setBudget(selectedMonth, selectedCatId, selectedSubId ? selectedSubId : null, 0);
      onClose();
    }
  };

  const selectedCategoryObj = categories.find((c) => c.id === selectedCatId);
  const selectedSubcategoryObj = subcategories.find((s) => s.id === selectedSubId);

  // Subcategory allocation warnings
  const isOverAllocating =
    !!selectedSubId &&
    parentCategoryBudget > 0 &&
    otherSubAllocatedNominal + nominal > parentCategoryBudget;

  const totalAllocatedWithCurrent = otherSubAllocatedNominal + nominal;
  const totalAllocatedPctWithCurrent =
    parentCategoryBudget > 0 ? Math.round((totalAllocatedWithCurrent / parentCategoryBudget) * 100) : 0;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 overflow-y-auto animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-3xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden my-8">
        {/* Modal Header */}
        <div className="p-5 sm:p-6 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center font-bold">
              <PieChart className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
                {isEditing ? 'Ubah Budget Anggaran' : 'Tambah Budget Baru'}
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Bulan: <strong className="text-slate-700 dark:text-slate-300">{formatMonthName(selectedMonth)}</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSave} className="p-5 sm:p-6 space-y-5">
          {/* If Add Mode: Category Type Toggle */}
          {!isEditing && (
            <div className="space-y-1.5">
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300">
                Tipe Anggaran
              </label>
              <div className="grid grid-cols-2 gap-2 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl">
                <button
                  type="button"
                  onClick={() => {
                    setCategoryType('pengeluaran');
                    const first = activeExpenseCats[0]?.id || '';
                    setSelectedCatId(first);
                    setSelectedSubId('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[38px] ${
                    categoryType === 'pengeluaran'
                      ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <TrendingDown className="w-3.5 h-3.5" />
                  <span>Batas Pengeluaran</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setCategoryType('pemasukan');
                    const first = activeIncomeCats[0]?.id || '';
                    setSelectedCatId(first);
                    setSelectedSubId('');
                  }}
                  className={`py-2 px-3 rounded-xl text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[38px] ${
                    categoryType === 'pemasukan'
                      ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                      : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
                  }`}
                >
                  <Target className="w-3.5 h-3.5" />
                  <span>Target Pemasukan</span>
                </button>
              </div>
            </div>
          )}

          {/* Category Selector */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
              Pilih Kategori <span className="text-rose-500">*</span>
            </label>
            {isEditing ? (
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700 flex items-center gap-3">
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center text-lg shrink-0"
                  style={{
                    backgroundColor: `${selectedCategoryObj?.warna || '#10b981'}20`,
                    color: selectedCategoryObj?.warna || '#10b981',
                  }}
                >
                  <span>{selectedCategoryObj?.ikon || '📁'}</span>
                </div>
                <div className="min-w-0 flex-1">
                  <h4 className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {selectedCategoryObj?.nama || 'Kategori'}
                  </h4>
                  {selectedSubcategoryObj ? (
                    <p className="text-xs text-slate-500 dark:text-slate-400 flex items-center gap-1 mt-0.5">
                      <span>Subkategori:</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        {selectedSubcategoryObj.ikon} {selectedSubcategoryObj.nama}
                      </span>
                    </p>
                  ) : (
                    <p className="text-xs text-slate-400 mt-0.5">Anggaran Kategori Utama</p>
                  )}
                </div>
              </div>
            ) : (
              <select
                value={selectedCatId}
                onChange={(e) => {
                  setSelectedCatId(e.target.value);
                  setSelectedSubId('');
                }}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-3 text-sm font-semibold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px]"
              >
                {displayedCats.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.ikon} {cat.nama}
                  </option>
                ))}
              </select>
            )}
          </div>

          {/* Subcategory Selector (If available) */}
          {!isEditing && availableSubcategories.length > 0 && (
            <div>
              <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                Alokasi Subkategori (Opsional)
              </label>
              <select
                value={selectedSubId}
                onChange={(e) => setSelectedSubId(e.target.value)}
                className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 px-3.5 py-2.5 text-sm font-semibold text-slate-900 dark:text-white focus:border-emerald-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[44px]"
              >
                <option value="">-- Seluruh Kategori ({selectedCategoryObj?.nama}) --</option>
                {availableSubcategories.map((sub) => (
                  <option key={sub.id} value={sub.id}>
                    {sub.ikon} {sub.nama}
                  </option>
                ))}
              </select>
              <p className="text-[11px] text-slate-400 mt-1">
                Pilih opsi di atas jika Anda ingin mengatur batas spesifik untuk satu subkategori.
              </p>
            </div>
          )}

          {/* If Subcategory is selected: Mode Switch (Nominal vs Persentase dari Budget Kategori) */}
          {selectedSubId && (
            <div className="p-3.5 rounded-2xl bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/80 dark:border-emerald-900/50 space-y-3">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 flex items-center gap-1.5">
                  <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                  Metode Penentuan Budget Subkategori
                </span>
                {parentCategoryBudget > 0 && (
                  <span className="text-[11px] text-slate-500 dark:text-slate-400">
                    Budget Induk: <strong className="text-slate-800 dark:text-slate-200">{formatRupiah(parentCategoryBudget)}</strong>
                  </span>
                )}
              </div>

              {/* Mode Toggle Buttons */}
              <div className="grid grid-cols-2 gap-2 p-1 bg-white/80 dark:bg-slate-900/80 rounded-xl border border-emerald-100 dark:border-emerald-900/60">
                <button
                  type="button"
                  onClick={() => setSubBudgetMode('nominal')}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[36px] ${
                    subBudgetMode === 'nominal'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <span>Nominal Rupiah (Rp)</span>
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSubBudgetMode('percentage');
                    if (parentCategoryBudget > 0 && nominal > 0) {
                      const calculated = Math.round((nominal / parentCategoryBudget) * 100);
                      setPercentageVal(Math.max(1, Math.min(100, calculated)));
                    }
                  }}
                  className={`py-2 px-3 rounded-lg text-xs font-bold transition flex items-center justify-center gap-1.5 min-h-[36px] ${
                    subBudgetMode === 'percentage'
                      ? 'bg-emerald-600 text-white shadow-xs'
                      : 'text-slate-600 dark:text-slate-300 hover:text-slate-900'
                  }`}
                >
                  <Percent className="w-3 h-3" />
                  <span>Persentase (%)</span>
                </button>
              </div>

              {/* Parent category has no budget notice */}
              {parentCategoryBudget === 0 && subBudgetMode === 'percentage' && (
                <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                  <div>
                    <span>
                      Budget kategori induk ({selectedCategoryObj?.nama}) saat ini masih <strong>Rp 0</strong>. Tentukan budget kategori induk terlebih dahulu agar persentase dapat dikalkulasikan, atau gunakan metode Nominal Rupiah.
                    </span>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Input Section based on chosen Mode */}
          {selectedSubId && subBudgetMode === 'percentage' && parentCategoryBudget > 0 ? (
            /* Percentage Input Mode */
            <div className="space-y-3 p-4 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 shadow-xs">
              <div className="flex items-center justify-between">
                <label className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                  Persentase dari Budget Kategori ({selectedCategoryObj?.nama})
                </label>
                <div className="flex items-center gap-1">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={percentageVal}
                    onChange={(e) => handlePercentageChange(Number(e.target.value))}
                    className="w-16 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-900 px-2 py-1 text-right text-sm font-bold text-slate-900 dark:text-white tabular-nums"
                  />
                  <span className="text-sm font-bold text-slate-600 dark:text-slate-300">%</span>
                </div>
              </div>

              {/* Range Slider */}
              <div className="space-y-1">
                <input
                  type="range"
                  min="1"
                  max="100"
                  step="1"
                  value={percentageVal}
                  onChange={(e) => handlePercentageChange(Number(e.target.value))}
                  className="w-full accent-emerald-600 cursor-pointer h-2 bg-slate-100 dark:bg-slate-700 rounded-lg"
                />
                <div className="flex justify-between text-[10px] text-slate-400 font-semibold px-0.5">
                  <span>0%</span>
                  <span>25%</span>
                  <span>50%</span>
                  <span>75%</span>
                  <span>100%</span>
                </div>
              </div>

              {/* Quick Percentage Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Pilihan:
                </span>
                {[10, 15, 20, 25, 30, 50, 75].map((pct) => (
                  <button
                    key={pct}
                    type="button"
                    onClick={() => handlePercentageChange(pct)}
                    className={`px-2.5 py-1 text-xs font-bold rounded-xl transition border min-h-[30px] ${
                      percentageVal === pct
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-2xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300 border-slate-200/60 dark:border-slate-700 hover:bg-emerald-50'
                    }`}
                  >
                    {pct}%
                  </button>
                ))}

                {remainingQuotaPct > 0 && remainingQuotaPct !== percentageVal && (
                  <button
                    type="button"
                    onClick={() => handlePercentageChange(remainingQuotaPct)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800 hover:bg-amber-100 transition min-h-[30px]"
                    title="Alokasikan sisa kuota yang belum terpakai"
                  >
                    Sisa Kuota ({remainingQuotaPct}%)
                  </button>
                )}
              </div>

              {/* Dynamic Calculation Result Box */}
              <div className="p-3.5 rounded-xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/80 dark:border-emerald-800/60 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 dark:text-slate-400 block">
                    Kalkulasi Nominal ({percentageVal}% × {formatRupiah(parentCategoryBudget)}):
                  </span>
                  <span className="text-lg font-bold text-emerald-700 dark:text-emerald-300 tabular-nums">
                    {formatRupiah(nominal)}
                  </span>
                </div>
                <div className="text-right text-[11px] text-slate-500 dark:text-slate-400">
                  <span>Alokasi lain: </span>
                  <strong className="text-slate-700 dark:text-slate-300">{otherSubAllocatedPct}%</strong>
                  <br />
                  <span>Sisa kuota: </span>
                  <strong className="text-emerald-600 dark:text-emerald-400">{remainingQuotaPct}%</strong>
                </div>
              </div>
            </div>
          ) : (
            /* Nominal (Rp) Input Mode */
            <div className="space-y-2">
              <CurrencyInput
                id="budget-nominal-input"
                value={nominal}
                onChange={setNominal}
                label={categoryType === 'pengeluaran' ? 'Batas Maksimal Anggaran (Rp)' : 'Target Pemasukan (Rp)'}
                placeholder="Contoh: 1.500.000"
                autoFocus
                required
              />

              {/* If budgeting a subcategory and parent has budget, show percentage equivalent */}
              {selectedSubId && parentCategoryBudget > 0 && nominal > 0 && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-400 px-1">
                  <Percent className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" />
                  <span>
                    Nominal ini setara dengan{' '}
                    <strong className="text-emerald-600 dark:text-emerald-400 font-bold tabular-nums">
                      {((nominal / parentCategoryBudget) * 100).toFixed(1)}%
                    </strong>{' '}
                    dari budget kategori induk ({formatRupiah(parentCategoryBudget)}).
                  </span>
                </div>
              )}

              {/* Quick Increment Chips */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] font-medium text-slate-400 mr-1 flex items-center gap-1">
                  <Sparkles className="w-3 h-3 text-emerald-500" /> Cepat:
                </span>
                {[50000, 100000, 500000, 1000000, 2000000, 5000000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => quickAddNominal(amt)}
                    className="px-2.5 py-1 text-xs font-semibold rounded-xl bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 dark:bg-slate-800 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 transition border border-slate-200/60 dark:border-slate-700 min-h-[32px]"
                  >
                    +{amt >= 1000000 ? `${amt / 1000000}jt` : `${amt / 1000}rb`}
                  </button>
                ))}
                {nominal > 0 && (
                  <button
                    type="button"
                    onClick={() => setNominal(0)}
                    className="px-2 py-1 text-xs font-medium rounded-xl text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition min-h-[32px]"
                  >
                    Reset (Rp 0)
                  </button>
                )}
              </div>
            </div>
          )}

          {/* Subcategory Over-allocation Warning if applicable */}
          {isOverAllocating && (
            <div className="p-3 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-900 text-xs text-amber-800 dark:text-amber-300 flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 shrink-0 text-amber-600" />
              <span>
                Peringatan: Total alokasi seluruh subkategori akan menjadi <strong>{totalAllocatedPctWithCurrent}%</strong> ({formatRupiah(totalAllocatedWithCurrent)}), melebihi budget kategori induk ({formatRupiah(parentCategoryBudget)}).
              </span>
            </div>
          )}

          {/* Real-time Spending Insight Card */}
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-800 space-y-2">
            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                {categoryType === 'pengeluaran' ? 'Pengeluaran Bulan Ini:' : 'Pemasukan Tercatat:'}
              </span>
              <strong className="text-slate-800 dark:text-slate-200 tabular-nums">
                {formatRupiah(currentActualSpent)}
              </strong>
            </div>

            {nominal > 0 && (
              <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-200/60 dark:border-slate-700">
                <span className="text-slate-500 dark:text-slate-400 font-medium">
                  {categoryType === 'pengeluaran' ? 'Sisa Batas Anggaran:' : 'Kekurangan Target:'}
                </span>
                <strong
                  className={`tabular-nums font-bold ${
                    nominal - currentActualSpent >= 0
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-rose-600 dark:text-rose-400'
                  }`}
                >
                  {formatRupiah(nominal - currentActualSpent)}
                </strong>
              </div>
            )}

            {nominal > 0 && currentActualSpent > nominal && categoryType === 'pengeluaran' && (
              <div className="flex items-center gap-1.5 text-xs text-rose-600 dark:text-rose-400 font-medium pt-1">
                <AlertTriangle className="w-3.5 h-3.5 shrink-0" />
                <span>Pengeluaran bulan ini sudah melebihi budget yang Anda pasang.</span>
              </div>
            )}
          </div>

          {/* Modal Footer Actions */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
            {/* If Editing or Existing Budget > 0, show Hapus button */}
            {(isEditing || (existingBudgetForSelection && existingBudgetForSelection.nominal > 0)) ? (
              <button
                type="button"
                onClick={handleDelete}
                className="w-full sm:w-auto flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl border border-rose-200 dark:border-rose-900/60 text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-xs sm:text-sm font-semibold transition min-h-[44px]"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus Budget</span>
              </button>
            ) : (
              <div className="hidden sm:block" />
            )}

            <div className="flex items-center gap-2.5 w-full sm:w-auto justify-end">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 sm:flex-none px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs sm:text-sm font-semibold transition min-h-[44px]"
              >
                Batal
              </button>
              <button
                type="submit"
                disabled={!selectedCatId || nominal <= 0}
                className="flex-1 sm:flex-none px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-xs sm:text-sm font-semibold shadow-xs transition min-h-[44px] active:scale-95 flex items-center justify-center gap-2"
              >
                <span>{isEditing ? 'Simpan Perubahan' : 'Pasang Budget'}</span>
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
