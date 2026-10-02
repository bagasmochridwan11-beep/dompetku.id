import React, { useState } from 'react';
import {
  Wallet as WalletIcon,
  ArrowRightLeft,
  Plus,
  Landmark,
  CreditCard,
  Banknote,
  TrendingUp,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  MoreVertical,
  X,
  Edit2,
  Archive,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { Wallet, WalletType } from '../../types/finance';
import { formatCurrency } from '../../utils/formatters';

const WALLET_TYPE_LABELS: Record<WalletType, { label: string; icon: typeof Landmark; color: string }> = {
  bank: { label: 'Bank', icon: Landmark, color: 'text-blue-600 bg-blue-50 dark:bg-blue-950/40' },
  ewallet: { label: 'E-Wallet', icon: CreditCard, color: 'text-emerald-600 bg-emerald-50 dark:bg-emerald-950/40' },
  cash: { label: 'Tunai', icon: Banknote, color: 'text-amber-600 bg-amber-50 dark:bg-amber-950/40' },
  investment: { label: 'Investasi', icon: TrendingUp, color: 'text-purple-600 bg-purple-50 dark:bg-purple-950/40' },
};

const COLOR_OPTIONS = ['#00529C', '#003366', '#00AA13', '#10B981', '#6366F1', '#EC4899', '#F59E0B', '#EF4444'];
const ICON_OPTIONS = ['🏦', '💳', '🟢', '💵', '📈', '🪙', '💰', '👛', '📱'];

export const WalletsView: React.FC = () => {
  const {
    wallets,
    totalNetWorth,
    addWallet,
    updateWallet,
    deleteWallet,
    transferFunds,
  } = useFinance();

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [editingWallet, setEditingWallet] = useState<Wallet | null>(null);

  // Add/Edit Wallet Form state
  const [nama, setNama] = useState('');
  const [tipe, setTipe] = useState<WalletType>('bank');
  const [saldo, setSaldo] = useState<number>(0);
  const [nomorRekening, setNomorRekening] = useState('');
  const [ikon, setIkon] = useState('🏦');
  const [warna, setWarna] = useState('#00529C');
  const [formError, setFormError] = useState<string | null>(null);

  // Transfer Form state
  const [transferSourceId, setTransferSourceId] = useState(wallets[0]?.id || '');
  const [transferTargetId, setTransferTargetId] = useState(wallets[1]?.id || '');
  const [transferAmount, setTransferAmount] = useState<number>(0);
  const [transferAdminFee, setTransferAdminFee] = useState<number>(0);
  const [transferNote, setTransferNote] = useState('');
  const [transferError, setTransferError] = useState<string | null>(null);
  const [transferSuccess, setTransferSuccess] = useState<string | null>(null);

  const activeWallets = wallets.filter((w) => !w.diarsipkan);
  const archivedWallets = wallets.filter((w) => w.diarsipkan);

  // Balance breakdown by wallet type
  const breakdown = {
    bank: activeWallets.filter((w) => w.tipe === 'bank').reduce((sum, w) => sum + w.saldo, 0),
    ewallet: activeWallets.filter((w) => w.tipe === 'ewallet').reduce((sum, w) => sum + w.saldo, 0),
    cash: activeWallets.filter((w) => w.tipe === 'cash').reduce((sum, w) => sum + w.saldo, 0),
    investment: activeWallets.filter((w) => w.tipe === 'investment').reduce((sum, w) => sum + w.saldo, 0),
  };

  const handleOpenAdd = () => {
    setEditingWallet(null);
    setNama('');
    setTipe('bank');
    setSaldo(0);
    setNomorRekening('');
    setIkon('🏦');
    setWarna('#00529C');
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEdit = (wallet: Wallet) => {
    setEditingWallet(wallet);
    setNama(wallet.nama);
    setTipe(wallet.tipe);
    setSaldo(wallet.saldo);
    setNomorRekening(wallet.nomorRekening || '');
    setIkon(wallet.ikon);
    setWarna(wallet.warna);
    setFormError(null);
    setIsAddModalOpen(true);
  };

  const handleSaveWallet = (e: React.FormEvent) => {
    e.preventDefault();
    if (!nama.trim()) {
      setFormError('Nama dompet/rekening wajib diisi.');
      return;
    }

    if (editingWallet) {
      updateWallet(editingWallet.id, {
        nama: nama.trim(),
        tipe,
        saldo: Number(saldo) || 0,
        nomorRekening: nomorRekening.trim() || undefined,
        ikon,
        warna,
      });
    } else {
      addWallet({
        nama: nama.trim(),
        tipe,
        saldo: Number(saldo) || 0,
        nomorRekening: nomorRekening.trim() || undefined,
        ikon,
        warna,
      });
    }

    setIsAddModalOpen(false);
  };

  const handleOpenTransfer = (sourceId?: string) => {
    setTransferError(null);
    setTransferSuccess(null);
    setTransferAmount(0);
    setTransferAdminFee(0);
    setTransferNote('');
    if (sourceId) {
      setTransferSourceId(sourceId);
      const other = activeWallets.find((w) => w.id !== sourceId);
      if (other) setTransferTargetId(other.id);
    } else {
      setTransferSourceId(activeWallets[0]?.id || '');
      setTransferTargetId(activeWallets[1]?.id || '');
    }
    setIsTransferModalOpen(true);
  };

  const handleExecuteTransfer = (e: React.FormEvent) => {
    e.preventDefault();
    setTransferError(null);

    if (transferAmount <= 0) {
      setTransferError('Nominal transfer harus lebih besar dari Rp 0.');
      return;
    }

    const res = transferFunds(
      transferSourceId,
      transferTargetId,
      transferAmount,
      transferAdminFee,
      transferNote.trim()
    );

    if (!res.success) {
      setTransferError(res.error || 'Gagal memproses transfer.');
    } else {
      setTransferSuccess('Transfer dana antar dompet berhasil dibukukan!');
      setTimeout(() => {
        setIsTransferModalOpen(false);
        setTransferSuccess(null);
      }, 1000);
    }
  };

  return (
    <div className="space-y-6 pb-20 md:pb-8 max-w-6xl mx-auto">
      {/* Top Banner: Total Net Worth & Transfer Trigger */}
      <div className="p-6 sm:p-8 rounded-3xl bg-linear-to-br from-slate-900 via-slate-800 to-emerald-950 text-white shadow-xl relative overflow-hidden">
        <div className="relative z-10 flex flex-col sm:flex-row sm:items-center justify-between gap-6">
          <div className="space-y-2">
            <span className="text-xs uppercase font-bold tracking-wider text-emerald-400">
              Kekayaan Bersih & Likuiditas
            </span>
            <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight">
              {formatCurrency(totalNetWorth)}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300">
              Total saldo aktif dari {activeWallets.length} rekening bank, e-wallet, uang tunai, dan investasi.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <button
              type="button"
              onClick={() => handleOpenTransfer()}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 text-white font-semibold text-xs sm:text-sm shadow-sm transition active:scale-95 cursor-pointer min-h-[44px]"
            >
              <ArrowRightLeft className="w-4 h-4 text-emerald-400" />
              <span>Transfer Antar Dompet</span>
            </button>

            <button
              type="button"
              onClick={handleOpenAdd}
              className="inline-flex items-center gap-2 px-4 py-3 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs sm:text-sm shadow-md shadow-emerald-600/30 transition active:scale-95 cursor-pointer min-h-[44px]"
            >
              <Plus className="w-4 h-4 stroke-[3]" />
              <span>Tambah Rekening</span>
            </button>
          </div>
        </div>

        {/* Breakdown bar */}
        <div className="relative z-10 grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 mt-6 border-t border-white/10 text-xs">
          <div>
            <span className="text-slate-400 block">Bank</span>
            <span className="text-sm font-bold text-white">{formatCurrency(breakdown.bank)}</span>
          </div>
          <div>
            <span className="text-slate-400 block">E-Wallet</span>
            <span className="text-sm font-bold text-white">{formatCurrency(breakdown.ewallet)}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Uang Tunai (Cash)</span>
            <span className="text-sm font-bold text-white">{formatCurrency(breakdown.cash)}</span>
          </div>
          <div>
            <span className="text-slate-400 block">Investasi</span>
            <span className="text-sm font-bold text-white">{formatCurrency(breakdown.investment)}</span>
          </div>
        </div>
      </div>

      {/* Wallets Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-base sm:text-lg font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <WalletIcon className="w-5 h-5 text-emerald-600" />
            <span>Daftar Dompet & Rekening ({activeWallets.length})</span>
          </h2>
          <span className="text-xs text-slate-400">
            Pilih rekening saat mencatat transaksi
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {activeWallets.map((wallet) => {
            const typeInfo = WALLET_TYPE_LABELS[wallet.tipe];
            const Icon = typeInfo.icon;

            return (
              <div
                key={wallet.id}
                className="group relative rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 p-5 shadow-xs hover:shadow-md hover:border-slate-300 dark:hover:border-slate-700 transition flex flex-col justify-between space-y-4"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-xs"
                        style={{ backgroundColor: `${wallet.warna}15`, color: wallet.warna }}
                      >
                        {wallet.ikon}
                      </div>
                      <div>
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {wallet.nama}
                        </h3>
                        <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
                          <span>{typeInfo.label}</span>
                          {wallet.nomorRekening && (
                            <>
                              <span aria-hidden="true">·</span>
                              <span className="font-mono text-[11px]">{wallet.nomorRekening}</span>
                            </>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(wallet)}
                        className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Ubah Dompet"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  <div className="pt-4">
                    <span className="text-xs text-slate-400 block">Saldo Saat Ini</span>
                    <span className="text-xl sm:text-2xl font-extrabold text-slate-900 dark:text-white tracking-tight">
                      {formatCurrency(wallet.saldo)}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs">
                  <button
                    type="button"
                    onClick={() => handleOpenTransfer(wallet.id)}
                    className="inline-flex items-center gap-1.5 text-emerald-600 dark:text-emerald-400 font-semibold hover:underline"
                  >
                    <ArrowRightLeft className="w-3.5 h-3.5" />
                    <span>Pindah Dana</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => deleteWallet(wallet.id)}
                    className="text-slate-400 hover:text-red-500 transition"
                    title="Arsipkan / Hapus dompet"
                  >
                    <Archive className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Add / Edit Wallet Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white">
                {editingWallet ? 'Ubah Dompet / Rekening' : 'Tambah Dompet / Rekening Baru'}
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
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{formError}</span>
              </div>
            )}

            <form onSubmit={handleSaveWallet} className="space-y-4">
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Nama Dompet / Rekening
                </label>
                <input
                  type="text"
                  required
                  placeholder="Contoh: BCA Gaji, GoPay, Dompet Saku"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Jenis
                  </label>
                  <select
                    value={tipe}
                    onChange={(e) => setTipe(e.target.value as WalletType)}
                    className="w-full text-sm px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  >
                    <option value="bank">Bank</option>
                    <option value="ewallet">E-Wallet</option>
                    <option value="cash">Tunai (Cash)</option>
                    <option value="investment">Investasi</option>
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Saldo Awal
                  </label>
                  <input
                    type="number"
                    min="0"
                    placeholder="0"
                    value={saldo || ''}
                    onChange={(e) => setSaldo(Number(e.target.value))}
                    className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Nomor Rekening / No. HP (Opsional)
                </label>
                <input
                  type="text"
                  placeholder="Misal: 123-456-7890"
                  value={nomorRekening}
                  onChange={(e) => setNomorRekening(e.target.value)}
                  className="w-full text-sm px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500"
                />
              </div>

              {/* Icon & Color selector */}
              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Pilih Ikon
                </label>
                <div className="flex flex-wrap gap-2">
                  {ICON_OPTIONS.map((item) => (
                    <button
                      key={item}
                      type="button"
                      onClick={() => setIkon(item)}
                      className={`w-9 h-9 rounded-xl flex items-center justify-center text-base transition ${
                        ikon === item ? 'bg-emerald-100 dark:bg-emerald-950/80 ring-2 ring-emerald-500' : 'bg-slate-100 dark:bg-slate-800 hover:bg-slate-200'
                      }`}
                    >
                      {item}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Pilih Warna Aksen
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
                  {editingWallet ? 'Simpan Perubahan' : 'Tambah Rekening'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transfer Funds Modal */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white dark:bg-slate-900 w-full max-w-md rounded-3xl p-6 shadow-2xl border border-slate-200 dark:border-slate-800 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ArrowRightLeft className="w-5 h-5 text-emerald-600" />
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Transfer Dana Antar Dompet
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="p-1 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {transferError && (
              <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{transferError}</span>
              </div>
            )}

            {transferSuccess && (
              <div className="p-3 rounded-2xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 text-xs text-emerald-700 dark:text-emerald-300 flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{transferSuccess}</span>
              </div>
            )}

            <form onSubmit={handleExecuteTransfer} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Dari Dompet
                  </label>
                  <select
                    value={transferSourceId}
                    onChange={(e) => setTransferSourceId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {activeWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama} ({formatCurrency(w.saldo)})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                    Ke Dompet
                  </label>
                  <select
                    value={transferTargetId}
                    onChange={(e) => setTransferTargetId(e.target.value)}
                    className="w-full text-xs font-semibold px-3 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                  >
                    {activeWallets.map((w) => (
                      <option key={w.id} value={w.id}>
                        {w.nama}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Nominal Transfer (Rp)
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  placeholder="0"
                  value={transferAmount || ''}
                  onChange={(e) => setTransferAmount(Number(e.target.value))}
                  className="w-full text-base font-bold px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Biaya Admin (Opsional)
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="0"
                  value={transferAdminFee || ''}
                  onChange={(e) => setTransferAdminFee(Number(e.target.value))}
                  className="w-full text-xs px-3.5 py-2 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div>
                <label className="text-xs font-bold uppercase tracking-wider text-slate-500 dark:text-slate-400 block mb-1">
                  Catatan Transfer
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tarik tunai, Top-Up GoPay"
                  value={transferNote}
                  onChange={(e) => setTransferNote(e.target.value)}
                  className="w-full text-xs px-3.5 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsTransferModalOpen(false)}
                  className="px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-600 dark:text-slate-400 hover:bg-slate-100 transition"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-5 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs shadow-md transition"
                >
                  Kirim & Catat Transfer
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
