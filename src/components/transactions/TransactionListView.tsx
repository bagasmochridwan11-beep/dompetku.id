import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Transaction, TransactionType } from '../../types/finance';
import { formatRupiah, formatIndoDate, formatRelativeDate, formatCurrency } from '../../utils/formatters';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Search,
  Filter,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  X,
  ArrowUpDown,
  ChevronDown,
  Bot,
  Camera,
  Wallet,
  ArrowRightLeft,
  Download,
} from 'lucide-react';

interface TransactionListViewProps {
  onOpenAddModal: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenChatModal?: () => void;
  onOpenReceiptModal?: () => void;
}

export const TransactionListView: React.FC<TransactionListViewProps> = ({
  onOpenAddModal,
  onEditTransaction,
  onOpenChatModal,
  onOpenReceiptModal,
}) => {
  const {
    transactions,
    categories,
    subcategories,
    wallets,
    deleteTransaction,
    getCategoryById,
    getSubcategoryById,
    getWalletById,
  } = useFinance();

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [walletFilter, setWalletFilter] = useState<string>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [subcategoryFilter, setSubcategoryFilter] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showFilterDrawer, setShowFilterDrawer] = useState(false);

  // Deletion modal state
  const [txToDelete, setTxToDelete] = useState<Transaction | null>(null);

  // Available subcategories depending on categoryFilter
  const availableSubcategories = useMemo(() => {
    if (categoryFilter === 'all') return [];
    return subcategories.filter((s) => s.kategoriId === categoryFilter && !s.diarsipkan);
  }, [categoryFilter, subcategories]);

  // Filtering transactions
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      // Search note, category, or sub name
      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const cat = getCategoryById(t.kategoriId);
        const sub = t.subkategoriId ? getSubcategoryById(t.subkategoriId) : null;
        const wallet = t.dompetId ? getWalletById(t.dompetId) : null;
        const matchNote = t.catatan.toLowerCase().includes(query);
        const matchCat = cat?.nama.toLowerCase().includes(query);
        const matchSub = sub?.nama.toLowerCase().includes(query);
        const matchWallet = wallet?.nama.toLowerCase().includes(query);
        const matchAmount = t.nominal.toString().includes(query);
        if (!matchNote && !matchCat && !matchSub && !matchWallet && !matchAmount) {
          return false;
        }
      }

      // Type filter
      if (typeFilter !== 'all' && t.tipe !== typeFilter) {
        return false;
      }

      // Wallet filter
      if (walletFilter !== 'all') {
        if (t.dompetId !== walletFilter && t.tujuanDompetId !== walletFilter) {
          return false;
        }
      }

      // Category filter
      if (categoryFilter !== 'all' && t.kategoriId !== categoryFilter) {
        return false;
      }

      // Subcategory filter
      if (subcategoryFilter !== 'all') {
        if (subcategoryFilter === '__NONE__') {
          if (t.subkategoriId) return false;
        } else if (t.subkategoriId !== subcategoryFilter) {
          return false;
        }
      }

      // Date range filter
      if (startDate && t.tanggal < startDate) return false;
      if (endDate && t.tanggal > endDate) return false;

      return true;
    });
  }, [
    transactions,
    searchTerm,
    typeFilter,
    walletFilter,
    categoryFilter,
    subcategoryFilter,
    startDate,
    endDate,
    getCategoryById,
    getSubcategoryById,
    getWalletById,
  ]);

  // Metrics on filtered list
  const metrics = useMemo(() => {
    let income = 0;
    let expense = 0;
    let transfer = 0;

    filteredTransactions.forEach((t) => {
      if (t.tipe === 'pemasukan') income += t.nominal;
      else if (t.tipe === 'pengeluaran') expense += t.nominal;
      else if (t.tipe === 'transfer') transfer += t.nominal;
    });

    return { income, expense, transfer, net: income - expense };
  }, [filteredTransactions]);

  // Group transactions by date descending
  const groupedByDate = useMemo(() => {
    const groups: { [dateStr: string]: Transaction[] } = {};

    const sorted = [...filteredTransactions].sort((a, b) => {
      const cmp = b.tanggal.localeCompare(a.tanggal);
      if (cmp !== 0) return cmp;
      return (b.createdAt || 0) - (a.createdAt || 0);
    });

    sorted.forEach((tx) => {
      if (!groups[tx.tanggal]) {
        groups[tx.tanggal] = [];
      }
      groups[tx.tanggal].push(tx);
    });

    return Object.entries(groups);
  }, [filteredTransactions]);

  const activeFiltersCount =
    (typeFilter !== 'all' ? 1 : 0) +
    (walletFilter !== 'all' ? 1 : 0) +
    (categoryFilter !== 'all' ? 1 : 0) +
    (subcategoryFilter !== 'all' ? 1 : 0) +
    (startDate ? 1 : 0) +
    (endDate ? 1 : 0);

  const resetFilters = () => {
    setSearchTerm('');
    setTypeFilter('all');
    setWalletFilter('all');
    setCategoryFilter('all');
    setSubcategoryFilter('all');
    setStartDate('');
    setEndDate('');
  };

  // Export filtered transactions to CSV
  const handleExportCSV = () => {
    const headers = ['Tanggal', 'Tipe', 'Kategori', 'Subkategori', 'Nominal', 'Dompet', 'Catatan'];
    const rows = filteredTransactions.map((t) => {
      const cat = getCategoryById(t.kategoriId)?.nama || '';
      const sub = t.subkategoriId ? getSubcategoryById(t.subkategoriId)?.nama || '' : '';
      const wallet = t.dompetId ? getWalletById(t.dompetId)?.nama || '' : '';
      return [
        t.tanggal,
        t.tipe,
        `"${cat}"`,
        `"${sub}"`,
        t.nominal,
        `"${wallet}"`,
        `"${(t.catatan || '').replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `transaksi_dompetku_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-5 pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Riwayat Transaksi
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Daftar lengkap transaksi dan mutasi rekening dengan filter multi-dimensi
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap self-start sm:self-auto">
          <button
            type="button"
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold shadow-xs hover:bg-slate-50 transition min-h-[44px]"
            title="Ekspor CSV"
          >
            <Download className="w-3.5 h-3.5 text-slate-500" />
            <span>Ekspor CSV</span>
          </button>

          {onOpenChatModal && (
            <button
              type="button"
              onClick={onOpenChatModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-emerald-500/30 bg-emerald-50/60 dark:bg-emerald-950/40 hover:bg-emerald-100 text-emerald-800 dark:text-emerald-300 font-semibold text-xs sm:text-sm transition active:scale-95 min-h-[44px]"
            >
              <Bot className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>Via Chat AI</span>
            </button>
          )}

          {onOpenReceiptModal && (
            <button
              type="button"
              onClick={onOpenReceiptModal}
              className="flex items-center gap-1.5 px-3.5 py-2.5 rounded-2xl border border-blue-500/30 bg-blue-50/60 dark:bg-blue-950/40 hover:bg-blue-100 text-blue-800 dark:text-blue-300 font-semibold text-xs sm:text-sm transition active:scale-95 min-h-[44px]"
            >
              <Camera className="w-4 h-4 text-blue-600 dark:text-blue-400" />
              <span>Scan Nota</span>
            </button>
          )}

          <button
            type="button"
            onClick={onOpenAddModal}
            className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition active:scale-95 min-h-[44px]"
          >
            <Plus className="w-4 h-4 stroke-[3]" />
            <span>Tambah</span>
          </button>
        </div>
      </div>

      {/* Filter Summary Metrics */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Pemasukan</span>
          <span className="text-sm sm:text-base font-bold text-emerald-600 dark:text-emerald-400">
            +{formatCurrency(metrics.income)}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Pengeluaran</span>
          <span className="text-sm sm:text-base font-bold text-rose-600 dark:text-rose-400">
            -{formatCurrency(metrics.expense)}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Transfer Antar Dompet</span>
          <span className="text-sm sm:text-base font-bold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(metrics.transfer)}
          </span>
        </div>
        <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] text-slate-400 block font-medium">Arus Kas Bersih</span>
          <span className={`text-sm sm:text-base font-bold ${metrics.net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'}`}>
            {metrics.net >= 0 ? '+' : ''}{formatCurrency(metrics.net)}
          </span>
        </div>
      </div>

      {/* Search and Quick Filters Bar */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
          {/* Search Input */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              placeholder="Cari transaksi, toko, dompet, nominal..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full text-xs pl-9 pr-8 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[40px]"
            />
            {searchTerm && (
              <button
                type="button"
                onClick={() => setSearchTerm('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>

          {/* Type Segmented Controls (Semua / Pengeluaran / Pemasukan / Transfer) */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl overflow-x-auto">
            <button
              type="button"
              onClick={() => setTypeFilter('all')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[34px] cursor-pointer ${
                typeFilter === 'all'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Semua
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('pengeluaran')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[34px] cursor-pointer ${
                typeFilter === 'pengeluaran'
                  ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pengeluaran
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('pemasukan')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[34px] cursor-pointer ${
                typeFilter === 'pemasukan'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Pemasukan
            </button>
            <button
              type="button"
              onClick={() => setTypeFilter('transfer')}
              className={`px-3 py-1.5 rounded-xl text-xs font-bold transition min-h-[34px] cursor-pointer ${
                typeFilter === 'transfer'
                  ? 'bg-white dark:bg-slate-700 text-indigo-600 dark:text-indigo-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              Transfer
            </button>
          </div>

          {/* Toggle More Filters */}
          <button
            type="button"
            onClick={() => setShowFilterDrawer(!showFilterDrawer)}
            className={`flex items-center justify-center gap-1.5 px-3 py-2 rounded-2xl border text-xs font-bold transition min-h-[40px] cursor-pointer ${
              activeFiltersCount > (typeFilter !== 'all' ? 1 : 0)
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-700 dark:text-emerald-300'
                : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 text-slate-700 dark:text-slate-300'
            }`}
          >
            <Filter className="w-3.5 h-3.5" />
            <span>Filter</span>
            {activeFiltersCount > 0 && (
              <span className="w-4 h-4 rounded-full bg-emerald-600 text-white text-[10px] flex items-center justify-center font-bold">
                {activeFiltersCount}
              </span>
            )}
          </button>
        </div>

        {/* Extended Filter Drawer */}
        {showFilterDrawer && (
          <div className="pt-3 border-t border-slate-100 dark:border-slate-800 grid grid-cols-1 sm:grid-cols-4 gap-3 animate-in fade-in duration-100">
            {/* Wallet Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Dompet / Rekening
              </label>
              <select
                value={walletFilter}
                onChange={(e) => setWalletFilter(e.target.value)}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">Semua Dompet</option>
                {wallets.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.ikon} {w.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Category Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Kategori
              </label>
              <select
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value);
                  setSubcategoryFilter('all');
                }}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              >
                <option value="all">Semua Kategori</option>
                {categories
                  .filter((c) => !c.diarsipkan)
                  .map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.ikon} {c.nama} ({c.tipe})
                    </option>
                  ))}
              </select>
            </div>

            {/* Subcategory Filter */}
            <div>
              <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                Subkategori
              </label>
              <select
                value={subcategoryFilter}
                onChange={(e) => setSubcategoryFilter(e.target.value)}
                disabled={categoryFilter === 'all' || availableSubcategories.length === 0}
                className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 disabled:opacity-50"
              >
                <option value="all">Semua Subkategori</option>
                {availableSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ikon} {s.nama}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range & Reset */}
            <div className="flex items-end gap-2">
              <div className="flex-1">
                <label className="text-[11px] font-bold uppercase tracking-wider text-slate-400 block mb-1">
                  Mulai Tanggal
                </label>
                <input
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200"
                />
              </div>
              <button
                type="button"
                onClick={resetFilters}
                className="px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:bg-slate-100 text-xs font-semibold text-slate-600 dark:text-slate-400 transition"
              >
                Reset
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Transaction List Grouped by Date */}
      {groupedByDate.length === 0 ? (
        <div className="p-12 text-center rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
          <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 text-slate-400 flex items-center justify-center mx-auto">
            <Search className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-800 dark:text-slate-200">
              Tidak ada transaksi ditemukan
            </h3>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              Coba sesuaikan kata kunci pencarian atau reset filter di atas.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          {groupedByDate.map(([dateStr, items]) => {
            const dayExpense = items
              .filter((i) => i.tipe === 'pengeluaran')
              .reduce((sum, i) => sum + i.nominal, 0);
            const dayIncome = items
              .filter((i) => i.tipe === 'pemasukan')
              .reduce((sum, i) => sum + i.nominal, 0);

            return (
              <div
                key={dateStr}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs overflow-hidden"
              >
                {/* Date Group Header */}
                <div className="px-5 py-3 bg-slate-50/70 dark:bg-slate-800/40 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2 font-bold text-slate-800 dark:text-slate-200">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{formatIndoDate(dateStr)}</span>
                  </div>

                  <div className="flex items-center gap-3 text-[11px] font-semibold">
                    {dayIncome > 0 && (
                      <span className="text-emerald-600 dark:text-emerald-400">
                        +{formatCurrency(dayIncome)}
                      </span>
                    )}
                    {dayExpense > 0 && (
                      <span className="text-rose-600 dark:text-rose-400">
                        -{formatCurrency(dayExpense)}
                      </span>
                    )}
                  </div>
                </div>

                {/* List items for this date */}
                <div className="divide-y divide-slate-100 dark:divide-slate-800">
                  {items.map((tx) => {
                    const cat = getCategoryById(tx.kategoriId);
                    const sub = tx.subkategoriId ? getSubcategoryById(tx.subkategoriId) : undefined;
                    const wallet = tx.dompetId ? getWalletById(tx.dompetId) : undefined;
                    const targetWallet = tx.tujuanDompetId ? getWalletById(tx.tujuanDompetId) : undefined;
                    const isExpense = tx.tipe === 'pengeluaran';
                    const isIncome = tx.tipe === 'pemasukan';
                    const isTransfer = tx.tipe === 'transfer';

                    return (
                      <div
                        key={tx.id}
                        className="p-4 flex items-center justify-between gap-3 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 transition group"
                      >
                        <div className="flex items-center gap-3 min-w-0">
                          <div
                            className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg shrink-0"
                            style={{
                              backgroundColor: cat ? `${cat.warna}15` : '#f1f5f9',
                              color: cat ? cat.warna : '#64748b',
                            }}
                          >
                            {isTransfer ? '⇄' : cat?.ikon || '📝'}
                          </div>

                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 dark:text-white truncate">
                              {tx.catatan || (isTransfer ? 'Transfer Antar Dompet' : cat?.nama)}
                            </p>
                            <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                              {isTransfer ? (
                                <span>
                                  {wallet?.nama || 'Dompet Asal'} → {targetWallet?.nama || 'Dompet Tujuan'}
                                </span>
                              ) : (
                                <span>{cat?.nama}</span>
                              )}
                              {sub && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>{sub.nama}</span>
                                </>
                              )}
                              {wallet && !isTransfer && (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span className="font-semibold text-slate-600 dark:text-slate-300">
                                    {wallet.nama}
                                  </span>
                                </>
                              )}
                              {tx.biayaAdmin ? (
                                <>
                                  <span aria-hidden="true">·</span>
                                  <span>Admin: {formatCurrency(tx.biayaAdmin)}</span>
                                </>
                              ) : null}
                            </div>
                          </div>
                        </div>

                        <div className="flex items-center gap-3 shrink-0">
                          <span
                            className={`text-xs sm:text-sm font-bold block tabular-nums ${
                              isExpense
                                ? 'text-rose-600 dark:text-rose-400'
                                : isIncome
                                ? 'text-emerald-600 dark:text-emerald-400'
                                : 'text-indigo-600 dark:text-indigo-400'
                            }`}
                          >
                            {isExpense ? '-' : isIncome ? '+' : ''}{formatRupiah(tx.nominal)}
                          </span>

                          <div className="flex items-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              type="button"
                              onClick={() => onEditTransaction(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                              title="Ubah Transaksi"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>
                            <button
                              type="button"
                              onClick={() => setTxToDelete(tx)}
                              className="p-1.5 rounded-lg text-slate-400 hover:text-red-600"
                              title="Hapus Transaksi"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {txToDelete && (
        <ConfirmModal
          isOpen={true}
          onClose={() => setTxToDelete(null)}
          onConfirm={() => {
            deleteTransaction(txToDelete.id);
            setTxToDelete(null);
          }}
          title="Hapus Transaksi?"
          message={`Apakah Anda yakin ingin menghapus transaksi sebesar ${formatRupiah(
            txToDelete.nominal
          )} (${txToDelete.catatan || 'Tanpa catatan'})? Saldo dompet akan disesuaikan kembali.`}
          confirmLabel="Hapus Transaksi"
          isDanger={true}
        />
      )}
    </div>
  );
};
