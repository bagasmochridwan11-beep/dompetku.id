/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { Sidebar, NavTab } from './components/navigation/Sidebar';
import { BottomNav } from './components/navigation/BottomNav';
import { Header } from './components/navigation/Header';
import { FloatingActionButton } from './components/navigation/FloatingActionButton';
import { OfflineBanner } from './components/common/OfflineBanner';
import { DashboardView } from './components/dashboard/DashboardView';
import { TransactionListView } from './components/transactions/TransactionListView';
import { WalletsView } from './components/wallets/WalletsView';
import { SavingsGoalsView } from './components/savings/SavingsGoalsView';
import { BudgetManagementView } from './components/budget/BudgetManagementView';
import { CategoryManagementView } from './components/categories/CategoryManagementView';
import { ReportsView } from './components/reports/ReportsView';
import { FinancialCalculatorsView } from './components/tools/FinancialCalculatorsView';
import { SettingsView } from './components/settings/SettingsView';
import { TransactionFormModal } from './components/transactions/TransactionFormModal';
import { ChatTransactionModal } from './components/transactions/ChatTransactionModal';
import { ReceiptAnalysisModal } from './components/transactions/ReceiptAnalysisModal';
import { Transaction } from './types/finance';

const MainLayout: React.FC = () => {
  const { isLoaded } = useFinance();
  const [activeTab, setActiveTab] = useState<NavTab>('dashboard');

  // Modals state
  const [isTxModalOpen, setIsTxModalOpen] = useState(false);
  const [editingTx, setEditingTx] = useState<Transaction | null>(null);

  const [isChatModalOpen, setIsChatModalOpen] = useState(false);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  const handleOpenAddTx = () => {
    setEditingTx(null);
    setIsTxModalOpen(true);
  };

  const handleEditTx = (tx: Transaction) => {
    setEditingTx(tx);
    setIsTxModalOpen(true);
  };

  const handleOpenChat = () => {
    setIsChatModalOpen(true);
  };

  const handleOpenReceipt = () => {
    setIsReceiptModalOpen(true);
  };

  if (!isLoaded) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-50 dark:bg-slate-950">
        <div className="w-12 h-12 rounded-2xl bg-emerald-600 animate-pulse flex items-center justify-center text-white mb-3 shadow-lg shadow-emerald-500/20">
          <svg className="w-6 h-6" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2">
            <rect x="2" y="5" width="20" height="14" rx="3" />
            <path d="M16 12h.01" />
            <path d="M2 10h20" />
          </svg>
        </div>
        <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
          Memuat DompetKu...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-slate-50/70 dark:bg-slate-950 text-slate-800 dark:text-slate-100 font-sans selection:bg-emerald-500/20">
      <OfflineBanner />

      {/* Desktop & Tablet Sidebar */}
      <Sidebar
        activeTab={activeTab}
        onSelectTab={setActiveTab}
        onOpenAddModal={handleOpenAddTx}
        onOpenChatModal={handleOpenChat}
        onOpenReceiptModal={handleOpenReceipt}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 min-h-screen">
        <Header activeTab={activeTab} onOpenAddModal={handleOpenAddTx} />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              onOpenAddTransaction={handleOpenAddTx}
              onNavigateToTransactions={() => setActiveTab('transactions')}
              onNavigateToBudget={() => setActiveTab('budget')}
              onNavigateToWallets={() => setActiveTab('wallets')}
              onNavigateToSavings={() => setActiveTab('savings')}
              onNavigateToTools={() => setActiveTab('tools')}
              onOpenChatModal={handleOpenChat}
              onOpenReceiptModal={handleOpenReceipt}
            />
          )}

          {activeTab === 'transactions' && (
            <TransactionListView
              onOpenAddModal={handleOpenAddTx}
              onEditTransaction={handleEditTx}
              onOpenChatModal={handleOpenChat}
              onOpenReceiptModal={handleOpenReceipt}
            />
          )}

          {activeTab === 'wallets' && <WalletsView />}

          {activeTab === 'savings' && <SavingsGoalsView />}

          {activeTab === 'budget' && <BudgetManagementView />}

          {activeTab === 'categories' && <CategoryManagementView />}

          {activeTab === 'reports' && <ReportsView />}

          {activeTab === 'tools' && <FinancialCalculatorsView />}

          {activeTab === 'settings' && <SettingsView />}
        </main>
      </div>

      {/* Mobile Floating Action Button (FAB) with Speed Dial */}
      <FloatingActionButton
        onManualAdd={handleOpenAddTx}
        onChatAdd={handleOpenChat}
        onReceiptAdd={handleOpenReceipt}
      />

      {/* Mobile Bottom Navigation */}
      <BottomNav activeTab={activeTab} onSelectTab={setActiveTab} />

      {/* Manual Transaction Modal */}
      <TransactionFormModal
        isOpen={isTxModalOpen}
        onClose={() => {
          setIsTxModalOpen(false);
          setEditingTx(null);
        }}
        initialData={editingTx}
      />

      {/* Catat via Chat AI Modal */}
      <ChatTransactionModal
        isOpen={isChatModalOpen}
        onClose={() => setIsChatModalOpen(false)}
      />

      {/* Scan Receipt Modal */}
      <ReceiptAnalysisModal
        isOpen={isReceiptModalOpen}
        onClose={() => setIsReceiptModalOpen(false)}
      />
    </div>
  );
};

export default function App() {
  return (
    <FinanceProvider>
      <MainLayout />
    </FinanceProvider>
  );
}
