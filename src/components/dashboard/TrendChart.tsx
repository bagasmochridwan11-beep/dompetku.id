import React, { useState } from 'react';
import { Category, Transaction } from '../../types/finance';
import { formatRupiah } from '../../utils/formatters';
import { TrendingUp, BarChart3 } from 'lucide-react';

interface TrendChartProps {
  transactions: Transaction[];
  categories: Category[];
  activeMonth: string; // YYYY-MM
}

export const TrendChart: React.FC<TrendChartProps> = ({
  transactions,
  categories,
  activeMonth,
}) => {
  const [activeTab, setActiveTab] = useState<'trend' | 'income_cat'>('income_cat');

  // Days in month
  const [yearStr, monthStr] = activeMonth.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10);
  const daysInMonth = new Date(year, month, 0).getDate();

  // Daily totals
  const dailyData: { day: number; dateStr: string; income: number; expense: number }[] = [];
  for (let d = 1; d <= daysInMonth; d++) {
    const padDay = String(d).padStart(2, '0');
    const dateStr = `${activeMonth}-${padDay}`;
    const dayTxs = transactions.filter((t) => t.tanggal === dateStr);
    const income = dayTxs
      .filter((t) => t.tipe === 'pemasukan')
      .reduce((sum, t) => sum + t.nominal, 0);
    const expense = dayTxs
      .filter((t) => t.tipe === 'pengeluaran')
      .reduce((sum, t) => sum + t.nominal, 0);

    dailyData.push({ day: d, dateStr, income, expense });
  }

  const maxDailyValue = Math.max(
    ...dailyData.map((d) => Math.max(d.income, d.expense)),
    100000
  );

  // Income by category
  const incomeTxs = transactions.filter((t) => t.tipe === 'pemasukan');
  const incomeCatMap = new Map<string, number>();
  incomeTxs.forEach((t) => {
    incomeCatMap.set(t.kategoriId, (incomeCatMap.get(t.kategoriId) || 0) + t.nominal);
  });

  const totalIncome = incomeTxs.reduce((sum, t) => sum + t.nominal, 0);
  const incomeSlices = Array.from(incomeCatMap.entries())
    .map(([catId, val]) => {
      const cat = categories.find((c) => c.id === catId);
      return {
        id: catId,
        name: cat ? cat.nama : 'Lainnya',
        icon: cat ? cat.ikon : '💰',
        color: cat ? cat.warna : '#10b981',
        value: val,
        percentage: totalIncome > 0 ? (val / totalIncome) * 100 : 0,
      };
    })
    .sort((a, b) => b.value - a.value);

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs">
      {/* Header and Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            {activeTab === 'trend' ? 'Tren Transaksi Harian' : 'Distribusi Pemasukan'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {activeTab === 'trend'
              ? 'Pemasukan (hijau) vs Pengeluaran (merah) per tanggal'
              : 'Rincian sumber pemasukan berdasarkan kategori custom'}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl self-start sm:self-auto">
          <button
            type="button"
            onClick={() => setActiveTab('trend')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition min-h-[32px] ${
              activeTab === 'trend'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Tren Harian</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('income_cat')}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg transition min-h-[32px] ${
              activeTab === 'income_cat'
                ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            <BarChart3 className="w-3.5 h-3.5" />
            <span>Pemasukan</span>
          </button>
        </div>
      </div>

      {activeTab === 'trend' ? (
        <div>
          {/* Legend */}
          <div className="flex items-center gap-4 text-xs font-medium mb-3">
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="text-slate-600 dark:text-slate-300">Pemasukan</span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded-full bg-rose-500" />
              <span className="text-slate-600 dark:text-slate-300">Pengeluaran</span>
            </div>
          </div>

          {/* Bar Chart Container */}
          <div className="overflow-x-auto pb-2">
            <div className="min-w-[500px] h-48 flex items-end gap-1.5 border-b border-slate-200 dark:border-slate-800 pt-4 px-1">
              {dailyData.map((d) => {
                const incomeHeight = d.income > 0 ? (d.income / maxDailyValue) * 100 : 0;
                const expenseHeight = d.expense > 0 ? (d.expense / maxDailyValue) * 100 : 0;
                const hasData = d.income > 0 || d.expense > 0;

                return (
                  <div
                    key={d.day}
                    className="flex-1 flex flex-col items-center justify-end h-full group relative cursor-pointer"
                  >
                    {/* Tooltip on hover */}
                    {hasData && (
                      <div className="absolute bottom-full mb-2 hidden group-hover:flex flex-col items-center z-20 pointer-events-none">
                        <div className="bg-slate-900 dark:bg-slate-100 text-white dark:text-slate-900 text-[10px] rounded-lg py-1 px-2 shadow-lg whitespace-nowrap">
                          <p className="font-bold">Tgl {d.day}</p>
                          {d.income > 0 && <p className="text-emerald-400 dark:text-emerald-700">Masuk: {formatRupiah(d.income)}</p>}
                          {d.expense > 0 && <p className="text-rose-400 dark:text-rose-700">Keluar: {formatRupiah(d.expense)}</p>}
                        </div>
                        <div className="w-1.5 h-1.5 bg-slate-900 dark:bg-slate-100 rotate-45 -mt-0.5" />
                      </div>
                    )}

                    <div className="w-full flex items-end justify-center gap-0.5 h-full">
                      {/* Income Bar */}
                      <div
                        className="w-1.5 sm:w-2 bg-emerald-500 rounded-t-xs transition-all duration-300 group-hover:brightness-110"
                        style={{ height: `${Math.max(incomeHeight, d.income > 0 ? 6 : 0)}%` }}
                      />
                      {/* Expense Bar */}
                      <div
                        className="w-1.5 sm:w-2 bg-rose-500 rounded-t-xs transition-all duration-300 group-hover:brightness-110"
                        style={{ height: `${Math.max(expenseHeight, d.expense > 0 ? 6 : 0)}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono mt-1 select-none">
                      {d.day}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      ) : (
        /* Income Category Breakdown */
        <div>
          {incomeSlices.length === 0 ? (
            <div className="text-center py-8 text-slate-400 text-xs">
              Belum ada transaksi pemasukan pada bulan ini.
            </div>
          ) : (
            <div className="space-y-3">
              {incomeSlices.map((item) => (
                <div key={item.id} className="space-y-1">
                  <div className="flex items-center justify-between text-xs">
                    <div className="flex items-center gap-2">
                      <span className="text-base">{item.icon}</span>
                      <span className="font-semibold text-slate-800 dark:text-slate-200">
                        {item.name}
                      </span>
                      <span className="text-slate-400 font-mono text-[11px]">
                        ({item.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <span className="font-bold text-slate-900 dark:text-white tabular-nums">
                      {formatRupiah(item.value)}
                    </span>
                  </div>

                  <div className="w-full bg-slate-100 dark:bg-slate-800 h-2.5 rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${item.percentage}%`,
                        backgroundColor: item.color,
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
