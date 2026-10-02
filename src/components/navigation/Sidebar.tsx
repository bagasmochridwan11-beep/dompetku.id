import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  PieChart,
  FolderTree,
  FileSpreadsheet,
  Settings,
  Plus,
  Bot,
  Camera,
  LogOut,
  Sparkles,
  Wallet,
  Target,
  Calculator,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';

export type NavTab =
  | 'dashboard'
  | 'transactions'
  | 'wallets'
  | 'budget'
  | 'savings'
  | 'categories'
  | 'reports'
  | 'tools'
  | 'settings';

interface SidebarProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
  onOpenAddModal: () => void;
  onOpenChatModal?: () => void;
  onOpenReceiptModal?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  activeTab,
  onSelectTab,
  onOpenAddModal,
  onOpenChatModal,
  onOpenReceiptModal,
}) => {
  const { user, isCloudSyncing, signInGoogle, signOutUser } = useFinance();

  const navItems = [
    { id: 'dashboard' as NavTab, label: 'Dashboard', icon: LayoutDashboard },
    { id: 'transactions' as NavTab, label: 'Transaksi', icon: Receipt },
    { id: 'wallets' as NavTab, label: 'Dompet & Rekening', icon: Wallet },
    { id: 'budget' as NavTab, label: 'Budget', icon: PieChart },
    { id: 'savings' as NavTab, label: 'Pos Tabungan', icon: Target },
    { id: 'categories' as NavTab, label: 'Kategori', icon: FolderTree },
    { id: 'reports' as NavTab, label: 'Laporan', icon: FileSpreadsheet },
    { id: 'tools' as NavTab, label: 'Kalkulator', icon: Calculator },
    { id: 'settings' as NavTab, label: 'Pengaturan', icon: Settings },
  ];

  return (
    <aside className="hidden md:flex flex-col w-64 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200/80 dark:border-slate-800 p-5 shrink-0 min-h-screen">
      {/* Brand Zone */}
      <div className="flex items-center gap-3 px-2 py-3 mb-6">
        <div className="w-10 h-10 rounded-2xl bg-emerald-600 flex items-center justify-center text-white shadow-md shadow-emerald-500/20">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <path d="M16 12h.01" />
            <path d="M2 10h20" />
          </svg>
        </div>
        <div>
          <span className="text-lg font-bold tracking-tight text-slate-900 dark:text-white block">
            DompetKu
          </span>
          <span className="text-[11px] text-slate-400 font-medium block">
            Budget & Keuangan Pribadi
          </span>
        </div>
      </div>

      {/* Primary Action Button */}
      <div className="space-y-2 mb-6">
        <button
          type="button"
          onClick={onOpenAddModal}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-md shadow-emerald-600/20 active:scale-[0.98] transition min-h-[44px]"
        >
          <Plus className="w-4 h-4 stroke-[3]" />
          <span>Transaksi Manual</span>
        </button>

        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            onClick={onOpenChatModal}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-emerald-50 dark:hover:bg-emerald-950/30 transition min-h-[38px]"
            title="Catat transaksi berbicara dengan AI"
          >
            <Bot className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
            <span>Via Chat</span>
          </button>

          <button
            type="button"
            onClick={onOpenReceiptModal}
            className="flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border border-slate-200 dark:border-slate-700 hover:border-blue-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-semibold hover:bg-blue-50 dark:hover:bg-blue-950/30 transition min-h-[38px]"
            title="Scan & Analisa Nota / Struk"
          >
            <Camera className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400" />
            <span>Scan Nota</span>
          </button>
        </div>
      </div>

      {/* Nav List */}
      <nav className="flex-1 space-y-1.5">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onSelectTab(item.id)}
              className={`w-full flex items-center gap-3.5 px-3.5 py-3 rounded-2xl text-sm font-semibold transition min-h-[44px] ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-400 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800/60 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <Icon
                className={`w-5 h-5 shrink-0 ${
                  isActive ? 'text-emerald-600 dark:text-emerald-400' : 'text-slate-400'
                }`}
              />
              <span className="truncate">{item.label}</span>
            </button>
          );
        })}
      </nav>

      {/* Firebase Cloud & Auth Card */}
      <div className="pt-4 border-t border-slate-100 dark:border-slate-800 space-y-3">
        {user ? (
          <div className="p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/80 flex items-center justify-between gap-2.5">
            <div className="flex items-center gap-2.5 min-w-0">
              {user.photoURL ? (
                <img
                  src={user.photoURL}
                  alt={user.displayName || 'User'}
                  className="w-8 h-8 rounded-full border border-emerald-500 shrink-0"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-emerald-600 text-white font-bold text-xs flex items-center justify-center shrink-0">
                  {(user.displayName || user.email || 'U')[0].toUpperCase()}
                </div>
              )}
              <div className="min-w-0">
                <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block truncate">
                  {user.displayName || user.email?.split('@')[0] || 'Pengguna'}
                </span>
                <span className="text-[10px] text-emerald-600 dark:text-emerald-400 font-semibold flex items-center gap-1">
                  <span className={`w-1.5 h-1.5 rounded-full bg-emerald-500 ${isCloudSyncing ? 'animate-ping' : ''}`} />
                  <span>{isCloudSyncing ? 'Sinkron Cloud...' : 'Firebase Cloud Aktif'}</span>
                </span>
              </div>
            </div>
            <button
              type="button"
              onClick={signOutUser}
              className="p-1.5 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 transition"
              title="Keluar dari akun"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <button
            type="button"
            onClick={() => signInGoogle()}
            className="w-full flex items-center justify-center gap-2.5 py-2.5 px-3 rounded-2xl border border-slate-200 dark:border-slate-700 hover:border-emerald-500 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 text-xs font-bold shadow-xs hover:bg-emerald-50/50 dark:hover:bg-emerald-950/30 transition cursor-pointer min-h-[40px]"
          >
            <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
            </svg>
            <span>Masuk Akun Google</span>
          </button>
        )}

        <div className="text-[11px] text-slate-400 px-1 flex items-center justify-between">
          <span className="font-semibold text-slate-600 dark:text-slate-300">DompetKu v1.1</span>
          <span>{user ? 'Firestore Online' : 'Penyimpanan Lokal'}</span>
        </div>
      </div>
    </aside>
  );
};
