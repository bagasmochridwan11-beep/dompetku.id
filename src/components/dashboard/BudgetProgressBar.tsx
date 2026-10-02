import React from 'react';
import { Category, Budget, Transaction } from '../../types/finance';
import { formatRupiah } from '../../utils/formatters';
import { AlertTriangle, AlertOctagon, CheckCircle2, ChevronRight } from 'lucide-react';

interface BudgetProgressBarProps {
  categories: Category[];
  budgets: Budget[];
  transactions: Transaction[];
  activeMonth: string;
  onNavigateToBudget?: () => void;
}

export const BudgetProgressBar: React.FC<BudgetProgressBarProps> = ({
  categories,
  budgets,
  transactions,
  activeMonth,
  onNavigateToBudget,
}) => {
  // Only expense budgets for the active month (parent category level, subkategoriId is null)
  const monthBudgets = budgets.filter((b) => b.bulan === activeMonth && !b.subkategoriId);
  const totalBudget = monthBudgets.reduce((sum, b) => sum + b.nominal, 0);

  // Month expense transactions
  const monthExpenseTxs = transactions.filter(
    (t) => t.tanggal.startsWith(activeMonth) && t.tipe === 'pengeluaran'
  );
  const totalExpense = monthExpenseTxs.reduce((sum, t) => sum + t.nominal, 0);

  const percentage = totalBudget > 0 ? (totalExpense / totalBudget) * 100 : 0;
  const remainingBudget = totalBudget - totalExpense;

  // Determine overall status
  let statusColor = 'bg-emerald-500';
  let badgeColor = 'text-emerald-700 bg-emerald-50 dark:bg-emerald-950/60 dark:text-emerald-400';
  let statusLabel = 'Aman (<80%)';

  if (percentage >= 100) {
    statusColor = 'bg-rose-500';
    badgeColor = 'text-rose-700 bg-rose-50 dark:bg-rose-950/60 dark:text-rose-400';
    statusLabel = 'Over Budget (>100%)';
  } else if (percentage >= 80) {
    statusColor = 'bg-amber-500';
    badgeColor = 'text-amber-700 bg-amber-50 dark:bg-amber-950/60 dark:text-amber-400';
    statusLabel = 'Mendekati Batas (>80%)';
  }

  // Find individual categories that are warning (>80%) or danger (>100%)
  const categoryAlerts: {
    category: Category;
    budget: number;
    spent: number;
    pct: number;
    isOver: boolean;
  }[] = [];

  monthBudgets.forEach((b) => {
    const cat = categories.find((c) => c.id === b.kategoriId);
    if (!cat) return;

    const catSpent = monthExpenseTxs
      .filter((t) => t.kategoriId === cat.id)
      .reduce((sum, t) => sum + t.nominal, 0);

    const catPct = (catSpent / b.nominal) * 100;
    if (catPct >= 80) {
      categoryAlerts.push({
        category: cat,
        budget: b.nominal,
        spent: catSpent,
        pct: catPct,
        isOver: catPct >= 100,
      });
    }
  });

  return (
    <div className="p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-base font-bold text-slate-900 dark:text-white">
            Budget Bulanan Keseluruhan
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Monitoring alokasi pengeluaran bulan ini
          </p>
        </div>

        <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${badgeColor}`}>
          {totalBudget > 0 ? statusLabel : 'Belum Ada Budget'}
        </span>
      </div>

      {totalBudget === 0 ? (
        <div className="py-4 text-center">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            Anda belum menetapkan budget untuk bulan ini.
          </p>
          {onNavigateToBudget && (
            <button
              type="button"
              onClick={onNavigateToBudget}
              className="mt-2 text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline inline-flex items-center gap-1"
            >
              Atur Budget Sekarang <ChevronRight className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="space-y-1.5">
            <div className="w-full bg-slate-100 dark:bg-slate-800 h-4 rounded-full overflow-hidden p-0.5">
              <div
                className={`h-full rounded-full transition-all duration-700 ${statusColor}`}
                style={{ width: `${Math.min(percentage, 100)}%` }}
              />
            </div>

            <div className="flex items-center justify-between text-xs">
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Terpakai: <strong className="text-slate-900 dark:text-white tabular-nums">{formatRupiah(totalExpense)}</strong> ({percentage.toFixed(1)}%)
              </span>
              <span className="text-slate-500 dark:text-slate-400 font-medium">
                Total Budget: <strong className="text-slate-900 dark:text-white tabular-nums">{formatRupiah(totalBudget)}</strong>
              </span>
            </div>
          </div>

          {/* Sisa Budget Metric */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <span className="text-slate-500 dark:text-slate-400">
              {remainingBudget >= 0 ? 'Sisa Budget Tersedia:' : 'Kelebihan Pengeluaran:'}
            </span>
            <span
              className={`font-bold tabular-nums text-sm ${
                remainingBudget >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {formatRupiah(Math.abs(remainingBudget))}
            </span>
          </div>

          {/* Individual Category Warnings if any */}
          {categoryAlerts.length > 0 && (
            <div className="mt-3 space-y-2 pt-2 border-t border-slate-100 dark:border-slate-800">
              <div className="text-xs font-semibold text-slate-700 dark:text-slate-300">
                Peringatan Batas Kategori:
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {categoryAlerts.map((alert) => (
                  <div
                    key={alert.category.id}
                    className={`flex items-center justify-between p-2.5 rounded-xl border text-xs ${
                      alert.isOver
                        ? 'bg-rose-50/80 border-rose-200 text-rose-800 dark:bg-rose-950/40 dark:border-rose-900 dark:text-rose-300'
                        : 'bg-amber-50/80 border-amber-200 text-amber-800 dark:bg-amber-950/40 dark:border-amber-900 dark:text-amber-300'
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {alert.isOver ? (
                        <AlertOctagon className="w-4 h-4 text-rose-600 dark:text-rose-400 shrink-0" />
                      ) : (
                        <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      )}
                      <span className="font-semibold truncate">
                        {alert.category.ikon} {alert.category.nama}
                      </span>
                    </div>
                    <span className="font-mono font-bold shrink-0 ml-2">
                      {alert.pct.toFixed(0)}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};
