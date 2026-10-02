import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { MonthSelector } from '../common/MonthSelector';
import { ConfirmModal } from '../common/ConfirmModal';
import { AddEditBudgetModal } from './AddEditBudgetModal';
import { formatRupiah, formatMonthName, shiftMonthString } from '../../utils/formatters';
import {
  ChevronDown,
  ChevronUp,
  AlertTriangle,
  AlertOctagon,
  CheckCircle2,
  PieChart,
  Target,
  Edit3,
  Trash2,
  Plus,
  Copy,
  Search,
  Check,
  TrendingDown,
  Sparkles,
  Info,
} from 'lucide-react';

export const BudgetManagementView: React.FC = () => {
  const {
    categories,
    subcategories,
    transactions,
    budgets,
    activeMonth,
    setActiveMonth,
    deleteBudgetByTarget,
    copyBudgetsFromMonth,
  } = useFinance();

  // Accordion state for expanded categories
  const [expandedCats, setExpandedCats] = useState<{ [catId: string]: boolean }>({});

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingTarget, setEditingTarget] = useState<{
    kategoriId: string;
    subkategoriId?: string | null;
    nominal: number;
    persentase?: number | null;
    nama?: string;
  } | null>(null);

  const [deleteConfirmTarget, setDeleteConfirmTarget] = useState<{
    kategoriId: string;
    subkategoriId: string | null;
    nama: string;
    nominal: number;
  } | null>(null);

  const [isCopyModalOpen, setIsCopyModalOpen] = useState(false);

  // Filters & Search
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'pengeluaran' | 'pemasukan'>('pengeluaran');
  const [statusFilter, setStatusFilter] = useState<'all' | 'budgeted' | 'unbudgeted' | 'overbudget'>('all');

  // Feedback Notification banner
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'info'; text: string } | null>(null);

  const toggleExpand = (catId: string) => {
    setExpandedCats((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Month transactions
  const monthTransactions = useMemo(
    () => transactions.filter((t) => t.tanggal.startsWith(activeMonth)),
    [transactions, activeMonth]
  );

  const expenseCategories = useMemo(
    () =>
      categories
        .filter((c) => c.tipe === 'pengeluaran' && !c.diarsipkan)
        .sort((a, b) => a.urutan - b.urutan),
    [categories]
  );

  const incomeCategories = useMemo(
    () =>
      categories
        .filter((c) => c.tipe === 'pemasukan' && !c.diarsipkan)
        .sort((a, b) => a.urutan - b.urutan),
    [categories]
  );

  // Previous month budget count for quick-copy feature
  const prevMonth = useMemo(() => shiftMonthString(activeMonth, -1), [activeMonth]);
  const prevMonthBudgets = useMemo(
    () => budgets.filter((b) => b.bulan === prevMonth && b.nominal > 0),
    [budgets, prevMonth]
  );

  // Overall totals for Expense Budgets (category level)
  const totalExpenseBudget = useMemo(() => {
    return expenseCategories.reduce((sum, c) => {
      const b = budgets.find((bg) => bg.bulan === activeMonth && bg.kategoriId === c.id && !bg.subkategoriId);
      return sum + (b ? b.nominal : 0);
    }, 0);
  }, [expenseCategories, budgets, activeMonth]);

  const totalExpenseSpent = useMemo(() => {
    return monthTransactions
      .filter((t) => t.tipe === 'pengeluaran')
      .reduce((sum, t) => sum + t.nominal, 0);
  }, [monthTransactions]);

  const expenseBudgetCategoriesCount = useMemo(() => {
    return expenseCategories.filter((c) => {
      const b = budgets.find((bg) => bg.bulan === activeMonth && bg.kategoriId === c.id && !bg.subkategoriId);
      return b && b.nominal > 0;
    }).length;
  }, [expenseCategories, budgets, activeMonth]);

  // Overall Income Targets
  const totalIncomeTarget = useMemo(() => {
    return incomeCategories.reduce((sum, c) => {
      const b = budgets.find((bg) => bg.bulan === activeMonth && bg.kategoriId === c.id && !bg.subkategoriId);
      return sum + (b ? b.nominal : 0);
    }, 0);
  }, [incomeCategories, budgets, activeMonth]);

  const totalIncomeRealized = useMemo(() => {
    return monthTransactions
      .filter((t) => t.tipe === 'pemasukan')
      .reduce((sum, t) => sum + t.nominal, 0);
  }, [monthTransactions]);

  // Handlers for Add, Edit, Delete
  const handleOpenAdd = () => {
    setEditingTarget(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (
    kategoriId: string,
    subkategoriId: string | null = null,
    nama: string
  ) => {
    const existing = budgets.find(
      (b) =>
        b.bulan === activeMonth &&
        b.kategoriId === kategoriId &&
        (subkategoriId ? b.subkategoriId === subkategoriId : !b.subkategoriId)
    );
    const nominal = existing ? existing.nominal : 0;
    setEditingTarget({ kategoriId, subkategoriId, nama, nominal });
    setIsAddModalOpen(true);
  };

  const handleRequestDelete = (
    kategoriId: string,
    subkategoriId: string | null = null,
    nama: string,
    nominal: number
  ) => {
    setDeleteConfirmTarget({
      kategoriId,
      subkategoriId,
      nama,
      nominal,
    });
  };

  const handleConfirmDelete = () => {
    if (!deleteConfirmTarget) return;
    deleteBudgetByTarget(
      activeMonth,
      deleteConfirmTarget.kategoriId,
      deleteConfirmTarget.subkategoriId
    );
    setToastMessage({
      type: 'info',
      text: `Budget untuk "${deleteConfirmTarget.nama}" berhasil dihapus.`,
    });
    setDeleteConfirmTarget(null);
    setIsAddModalOpen(false);
  };

  const handleCopyFromPreviousMonth = () => {
    if (prevMonthBudgets.length === 0) return;
    const res = copyBudgetsFromMonth(prevMonth, activeMonth);
    setIsCopyModalOpen(false);
    setToastMessage({
      type: 'success',
      text: `Sukses menyalin ${res.count} alokasi anggaran dari ${formatMonthName(prevMonth)} ke ${formatMonthName(activeMonth)}!`,
    });
  };

  // Filtered Categories based on search and status
  const currentCategories = activeTab === 'pengeluaran' ? expenseCategories : incomeCategories;

  const filteredCategories = useMemo(() => {
    return currentCategories.filter((cat) => {
      // Search matching
      const matchesSearch =
        cat.nama.toLowerCase().includes(searchQuery.toLowerCase()) ||
        subcategories
          .filter((s) => s.kategoriId === cat.id)
          .some((s) => s.nama.toLowerCase().includes(searchQuery.toLowerCase()));

      if (!matchesSearch) return false;

      // Status filter
      const b = budgets.find((bg) => bg.bulan === activeMonth && bg.kategoriId === cat.id && !bg.subkategoriId);
      const budgetNominal = b ? b.nominal : 0;

      const spent = monthTransactions
        .filter((t) => t.kategoriId === cat.id && t.tipe === cat.tipe)
        .reduce((sum, t) => sum + t.nominal, 0);

      const pct = budgetNominal > 0 ? (spent / budgetNominal) * 100 : 0;

      if (statusFilter === 'budgeted') return budgetNominal > 0;
      if (statusFilter === 'unbudgeted') return budgetNominal === 0;
      if (statusFilter === 'overbudget') return budgetNominal > 0 && pct >= 80;

      return true;
    });
  }, [currentCategories, searchQuery, statusFilter, budgets, activeMonth, monthTransactions, subcategories]);

  // Overall Progress Percentage
  const overallPercentage =
    totalExpenseBudget > 0 ? Math.min(100, Math.round((totalExpenseSpent / totalExpenseBudget) * 100)) : 0;

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
              Manajemen Budget & Anggaran
            </h1>
            <span className="text-xs px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400 font-semibold border border-emerald-200/60 dark:border-emerald-800">
              {expenseBudgetCategoriesCount} Aktif
            </span>
          </div>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Tetapkan batas anggaran pengeluaran, ubah atau hapus budget kapan saja dengan mudah
          </p>
        </div>

        {/* Header Right Actions */}
        <div className="flex flex-wrap items-center gap-2.5">
          <MonthSelector currentMonth={activeMonth} onChange={setActiveMonth} />

          {/* Salin dari Bulan Lalu Button (if available) */}
          {prevMonthBudgets.length > 0 && (
            <button
              type="button"
              onClick={() => setIsCopyModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-2 rounded-2xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition shadow-xs min-h-[40px]"
              title={`Salin budget dari ${formatMonthName(prevMonth)}`}
            >
              <Copy className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>Salin dari Bulan Lalu</span>
            </button>
          )}

          {/* Primary Tambah Budget Button */}
          <button
            type="button"
            onClick={handleOpenAdd}
            className="flex items-center gap-2 px-4 py-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs sm:text-sm font-semibold shadow-sm transition active:scale-95 min-h-[40px]"
          >
            <Plus className="w-4 h-4" />
            <span>Tambah Budget</span>
          </button>
        </div>
      </div>

      {/* Notification Toast */}
      {toastMessage && (
        <div
          className={`p-3.5 rounded-2xl text-xs sm:text-sm flex items-center justify-between gap-3 animate-in fade-in duration-200 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-300 dark:border-emerald-800'
              : 'bg-blue-50 text-blue-800 border border-blue-200 dark:bg-blue-950/40 dark:text-blue-300 dark:border-blue-800'
          }`}
        >
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
            <span>{toastMessage.text}</span>
          </div>
          <button
            type="button"
            onClick={() => setToastMessage(null)}
            className="text-xs font-bold hover:underline opacity-80"
          >
            Tutup
          </button>
        </div>
      )}

      {/* Hero Overview Statistics Cards */}
      <div className="p-5 sm:p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {/* Card 1: Total Budget */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Total Budget Pengeluaran
            </span>
            <p className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white tabular-nums">
              {formatRupiah(totalExpenseBudget)}
            </p>
            <p className="text-xs text-slate-400">
              {expenseBudgetCategoriesCount} dari {expenseCategories.length} kategori diatur
            </p>
          </div>

          {/* Card 2: Realisasi Terpakai */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Realisasi Pengeluaran
            </span>
            <p className="text-xl sm:text-2xl font-bold text-rose-600 dark:text-rose-400 tabular-nums">
              {formatRupiah(totalExpenseSpent)}
            </p>
            <p className="text-xs text-slate-400">
              {totalExpenseBudget > 0 ? `${overallPercentage}% dari total budget` : 'Belum ada budget'}
            </p>
          </div>

          {/* Card 3: Sisa Anggaran */}
          <div className="space-y-1">
            <span className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">
              Sisa Anggaran Bulan Ini
            </span>
            <p
              className={`text-xl sm:text-2xl font-bold tabular-nums ${
                totalExpenseBudget - totalExpenseSpent >= 0
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatRupiah(totalExpenseBudget - totalExpenseSpent)}
            </p>
            <p className="text-xs text-slate-400">
              {totalExpenseBudget - totalExpenseSpent >= 0 ? 'Kondisi surplus aman' : 'Melebihi budget keseluruhan'}
            </p>
          </div>

          {/* Card 4: Health Indicator */}
          <div className="space-y-1.5 flex flex-col justify-center">
            <div className="flex items-center justify-between text-xs font-semibold">
              <span className="text-slate-500 dark:text-slate-400">Status Pemakaian:</span>
              <span
                className={`px-2 py-0.5 rounded-full text-[11px] font-bold ${
                  overallPercentage >= 100
                    ? 'bg-rose-50 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                    : overallPercentage >= 80
                    ? 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                    : 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                }`}
              >
                {overallPercentage >= 100
                  ? 'Over Budget'
                  : overallPercentage >= 80
                  ? 'Waspada (>80%)'
                  : 'Aman'}
              </span>
            </div>
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  overallPercentage >= 100
                    ? 'bg-rose-500'
                    : overallPercentage >= 80
                    ? 'bg-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(overallPercentage, 100)}%` }}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs & Search Filter Bar */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Tab Switcher: Pengeluaran vs Target Pemasukan */}
        <div className="flex items-center p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl w-fit">
          <button
            type="button"
            onClick={() => {
              setActiveTab('pengeluaran');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
              activeTab === 'pengeluaran'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <PieChart className="w-3.5 h-3.5" />
            <span>Budget Pengeluaran ({expenseCategories.length})</span>
          </button>
          <button
            type="button"
            onClick={() => {
              setActiveTab('pemasukan');
              setStatusFilter('all');
            }}
            className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-bold transition min-h-[36px] ${
              activeTab === 'pemasukan'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <Target className="w-3.5 h-3.5" />
            <span>Target Pemasukan ({incomeCategories.length})</span>
          </button>
        </div>

        {/* Search & Quick Filters */}
        <div className="flex flex-wrap items-center gap-2 flex-1 max-w-lg md:justify-end">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[180px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Cari kategori..."
              className="w-full rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 pl-9 pr-3.5 py-2 text-xs font-medium text-slate-900 dark:text-white placeholder-slate-400 focus:border-emerald-500 focus:outline-none min-h-[38px]"
            />
            {searchQuery && (
              <button
                type="button"
                onClick={() => setSearchQuery('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-xs text-slate-400 hover:text-slate-600"
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Buttons */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            {[
              { id: 'all', label: 'Semua' },
              { id: 'budgeted', label: 'Ber-Budget' },
              { id: 'unbudgeted', label: 'Belum Diatur' },
              { id: 'overbudget', label: 'Waspada / Over' },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setStatusFilter(f.id as any)}
                className={`px-2.5 py-1.5 rounded-xl text-[11px] font-semibold transition shrink-0 min-h-[34px] ${
                  statusFilter === f.id
                    ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                    : 'bg-white dark:bg-slate-800 text-slate-600 dark:text-slate-300 border border-slate-200/80 dark:border-slate-700 hover:bg-slate-50'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Categories Budget Cards List */}
      <div className="space-y-3.5">
        {filteredCategories.length === 0 ? (
          <div className="p-10 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 space-y-3">
            <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto text-xl">
              🔍
            </div>
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              Tidak ada kategori yang cocok
            </h3>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau ubah filter status kategori di atas.
            </p>
            <button
              type="button"
              onClick={() => {
                setSearchQuery('');
                setStatusFilter('all');
              }}
              className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              Reset Filter
            </button>
          </div>
        ) : (
          filteredCategories.map((cat) => {
            const isExpanded = !!expandedCats[cat.id];
            const childSubs = subcategories
              .filter((s) => s.kategoriId === cat.id && !s.diarsipkan)
              .sort((a, b) => a.urutan - b.urutan);

            // Parent budget & spent
            const parentBudgetEntry = budgets.find(
              (b) => b.bulan === activeMonth && b.kategoriId === cat.id && !b.subkategoriId
            );
            const parentBudgetNominal = parentBudgetEntry ? parentBudgetEntry.nominal : 0;

            const parentSpent = monthTransactions
              .filter((t) => t.kategoriId === cat.id && t.tipe === cat.tipe)
              .reduce((sum, t) => sum + t.nominal, 0);

            const parentPct = parentBudgetNominal > 0 ? (parentSpent / parentBudgetNominal) * 100 : 0;
            const parentRemaining = parentBudgetNominal - parentSpent;

            // Subcategory budgets calculation & validation
            const childBudgetsTotal = childSubs.reduce((sum, s) => {
              const b = budgets.find(
                (bg) => bg.bulan === activeMonth && bg.kategoriId === cat.id && bg.subkategoriId === s.id
              );
              return sum + (b ? b.nominal : 0);
            }, 0);

            const isSubBudgetOverAllocated = parentBudgetNominal > 0 && childBudgetsTotal > parentBudgetNominal;
            const unallocatedSubBudget = parentBudgetNominal - childBudgetsTotal;

            // Status Styling
            let barColor = 'bg-emerald-500';
            let statusBadge = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400';
            let statusText = 'Aman';
            if (parentPct >= 100) {
              barColor = 'bg-rose-500';
              statusBadge = 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400';
              statusText = 'Over Budget!';
            } else if (parentPct >= 80) {
              barColor = 'bg-amber-500';
              statusBadge = 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400';
              statusText = 'Waspada';
            }

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden transition-all hover:border-slate-300 dark:hover:border-slate-700"
              >
                {/* Main Category Row */}
                <div className="p-4 sm:p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    {/* Category Title & Badge */}
                    <div className="flex items-center gap-3">
                      <div
                        className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs"
                        style={{ backgroundColor: `${cat.warna}20`, color: cat.warna }}
                      >
                        <span>{cat.ikon}</span>
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="text-sm sm:text-base font-bold text-slate-900 dark:text-white">
                            {cat.nama}
                          </h3>
                          {parentBudgetNominal > 0 ? (
                            <span className={`text-[10px] sm:text-xs font-semibold px-2 py-0.5 rounded-full ${statusBadge}`}>
                              {statusText} ({parentPct.toFixed(0)}%)
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-slate-100 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                              Belum Ada Budget
                            </span>
                          )}
                        </div>
                        <p className="text-xs text-slate-400 mt-0.5">
                          {cat.tipe === 'pengeluaran' ? 'Terpakai: ' : 'Tercapai: '}
                          <strong className="text-slate-700 dark:text-slate-300 tabular-nums">
                            {formatRupiah(parentSpent)}
                          </strong>
                          {parentBudgetNominal > 0 && (
                            <>
                              {' '}dari{' '}
                              <strong className="text-slate-700 dark:text-slate-300 tabular-nums">
                                {formatRupiah(parentBudgetNominal)}
                              </strong>
                            </>
                          )}
                        </p>
                      </div>
                    </div>

                    {/* Action Buttons Right on the Card */}
                    <div className="flex items-center gap-2 self-end sm:self-auto flex-wrap">
                      {parentBudgetNominal > 0 ? (
                        <>
                          {/* Edit Button */}
                          <button
                            type="button"
                            onClick={() => handleOpenEdit(cat.id, null, cat.nama)}
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 transition min-h-[38px] shadow-2xs"
                          >
                            <Edit3 className="w-3.5 h-3.5 text-slate-500" />
                            <span>Edit</span>
                          </button>

                          {/* Delete Button */}
                          <button
                            type="button"
                            onClick={() =>
                              handleRequestDelete(cat.id, null, cat.nama, parentBudgetNominal)
                            }
                            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-rose-200/80 dark:border-rose-900/40 bg-rose-50/50 dark:bg-rose-950/20 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-950/60 transition min-h-[38px]"
                            title="Hapus budget kategori ini"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>Hapus</span>
                          </button>
                        </>
                      ) : (
                        /* Atur / Tambah Budget Button */
                        <button
                          type="button"
                          onClick={() => handleOpenEdit(cat.id, null, cat.nama)}
                          className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 text-xs font-bold hover:bg-emerald-100 dark:hover:bg-emerald-900 transition min-h-[38px]"
                        >
                          <Plus className="w-3.5 h-3.5" />
                          <span>+ Atur Budget</span>
                        </button>
                      )}

                      {/* Subcategories Accordion Toggle */}
                      {childSubs.length > 0 && (
                        <button
                          type="button"
                          onClick={() => toggleExpand(cat.id)}
                          className="flex items-center gap-1 px-2.5 py-1.5 rounded-xl text-xs font-semibold text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[38px]"
                        >
                          <span>{childSubs.length} Sub</span>
                          {isExpanded ? (
                            <ChevronUp className="w-4 h-4" />
                          ) : (
                            <ChevronDown className="w-4 h-4" />
                          )}
                        </button>
                      )}
                    </div>
                  </div>

                  {/* Progress Bar for Parent Category */}
                  {parentBudgetNominal > 0 && (
                    <div className="mt-4 space-y-1.5">
                      <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                          style={{ width: `${Math.min(parentPct, 100)}%` }}
                        />
                      </div>
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between text-[11px] text-slate-500 dark:text-slate-400 gap-1">
                        <span>
                          {parentRemaining >= 0 ? 'Sisa Batas:' : 'Overbudget:'}{' '}
                          <strong
                            className={`tabular-nums font-semibold ${
                              parentRemaining >= 0
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-rose-600 dark:text-rose-400'
                            }`}
                          >
                            {formatRupiah(Math.abs(parentRemaining))}
                          </strong>
                        </span>

                        {childBudgetsTotal > 0 && (
                          <span
                            className={
                              isSubBudgetOverAllocated
                                ? 'text-rose-600 font-semibold'
                                : 'text-slate-400'
                            }
                          >
                            {isSubBudgetOverAllocated
                              ? `Alokasi subkategori melebihi budget sebesar ${formatRupiah(
                                  childBudgetsTotal - parentBudgetNominal
                                )}!`
                              : `Belum dialokasi ke subkategori: ${formatRupiah(
                                  unallocatedSubBudget
                                )}`}
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Subcategory allocation warning banner */}
                  {isSubBudgetOverAllocated && (
                    <div className="mt-3 p-3 rounded-2xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-xs text-rose-700 dark:text-rose-300 flex items-center gap-2">
                      <AlertOctagon className="w-4 h-4 shrink-0" />
                      <span>
                        Peringatan: Total alokasi budget subkategori ({formatRupiah(childBudgetsTotal)}) melebihi budget kategori induk ({formatRupiah(parentBudgetNominal)}).
                      </span>
                    </div>
                  )}
                </div>

                {/* Subcategories Accordion Content */}
                {isExpanded && childSubs.length > 0 && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/30 p-4 space-y-3">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Alokasi Subkategori ({cat.nama})
                      </span>
                      <span className="text-[11px] text-slate-400">
                        Total Dialokasikan: <strong className="text-slate-700 dark:text-slate-300">{formatRupiah(childBudgetsTotal)}</strong>
                      </span>
                    </div>

                    <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
                      {childSubs.map((sub) => {
                        const subBudgetEntry = budgets.find(
                          (b) =>
                            b.bulan === activeMonth &&
                            b.kategoriId === cat.id &&
                            b.subkategoriId === sub.id
                        );
                        const subBudgetNominal = subBudgetEntry ? subBudgetEntry.nominal : 0;

                        const subSpent = monthTransactions
                          .filter((t) => t.subkategoriId === sub.id)
                          .reduce((sum, t) => sum + t.nominal, 0);

                        const subPct = subBudgetNominal > 0 ? (subSpent / subBudgetNominal) * 100 : 0;
                        const subRemaining = subBudgetNominal - subSpent;

                        return (
                          <div
                            key={sub.id}
                            className="py-3 px-2 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                          >
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-lg">{sub.ikon}</span>
                              <div>
                                <div className="flex items-center gap-2">
                                  <span className="text-xs sm:text-sm font-semibold text-slate-800 dark:text-slate-200">
                                    {sub.nama}
                                  </span>
                                  {subBudgetNominal > 0 && (
                                    <span
                                      className={`text-[10px] font-semibold px-2 py-0.2 rounded-full ${
                                        subPct >= 100
                                          ? 'bg-rose-100 text-rose-700 dark:bg-rose-950/60 dark:text-rose-400'
                                          : subPct >= 80
                                          ? 'bg-amber-100 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
                                          : 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                                      }`}
                                    >
                                      {subPct.toFixed(0)}%
                                    </span>
                                  )}
                                </div>
                                <div className="text-[11px] text-slate-400 mt-0.5">
                                  Terpakai: <strong className="text-slate-600 dark:text-slate-300 tabular-nums">{formatRupiah(subSpent)}</strong>
                                  {subBudgetNominal > 0 && (
                                    <> / Target: <strong className="text-slate-600 dark:text-slate-300 tabular-nums">{formatRupiah(subBudgetNominal)}</strong></>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-3 self-end sm:self-auto">
                              {subBudgetNominal > 0 && (
                                <div className="text-right">
                                  <span
                                    className={`text-xs font-semibold tabular-nums ${
                                      subRemaining >= 0
                                        ? 'text-emerald-600 dark:text-emerald-400'
                                        : 'text-rose-600 dark:text-rose-400'
                                    }`}
                                  >
                                    {subRemaining >= 0
                                      ? `Sisa: ${formatRupiah(subRemaining)}`
                                      : `Over: ${formatRupiah(Math.abs(subRemaining))}`}
                                  </span>
                                  <div className="w-24 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden mt-1">
                                    <div
                                      className={`h-full rounded-full ${
                                        subPct >= 100
                                          ? 'bg-rose-500'
                                          : subPct >= 80
                                          ? 'bg-amber-500'
                                          : 'bg-emerald-500'
                                      }`}
                                      style={{ width: `${Math.min(subPct, 100)}%` }}
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Subcategory Actions */}
                              {subBudgetNominal > 0 ? (
                                <div className="flex items-center gap-1.5">
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleOpenEdit(
                                        cat.id,
                                        sub.id,
                                        `${cat.nama} › ${sub.nama}`
                                      )
                                    }
                                    className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition min-h-[34px] flex items-center gap-1"
                                  >
                                    <Edit3 className="w-3 h-3 text-slate-400" />
                                    <span>Edit</span>
                                  </button>
                                  <button
                                    type="button"
                                    onClick={() =>
                                      handleRequestDelete(
                                        cat.id,
                                        sub.id,
                                        `${cat.nama} › ${sub.nama}`,
                                        subBudgetNominal
                                      )
                                    }
                                    className="px-2 py-1 rounded-lg border border-rose-200 dark:border-rose-900/40 text-xs font-semibold text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition min-h-[34px]"
                                    title="Hapus budget subkategori ini"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                  </button>
                                </div>
                              ) : (
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleOpenEdit(
                                      cat.id,
                                      sub.id,
                                      `${cat.nama} › ${sub.nama}`
                                    )
                                  }
                                  className="px-2.5 py-1 rounded-lg border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 hover:bg-white dark:hover:bg-slate-700 transition min-h-[34px] flex items-center gap-1"
                                >
                                  <Plus className="w-3 h-3" />
                                  <span>+ Budget</span>
                                </button>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Add / Edit Budget Modal */}
      <AddEditBudgetModal
        isOpen={isAddModalOpen}
        onClose={() => {
          setIsAddModalOpen(false);
          setEditingTarget(null);
        }}
        initialTarget={editingTarget}
        activeMonth={activeMonth}
        onDeleteRequest={(kategoriId, subkategoriId, nama, nominal) => {
          handleRequestDelete(kategoriId, subkategoriId, nama, nominal);
        }}
      />

      {/* Delete Budget Confirmation Modal */}
      <ConfirmModal
        isOpen={!!deleteConfirmTarget}
        onClose={() => setDeleteConfirmTarget(null)}
        onConfirm={handleConfirmDelete}
        title="Hapus Anggaran Budget?"
        message={`Apakah Anda yakin ingin menghapus alokasi budget untuk "${deleteConfirmTarget?.nama}" sebesar ${
          deleteConfirmTarget ? formatRupiah(deleteConfirmTarget.nominal) : 'Rp 0'
        } pada bulan ${formatMonthName(activeMonth)}? Pengeluaran yang sudah terjadi tidak akan hilang.`}
        confirmLabel="Ya, Hapus Budget"
        cancelLabel="Batal"
        isDanger={true}
      />

      {/* Copy From Previous Month Confirmation Modal */}
      <ConfirmModal
        isOpen={isCopyModalOpen}
        onClose={() => setIsCopyModalOpen(false)}
        onConfirm={handleCopyFromPreviousMonth}
        title="Salin Budget dari Bulan Lalu?"
        message={`Sistem mendeteksi ada ${prevMonthBudgets.length} alokasi anggaran pada bulan ${formatMonthName(
          prevMonth
        )}. Salin semua anggaran tersebut ke bulan ${formatMonthName(activeMonth)}?`}
        confirmLabel="Ya, Salin Semua Budget"
        cancelLabel="Batal"
        isDanger={false}
      />
    </div>
  );
};
