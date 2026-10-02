import React, { useState } from 'react';
import {
  Target,
  Plus,
  Coins,
  Calendar,
  CheckCircle2,
  AlertCircle,
  X,
  Edit2,
  Trash2,
  Sparkles,
  TrendingUp,
  Shield,
  Plane,
  Laptop,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { SavingsGoal } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

const CATEGORY_ICONS: Record<string, string> = {
  Darurat: '🛡️',
  Liburan: '✈️',
  Investasi: '📈',
  Gadget: '💻',
  Kendaraan: '🛵',
  Pendidikan: '🎓',
  Lainnya: '🎯',
};

const COLOR_OPTIONS = ['#059669', '#3B82F6', '#8B5CF6', '#EC4899', '#F59E0B', '#10B981', '#6366F1'];

export const SavingsGoalsView: React.FC = () => {
  const {
    savingsGoals,
    wallets,
    addSavingsGoal,
    updateSavingsGoal,
    deleteSavingsGoal,
    depositToGoal,
  } = useFinance();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isDepositModalOpen, setIsDepositModalOpen] = useState(false);
  const [activeGoal, setActiveGoal] = useState<SavingsGoal | null>(null);

  // Add/Edit Form
  const [nama, setNama] = useState('');
  const [kategori, setKategori] = useState<SavingsGoal['kategori']>('Darurat');
  const [targetNominal, setTargetNominal] = useState<number>(0);
  const [tenggatWaktu, setTenggatWaktu] = useState('');
  const [catatan, setCatatan] = useState('');
  const [warna, setWarna] = useState('#059669');
  const [formError, setFormError] = useState<string | null>(null);

  // Deposit Form
  const [depositAmount, setDepositAmount] = useState<number>(0);
  const [sourceWalletId, setSourceWalletId] = useState<string>(wallets[0]?.id || '');
  const [depositError, setDepositError] = useState<string | null>(null);
  const [depositSuccess, setDepositSuccess] = useState<string | null>(null);

  const totalTarget = savingsGoals.reduce((sum, g) => sum + g.targetNominal, 0);
  const totalTerkumpul = savingsGoals.reduce((sum, g) => sum + g.terkumpul, 0);
  const overallPercentage = totalTarget > 0 ? Math.min(100, Math.round((totalTerkumpul / totalTarget) * 100)) : 0;

  const handleOpenAdd = () => {
    setActiveGoal(null);
    setNama('');
    setKategori('Darurat');
    setTargetNominal(10000000);
    setTenggatWaktu(new Date(Date.now() + 180 * 86400000).toISOString().split('T')[0]);
    setCatatan('');
    setWarna('#059669');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (goal: SavingsGoal) => {
    setActiveGoal(goal);
    setNama(goal.nama);
    setKategori(goal.kategori);
    setTargetNominal(goal.targetNominal);
    setTenggatWaktu(goal.tenggatWaktu);
    setCatatan(goal.catatan || '');
    setWarna(goal.warna);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveGoal = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setFormError('Nama target impian wajib diisi.');
      return;
    }
    if (targetNominal <= 0) {
      setFormError('Target nominal harus lebih besar dari 0.');
      return;
    }

    if (activeGoal) {
      updateSavingsGoal(activeGoal.id, {
        nama: nama.trim(),
        kategori,
        targetNominal,
        tenggatWaktu,
        catatan: catatan.trim() || undefined,
        ikon: CATEGORY_ICONS[kategori] || '🎯',
        warna,
      });
    } else {
      addSavingsGoal({
        nama: nama.trim(),
        kategori,
        targetNominal,
        tenggatWaktu: tenggatWaktu || new Date().toISOString().split('T')[0],
        catatan: catatan.trim() || undefined,
        ikon: CATEGORY_ICONS[kategori] || '🎯',
        warna,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleOpenDeposit = (goal: SavingsGoal) => {
    setActiveGoal(goal);
    setDepositAmount(0);
    setSourceWalletId(wallets[0]?.id || '');
    setDepositError(null);
    setDepositSuccess(null);
    setIsDepositModalOpen(true);
  };

  const handleExecuteDeposit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeGoal) return;
    if (depositAmount <= 0) {
      setDepositError('Nominal setoran harus lebih dari Rp 0.');
      return;
    }

    const res = depositToGoal(activeGoal.id, depositAmount, sourceWalletId || undefined);
    if (!res.success) {
      setDepositError(res.error || 'Gagal menyetor tabungan.');
    } else {
      setDepositSuccess(`Berhasil menyetor ${formatCurrency(depositAmount)} ke ${activeGoal.nama}!`);
      setTimeout(() => {
        setIsDepositModalOpen(false);
        setDepositSuccess(null);
      }, 1000);
    }
  };

  const calculateDaysRemaining = (dateStr: string) => {
    const target = new Date(dateStr).getTime();
    const now = new Date().setHours(0, 0, 0, 0);
    const diff = Math.ceil((target - now) / (1000 * 60 * 60 * 24));
    if (diff < 0) return 'Tenggat lewat';
    if (diff === 0) return 'Hari ini';
    return `${diff} hari lagi`;
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-6xl mx-auto">
      {/* Header Banner */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-emerald-950 via-slate-900 to-indigo-950 text-white shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-6">
        <div className="space-y-2">
          <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
            Perencanaan Finansial & Target Impian
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Pos Tabungan & Wishlist
          </h1>
          <p className="text-xs sm:text-sm text-slate-300 max-w-xl">
            Kumpulkan dana untuk impian Anda secara konsisten: Dana Darurat, Liburan, Gadget, atau DP Rumah dengan alokasi otomatis dari dompet.
          </p>
        </div>

        <button
          type="button"
          onClick={handleOpenAdd}
          className="inline-flex items-center gap-2 px-5 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer shrink-0 min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Buat Target Baru</span>
        </button>
      </div>

      {/* Progress Overview Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-medium">Total Dana Terkumpul</span>
          <p className="text-xl sm:text-2xl font-extrabold text-emerald-600 dark:text-emerald-400">
            {formatCurrency(totalTerkumpul)}
          </p>
          <span className="text-[11px] text-slate-400 block pt-0.5">
            {overallPercentage}% dari total target keseluruhan
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-medium">Target Akumulasi</span>
          <p className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white">
            {formatCurrency(totalTarget)}
          </p>
          <span className="text-[11px] text-slate-400 block pt-0.5">
            Dari {savingsGoals.length} pos tabungan aktif
          </span>
        </div>

        <div className="p-5 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-1">
          <span className="text-xs text-slate-400 font-medium">Sisa yang Perlu Ditabung</span>
          <p className="text-xl sm:text-2xl font-extrabold text-indigo-600 dark:text-indigo-400">
            {formatCurrency(Math.max(0, totalTarget - totalTerkumpul))}
          </p>
          <span className="text-[11px] text-slate-400 block pt-0.5">
            Pertahankan komitmen nabung rutin
          </span>
        </div>
      </div>

      {/* Goals Grid */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
          <Target className="w-5 h-5 text-emerald-600" />
          <span>Semua Pos Tabungan ({savingsGoals.length})</span>
        </h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {savingsGoals.map((goal) => {
            const percentage = Math.min(100, Math.round((goal.terkumpul / goal.targetNominal) * 100));
            const isCompleted = percentage >= 100;
            const remainingDays = calculateDaysRemaining(goal.tenggatWaktu);

            return (
              <div
                key={goal.id}
                className="rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md transition space-y-4 flex flex-col justify-between"
              >
                <div className="space-y-3">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl shadow-xs"
                        style={{ backgroundColor: `${goal.warna}15` }}
                      >
                        {goal.ikon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {goal.nama}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{goal.kategori}</span>
                          <span aria-hidden="true">·</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            <span>{remainingDays}</span>
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(goal)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
                        title="Ubah Target"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => deleteSavingsGoal(goal.id)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-red-500"
                        title="Hapus Target"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Progress Numbers */}
                  <div className="pt-1">
                    <div className="flex items-baseline justify-between text-xs mb-1.5">
                      <span className="font-extrabold text-slate-900 dark:text-white text-base">
                        {formatCurrency(goal.terkumpul)}
                      </span>
                      <span className="text-slate-400 text-xs">
                        dari {formatCurrency(goal.targetNominal)}
                      </span>
                    </div>

                    {/* Progress Bar */}
                    <div className="w-full h-2.5 rounded-full bg-slate-100 dark:bg-slate-800 overflow-hidden">
                      <div
                        className="h-full rounded-full transition-all duration-500"
                        style={{
                          width: `${percentage}%`,
                          backgroundColor: isCompleted ? '#10B981' : goal.warna,
                        }}
                      />
                    </div>

                    <div className="flex items-center justify-between text-[11px] text-slate-400 pt-1.5 font-medium">
                      <span>{percentage}% Tercapai</span>
                      <span>Sisa {formatCurrency(Math.max(0, goal.targetNominal - goal.terkumpul))}</span>
                    </div>
                  </div>

                  {goal.catatan && (
                    <p className="text-xs text-slate-500 dark:text-slate-400 bg-slate-50 dark:bg-slate-800/50 p-2.5 rounded-xl line-clamp-2">
                      {goal.catatan}
                    </p>
                  )}
                </div>

                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => handleOpenDeposit(goal)}
                    className="w-full flex items-center justify-center gap-2 py-2.5 px-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-950/60 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 font-bold text-xs transition cursor-pointer min-h-[40px]"
                  >
                    <Coins className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                    <span>Nabung ke Pos Ini</span>
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Goal Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {activeGoal ? 'Ubah Target Tabungan' : 'Buat Target Tabungan Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {formError && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Nama Target
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: Dana Darurat, Liburan Jepang, DP Mobil"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Kategori
                  </label>
                  <select
                    value={kategori}
                    onChange={(e) => setKategori(e.target.value as SavingsGoal['kategori'])}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    <option value="Darurat">🛡️ Dana Darurat</option>
                    <option value="Liburan">✈️ Liburan</option>
                    <option value="Investasi">📈 Investasi</option>
                    <option value="Gadget">💻 Gadget</option>
                    <option value="Kendaraan">🛵 Kendaraan</option>
                    <option value="Pendidikan">🎓 Pendidikan</option>
                    <option value="Lainnya">🎯 Lainnya</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Target Nominal (Rp)
                  </label>
                  <input
                    type="number"
                    min="10000"
                    step="50000"
                    value={targetNominal || ''}
                    onChange={(e) => setTargetNominal(Number(e.target.value))}
                    className="w-full text-sm font-bold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Target Tanggal Selesai
                </label>
                <input
                  type="date"
                  required
                  value={tenggatWaktu}
                  onChange={(e) => setTenggatWaktu(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Warna Tema
                </label>
                <div className="flex flex-wrap gap-2">
                  {COLOR_OPTIONS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setWarna(c)}
                      className={`w-7 h-7 rounded-full transition ${warna === c ? 'ring-2 ring-offset-2 ring-slate-900 dark:ring-white scale-110' : ''}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Catatan / Motivasi (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: Siapkan dana sebelum cuti bersama"
                  value={catatan}
                  onChange={(e) => setCatatan(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  {activeGoal ? 'Simpan Target' : 'Buat Target'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit to Goal Modal */}
      {isDepositModalOpen && activeGoal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Nabung ke {activeGoal.nama}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsDepositModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {depositError && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 text-xs text-red-700 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{depositError}</span>
              </div>
            )}

            {depositSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 text-xs text-emerald-700 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{depositSuccess}</span>
              </div>
            )}

            <form onSubmit={handleExecuteDeposit} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Ambil Dana dari Dompet
                </label>
                <select
                  value={sourceWalletId}
                  onChange={(e) => setSourceWalletId(e.target.value)}
                  className="w-full text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                >
                  {wallets.map((w) => (
                    <option key={w.id} value={w.id}>
                      {w.nama} ({formatCurrency(w.saldo)})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Nominal yang Ditabung (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1000"
                  step="10000"
                  placeholder="0"
                  value={depositAmount || ''}
                  onChange={(e) => setDepositAmount(Number(e.target.value))}
                  className="w-full text-base font-bold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="grid grid-cols-3 gap-2">
                {[50000, 100000, 500000].map((amt) => (
                  <button
                    key={amt}
                    type="button"
                    onClick={() => setDepositAmount((prev) => prev + amt)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
                  >
                    +{formatCurrency(amt)}
                  </button>
                ))}
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsDepositModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  Simpan Tabungan
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
