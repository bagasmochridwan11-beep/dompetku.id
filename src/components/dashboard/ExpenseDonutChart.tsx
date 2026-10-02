import React, { useState } from 'react';
import { Category, Subcategory, Transaction } from '../../types/finance';
import { formatRupiah } from '../../utils/formatters';
import { ArrowLeft, PieChart as PieIcon, Layers } from 'lucide-react';

interface ExpenseDonutChartProps {
  transactions: Transaction[];
  categories: Category[];
  subcategories: Subcategory[];
}

interface ChartSlice {
  id: string;
  name: string;
  icon: string;
  color: string;
  value: number;
  percentage: number;
  isCategory: boolean;
}

export const ExpenseDonutChart: React.FC<ExpenseDonutChartProps> = ({
  transactions,
  categories,
  subcategories,
}) => {
  // Drill-down category ID (null = viewing parent categories)
  const [drilldownCategoryId, setDrilldownCategoryId] = useState<string | null>(null);
  const [hoveredSlice, setHoveredSlice] = useState<ChartSlice | null>(null);

  const expenseTxs = transactions.filter((t) => t.tipe === 'pengeluaran');
  const selectedCategory = categories.find((c) => c.id === drilldownCategoryId);

  // Calculate slices based on drill-down state
  let slices: ChartSlice[] = [];
  let totalExpense = 0;

  if (!drilldownCategoryId) {
    // Parent categories breakdown
    const catMap = new Map<string, number>();
    expenseTxs.forEach((t) => {
      catMap.set(t.kategoriId, (catMap.get(t.kategoriId) || 0) + t.nominal);
    });

    totalExpense = Array.from(catMap.values()).reduce((sum, val) => sum + val, 0);

    slices = Array.from(catMap.entries())
      .map(([catId, value]) => {
        const cat = categories.find((c) => c.id === catId);
        return {
          id: catId,
          name: cat ? cat.nama : 'Lainnya',
          icon: cat ? cat.ikon : '📁',
          color: cat ? cat.warna : '#64748b',
          value,
          percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
          isCategory: true,
        };
      })
      .sort((a, b) => b.value - a.value);
  } else {
    // Drilled down into a specific category's subcategories
    const categoryTxs = expenseTxs.filter((t) => t.kategoriId === drilldownCategoryId);
    const subMap = new Map<string, number>();
    let noSubAmount = 0;

    categoryTxs.forEach((t) => {
      if (t.subkategoriId) {
        subMap.set(t.subkategoriId, (subMap.get(t.subkategoriId) || 0) + t.nominal);
      } else {
        noSubAmount += t.nominal;
      }
    });

    totalExpense = categoryTxs.reduce((sum, t) => sum + t.nominal, 0);

    const subSlices = Array.from(subMap.entries()).map(([subId, value]) => {
      const sub = subcategories.find((s) => s.id === subId);
      return {
        id: subId,
        name: sub ? sub.nama : 'Subkategori',
        icon: sub ? sub.ikon : '🏷️',
        color: sub ? sub.warna : selectedCategory?.warna || '#3b82f6',
        value,
        percentage: totalExpense > 0 ? (value / totalExpense) * 100 : 0,
        isCategory: false,
      };
    });

    if (noSubAmount > 0) {
      subSlices.push({
        id: 'no-sub',
        name: 'Tanpa Subkategori',
        icon: selectedCategory?.ikon || '📁',
        color: selectedCategory?.warna || '#64748b',
        value: noSubAmount,
        percentage: totalExpense > 0 ? (noSubAmount / totalExpense) * 100 : 0,
        isCategory: false,
      });
    }

    slices = subSlices.sort((a, b) => b.value - a.value);
  }

  // Calculate SVG arc paths
  const radius = 80;
  const strokeWidth = 32;
  const circumference = 2 * Math.PI * radius;
  let accumulatedAngle = 0;

  if (totalExpense === 0 || slices.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl min-h-[320px]">
        <div className="w-12 h-12 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-400 mb-3">
          <PieIcon className="w-6 h-6" />
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-400">Belum ada data pengeluaran</p>
        <p className="text-xs text-slate-400 mt-1">Tambahkan transaksi untuk melihat grafik.</p>
      </div>
    );
  }

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs">
      {/* Header with drilldown navigation */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <div className="flex items-center gap-2">
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              {drilldownCategoryId ? `Rincian: ${selectedCategory?.nama}` : 'Pengeluaran per Kategori'}
            </h3>
            {drilldownCategoryId && (
              <span className="text-xs font-semibold px-2 py-0.5 rounded-md bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400">
                Subkategori
              </span>
            )}
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            {drilldownCategoryId
              ? 'Distribusi pengeluaran per subkategori'
              : 'Klik kategori pada diagram untuk melihat subkategori'}
          </p>
        </div>

        {drilldownCategoryId && (
          <button
            type="button"
            onClick={() => {
              setDrilldownCategoryId(null);
              setHoveredSlice(null);
            }}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 transition min-h-[36px]"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Semua Kategori</span>
          </button>
        )}
      </div>

      {/* Main visual & legend layout */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
        {/* Donut Chart SVG */}
        <div className="md:col-span-6 flex flex-col items-center justify-center relative">
          <svg className="w-60 h-60 -rotate-90 transform" viewBox="0 0 220 220">
            {/* Background ring */}
            <circle
              cx="110"
              cy="110"
              r={radius}
              fill="transparent"
              stroke="currentColor"
              strokeWidth={strokeWidth}
              className="text-slate-100 dark:text-slate-800/80"
            />

            {/* Slices */}
            {slices.map((slice) => {
              const strokeDasharray = `${(slice.percentage / 100) * circumference} ${circumference}`;
              const strokeDashoffset = -accumulatedAngle;
              accumulatedAngle += (slice.percentage / 100) * circumference;

              const isHovered = hoveredSlice?.id === slice.id;

              return (
                <circle
                  key={slice.id}
                  cx="110"
                  cy="110"
                  r={radius}
                  fill="transparent"
                  stroke={slice.color}
                  strokeWidth={isHovered ? strokeWidth + 6 : strokeWidth}
                  strokeDasharray={strokeDasharray}
                  strokeDashoffset={strokeDashoffset}
                  strokeLinecap="round"
                  className="transition-all duration-200 cursor-pointer"
                  onMouseEnter={() => setHoveredSlice(slice)}
                  onMouseLeave={() => setHoveredSlice(null)}
                  onClick={() => {
                    if (slice.isCategory) {
                      setDrilldownCategoryId(slice.id);
                      setHoveredSlice(null);
                    }
                  }}
                />
              );
            })}
          </svg>

          {/* Center text in donut */}
          <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none text-center px-4">
            <span className="text-[11px] font-medium text-slate-400 dark:text-slate-500 uppercase tracking-wider">
              {hoveredSlice ? hoveredSlice.name : 'Total Pengeluaran'}
            </span>
            <span className="text-lg md:text-xl font-bold text-slate-900 dark:text-white tabular-nums tracking-tight">
              {formatRupiah(hoveredSlice ? hoveredSlice.value : totalExpense)}
            </span>
            {hoveredSlice ? (
              <span className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 mt-0.5">
                {hoveredSlice.percentage.toFixed(1)}%
              </span>
            ) : (
              <span className="text-[11px] text-slate-400 mt-0.5 flex items-center gap-1">
                <Layers className="w-3 h-3" /> {slices.length} {drilldownCategoryId ? 'subkategori' : 'kategori'}
              </span>
            )}
          </div>
        </div>

        {/* Legend List */}
        <div className="md:col-span-6 space-y-2 max-h-64 overflow-y-auto pr-1">
          {slices.map((slice) => {
            const isHovered = hoveredSlice?.id === slice.id;
            return (
              <div
                key={slice.id}
                onMouseEnter={() => setHoveredSlice(slice)}
                onMouseLeave={() => setHoveredSlice(null)}
                onClick={() => {
                  if (slice.isCategory) {
                    setDrilldownCategoryId(slice.id);
                  }
                }}
                className={`flex items-center justify-between p-2.5 rounded-2xl transition cursor-pointer ${
                  isHovered
                    ? 'bg-slate-100 dark:bg-slate-800'
                    : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className="w-8 h-8 rounded-xl flex items-center justify-center text-sm shrink-0 shadow-xs"
                    style={{ backgroundColor: `${slice.color}25`, color: slice.color }}
                  >
                    <span>{slice.icon}</span>
                  </div>
                  <div className="truncate">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                        {slice.name}
                      </span>
                      {slice.isCategory && (
                        <span className="text-[10px] text-slate-400 dark:text-slate-500 font-normal">
                          (Klik)
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-0.5">
                      <div className="w-12 bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full overflow-hidden">
                        <div
                          className="h-full rounded-full"
                          style={{ width: `${slice.percentage}%`, backgroundColor: slice.color }}
                        />
                      </div>
                      <span className="text-[11px] text-slate-400 font-mono">
                        {slice.percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                </div>

                <div className="text-right shrink-0 ml-2">
                  <span className="text-xs font-bold text-slate-900 dark:text-slate-100 tabular-nums">
                    {formatRupiah(slice.value)}
                  </span>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
