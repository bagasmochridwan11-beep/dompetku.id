import React, { useState } from 'react';
import {
  Calculator,
  Shield,
  TrendingUp,
  Percent,
  CheckCircle2,
  Calendar,
  DollarSign,
  Info,
  ChevronRight,
  ArrowRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { formatCurrency } from '../../utils/formatters';

type ToolTab = 'emergency' | 'compound' | 'loan';

export const FinancialCalculatorsView: React.FC = () => {
  const { financialHealth } = useFinance();
  const [activeTab, setActiveTab] = useState<ToolTab>('emergency');

  // Emergency Fund State
  const [monthlyExpense, setMonthlyExpense] = useState<number>(financialHealth.expense || 4500000);
  const [maritalStatus, setMaritalStatus] = useState<'single' | 'married' | 'family' | 'business'>('single');
  const [savedEmergency, setSavedEmergency] = useState<number>(10000000);
  const [monthlySaveCapacity, setMonthlySaveCapacity] = useState<number>(1500000);

  // Compound Interest State
  const [initialPrincipal, setInitialPrincipal] = useState<number>(5000000);
  const [monthlyContribution, setMonthlyContribution] = useState<number>(1000000);
  const [annualReturnRate, setAnnualReturnRate] = useState<number>(8.5); // 8.5% typical mutual fund / index
  const [investmentYears, setInvestmentYears] = useState<number>(5);

  // Loan / Installment State
  const [loanPrincipal, setLoanPrincipal] = useState<number>(25000000);
  const [loanInterestRate, setLoanInterestRate] = useState<number>(9.5); // 9.5% flat / year
  const [loanTenorMonths, setLoanTenorMonths] = useState<number>(12);

  // 1. Emergency Fund Calculation
  const multiplier = {
    single: 3, // 3 - 6 bulan
    married: 6, // 6 bulan
    family: 9, // 9 bulan
    business: 12, // 12 bulan
  }[maritalStatus];

  const targetEmergencyFund = monthlyExpense * multiplier;
  const emergencyShortfall = Math.max(0, targetEmergencyFund - savedEmergency);
  const monthsToGoal = monthlySaveCapacity > 0 ? Math.ceil(emergencyShortfall / monthlySaveCapacity) : 0;

  // 2. Compound Interest Calculation
  // FV = P * (1 + r/n)^(nt) + PMT * [((1 + r/n)^(nt) - 1) / (r/n)]
  const calculateCompound = () => {
    const r = annualReturnRate / 100;
    const n = 12; // monthly compounding
    const t = investmentYears;

    let balance = initialPrincipal;
    let totalDeposited = initialPrincipal;
    const yearlyBreakdown: { year: number; balance: number; totalDeposited: number; interestEarned: number }[] = [];

    for (let yr = 1; yr <= t; yr++) {
      for (let m = 1; m <= 12; m++) {
        balance = balance * (1 + r / n) + monthlyContribution;
        totalDeposited += monthlyContribution;
      }
      yearlyBreakdown.push({
        year: yr,
        balance: Math.round(balance),
        totalDeposited: Math.round(totalDeposited),
        interestEarned: Math.round(balance - totalDeposited),
      });
    }

    const finalBalance = Math.round(balance);
    const totalGains = Math.round(finalBalance - totalDeposited);

    return { finalBalance, totalDeposited, totalGains, yearlyBreakdown };
  };

  const compoundResult = calculateCompound();

  // 3. Loan / Cicilan Calculation
  const calculateLoan = () => {
    const years = loanTenorMonths / 12;
    const totalInterest = loanPrincipal * (loanInterestRate / 100) * years;
    const totalPayment = loanPrincipal + totalInterest;
    const monthlyInstallment = Math.round(totalPayment / loanTenorMonths);
    return { monthlyInstallment, totalInterest, totalPayment };
  };

  const loanResult = calculateLoan();

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-5xl mx-auto">
      {/* Top Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-indigo-950 via-slate-900 to-slate-800 text-white shadow-xl space-y-2">
        <span className="text-xs uppercase font-bold tracking-wider text-indigo-400">
          Financial Advisory & Simulation Tools
        </span>
        <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
          Kalkulator & Simulasi Finansial
        </h1>
        <p className="text-xs sm:text-sm text-slate-300 max-w-2xl">
          Hitung kecukupan dana darurat, proyeksikan pertumbuhan investasi bunga majemuk (compound interest), dan rencanakan simulasi cicilan secara objektif.
        </p>
      </div>

      {/* Segmented Tool Tabs */}
      <div className="flex items-center gap-1.5 p-1.5 bg-slate-100 dark:bg-slate-800/80 rounded-2xl w-full sm:w-max border border-slate-200/80 dark:border-slate-700">
        <button
          type="button"
          onClick={() => setActiveTab('emergency')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial min-h-[40px] cursor-pointer ${
            activeTab === 'emergency'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Shield className="w-4 h-4" />
          <span>Dana Darurat</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('compound')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial min-h-[40px] cursor-pointer ${
            activeTab === 'compound'
              ? 'bg-white dark:bg-slate-900 text-indigo-600 dark:text-indigo-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <TrendingUp className="w-4 h-4" />
          <span>Bunga Majemuk (Investasi)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveTab('loan')}
          className={`flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl text-xs font-bold transition flex-1 sm:flex-initial min-h-[40px] cursor-pointer ${
            activeTab === 'loan'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Percent className="w-4 h-4" />
          <span>Simulasi Cicilan</span>
        </button>
      </div>

      {/* TAB 1: EMERGENCY FUND CALCULATOR */}
      {activeTab === 'emergency' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Input Panel (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <div className="flex items-center gap-2 border-b border-slate-100 dark:border-slate-800 pb-3">
              <Shield className="w-5 h-5 text-emerald-600" />
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Parameter Profil Anda
              </h2>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Status Rumah Tangga / Tanggungan
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { id: 'single', label: 'Lajang (3x)', desc: 'Minimal 3 bulan pengeluaran' },
                    { id: 'married', label: 'Menikah (6x)', desc: 'Ideal 6 bulan pengeluaran' },
                    { id: 'family', label: 'Keluarga (9x)', desc: '9 bulan dengan anak/tanggungan' },
                    { id: 'business', label: 'Freelancer/Usaha (12x)', desc: '12 bulan untuk arus kas fluktuatif' },
                  ].map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setMaritalStatus(s.id as any)}
                      className={`p-3 rounded-2xl border text-left text-xs transition cursor-pointer min-h-[58px] ${
                        maritalStatus === s.id
                          ? 'border-emerald-600 bg-emerald-50 dark:bg-emerald-950/40 text-emerald-900 dark:text-emerald-200 font-bold'
                          : 'border-slate-200 dark:border-slate-800 hover:border-slate-300 text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      <div className="font-bold">{s.label}</div>
                      <div className="text-[10px] text-slate-400 mt-0.5">{s.desc}</div>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Rata-rata Pengeluaran Rutin per Bulan (Rp)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={monthlyExpense || ''}
                  onChange={(e) => setMonthlyExpense(Number(e.target.value))}
                  className="w-full text-base font-bold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Dana Darurat yang Sudah Dimiliki Saat Ini (Rp)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={savedEmergency || ''}
                  onChange={(e) => setSavedEmergency(Number(e.target.value))}
                  className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Kemampuan Menabung Rutin per Bulan (Rp)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={monthlySaveCapacity || ''}
                  onChange={(e) => setMonthlySaveCapacity(Number(e.target.value))}
                  className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          {/* Results Panel (6 cols) */}
          <div className="lg:col-span-6 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Hasil Rekomendasi Dana Darurat
            </h2>

            <div className="p-5 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-emerald-700 dark:text-emerald-300">
                Target Dana Darurat Ideal ({multiplier} Bulan)
              </span>
              <p className="text-3xl font-extrabold text-emerald-800 dark:text-emerald-200">
                {formatCurrency(targetEmergencyFund)}
              </p>
              <p className="text-xs text-emerald-700/80 dark:text-emerald-300/80">
                Memberikan ketenangan finansial bila terjadi PHK, sakit mendadak, atau krisis operasional.
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block">Kekurangan Dana</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(emergencyShortfall)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block">Estimasi Waktu Tercapai</span>
                <span className="text-sm font-bold text-emerald-600 dark:text-emerald-400">
                  {emergencyShortfall === 0 ? 'Sudah Tercapai!' : `${monthsToGoal} Bulan`}
                </span>
              </div>
            </div>

            {/* Recommendations callout */}
            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-2">
              <div className="flex items-center gap-1.5 font-bold text-slate-800 dark:text-slate-200">
                <Info className="w-4 h-4 text-emerald-600" />
                <span>Instrumen Terbaik untuk Dana Darurat:</span>
              </div>
              <ul className="list-disc list-inside space-y-1 text-slate-600 dark:text-slate-400 pl-1 text-[11px]">
                <li><strong>Deposito Bank Digital / Rekening Terpisah:</strong> Likuiditas tinggi dan tidak mudah terpakai belanja.</li>
                <li><strong>Reksa Dana Pasar Uang (RDPU):</strong> Return di atas inflasi tanpa fluktuasi tajam serta bebas pajak.</li>
                <li><strong>Emas Fisik / Tabungan Emas:</strong> Sebagai aset penyimpan nilai jangka panjang.</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: COMPOUND INTEREST (INVESTMENT) */}
      {activeTab === 'compound' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Inputs */}
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-indigo-600" />
              <span>Simulasi Investasi Masa Depan</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Modal Awal / Saldo Pokok (Rp)
                </label>
                <input
                  type="number"
                  step="500000"
                  value={initialPrincipal || ''}
                  onChange={(e) => setInitialPrincipal(Number(e.target.value))}
                  className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Setoran Investasi Rutin per Bulan (Rp)
                </label>
                <input
                  type="number"
                  step="100000"
                  value={monthlyContribution || ''}
                  onChange={(e) => setMonthlyContribution(Number(e.target.value))}
                  className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Return per Tahun (%)
                  </label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    max="30"
                    value={annualReturnRate}
                    onChange={(e) => setAnnualReturnRate(Number(e.target.value))}
                    className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">Misal RDPU 5%, Saham/IHSG 10%</span>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Jangka Waktu (Tahun)
                  </label>
                  <input
                    type="number"
                    min="1"
                    max="40"
                    value={investmentYears}
                    onChange={(e) => setInvestmentYears(Number(e.target.value))}
                    className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                  <span className="text-[10px] text-slate-400 mt-0.5 block">{investmentYears * 12} kali setoran</span>
                </div>
              </div>
            </div>
          </div>

          {/* Results Table & Future Value */}
          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Proyeksi Akumulasi Aset ({investmentYears} Tahun)
            </h2>

            <div className="p-5 rounded-2xl bg-indigo-50 dark:bg-indigo-950/40 border border-indigo-500/20 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-indigo-700 dark:text-indigo-300">
                Nilai Akhir Portofolio (Masa Depan)
              </span>
              <p className="text-3xl font-extrabold text-indigo-800 dark:text-indigo-200">
                {formatCurrency(compoundResult.finalBalance)}
              </p>
              <div className="flex flex-wrap items-center gap-4 text-xs pt-1">
                <span>Modal Disetor: <strong>{formatCurrency(compoundResult.totalDeposited)}</strong></span>
                <span className="text-emerald-600 dark:text-emerald-400">
                  Keuntungan Bunga Majemuk: <strong>+{formatCurrency(compoundResult.totalGains)}</strong>
                </span>
              </div>
            </div>

            {/* Growth Breakdown Table */}
            <div className="space-y-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400">
                Pertumbuhan Portofolio per Tahun
              </h3>
              <div className="max-h-60 overflow-y-auto rounded-2xl border border-slate-100 dark:border-slate-800 text-xs">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 dark:bg-slate-800 text-slate-500 sticky top-0 font-bold">
                    <tr>
                      <th className="py-2.5 px-3">Tahun</th>
                      <th className="py-2.5 px-3">Modal Setor</th>
                      <th className="py-2.5 px-3">Bunga Akumulasi</th>
                      <th className="py-2.5 px-3 text-right">Total Saldo</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {compoundResult.yearlyBreakdown.map((row) => (
                      <tr key={row.year} className="hover:bg-slate-50/50 dark:hover:bg-slate-800/40">
                        <td className="py-2 px-3 font-bold text-slate-800 dark:text-slate-200">Thn ke-{row.year}</td>
                        <td className="py-2 px-3 text-slate-500">{formatCurrency(row.totalDeposited)}</td>
                        <td className="py-2 px-3 text-emerald-600 dark:text-emerald-400 font-semibold">
                          +{formatCurrency(row.interestEarned)}
                        </td>
                        <td className="py-2 px-3 text-right font-bold text-indigo-600 dark:text-indigo-400">
                          {formatCurrency(row.balance)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LOAN / CICILAN CALCULATOR */}
      {activeTab === 'loan' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          <div className="lg:col-span-5 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-5">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3 flex items-center gap-2">
              <Percent className="w-5 h-5 text-amber-600" />
              <span>Kalkulator Cicilan & Hutang</span>
            </h2>

            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Plafon Pinjaman / Harga Bersih (Rp)
                </label>
                <input
                  type="number"
                  step="1000000"
                  value={loanPrincipal || ''}
                  onChange={(e) => setLoanPrincipal(Number(e.target.value))}
                  className="w-full text-base font-bold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Suku Bunga per Tahun (%)
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    min="0"
                    value={loanInterestRate}
                    onChange={(e) => setLoanInterestRate(Number(e.target.value))}
                    className="w-full text-sm font-semibold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  />
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Tenor (Bulan)
                  </label>
                  <select
                    value={loanTenorMonths}
                    onChange={(e) => setLoanTenorMonths(Number(e.target.value))}
                    className="w-full text-sm font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-amber-500/20"
                  >
                    <option value={3}>3 Bulan</option>
                    <option value={6}>6 Bulan</option>
                    <option value={12}>12 Bulan (1 Thn)</option>
                    <option value={24}>24 Bulan (2 Thn)</option>
                    <option value={36}>36 Bulan (3 Thn)</option>
                    <option value={60}>60 Bulan (5 Thn)</option>
                  </select>
                </div>
              </div>
            </div>
          </div>

          <div className="lg:col-span-7 bg-white dark:bg-slate-900 rounded-3xl border border-slate-200/80 dark:border-slate-800 p-6 shadow-xs space-y-6">
            <h2 className="text-base font-bold text-slate-900 dark:text-white border-b border-slate-100 dark:border-slate-800 pb-3">
              Rincian Angsuran Bulanan
            </h2>

            <div className="p-5 rounded-2xl bg-amber-50 dark:bg-amber-950/40 border border-amber-500/20 space-y-2">
              <span className="text-xs font-bold uppercase tracking-wider text-amber-700 dark:text-amber-300">
                Cicilan per Bulan
              </span>
              <p className="text-3xl font-extrabold text-amber-800 dark:text-amber-200">
                {formatCurrency(loanResult.monthlyInstallment)}
                <span className="text-xs font-medium text-slate-500"> / bulan</span>
              </p>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block">Total Bunga Dibayarkan</span>
                <span className="text-sm font-bold text-red-600 dark:text-red-400">
                  {formatCurrency(loanResult.totalInterest)}
                </span>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800">
                <span className="text-slate-400 block">Total Pengembalian</span>
                <span className="text-sm font-bold text-slate-900 dark:text-white">
                  {formatCurrency(loanResult.totalPayment)}
                </span>
              </div>
            </div>

            <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/40 border border-slate-200 dark:border-slate-700 text-xs space-y-1.5">
              <span className="font-bold text-slate-800 dark:text-slate-200 block">
                Prinsip Rasio Cicilan Sehat (Debt Service Ratio / DSR):
              </span>
              <p className="text-slate-500 dark:text-slate-400 text-[11px]">
                Pastikan total akumulasi seluruh cicilan bulanan Anda tidak melebihi <strong>30% dari pemasukan bulanan</strong> untuk menghindari jeratan hutang dan gagal bayar.
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
