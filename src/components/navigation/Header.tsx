import React from 'react';
import { NavTab } from './Sidebar';
import { PWAInstallButton } from '../common/PWAInstallButton';
import { Plus, Cloud, Check } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

interface HeaderProps {
  activeTab: NavTab;
  onOpenAddModal: () => void;
}

export const Header: React.FC<HeaderProps> = ({ activeTab, onOpenAddModal }) => {
  const { user, isCloudSyncing, signInGoogle } = useFinance();

  const getTabTitle = (tab: NavTab) => {
    switch (tab) {
      case 'dashboard':
        return 'DompetKu';
      case 'transactions':
        return 'Daftar Transaksi';
      case 'wallets':
        return 'Dompet & Rekening';
      case 'budget':
        return 'Budget Bulanan';
      case 'savings':
        return 'Pos Tabungan & Impian';
      case 'categories':
        return 'Kelola Kategori';
      case 'reports':
        return 'Laporan Keuangan';
      case 'tools':
        return 'Kalkulator Finansial';
      case 'settings':
        return 'Pengaturan';
      default:
        return 'DompetKu';
    }
  };

  return (
    <header className="sticky top-0 z-30 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md border-b border-slate-200/80 dark:border-slate-800 px-4 sm:px-8 py-3.5 flex items-center justify-between">
      {/* Zone 1: Brand / Active Section Wordmark */}
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-xl bg-emerald-600 flex items-center justify-center text-white md:hidden shadow-xs">
          <svg className="w-5 h-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <path d="M16 12h.01" />
            <path d="M2 10h20" />
          </svg>
        </div>
        <div>
          <span className="text-base sm:text-lg font-bold tracking-tight text-slate-900 dark:text-white truncate block">
            {getTabTitle(activeTab)}
          </span>
        </div>
      </div>

      {/* Zone 3: Actions & Install Button */}
      <div className="flex items-center gap-2 sm:gap-3">
        {/* User / Cloud indicator */}
        {user ? (
          <div className="hidden sm:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-500/20 text-emerald-700 dark:text-emerald-300 text-xs font-medium">
            <Cloud className={`w-3.5 h-3.5 ${isCloudSyncing ? 'animate-pulse text-amber-500' : 'text-emerald-500'}`} />
            <span className="text-[11px] truncate max-w-[120px]">
              {isCloudSyncing ? 'Menyinkronkan...' : user.displayName || user.email?.split('@')[0]}
            </span>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => signInGoogle()}
            className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition shadow-xs"
          >
            <span>Masuk Google</span>
          </button>
        )}

        <PWAInstallButton compact={true} />

        {/* Desktop Quick Add Button in header if needed */}
        <button
          type="button"
          onClick={onOpenAddModal}
          className="hidden sm:flex md:hidden items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-xs transition active:scale-95 min-h-[36px]"
        >
          <Plus className="w-3.5 h-3.5 stroke-[3]" />
          <span>Tambah</span>
        </button>
      </div>
    </header>
  );
};
