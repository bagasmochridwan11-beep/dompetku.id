import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ReferenceLine,
} from 'recharts';
import { Transaction, Category } from '../../types/finance';
import { formatRupiah, formatMonthName } from '../../utils/formatters';
import {
  TrendingUp,
  TrendingDown,
  Activity,
  BarChart2,
  Calendar,
  Wallet,
  ArrowUpRight,
  ArrowDownRight,
  Maximize2,
  Layers,
} from 'lucide-react';

interface TrendsSectionProps {
  transactions: Transaction[]; // Can be all transactions or month transactions
  allTransactions?: Transaction[]; // Full history for multi-month trends
  categories: Category[];
  activeMonth: string; // YYYY-MM
}

type TimeframeOption = 'month' | '6months' | 'year';
type ChartStyleOption = 'area' | 'bar' | 'net';

export const TrendsSection: React.FC<TrendsSectionProps> = ({
  transactions,
  allTransactions = transactions,
  categories,
  activeMonth,
}) => {
  const [timeframe, setTimeframe] = useState<TimeframeOption>('month');
  const [chartStyle, setChartStyle] = useState<ChartStyleOption>('area');

  // Month names in Indonesian (short & full)
  const shortMonths = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const fullMonths = [
    'Januari', 'Februari', 'Maret', 'April', 'Mei', 'Juni',
    'Juli', 'Agustus', 'September', 'Oktober', 'November', 'Desember'
  ];

  // Parse active month
  const [activeYearStr, activeMonthStr] = activeMonth.split('-');
  const activeYear = parseInt(activeYearStr, 10);
  const activeMonthNum = parseInt(activeMonthStr, 10);

  // Compute chart dataset based on selected timeframe
  const chartData = useMemo(() => {
    if (timeframe === 'month') {
      // Daily breakdown for the active month (1..daysInMonth)
      const daysInMonth = new Date(activeYear, activeMonthNum, 0).getDate();
      const result = [];
      let runningBalance = 0;

      for (let day = 1; day <= daysInMonth; day++) {
        const padDay = String(day).padStart(2, '0');
        const dateStr = `${activeMonth}-${padDay}`;
        const dayTxs = allTransactions.filter((t) => t.tanggal === dateStr);

        const income = dayTxs
          .filter((t) => t.tipe === 'pemasukan')
          .reduce((sum, t) => sum + t.nominal, 0);

        const expense = dayTxs
          .filter((t) => t.tipe === 'pengeluaran')
          .reduce((sum, t) => sum + t.nominal, 0);

        const net = income - expense;
        runningBalance += net;

        result.push({
          label: `${day}`,
          fullLabel: `${day} ${fullMonths[activeMonthNum - 1]} ${activeYear}`,
          income,
          expense,
          net,
          runningBalance,
          count: dayTxs.length,
        });
      }
      return result;
    } else if (timeframe === '6months') {
      // 6 consecutive months leading up to activeMonth
      const result = [];
      let runningBalance = 0;

      for (let i = 5; i >= 0; i--) {
        const d = new Date(activeYear, activeMonthNum - 1 - i, 1);
        const y = d.getFullYear();
        const m = d.getMonth() + 1;
        const monthKey = `${y}-${String(m).padStart(2, '0')}`;

        const monthTxs = allTransactions.filter((t) => t.tanggal.startsWith(monthKey));

        const income = monthTxs
          .filter((t) => t.tipe === 'pemasukan')
          .reduce((sum, t) => sum + t.nominal, 0);

        const expense = monthTxs
          .filter((t) => t.tipe === 'pengeluaran')
          .reduce((sum, t) => sum + t.nominal, 0);

        const net = income - expense;
        runningBalance += net;

        result.push({
          label: `${shortMonths[m - 1]} '${String(y).slice(-2)}`,
          fullLabel: `${fullMonths[m - 1]} ${y}`,
          income,
          expense,
          net,
          runningBalance,
          count: monthTxs.length,
        });
      }
      return result;
    } else {
      // Full 12 months of the active year
      const result = [];
      let runningBalance = 0;

      for (let m = 1; m <= 12; m++) {
        const monthKey = `${activeYear}-${String(m).padStart(2, '0')}`;
        const monthTxs = allTransactions.filter((t) => t.tanggal.startsWith(monthKey));

        const income = monthTxs
          .filter((t) => t.tipe === 'pemasukan')
          .reduce((sum, t) => sum + t.nominal, 0);

        const expense = monthTxs
          .filter((t) => t.tipe === 'pengeluaran')
          .reduce((sum, t) => sum + t.nominal, 0);

        const net = income - expense;
        runningBalance += net;

        result.push({
          label: shortMonths[m - 1],
          fullLabel: `${fullMonths[m - 1]} ${activeYear}`,
          income,
          expense,
          net,
          runningBalance,
          count: monthTxs.length,
        });
      }
      return result;
    }
  }, [timeframe, activeMonth, allTransactions, activeYear, activeMonthNum]);

  // Aggregate stats across the visible chart dataset
  const { totalIncome, totalExpense, netCashflow, maxExpenseItem, avgExpense, savingsRate } =
    useMemo(() => {
      let incomeSum = 0;
      let expenseSum = 0;
      let maxExp = { label: '-', expense: 0 };
      let activeDaysCount = 0;

      chartData.forEach((item) => {
        incomeSum += item.income;
        expenseSum += item.expense;
        if (item.expense > maxExp.expense) {
          maxExp = { label: item.fullLabel || item.label, expense: item.expense };
        }
        if (item.expense > 0 || item.income > 0) {
          activeDaysCount++;
        }
      });

      const net = incomeSum - expenseSum;
      const divisor = chartData.length || 1;
      const avg = Math.round(expenseSum / divisor);
      const rate = incomeSum > 0 ? Math.round(((incomeSum - expenseSum) / incomeSum) * 100) : 0;

      return {
        totalIncome: incomeSum,
        totalExpense: expenseSum,
        netCashflow: net,
        maxExpenseItem: maxExp,
        avgExpense: avg,
        savingsRate: rate,
      };
    }, [chartData]);

  // Y-axis compact currency formatter
  const formatYAxis = (val: number) => {
    if (!val || val === 0) return '0';
    const abs = Math.abs(val);
    const sign = val < 0 ? '-' : '';
    if (abs >= 1000000000) {
      return `${sign}${(abs / 1000000000).toFixed(1).replace('.0', '')}M`;
    }
    if (abs >= 1000000) {
      return `${sign}${(abs / 1000000).toFixed(1).replace('.0', '')}jt`;
    }
    if (abs >= 1000) {
      return `${sign}${Math.round(abs / 1000)}rb`;
    }
    return `${sign}${abs}`;
  };

  // Custom Recharts Tooltip Component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (!active || !payload || !payload.length) return null;

    const dataPoint = payload[0]?.payload;
    if (!dataPoint) return null;

    const inc = dataPoint.income || 0;
    const exp = dataPoint.expense || 0;
    const net = inc - exp;

    return (
      <div className="bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border border-slate-200 dark:border-slate-800 rounded-2xl p-3.5 shadow-xl text-xs min-w-[210px] space-y-2 pointer-events-none">
        <div className="border-b border-slate-100 dark:border-slate-800 pb-1.5 flex items-center justify-between">
          <span className="font-bold text-slate-800 dark:text-white">
            {dataPoint.fullLabel || label}
          </span>
          <span className="text-[11px] text-slate-400">
            {dataPoint.count ? `${dataPoint.count} tx` : '0 tx'}
          </span>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-xs" />
              <span className="text-slate-600 dark:text-slate-300">Pemasukan</span>
            </div>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {formatRupiah(inc)}
            </span>
          </div>

          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-500 shadow-xs" />
              <span className="text-slate-600 dark:text-slate-300">Pengeluaran</span>
            </div>
            <span className="font-bold tabular-nums text-rose-600 dark:text-rose-400">
              {formatRupiah(exp)}
            </span>
          </div>

          <div className="pt-1.5 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-3">
            <span className="text-slate-500 dark:text-slate-400 font-medium">Arus Kas Bersih</span>
            <span
              className={`font-bold tabular-nums ${
                net >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {net >= 0 ? '+' : ''}
              {formatRupiah(net)}
            </span>
          </div>

          {chartStyle === 'net' && (
            <div className="flex items-center justify-between gap-3 text-[11px] text-slate-400 pt-0.5">
              <span>Saldo Akumulatif:</span>
              <span className="font-semibold tabular-nums text-slate-700 dark:text-slate-300">
                {formatRupiah(dataPoint.runningBalance || 0)}
              </span>
            </div>
          )}
        </div>
      </div>
    );
  };

  const hasData = totalIncome > 0 || totalExpense > 0;

  return (
    <div className="p-5 sm:p-6 bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs space-y-5">
      {/* Header & Controls */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white">
              Tren Arus Kas (Spending vs. Income)
            </h2>
          </div>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1">
            Visualisasi komparasi pengeluaran dan pemasukan over-time menggunakan Recharts
          </p>
        </div>

        {/* Action Controls: Timeframe & Chart Style Toggles */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Timeframe Selector */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-xs font-semibold">
            <button
              type="button"
              onClick={() => setTimeframe('month')}
              className={`px-3 py-1.5 rounded-xl transition min-h-[30px] ${
                timeframe === 'month'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Bulan Ini
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('6months')}
              className={`px-3 py-1.5 rounded-xl transition min-h-[30px] ${
                timeframe === '6months'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              6 Bulan
            </button>
            <button
              type="button"
              onClick={() => setTimeframe('year')}
              className={`px-3 py-1.5 rounded-xl transition min-h-[30px] ${
                timeframe === 'year'
                  ? 'bg-white dark:bg-slate-700 text-slate-900 dark:text-white shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              1 Tahun
            </button>
          </div>

          {/* Chart Style Switcher */}
          <div className="inline-flex p-1 bg-slate-100 dark:bg-slate-800/90 rounded-2xl border border-slate-200/50 dark:border-slate-700/50 text-xs font-semibold">
            <button
              type="button"
              title="Grafik Area (Smooth Gradient)"
              onClick={() => setChartStyle('area')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition min-h-[30px] ${
                chartStyle === 'area'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              <span>Area</span>
            </button>
            <button
              type="button"
              title="Grafik Batang (Komparasi)"
              onClick={() => setChartStyle('bar')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition min-h-[30px] ${
                chartStyle === 'bar'
                  ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <BarChart2 className="w-3.5 h-3.5" />
              <span>Batang</span>
            </button>
            <button
              type="button"
              title="Arus Kas Bersih (Net Cashflow)"
              onClick={() => setChartStyle('net')}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition min-h-[30px] ${
                chartStyle === 'net'
                  ? 'bg-white dark:bg-slate-700 text-blue-600 dark:text-blue-400 shadow-xs font-bold'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Wallet className="w-3.5 h-3.5" />
              <span>Net Saldo</span>
            </button>
          </div>
        </div>
      </div>

      {/* KPI Highlights Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-1">
        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-emerald-500" />
            Total Masuk
          </span>
          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tabular-nums mt-1 truncate">
            {formatRupiah(totalIncome)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span className="w-2 h-2 rounded-full bg-rose-500" />
            Total Keluar
          </span>
          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tabular-nums mt-1 truncate">
            {formatRupiah(totalExpense)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400 flex items-center gap-1">
            <span
              className={`w-2 h-2 rounded-full ${
                netCashflow >= 0 ? 'bg-emerald-500' : 'bg-rose-500'
              }`}
            />
            Arus Kas Bersih
          </span>
          <p
            className={`text-sm sm:text-base font-bold tabular-nums mt-1 truncate ${
              netCashflow >= 0
                ? 'text-emerald-600 dark:text-emerald-400'
                : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {netCashflow >= 0 ? '+' : ''}
            {formatRupiah(netCashflow)}
          </p>
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/50 border border-slate-100 dark:border-slate-800">
          <span className="text-[11px] font-medium text-slate-500 dark:text-slate-400">
            {timeframe === 'month' ? 'Rata-rata / Hari' : 'Rata-rata / Bulan'}
          </span>
          <p className="text-sm sm:text-base font-bold text-slate-900 dark:text-white tabular-nums mt-1 truncate">
            {formatRupiah(avgExpense)}
          </p>
        </div>
      </div>

      {/* Main Recharts Area */}
      <div className="w-full pt-2">
        {!hasData ? (
          <div className="h-64 sm:h-80 flex flex-col items-center justify-center text-center p-6 bg-slate-50/50 dark:bg-slate-800/20 rounded-2xl border border-dashed border-slate-200 dark:border-slate-800">
            <Calendar className="w-10 h-10 text-slate-300 dark:text-slate-600 mb-2" />
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              Belum ada aktivitas transaksi pada periode ini
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm">
              Catat transaksi pemasukan atau pengeluaran untuk melihat grafik pergerakan arus kas
              Recharts secara interaktif.
            </p>
          </div>
        ) : (
          <div className="h-72 sm:h-80 w-full min-w-0">
            <ResponsiveContainer width="100%" height="100%">
              {chartStyle === 'area' ? (
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="incomeGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0.0} />
                    </linearGradient>
                    <linearGradient id="expenseGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#f43f5e" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800/80"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    dy={6}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                    formatter={(value) => (
                      <span className="text-slate-700 dark:text-slate-300 font-medium ml-1">
                        {value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="income"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#incomeGradient)"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  />
                  <Area
                    type="monotone"
                    dataKey="expense"
                    stroke="#f43f5e"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#expenseGradient)"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              ) : chartStyle === 'bar' ? (
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800/80"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    dy={6}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                    formatter={(value) => (
                      <span className="text-slate-700 dark:text-slate-300 font-medium ml-1">
                        {value === 'income' ? 'Pemasukan' : 'Pengeluaran'}
                      </span>
                    )}
                  />
                  <Bar
                    dataKey="income"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                  <Bar
                    dataKey="expense"
                    fill="#f43f5e"
                    radius={[4, 4, 0, 0]}
                    maxBarSize={28}
                  />
                </BarChart>
              ) : (
                /* Net Cashflow (Surplus/Deficit line & area) */
                <AreaChart data={chartData} margin={{ top: 10, right: 10, left: -15, bottom: 0 }}>
                  <defs>
                    <linearGradient id="netGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.4} />
                      <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="currentColor"
                    className="text-slate-200 dark:text-slate-800/80"
                  />
                  <XAxis
                    dataKey="label"
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                    dy={6}
                  />
                  <YAxis
                    tickFormatter={formatYAxis}
                    tickLine={false}
                    axisLine={false}
                    tick={{ fill: '#94a3b8', fontSize: 11 }}
                  />
                  <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                  <Tooltip content={<CustomTooltip />} />
                  <Legend
                    verticalAlign="top"
                    align="right"
                    iconType="circle"
                    iconSize={8}
                    wrapperStyle={{ paddingBottom: 12, fontSize: 12 }}
                    formatter={() => (
                      <span className="text-slate-700 dark:text-slate-300 font-medium ml-1">
                        Arus Kas Bersih (Net)
                      </span>
                    )}
                  />
                  <Area
                    type="monotone"
                    dataKey="net"
                    stroke="#3b82f6"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#netGradient)"
                    activeDot={{ r: 5, strokeWidth: 2, stroke: '#fff' }}
                  />
                </AreaChart>
              )}
            </ResponsiveContainer>
          </div>
        )}
      </div>

      {/* Insight Footer */}
      {hasData && (
        <div className="pt-2 border-t border-slate-100 dark:border-slate-800/80 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-slate-500 dark:text-slate-400">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Pengeluaran Tertinggi:
            </span>
            <span className="text-rose-600 dark:text-rose-400 font-bold tabular-nums">
              {formatRupiah(maxExpenseItem.expense)}
            </span>
            <span className="text-slate-400">({maxExpenseItem.label})</span>
          </div>

          <div className="flex items-center gap-2">
            <span className="font-semibold text-slate-700 dark:text-slate-300">
              Rasio Tabungan:
            </span>
            <span
              className={`font-bold tabular-nums ${
                savingsRate >= 20
                  ? 'text-emerald-600 dark:text-emerald-400'
                  : savingsRate > 0
                  ? 'text-amber-600 dark:text-amber-400'
                  : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {savingsRate}%
            </span>
            <span className="text-slate-400">
              {savingsRate >= 20
                ? '(Sangat Sehat)'
                : savingsRate > 0
                ? '(Moderat)'
                : '(Defisit)'}
            </span>
          </div>
        </div>
      )}
    </div>
  );
};
