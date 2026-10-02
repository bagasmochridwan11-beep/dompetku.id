import React from 'react';
import { NavTab } from './Sidebar';
import {
  LayoutDashboard,
  Receipt,
  Wallet,
  Target,
  PieChart,
  Settings,
} from 'lucide-react';

interface BottomNavProps {
  activeTab: NavTab;
  onSelectTab: (tab: NavTab) => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({ activeTab, onSelectTab }) => {
  const tabs = [
    { id: 'dashboard' as NavTab, label: 'Beranda', icon: LayoutDashboard },
    { id: 'transactions' as NavTab, label: 'Transaksi', icon: Receipt },
    { id: 'wallets' as NavTab, label: 'Dompet', icon: Wallet },
    { id: 'savings' as NavTab, label: 'Tabungan', icon: Target },
    { id: 'budget' as NavTab, label: 'Budget', icon: PieChart },
    { id: 'settings' as NavTab, label: 'Setelan', icon: Settings },
  ];

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200/80 dark:border-slate-800 pb-[env(safe-area-inset-bottom,0px)] shadow-lg">
      <div className="grid grid-cols-6 items-center h-16 px-1">
        {tabs.map((tab) => {
          const Icon = tab.icon;
          const isActive = activeTab === tab.id;

          return (
            <button
              key={tab.id}
              type="button"
              onClick={() => onSelectTab(tab.id)}
              className={`flex flex-col items-center justify-center h-full min-h-[44px] transition-colors relative cursor-pointer ${
                isActive
                  ? 'text-emerald-600 dark:text-emerald-400 font-semibold'
                  : 'text-slate-500 dark:text-slate-400 hover:text-slate-900'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-transform ${isActive ? 'scale-110' : ''}`} />
                {isActive && (
                  <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-emerald-500" />
                )}
              </div>
              <span className="text-[10px] tracking-tight mt-1 truncate max-w-[52px]">
                {tab.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
};
