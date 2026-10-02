import React from 'react';
import { useFinance } from '../../context/FinanceContext';
import { MonthSelector } from '../common/MonthSelector';
import { ExpenseDonutChart } from './ExpenseDonutChart';
import { TrendChart } from './TrendChart';
import { TrendsSection } from './TrendsSection';
import { BudgetProgressBar } from './BudgetProgressBar';
import { formatRupiah, formatRelativeDate, formatCurrency } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Wallet,
  ArrowRight,
  PlusCircle,
  Receipt,
  Layers,
  Bot,
  Camera,
  Sparkles,
  ShieldCheck,
  Target,
  ArrowRightLeft,
  CheckCircle2,
  AlertTriangle,
  Flame,
  Coffee,
  Coins,
  CreditCard,
  Landmark,
  Calculator,
} from 'lucide-react';

interface DashboardViewProps {
  onOpenAddTransaction: () => void;
  onNavigateToTransactions: () => void;
  onNavigateToBudget: () => void;
  onNavigateToWallets?: () => void;
  onNavigateToSavings?: () => void;
  onNavigateToTools?: () => void;
  onOpenChatModal?: () => void;
  onOpenReceiptModal?: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTransaction,
  onNavigateToTransactions,
  onNavigateToBudget,
  onNavigateToWallets,
  onNavigateToSavings,
  onNavigateToTools,
  onOpenChatModal,
  onOpenReceiptModal,
}) => {
  const {
    categories,
    subcategories,
    transactions,
    budgets,
    wallets,
    savingsGoals,
    quickTemplates,
    activeMonth,
    setActiveMonth,
    totalNetWorth,
    financialHealth,
    getCategoryById,
    getSubcategoryById,
    getWalletById,
    user,
  } = useFinance();

  // Time-based Indonesian greeting
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour >= 4 && hour < 11) return 'Selamat Pagi';
    if (hour >= 11 && hour < 15) return 'Selamat Siang';
    if (hour >= 15 && hour < 18) return 'Selamat Sore';
    return 'Selamat Malam';
  };

  const displayName = user?.displayName || user?.email?.split('@')[0] || 'Teman Keuangan';

  const monthTransactions = transactions.filter((t) =>
    t.tanggal.startsWith(activeMonth)
  );

  const totalIncome = financialHealth.income;
  const totalExpense = financialHealth.expense;
  const netBalance = financialHealth.netCashflow;

  const activeWallets = wallets.filter((w) => !w.diarsipkan);

  // 5 most recent transactions overall
  const recentTransactions = [...transactions]
    .sort((a, b) => {
      const cmpDate = b.tanggal.localeCompare(a.tanggal);
      if (cmpDate !== 0) return cmpDate;
      return (b.createdAt || 0) - (a.createdAt || 0);
    })
    .slice(0, 5);

  return (
    <div className="space-y-6 pb-20 md:pb-8">
      {/* Top Greeting & Month Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white flex items-center gap-2">
            <span>{getGreeting()}, {displayName}</span>
            <span className="text-xl">👋</span>
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Berikut ringkasan kesehatan finansial, dompet, dan arus kas Anda
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <MonthSelector currentMonth={activeMonth} onChange={setActiveMonth} />
        </div>
      </div>

      {/* Hero Card: Total Net Worth & Arus Kas Ringkas */}
      <div className="p-6 sm:p-7 rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-1.5">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400 flex items-center gap-1.5">
              <Wallet className="w-3.5 h-3.5" />
              <span>Total Saldo & Kekayaan Bersih</span>
            </span>
            <div className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatCurrency(totalNetWorth)}
            </div>
            <div className="flex items-center gap-2 text-xs text-slate-300 pt-1">
              <span>{activeWallets.length} Akun/Dompet Terhubung</span>
              <span aria-hidden="true">·</span>
              <button
                type="button"
                onClick={onNavigateToWallets}
                className="text-emerald-400 hover:text-emerald-300 font-semibold underline underline-offset-2 flex items-center gap-0.5"
              >
                <span>Kelola Dompet</span>
                <ArrowRight className="w-3 h-3" />
              </button>
            </div>
          </div>

          {/* Quick Cashflow Mini Metrics */}
          <div className="flex items-center gap-4 sm:gap-6 bg-white/10 backdrop-blur-md p-4 rounded-2xl border border-white/15">
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Pemasukan Bulan Ini</span>
              <span className="text-sm sm:text-base font-bold text-emerald-400">
                +{formatCurrency(totalIncome)}
              </span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Pengeluaran Bulan Ini</span>
              <span className="text-sm sm:text-base font-bold text-rose-400">
                -{formatCurrency(totalExpense)}
              </span>
            </div>
            <div className="w-px h-8 bg-white/20" />
            <div>
              <span className="text-[11px] text-slate-400 block font-medium">Arus Kas Bersih</span>
              <span className={`text-sm sm:text-base font-bold ${netBalance >= 0 ? 'text-white' : 'text-rose-400'}`}>
                {netBalance >= 0 ? '+' : ''}{formatCurrency(netBalance)}
              </span>
            </div>
          </div>
        </div>

        {/* Quick Wallets Horizontal Scroll */}
        <div className="relative z-10 pt-5 mt-5 border-t border-white/10">
          <div className="flex items-center gap-2.5 overflow-x-auto pb-1 scrollbar-none">
            {activeWallets.map((w) => (
              <div
                key={w.id}
                onClick={onNavigateToWallets}
                className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 transition cursor-pointer shrink-0 text-xs"
              >
                <span>{w.ikon}</span>
                <span className="font-semibold text-slate-200">{w.nama}</span>
                <span className="text-emerald-400 font-mono text-[11px]">({formatCurrency(w.saldo)})</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Financial Health Scorecard & Safe Daily Spend (PRO FEATURE) */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-slate-800 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <ShieldCheck className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Analisis Kesehatan Finansial & Rasio 50/30/20
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Kondisi keuangan bulan {activeMonth}: <strong>{financialHealth.status}</strong> (Tingkat Tabungan {financialHealth.savingsRate}%)
              </p>
            </div>
          </div>

          {/* Safe Daily Spend Indicator */}
          <div className="p-3 rounded-2xl bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-500/20 text-xs flex items-center gap-3">
            <Flame className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
            <div>
              <span className="text-[10px] uppercase font-bold text-emerald-700 dark:text-emerald-300 block">
                Batas Belanja Harian Aman
              </span>
              <span className="text-sm font-extrabold text-emerald-800 dark:text-emerald-200">
                {formatCurrency(financialHealth.safeDailySpend)} / hari
              </span>
            </div>
            <span className="text-[10px] text-slate-400 pl-1">
              (Sisa {financialHealth.daysRemainingInMonth} hari)
            </span>
          </div>
        </div>

        {/* 50/30/20 Ratio Visual Progress */}
        <div className="space-y-3">
          <div className="flex items-center justify-between text-xs">
            <span className="font-bold text-slate-700 dark:text-slate-300">
              Distribusi Pengeluaran Ideal vs Aktual
            </span>
            <span className="text-slate-400 text-[11px]">
              Kebutuhan (Max 50%) · Keinginan (Max 30%) · Tabungan (Min 20%)
            </span>
          </div>

          <div className="w-full h-4 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden flex">
            <div
              style={{ width: `${Math.min(100, financialHealth.needsRatio)}%` }}
              className="bg-blue-500 h-full transition-all"
              title={`Kebutuhan: ${financialHealth.needsRatio}%`}
            />
            <div
              style={{ width: `${Math.min(100, financialHealth.wantsRatio)}%` }}
              className="bg-rose-500 h-full transition-all"
              title={`Keinginan: ${financialHealth.wantsRatio}%`}
            />
            <div
              style={{ width: `${Math.min(100, financialHealth.savingsRatio)}%` }}
              className="bg-emerald-500 h-full transition-all"
              title={`Tabungan: ${financialHealth.savingsRatio}%`}
            />
          </div>

          <div className="grid grid-cols-3 gap-2 text-xs pt-1">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0" />
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Kebutuhan Pokok</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {financialHealth.needsRatio}% ({formatCurrency(financialHealth.needsAmount)})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shrink-0" />
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Keinginan & Lifestyle</span>
                <span className="font-bold text-slate-900 dark:text-white">
                  {financialHealth.wantsRatio}% ({formatCurrency(financialHealth.wantsAmount)})
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shrink-0" />
              <div>
                <span className="text-slate-500 dark:text-slate-400 block text-[11px]">Tabungan / Surplus</span>
                <span className="font-bold text-emerald-600 dark:text-emerald-400">
                  {financialHealth.savingsRate}% ({formatCurrency(Math.max(0, financialHealth.netCashflow))})
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Personalized Smart Advice Box */}
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-200/80 dark:border-slate-700/80 flex items-start gap-3 text-xs">
          <Sparkles className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
          <div className="flex-1">
            <span className="font-bold text-slate-800 dark:text-slate-200">Tips Finansial Bulan Ini:</span>
            <p className="text-slate-600 dark:text-slate-400 mt-0.5 leading-relaxed">
              {financialHealth.advice}
            </p>
          </div>
        </div>
      </div>

      {/* 1-Tap Quick Action Presets (Transaksi Kilat) */}
      <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1.5">
            <Coins className="w-4 h-4 text-emerald-500" />
            <span>Transaksi Kilat (1-Tap Sering Digunakan)</span>
          </span>
          <button
            type="button"
            onClick={onOpenAddTransaction}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
          >
            + Transaksi Baru
          </button>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-2.5">
          {quickTemplates.map((tpl) => (
            <button
              key={tpl.id}
              type="button"
              onClick={onOpenAddTransaction}
              className="p-3 rounded-2xl border border-slate-200/80 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-800/40 hover:border-emerald-500 hover:bg-emerald-50/30 dark:hover:bg-emerald-950/20 text-left transition group cursor-pointer min-h-[56px]"
            >
              <div className="text-lg mb-1">{tpl.ikon}</div>
              <div className="text-xs font-bold text-slate-800 dark:text-slate-200 truncate group-hover:text-emerald-600">
                {tpl.nama}
              </div>
              <div className="text-[11px] text-slate-500 font-mono">
                {formatCurrency(tpl.nominal)}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* AI Smart Entry Banner */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
        <div
          onClick={onOpenChatModal}
          className="p-4 rounded-3xl bg-linear-to-r from-emerald-500/10 via-teal-500/10 to-transparent border border-emerald-500/20 hover:border-emerald-500/40 transition cursor-pointer group flex items-center justify-between min-h-[72px]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-600 text-white flex items-center justify-center shadow-md shadow-emerald-500/20 group-hover:scale-105 transition-transform">
              <Bot className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Catat Transaksi via Chat AI
                </h3>
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Ketik kalimat sehari-hari (mis: "Beli bensin 50rb tadi pakai GoPay")
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-emerald-600 group-hover:translate-x-1 transition-transform mr-1 shrink-0" />
        </div>

        <div
          onClick={onOpenReceiptModal}
          className="p-4 rounded-3xl bg-linear-to-r from-blue-500/10 via-indigo-500/10 to-transparent border border-blue-500/20 hover:border-blue-500/40 transition cursor-pointer group flex items-center justify-between min-h-[72px]"
        >
          <div className="flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <Camera className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Scan & Analisa Nota / Struk
                </h3>
                <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300">
                  OCR AI
                </span>
              </div>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Foto struk belanja, AI otomatis membaca item dan nominal
              </p>
            </div>
          </div>
          <ArrowRight className="w-4 h-4 text-blue-600 group-hover:translate-x-1 transition-transform mr-1 shrink-0" />
        </div>
      </div>

      {/* Savings Goals Quick Preview */}
      {savingsGoals.length > 0 && (
        <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Pos Tabungan & Target Impian
              </h2>
            </div>
            <button
              type="button"
              onClick={onNavigateToSavings}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
            >
              <span>Lihat Semua ({savingsGoals.length})</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {savingsGoals.slice(0, 3).map((goal) => {
              const pct = Math.min(100, Math.round((goal.terkumpul / goal.targetNominal) * 100));
              return (
                <div
                  key={goal.id}
                  onClick={onNavigateToSavings}
                  className="p-4 rounded-2xl border border-slate-150 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 hover:border-emerald-500 transition cursor-pointer space-y-2.5"
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-bold text-slate-800 dark:text-slate-200 truncate">
                      {goal.ikon} {goal.nama}
                    </span>
                    <span className="font-bold text-emerald-600 dark:text-emerald-400">{pct}%</span>
                  </div>

                  <div className="w-full h-2 rounded-full bg-slate-200 dark:bg-slate-700 overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-300"
                      style={{ width: `${pct}%`, backgroundColor: goal.warna }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-slate-400 font-medium">
                    <span>{formatCurrency(goal.terkumpul)}</span>
                    <span>Target: {formatCurrency(goal.targetNominal)}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Main Charts: Donut + Cashflow Trend */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Category Expense Donut Chart (5 cols) */}
        <div className="lg:col-span-5 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Porsi Pengeluaran
            </h2>
            <span className="text-xs text-slate-400">Bulan Ini</span>
          </div>

          <ExpenseDonutChart
            transactions={monthTransactions}
            categories={categories}
            subcategories={subcategories}
          />
        </div>

        {/* Cashflow Trend Chart (7 cols) */}
        <div className="lg:col-span-7 p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Tren Arus Kas (Harian)
            </h2>
            <span className="text-xs text-slate-400">Pemasukan vs Pengeluaran</span>
          </div>

          <TrendChart
            transactions={monthTransactions}
            categories={categories}
            activeMonth={activeMonth}
          />
        </div>
      </div>

      {/* Budget Progress Bar overview */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Status Budget Bulanan
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Pantau batas pengeluaran per kategori agar tidak overspending
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToBudget}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Kelola Budget</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        <BudgetProgressBar
          budgets={budgets}
          transactions={monthTransactions}
          categories={categories}
          activeMonth={activeMonth}
        />
      </div>

      {/* Recent Transactions List with Wallet info */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-base font-bold text-slate-900 dark:text-white">
              Transaksi Terakhir
            </h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              5 catatan transaksi paling mutakhir
            </p>
          </div>
          <button
            type="button"
            onClick={onNavigateToTransactions}
            className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
          >
            <span>Semua Transaksi</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>

        {recentTransactions.length === 0 ? (
          <div className="text-center py-8 text-slate-400 text-xs">
            Belum ada transaksi. Klik "Transaksi Baru" untuk mencatat.
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {recentTransactions.map((tx) => {
              const cat = getCategoryById(tx.kategoriId);
              const sub = tx.subkategoriId ? getSubcategoryById(tx.subkategoriId) : undefined;
              const wallet = tx.dompetId ? getWalletById(tx.dompetId) : undefined;
              const isExpense = tx.tipe === 'pengeluaran';
              const isIncome = tx.tipe === 'pemasukan';
              const isTransfer = tx.tipe === 'transfer';

              return (
                <div
                  key={tx.id}
                  className="py-3 flex items-center justify-between gap-3 hover:bg-slate-50/50 dark:hover:bg-slate-800/40 rounded-xl px-2 transition"
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
                        {tx.catatan || cat?.nama || (isTransfer ? 'Transfer Antar Dompet' : 'Transaksi')}
                      </p>
                      <div className="flex items-center gap-1.5 text-[11px] text-slate-400 truncate mt-0.5">
                        <span>{cat?.nama}</span>
                        {sub && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span>{sub.nama}</span>
                          </>
                        )}
                        {wallet && (
                          <>
                            <span aria-hidden="true">·</span>
                            <span className="font-semibold text-slate-600 dark:text-slate-300">
                              {wallet.nama}
                            </span>
                          </>
                        )}
                        <span aria-hidden="true">·</span>
                        <span>{formatRelativeDate(tx.tanggal).label}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0">
                    <span
                      className={`text-xs sm:text-sm font-bold block ${
                        isExpense
                          ? 'text-rose-600 dark:text-rose-400'
                          : isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : 'text-indigo-600 dark:text-indigo-400'
                      }`}
                    >
                      {isExpense ? '-' : isIncome ? '+' : ''}{formatRupiah(tx.nominal)}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
