import React, { useState, useMemo } from 'react';
import { useFinance } from '../../context/FinanceContext';
import {
  formatRupiah,
  exportToCSV,
  getCurrentMonthString,
  shiftMonthString,
  formatMonthName,
} from '../../utils/formatters';
import {
  Download,
  FileSpreadsheet,
  ChevronDown,
  ChevronUp,
  TrendingUp,
  TrendingDown,
  Scale,
  Calendar,
} from 'lucide-react';

export const ReportsView: React.FC = () => {
  const { categories, subcategories, transactions, getCategoryById, getSubcategoryById } =
    useFinance();

  const currentMonth = getCurrentMonthString();
  const lastMonth = shiftMonthString(currentMonth, -1);
  const currentYear = currentMonth.split('-')[0];

  const [periodPreset, setPeriodPreset] = useState<'this_month' | 'last_month' | 'this_year' | 'custom'>(
    'this_month'
  );
  const [customStart, setCustomStart] = useState<string>(`${currentMonth}-01`);
  const [customEnd, setCustomEnd] = useState<string>(`${currentMonth}-31`);

  const [expandedRows, setExpandedRows] = useState<{ [catId: string]: boolean }>({});

  const toggleRow = (catId: string) => {
    setExpandedRows((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  // Filter transactions for report period
  const periodTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (periodPreset === 'this_month') {
        return t.tanggal.startsWith(currentMonth);
      }
      if (periodPreset === 'last_month') {
        return t.tanggal.startsWith(lastMonth);
      }
      if (periodPreset === 'this_year') {
        return t.tanggal.startsWith(currentYear);
      }
      if (periodPreset === 'custom') {
        if (customStart && t.tanggal < customStart) return false;
        if (customEnd && t.tanggal > customEnd) return false;
        return true;
      }
      return true;
    });
  }, [transactions, periodPreset, currentMonth, lastMonth, currentYear, customStart, customEnd]);

  // Totals
  const totalIncome = periodTransactions
    .filter((t) => t.tipe === 'pemasukan')
    .reduce((sum, t) => sum + t.nominal, 0);

  const totalExpense = periodTransactions
    .filter((t) => t.tipe === 'pengeluaran')
    .reduce((sum, t) => sum + t.nominal, 0);

  const netSavings = totalIncome - totalExpense;
  const savingsRate = totalIncome > 0 ? (netSavings / totalIncome) * 100 : 0;

  // Breakdown tables per category
  const expenseBreakdown = useMemo(() => {
    const list = categories.filter((c) => c.tipe === 'pengeluaran');
    return list
      .map((cat) => {
        const catTxs = periodTransactions.filter((t) => t.kategoriId === cat.id);
        const catTotal = catTxs.reduce((sum, t) => sum + t.nominal, 0);

        const subs = subcategories.filter((s) => s.kategoriId === cat.id);
        const subData = subs.map((sub) => {
          const subTxs = catTxs.filter((t) => t.subkategoriId === sub.id);
          const subTotal = subTxs.reduce((sum, t) => sum + t.nominal, 0);
          return {
            sub,
            total: subTotal,
            count: subTxs.length,
            percentageOfCategory: catTotal > 0 ? (subTotal / catTotal) * 100 : 0,
          };
        });

        const noSubTxs = catTxs.filter((t) => !t.subkategoriId);
        const noSubTotal = noSubTxs.reduce((sum, t) => sum + t.nominal, 0);

        return {
          cat,
          total: catTotal,
          count: catTxs.length,
          subData,
          noSubTotal,
          percentageOfExpense: totalExpense > 0 ? (catTotal / totalExpense) * 100 : 0,
        };
      })
      .filter((item) => item.total > 0 || !item.cat.diarsipkan)
      .sort((a, b) => b.total - a.total);
  }, [categories, subcategories, periodTransactions, totalExpense]);

  const incomeBreakdown = useMemo(() => {
    const list = categories.filter((c) => c.tipe === 'pemasukan');
    return list
      .map((cat) => {
        const catTxs = periodTransactions.filter((t) => t.kategoriId === cat.id);
        const catTotal = catTxs.reduce((sum, t) => sum + t.nominal, 0);

        const subs = subcategories.filter((s) => s.kategoriId === cat.id);
        const subData = subs.map((sub) => {
          const subTxs = catTxs.filter((t) => t.subkategoriId === sub.id);
          const subTotal = subTxs.reduce((sum, t) => sum + t.nominal, 0);
          return {
            sub,
            total: subTotal,
            count: subTxs.length,
            percentageOfCategory: catTotal > 0 ? (subTotal / catTotal) * 100 : 0,
          };
        });

        const noSubTxs = catTxs.filter((t) => !t.subkategoriId);
        const noSubTotal = noSubTxs.reduce((sum, t) => sum + t.nominal, 0);

        return {
          cat,
          total: catTotal,
          count: catTxs.length,
          subData,
          noSubTotal,
          percentageOfIncome: totalIncome > 0 ? (catTotal / totalIncome) * 100 : 0,
        };
      })
      .filter((item) => item.total > 0 || !item.cat.diarsipkan)
      .sort((a, b) => b.total - a.total);
  }, [categories, subcategories, periodTransactions, totalIncome]);

  // Export to CSV
  const handleExportCSV = () => {
    const headers = ['ID', 'Tanggal', 'Tipe', 'Kategori', 'Subkategori', 'Nominal (Rp)', 'Catatan'];
    const rows = periodTransactions.map((t) => {
      const cat = getCategoryById(t.kategoriId);
      const sub = t.subkategoriId ? getSubcategoryById(t.subkategoriId) : null;
      return [
        t.id,
        t.tanggal,
        t.tipe === 'pemasukan' ? 'Pemasukan' : 'Pengeluaran',
        cat ? cat.nama : 'Tanpa Kategori',
        sub ? sub.nama : '',
        t.nominal.toString(),
        t.catatan || '',
      ];
    });

    const periodLabel =
      periodPreset === 'this_month'
        ? currentMonth
        : periodPreset === 'last_month'
        ? lastMonth
        : periodPreset === 'this_year'
        ? currentYear
        : `${customStart}_sd_${customEnd}`;

    exportToCSV(`laporan_keuangan_${periodLabel}.csv`, [headers, ...rows]);
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Laporan Keuangan
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Analisis bertingkat pemasukan dan pengeluaran per kategori & subkategori
          </p>
        </div>

        <button
          type="button"
          onClick={handleExportCSV}
          disabled={periodTransactions.length === 0}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition active:scale-95 disabled:opacity-50 self-start sm:self-auto min-h-[44px]"
        >
          <FileSpreadsheet className="w-4 h-4" />
          <span>Ekspor CSV</span>
        </button>
      </div>

      {/* Period Selector Tabs */}
      <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            onClick={() => setPeriodPreset('this_month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition min-h-[36px] ${
              periodPreset === 'this_month'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Bulan Ini ({formatMonthName(currentMonth)})
          </button>
          <button
            type="button"
            onClick={() => setPeriodPreset('last_month')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition min-h-[36px] ${
              periodPreset === 'last_month'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Bulan Lalu ({formatMonthName(lastMonth)})
          </button>
          <button
            type="button"
            onClick={() => setPeriodPreset('this_year')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition min-h-[36px] ${
              periodPreset === 'this_year'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Tahun {currentYear}
          </button>
          <button
            type="button"
            onClick={() => setPeriodPreset('custom')}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-semibold transition min-h-[36px] ${
              periodPreset === 'custom'
                ? 'bg-slate-900 text-white dark:bg-white dark:text-slate-900'
                : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Rentang Kustom
          </button>
        </div>

        {periodPreset === 'custom' && (
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs text-slate-500 font-medium">Dari:</span>
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 min-h-[36px]"
            />
            <span className="text-xs text-slate-500 font-medium">Sampai:</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2.5 py-1 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-xs text-slate-800 dark:text-slate-200 min-h-[36px]"
            />
          </div>
        )}
      </div>

      {/* Comparison Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Pemasukan</span>
            <TrendingUp className="w-4 h-4 text-emerald-600" />
          </div>
          <p className="text-lg font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
            {formatRupiah(totalIncome)}
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Pengeluaran</span>
            <TrendingDown className="w-4 h-4 text-rose-600" />
          </div>
          <p className="text-lg font-bold text-rose-600 dark:text-rose-400 tabular-nums">
            {formatRupiah(totalExpense)}
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Net Arus Kas</span>
            <Scale className="w-4 h-4 text-blue-600" />
          </div>
          <p
            className={`text-lg font-bold tabular-nums ${
              netSavings >= 0 ? 'text-slate-900 dark:text-white' : 'text-rose-600'
            }`}
          >
            {formatRupiah(netSavings)}
          </p>
        </div>

        <div className="p-4 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between text-xs text-slate-500 mb-1">
            <span>Rasio Tabungan</span>
            <span className="text-[11px] text-slate-400 font-mono">%</span>
          </div>
          <p
            className={`text-lg font-bold tabular-nums ${
              savingsRate >= 20 ? 'text-emerald-600' : savingsRate >= 0 ? 'text-amber-600' : 'text-rose-600'
            }`}
          >
            {savingsRate.toFixed(1)}%
          </p>
        </div>
      </div>

      {/* Rincian Pengeluaran Bertingkat Table */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Rincian Pengeluaran Bertingkat (Kategori & Subkategori)
        </h3>

        {expenseBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Tidak ada transaksi pengeluaran pada periode ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Kategori / Subkategori</th>
                  <th className="pb-3 text-center">Jumlah Transaksi</th>
                  <th className="pb-3 text-right">Porsi (%)</th>
                  <th className="pb-3 pr-2 text-right">Total Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {expenseBreakdown.map((item) => {
                  const isExpanded = !!expandedRows[item.cat.id];
                  const hasSubData = item.subData.some((s) => s.total > 0) || item.noSubTotal > 0;

                  return (
                    <React.Fragment key={item.cat.id}>
                      {/* Parent Category Row */}
                      <tr
                        onClick={() => hasSubData && toggleRow(item.cat.id)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                          hasSubData ? 'cursor-pointer' : ''
                        }`}
                      >
                        <td className="py-3 pl-2 flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
                          <span
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow-2xs"
                            style={{ backgroundColor: `${item.cat.warna}25`, color: item.cat.warna }}
                          >
                            {item.cat.ikon}
                          </span>
                          <span>{item.cat.nama}</span>
                          {hasSubData && (
                            <span className="text-slate-400 ml-1">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 inline" /> : <ChevronDown className="w-3.5 h-3.5 inline" />}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center text-slate-500 font-mono">
                          {item.count}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-500">
                          {item.percentageOfExpense.toFixed(1)}%
                        </td>
                        <td className="py-3 pr-2 text-right font-bold text-slate-900 dark:text-white tabular-nums">
                          {formatRupiah(item.total)}
                        </td>
                      </tr>

                      {/* Subcategories Child Rows */}
                      {isExpanded &&
                        item.subData
                          .filter((s) => s.total > 0)
                          .map((subItem) => (
                            <tr
                              key={subItem.sub.id}
                              className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300"
                            >
                              <td className="py-2 pl-9 flex items-center gap-2">
                                <span>{subItem.sub.ikon}</span>
                                <span>{subItem.sub.nama}</span>
                              </td>
                              <td className="py-2 text-center text-slate-400 font-mono">
                                {subItem.count}
                              </td>
                              <td className="py-2 text-right font-mono text-slate-400">
                                {subItem.percentageOfCategory.toFixed(1)}% (kat)
                              </td>
                              <td className="py-2 pr-2 text-right font-semibold tabular-nums text-slate-700 dark:text-slate-200">
                                {formatRupiah(subItem.total)}
                              </td>
                            </tr>
                          ))}

                      {/* Without Subcategory Entry if applicable */}
                      {isExpanded && item.noSubTotal > 0 && (
                        <tr className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-500 italic">
                          <td className="py-2 pl-9 flex items-center gap-2">
                            <span>📁</span>
                            <span>Tanpa Subkategori</span>
                          </td>
                          <td className="py-2 text-center text-slate-400 font-mono">-</td>
                          <td className="py-2 text-right font-mono text-slate-400">
                            {((item.noSubTotal / item.total) * 100).toFixed(1)}% (kat)
                          </td>
                          <td className="py-2 pr-2 text-right font-semibold tabular-nums text-slate-600 dark:text-slate-300">
                            {formatRupiah(item.noSubTotal)}
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Rincian Pemasukan Bertingkat Table */}
      <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
        <h3 className="text-base font-bold text-slate-900 dark:text-white">
          Rincian Pemasukan Bertingkat
        </h3>

        {incomeBreakdown.length === 0 ? (
          <p className="text-xs text-slate-400 py-4 text-center">Tidak ada transaksi pemasukan pada periode ini.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 dark:border-slate-800 text-slate-400 font-semibold uppercase tracking-wider">
                  <th className="pb-3 pl-2">Kategori / Subkategori</th>
                  <th className="pb-3 text-center">Jumlah Transaksi</th>
                  <th className="pb-3 text-right">Porsi (%)</th>
                  <th className="pb-3 pr-2 text-right">Total Nominal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-800/80">
                {incomeBreakdown.map((item) => {
                  const isExpanded = !!expandedRows[item.cat.id];
                  const hasSubData = item.subData.some((s) => s.total > 0) || item.noSubTotal > 0;

                  return (
                    <React.Fragment key={item.cat.id}>
                      <tr
                        onClick={() => hasSubData && toggleRow(item.cat.id)}
                        className={`hover:bg-slate-50 dark:hover:bg-slate-800/60 transition ${
                          hasSubData ? 'cursor-pointer' : ''
                        }`}
                      >
                        <td className="py-3 pl-2 flex items-center gap-2.5 font-bold text-slate-900 dark:text-white">
                          <span
                            className="w-7 h-7 rounded-xl flex items-center justify-center text-sm shadow-2xs"
                            style={{ backgroundColor: `${item.cat.warna}25`, color: item.cat.warna }}
                          >
                            {item.cat.ikon}
                          </span>
                          <span>{item.cat.nama}</span>
                          {hasSubData && (
                            <span className="text-slate-400 ml-1">
                              {isExpanded ? <ChevronUp className="w-3.5 h-3.5 inline" /> : <ChevronDown className="w-3.5 h-3.5 inline" />}
                            </span>
                          )}
                        </td>
                        <td className="py-3 text-center text-slate-500 font-mono">
                          {item.count}
                        </td>
                        <td className="py-3 text-right font-mono text-slate-500">
                          {item.percentageOfIncome.toFixed(1)}%
                        </td>
                        <td className="py-3 pr-2 text-right font-bold text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {formatRupiah(item.total)}
                        </td>
                      </tr>

                      {isExpanded &&
                        item.subData
                          .filter((s) => s.total > 0)
                          .map((subItem) => (
                            <tr
                              key={subItem.sub.id}
                              className="bg-slate-50/50 dark:bg-slate-800/30 text-slate-600 dark:text-slate-300"
                            >
                              <td className="py-2 pl-9 flex items-center gap-2">
                                <span>{subItem.sub.ikon}</span>
                                <span>{subItem.sub.nama}</span>
                              </td>
                              <td className="py-2 text-center text-slate-400 font-mono">
                                {subItem.count}
                              </td>
                              <td className="py-2 text-right font-mono text-slate-400">
                                {subItem.percentageOfCategory.toFixed(1)}% (kat)
                              </td>
                              <td className="py-2 pr-2 text-right font-semibold tabular-nums text-emerald-700 dark:text-emerald-300">
                                {formatRupiah(subItem.total)}
                              </td>
                            </tr>
                          ))}
                    </React.Fragment>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};
