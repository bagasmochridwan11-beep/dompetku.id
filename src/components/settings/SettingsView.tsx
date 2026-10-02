import React, { useRef, useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { ConfirmModal } from '../common/ConfirmModal';
import {
  Moon,
  Sun,
  Download,
  Upload,
  RotateCcw,
  Trash2,
  CheckCircle2,
  AlertCircle,
  HelpCircle,
  Smartphone,
  ShieldCheck,
  Globe,
  Cloud,
  LogOut,
  RefreshCw,
} from 'lucide-react';

export const SettingsView: React.FC = () => {
  const {
    settings,
    toggleDarkMode,
    resetToDefaultData,
    clearAllData,
    exportDataJSON,
    importDataJSON,
    transactions,
    categories,
    subcategories,
    user,
    signInGoogle,
    signOutUser,
    isCloudSyncing,
    lastSyncedTime,
    syncWithCloud,
  } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [importStatus, setImportStatus] = useState<{ type: 'success' | 'error'; message: string } | null>(
    null
  );

  const [isResetConfirmOpen, setIsResetConfirmOpen] = useState(false);
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);

  const handleGoogleSignIn = async () => {
    setAuthError(null);
    const res = await signInGoogle();
    if (!res.success && res.error) {
      setAuthError(res.error);
    }
  };

  // Export JSON backup
  const handleExportJSON = () => {
    const jsonStr = exportDataJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    const dateStr = new Date().toISOString().split('T')[0];
    link.download = `backup_dompetku_${dateStr}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Import JSON backup
  const handleImportFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      const res = importDataJSON(content);
      if (res.success) {
        setImportStatus({ type: 'success', message: 'Data backup berhasil dipulihkan!' });
      } else {
        setImportStatus({ type: 'error', message: res.error || 'Gagal memulihkan file.' });
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8 max-w-4xl">
      {/* Top Header */}
      <div>
        <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
          Pengaturan & Data
        </h1>
        <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
          Kelola sinkronisasi Google Firebase, preferensi tampilan, dan backup data
        </p>
      </div>

      {/* Firebase Cloud & Auth Card */}
      <div className="p-6 rounded-3xl bg-linear-to-br from-white to-emerald-50/30 dark:from-slate-900 dark:to-emerald-950/20 border border-emerald-500/20 dark:border-emerald-500/20 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Akun & Firebase Cloud
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Penyimpanan cloud Firestore terenkripsi dengan Google Sign-in
              </p>
            </div>
          </div>
          <span className={`text-xs font-semibold px-2.5 py-1 rounded-full ${
            user
              ? 'bg-emerald-100 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300'
              : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400'
          }`}>
            {user ? 'Terhubung ke Cloud' : 'Mode Offline / Lokal'}
          </span>
        </div>

        {authError && (
          <div className="p-3 rounded-2xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-xs text-red-700 dark:text-red-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{authError}</span>
          </div>
        )}

        {user ? (
          <div className="space-y-4 pt-1">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div className="flex items-center gap-3">
                {user.photoURL ? (
                  <img
                    src={user.photoURL}
                    alt={user.displayName || 'User'}
                    className="w-12 h-12 rounded-full border-2 border-emerald-500"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-full bg-emerald-600 text-white font-bold text-base flex items-center justify-center">
                    {(user.displayName || user.email || 'U')[0].toUpperCase()}
                  </div>
                )}
                <div>
                  <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                    {user.displayName || 'Pengguna Terdaftar'}
                  </h3>
                  <p className="text-xs text-slate-500 dark:text-slate-400">{user.email}</p>
                  <p className="text-[10px] text-slate-400 font-mono mt-0.5">UID: {user.uid.slice(0, 12)}...</p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => syncWithCloud()}
                  disabled={isCloudSyncing}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-slate-50 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-200 transition"
                  title="Paksa sinkronisasi sekarang"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-spin text-emerald-500' : ''}`} />
                  <span>{isCloudSyncing ? 'Menyinkronkan...' : 'Sinkronkan Sekarang'}</span>
                </button>

                <button
                  type="button"
                  onClick={signOutUser}
                  className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 hover:bg-red-100 text-xs font-semibold transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar</span>
                </button>
              </div>
            </div>

            <div className="text-xs text-slate-500 dark:text-slate-400 flex items-center justify-between px-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                <span>Semua transaksi, budget, & kategori tersimpan di Google Firestore</span>
              </span>
              {lastSyncedTime && (
                <span className="text-[11px] text-slate-400">
                  Terakhir sinkron: {lastSyncedTime.toLocaleTimeString('id-ID')}
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="p-4 rounded-2xl bg-white dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                Masuk untuk Mengaktifkan Cloud Sync
              </h3>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                Data transaksi Anda akan disinkronkan secara otomatis dan aman antar perangkat.
              </p>
            </div>

            <button
              type="button"
              onClick={handleGoogleSignIn}
              className="flex items-center justify-center gap-2.5 px-4 py-2.5 rounded-2xl bg-white hover:bg-slate-50 border border-slate-300 dark:border-slate-700 text-slate-800 dark:text-slate-100 dark:bg-slate-800 text-xs font-bold shadow-sm transition active:scale-95 cursor-pointer min-h-[42px] shrink-0"
            >
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
              </svg>
              <span>Masuk dengan Google</span>
            </button>
          </div>
        )}
      </div>

      {/* App Appearance Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-slate-900 dark:text-white">
          Tampilan & Preferensi
        </h2>

        {/* Dark Mode Switch */}
        <div className="flex items-center justify-between py-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-700 dark:text-slate-200">
              {settings.darkMode ? <Moon className="w-5 h-5 text-indigo-400" /> : <Sun className="w-5 h-5 text-amber-500" />}
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Tema {settings.darkMode ? 'Gelap (Dark Mode)' : 'Terang (Light Mode)'}
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pilih tampilan yang nyaman di mata
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={toggleDarkMode}
            className={`w-14 h-8 rounded-full transition-colors relative p-1 cursor-pointer min-h-[32px] ${
              settings.darkMode ? 'bg-emerald-600' : 'bg-slate-300'
            }`}
            title="Ganti Mode Gelap / Terang"
          >
            <div
              className={`w-6 h-6 rounded-full bg-white shadow-md transform transition-transform ${
                settings.darkMode ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>

        {/* Currency Format Info */}
        <div className="flex items-center justify-between py-2">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950 flex items-center justify-center text-emerald-600 font-bold text-sm">
              Rp
            </div>
            <div>
              <p className="text-sm font-bold text-slate-900 dark:text-white">
                Format Mata Uang
              </p>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Rupiah Indonesia (Rp 1.500.000) dengan titik pemisah ribuan
              </p>
            </div>
          </div>
          <span className="text-xs font-semibold text-emerald-600 bg-emerald-50 dark:bg-emerald-950/60 px-3 py-1 rounded-full">
            Aktif
          </span>
        </div>
      </div>

      {/* PWA & Install Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 dark:bg-indigo-950 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <Smartphone className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-slate-900 dark:text-white">
                Aplikasi Web Progresif (PWA)
              </h2>
              <p className="text-xs text-slate-500 dark:text-slate-400">
                Pasang di layar utama HP atau tablet untuk akses cepat seperti aplikasi bawaan
              </p>
            </div>
          </div>

          <PWAInstallButton />
        </div>

        <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-800/60 text-xs text-slate-600 dark:text-slate-300 space-y-1">
          <div className="flex items-center gap-1.5 font-semibold text-slate-900 dark:text-white">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Mendukung Penggunaan Offline</span>
          </div>
          <p>
            Aplikasi tetap dapat dibuka dan digunakan meskipun tanpa koneksi internet. Semua data disimpan secara lokal di memori browser Anda.
          </p>
        </div>
      </div>

      {/* Backup & Restore Card */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-4">
        <div>
          <h2 className="text-base font-bold text-slate-900 dark:text-white">
            Cadangkan & Pulihkan Data (Backup & Restore)
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
            Simpan data ke file JSON agar dapat dipindahkan ke perangkat atau browser lain
          </p>
        </div>

        {importStatus && (
          <div
            className={`p-3 rounded-2xl text-xs flex items-center gap-2 ${
              importStatus.type === 'success'
                ? 'bg-emerald-50 text-emerald-800 border border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300'
                : 'bg-rose-50 text-rose-800 border border-rose-200 dark:bg-rose-950/60 dark:text-rose-300'
            }`}
          >
            {importStatus.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 shrink-0" />
            ) : (
              <AlertCircle className="w-4 h-4 shrink-0" />
            )}
            <span>{importStatus.message}</span>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-3 pt-1">
          <button
            type="button"
            onClick={handleExportJSON}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold transition min-h-[44px]"
          >
            <Download className="w-4 h-4 text-emerald-600" />
            <span>Unduh Cadangan (Export JSON)</span>
          </button>

          <label className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-800 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700 text-sm font-semibold transition cursor-pointer min-h-[44px]">
            <Upload className="w-4 h-4 text-blue-600" />
            <span>Pulihkan Cadangan (Import JSON)</span>
            <input
              type="file"
              ref={fileInputRef}
              accept=".json"
              onChange={handleImportFile}
              className="hidden"
            />
          </label>
        </div>

        <div className="text-[11px] text-slate-400">
          Saat ini tersimpan: {categories.length} kategori · {subcategories.length} subkategori · {transactions.length} transaksi.
        </div>
      </div>

      {/* Danger Zone: Reset to Default & Clear All */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-rose-200/80 dark:border-rose-950/60 shadow-xs space-y-4">
        <h2 className="text-base font-bold text-rose-600 dark:text-rose-400">
          Zona Bahaya (Reset Data)
        </h2>

        <div className="flex flex-col sm:flex-row gap-3">
          <button
            type="button"
            onClick={() => setIsResetConfirmOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/50 dark:bg-rose-950/20 text-rose-700 dark:text-rose-400 hover:bg-rose-100 dark:hover:bg-rose-900/40 text-sm font-semibold transition min-h-[44px]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>Reset ke Data Contoh Bawaan</span>
          </button>

          <button
            type="button"
            onClick={() => setIsClearConfirmOpen(true)}
            className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 rounded-2xl bg-rose-600 hover:bg-rose-700 text-white text-sm font-semibold transition min-h-[44px]"
          >
            <Trash2 className="w-4 h-4" />
            <span>Hapus Semua Transaksi & Budget</span>
          </button>
        </div>
      </div>

      {/* Petunjuk Deployment & Cara Pakai */}
      <div className="p-6 rounded-3xl bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center gap-2 text-slate-900 dark:text-white font-bold text-sm">
          <Globe className="w-4 h-4 text-emerald-600" />
          <span>Petunjuk Menjalankan & Men-Deploy</span>
        </div>

        <div className="text-xs text-slate-600 dark:text-slate-400 space-y-2 leading-relaxed">
          <p>
            <strong>1. Menjalankan secara lokal:</strong>
          </p>
          <pre className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto">
            npm install{'\n'}npm run dev
          </pre>
          <p>
            <strong>2. Build untuk Produksi:</strong>
          </p>
          <pre className="p-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 font-mono text-[11px] text-slate-800 dark:text-slate-200 overflow-x-auto">
            npm run build
          </pre>
          <p>
            Folder hasil build <code className="bg-slate-200 dark:bg-slate-700 px-1 py-0.5 rounded">dist/</code> siap diunggah ke <strong>GitHub Pages</strong>, <strong>Netlify</strong>, <strong>Vercel</strong>, atau web server statis manapun tanpa memerlukan backend database!
          </p>
        </div>
      </div>

      {/* Modals */}
      <ConfirmModal
        isOpen={isResetConfirmOpen}
        onClose={() => setIsResetConfirmOpen(false)}
        onConfirm={resetToDefaultData}
        title="Reset ke Data Bawaan?"
        message="Tindakan ini akan mengembalikan seluruh kategori, subkategori, transaksi contoh, dan budget ke setelan awal. Buat cadangan JSON terlebih dahulu jika ingin menyimpan data Anda saat ini."
        confirmLabel="Reset Data Sekarang"
        isDanger={true}
      />

      <ConfirmModal
        isOpen={isClearConfirmOpen}
        onClose={() => setIsClearConfirmOpen(false)}
        onConfirm={clearAllData}
        title="Hapus Semua Transaksi & Budget?"
        message="Seluruh catatan transaksi dan budget bulanan akan dikosongkan. Kategori dan subkategori tetap dipertahankan. Apakah Anda yakin?"
        confirmLabel="Kosongkan Transaksi"
        isDanger={true}
      />
    </div>
  );
};
