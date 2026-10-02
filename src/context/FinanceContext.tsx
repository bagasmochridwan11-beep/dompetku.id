import React, { createContext, useContext, useState, useEffect, useRef, useMemo } from 'react';
import {
  Category,
  Subcategory,
  Transaction,
  Budget,
  Wallet,
  SavingsGoal,
  QuickTemplate,
  AppSettings,
  DeleteCategoryOptions,
  TransactionType,
} from '../types/finance';
import {
  INITIAL_CATEGORIES,
  INITIAL_SUBCATEGORIES,
  INITIAL_WALLETS,
  INITIAL_SAVINGS_GOALS,
  INITIAL_QUICK_TEMPLATES,
  generateInitialTransactions,
  generateInitialBudgets,
} from '../data/defaultData';
import { getCurrentMonthString, getTodayDateString } from '../utils/formatters';
import {
  auth,
  signInWithGoogle,
  logOut,
  onAuthStateChanged,
  User,
  db,
} from '../lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export interface FinancialHealth {
  income: number;
  expense: number;
  netCashflow: number;
  savingsRate: number;
  needsAmount: number;
  needsRatio: number;
  wantsAmount: number;
  wantsRatio: number;
  savingsRatio: number;
  safeDailySpend: number;
  daysRemainingInMonth: number;
  dailyBurnRate: number;
  projectedEndBalance: number;
  status: 'Sangat Sehat' | 'Sehat' | 'Perlu Perhatian' | 'Waspada Defisit';
  advice: string;
}

interface FinanceContextType {
  categories: Category[];
  subcategories: Subcategory[];
  transactions: Transaction[];
  budgets: Budget[];
  wallets: Wallet[];
  savingsGoals: SavingsGoal[];
  quickTemplates: QuickTemplate[];
  activeMonth: string;
  setActiveMonth: (month: string) => void;
  settings: AppSettings;
  isLoaded: boolean;

  // Firebase Auth & Cloud Sync
  user: User | null;
  isAuthLoading: boolean;
  signInGoogle: () => Promise<{ success: boolean; error?: string }>;
  signOutUser: () => Promise<void>;
  isCloudSyncing: boolean;
  lastSyncedTime: Date | null;
  syncWithCloud: () => Promise<void>;

  // Wallets & Accounts
  totalNetWorth: number;
  addWallet: (wallet: Omit<Wallet, 'id'>) => { success: boolean; newId?: string; error?: string };
  updateWallet: (id: string, updates: Partial<Wallet>) => { success: boolean; error?: string };
  deleteWallet: (id: string) => { success: boolean; error?: string };
  transferFunds: (sourceWalletId: string, targetWalletId: string, amount: number, adminFee?: number, note?: string) => { success: boolean; error?: string };

  // Savings Goals
  addSavingsGoal: (goal: Omit<SavingsGoal, 'id' | 'terkumpul'>) => { success: boolean; newId?: string; error?: string };
  updateSavingsGoal: (id: string, updates: Partial<SavingsGoal>) => { success: boolean; error?: string };
  deleteSavingsGoal: (id: string) => { success: boolean; error?: string };
  depositToGoal: (goalId: string, amount: number, sourceWalletId?: string) => { success: boolean; error?: string };

  // Quick Templates
  addQuickTemplate: (tpl: Omit<QuickTemplate, 'id'>) => void;
  deleteQuickTemplate: (id: string) => void;

  // Financial Health Metrics
  financialHealth: FinancialHealth;

  // Categories
  addCategory: (cat: { nama: string; tipe: 'pemasukan' | 'pengeluaran'; ikon: string; warna: string; kebutuhanTipe?: 'kebutuhan' | 'keinginan' }) => { success: boolean; error?: string; newId?: string };
  updateCategory: (id: string, updates: Partial<Category>) => { success: boolean; error?: string };
  reorderCategory: (id: string, direction: 'up' | 'down') => void;
  deleteCategory: (options: DeleteCategoryOptions) => void;

  // Subcategories
  addSubcategory: (sub: { kategoriId: string; nama: string; ikon: string; warna?: string }) => { success: boolean; error?: string; newId?: string };
  updateSubcategory: (id: string, updates: Partial<Subcategory>) => { success: boolean; error?: string };
  reorderSubcategory: (id: string, direction: 'up' | 'down') => void;
  deleteSubcategory: (options: { subcategoryId: string; action: 'archive' | 'delete_and_reassign'; targetSubcategoryId?: string | null }) => void;

  // Transactions
  addTransaction: (tx: Omit<Transaction, 'id' | 'createdAt'>) => string;
  updateTransaction: (id: string, updates: Partial<Transaction>) => void;
  deleteTransaction: (id: string) => void;

  // Budgets
  setBudget: (bulan: string, kategoriId: string, subkategoriId: string | null, nominal: number, persentase?: number | null) => void;
  removeBudget: (id: string) => void;
  deleteBudgetByTarget: (bulan: string, kategoriId: string, subkategoriId: string | null) => void;
  copyBudgetsFromMonth: (sourceMonth: string, targetMonth: string) => { count: number };

  // Lookups & Counts
  getCategoryById: (id: string) => Category | undefined;
  getSubcategoryById: (id: string) => Subcategory | undefined;
  getWalletById: (id: string) => Wallet | undefined;
  getSubcategoriesForCategory: (catId: string, includeArchived?: boolean) => Subcategory[];
  getTransactionsCountForCategory: (catId: string) => number;
  getTransactionsCountForSubcategory: (subId: string) => number;

  // Settings & Storage
  toggleDarkMode: () => void;
  resetToDefaultData: () => void;
  clearAllData: () => void;
  exportDataJSON: () => string;
  importDataJSON: (jsonStr: string) => { success: boolean; error?: string };
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

const STORAGE_KEYS = {
  CATEGORIES: 'dompetku_categories',
  SUBCATEGORIES: 'dompetku_subcategories',
  TRANSACTIONS: 'dompetku_transactions',
  BUDGETS: 'dompetku_budgets',
  WALLETS: 'dompetku_wallets',
  SAVINGS_GOALS: 'dompetku_savings_goals',
  QUICK_TEMPLATES: 'dompetku_quick_templates',
  SETTINGS: 'dompetku_settings',
};

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [subcategories, setSubcategories] = useState<Subcategory[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [budgets, setBudgets] = useState<Budget[]>([]);
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [savingsGoals, setSavingsGoals] = useState<SavingsGoal[]>([]);
  const [quickTemplates, setQuickTemplates] = useState<QuickTemplate[]>([]);
  const [activeMonth, setActiveMonth] = useState<string>(getCurrentMonthString());
  const [settings, setSettings] = useState<AppSettings>({
    darkMode: false,
    currency: 'IDR',
    hasInitializedData: false,
  });
  const [isLoaded, setIsLoaded] = useState(false);

  // Firebase Auth state
  const [user, setUser] = useState<User | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(true);
  const [isCloudSyncing, setIsCloudSyncing] = useState(false);
  const [lastSyncedTime, setLastSyncedTime] = useState<Date | null>(null);
  const isSyncingFromCloudRef = useRef(false);
  const saveTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // Monitor Firebase Auth State
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      setIsAuthLoading(false);

      if (currentUser) {
        setIsCloudSyncing(true);
        try {
          const userDocRef = doc(db, 'users', currentUser.uid);
          const snap = await getDoc(userDocRef);

          if (snap.exists()) {
            const cloudData = snap.data();
            isSyncingFromCloudRef.current = true;

            if (cloudData.categories && Array.isArray(cloudData.categories)) {
              setCategories(cloudData.categories);
              localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(cloudData.categories));
            }
            if (cloudData.subcategories && Array.isArray(cloudData.subcategories)) {
              setSubcategories(cloudData.subcategories);
              localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(cloudData.subcategories));
            }
            if (cloudData.transactions && Array.isArray(cloudData.transactions)) {
              setTransactions(cloudData.transactions);
              localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(cloudData.transactions));
            }
            if (cloudData.budgets && Array.isArray(cloudData.budgets)) {
              setBudgets(cloudData.budgets);
              localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(cloudData.budgets));
            }
            if (cloudData.wallets && Array.isArray(cloudData.wallets)) {
              setWallets(cloudData.wallets);
              localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(cloudData.wallets));
            }
            if (cloudData.savingsGoals && Array.isArray(cloudData.savingsGoals)) {
              setSavingsGoals(cloudData.savingsGoals);
              localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(cloudData.savingsGoals));
            }
            if (cloudData.quickTemplates && Array.isArray(cloudData.quickTemplates)) {
              setQuickTemplates(cloudData.quickTemplates);
              localStorage.setItem(STORAGE_KEYS.QUICK_TEMPLATES, JSON.stringify(cloudData.quickTemplates));
            }
            if (cloudData.settings) {
              setSettings((prev) => ({ ...prev, ...cloudData.settings }));
              localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(cloudData.settings));
            }

            setLastSyncedTime(new Date());
            setTimeout(() => {
              isSyncingFromCloudRef.current = false;
            }, 500);
          } else {
            // First time login: seed current state to Firestore
            await setDoc(userDocRef, {
              uid: currentUser.uid,
              displayName: currentUser.displayName || '',
              email: currentUser.email || '',
              photoURL: currentUser.photoURL || '',
              categories,
              subcategories,
              transactions,
              budgets,
              wallets,
              savingsGoals,
              quickTemplates,
              settings,
              createdAt: new Date().toISOString(),
              lastSyncedAt: Date.now(),
            }, { merge: true });
            setLastSyncedTime(new Date());
          }
        } catch (err) {
          console.error('Failed to load user data from Firestore:', err);
        } finally {
          setIsCloudSyncing(false);
        }
      }
    });

    return () => unsubscribe();
  }, []);

  // Sync to Firestore whenever state changes and user is signed in
  useEffect(() => {
    if (!user || !isLoaded || isSyncingFromCloudRef.current) return;

    if (saveTimeoutRef.current) {
      clearTimeout(saveTimeoutRef.current);
    }

    saveTimeoutRef.current = setTimeout(async () => {
      setIsCloudSyncing(true);
      try {
        const userDocRef = doc(db, 'users', user.uid);
        await setDoc(
          userDocRef,
          {
            uid: user.uid,
            displayName: user.displayName || '',
            email: user.email || '',
            photoURL: user.photoURL || '',
            categories,
            subcategories,
            transactions,
            budgets,
            wallets,
            savingsGoals,
            quickTemplates,
            settings,
            lastSyncedAt: Date.now(),
          },
          { merge: true }
        );
        setLastSyncedTime(new Date());
      } catch (e) {
        console.error('Error auto-syncing to Firestore:', e);
      } finally {
        setIsCloudSyncing(false);
      }
    }, 1200);

    return () => {
      if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
    };
  }, [categories, subcategories, transactions, budgets, wallets, savingsGoals, quickTemplates, settings, user, isLoaded]);

  // Initialize from LocalStorage or seed defaults
  useEffect(() => {
    try {
      const storedSettings = localStorage.getItem(STORAGE_KEYS.SETTINGS);
      const parsedSettings: AppSettings = storedSettings
        ? JSON.parse(storedSettings)
        : { darkMode: false, currency: 'IDR', hasInitializedData: false };

      if (!parsedSettings.hasInitializedData) {
        // First run: Seed all starter entities
        const initCats = INITIAL_CATEGORIES;
        const initSubs = INITIAL_SUBCATEGORIES;
        const initTxs = generateInitialTransactions();
        const initBgs = generateInitialBudgets();
        const initWls = INITIAL_WALLETS;
        const initGls = INITIAL_SAVINGS_GOALS;
        const initQts = INITIAL_QUICK_TEMPLATES;

        setCategories(initCats);
        setSubcategories(initSubs);
        setTransactions(initTxs);
        setBudgets(initBgs);
        setWallets(initWls);
        setSavingsGoals(initGls);
        setQuickTemplates(initQts);

        const newSettings = { ...parsedSettings, hasInitializedData: true };
        setSettings(newSettings);

        localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initCats));
        localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(initSubs));
        localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initTxs));
        localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(initBgs));
        localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(initWls));
        localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(initGls));
        localStorage.setItem(STORAGE_KEYS.QUICK_TEMPLATES, JSON.stringify(initQts));
        localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(newSettings));
      } else {
        const storedCats = localStorage.getItem(STORAGE_KEYS.CATEGORIES);
        const storedSubs = localStorage.getItem(STORAGE_KEYS.SUBCATEGORIES);
        const storedTxs = localStorage.getItem(STORAGE_KEYS.TRANSACTIONS);
        const storedBgs = localStorage.getItem(STORAGE_KEYS.BUDGETS);
        const storedWls = localStorage.getItem(STORAGE_KEYS.WALLETS);
        const storedGls = localStorage.getItem(STORAGE_KEYS.SAVINGS_GOALS);
        const storedQts = localStorage.getItem(STORAGE_KEYS.QUICK_TEMPLATES);

        setCategories(storedCats ? JSON.parse(storedCats) : INITIAL_CATEGORIES);
        setSubcategories(storedSubs ? JSON.parse(storedSubs) : INITIAL_SUBCATEGORIES);
        setTransactions(storedTxs ? JSON.parse(storedTxs) : generateInitialTransactions());
        setBudgets(storedBgs ? JSON.parse(storedBgs) : generateInitialBudgets());
        setWallets(storedWls ? JSON.parse(storedWls) : INITIAL_WALLETS);
        setSavingsGoals(storedGls ? JSON.parse(storedGls) : INITIAL_SAVINGS_GOALS);
        setQuickTemplates(storedQts ? JSON.parse(storedQts) : INITIAL_QUICK_TEMPLATES);
        setSettings(parsedSettings);
      }
    } catch (e) {
      console.error('Failed to initialize local data, falling back to defaults', e);
      setCategories(INITIAL_CATEGORIES);
      setSubcategories(INITIAL_SUBCATEGORIES);
      setTransactions(generateInitialTransactions());
      setBudgets(generateInitialBudgets());
      setWallets(INITIAL_WALLETS);
      setSavingsGoals(INITIAL_SAVINGS_GOALS);
      setQuickTemplates(INITIAL_QUICK_TEMPLATES);
    } finally {
      setIsLoaded(true);
    }
  }, []);

  // Dark Mode Class Management
  useEffect(() => {
    if (settings.darkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [settings.darkMode]);

  // Persist state changes to LocalStorage
  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(categories));
    } catch (e) {
      console.error('Failed to persist categories', e);
    }
  }, [categories, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(subcategories));
    } catch (e) {
      console.error('Failed to persist subcategories', e);
    }
  }, [subcategories, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(transactions));
    } catch (e) {
      console.error('Failed to persist transactions', e);
    }
  }, [transactions, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(budgets));
    } catch (e) {
      console.error('Failed to persist budgets', e);
    }
  }, [budgets, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
    } catch (e) {
      console.error('Failed to persist wallets', e);
    }
  }, [wallets, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(savingsGoals));
    } catch (e) {
      console.error('Failed to persist savings goals', e);
    }
  }, [savingsGoals, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.QUICK_TEMPLATES, JSON.stringify(quickTemplates));
    } catch (e) {
      console.error('Failed to persist quick templates', e);
    }
  }, [quickTemplates, isLoaded]);

  useEffect(() => {
    if (!isLoaded) return;
    try {
      localStorage.setItem(STORAGE_KEYS.SETTINGS, JSON.stringify(settings));
    } catch (e) {
      console.error('Failed to persist settings', e);
    }
  }, [settings, isLoaded]);

  // Total Net Worth (Sum of active wallets)
  const totalNetWorth = useMemo(() => {
    return wallets.reduce((sum, w) => sum + (w.diarsipkan ? 0 : w.saldo), 0);
  }, [wallets]);

  // Financial Health & 50/30/20 Analytics
  const financialHealth: FinancialHealth = useMemo(() => {
    const currentMonthTxs = transactions.filter((t) => t.tanggal.startsWith(activeMonth));
    const income = currentMonthTxs
      .filter((t) => t.tipe === 'pemasukan')
      .reduce((sum, t) => sum + t.nominal, 0);
    const expense = currentMonthTxs
      .filter((t) => t.tipe === 'pengeluaran')
      .reduce((sum, t) => sum + t.nominal, 0);

    const netCashflow = income - expense;
    const savingsRate = income > 0 ? Math.max(0, Math.round((netCashflow / income) * 100)) : 0;

    // Categorize Needs (50%) vs Wants (30%)
    let needsAmount = 0;
    let wantsAmount = 0;

    currentMonthTxs
      .filter((t) => t.tipe === 'pengeluaran')
      .forEach((t) => {
        const cat = categories.find((c) => c.id === t.kategoriId);
        if (cat?.kebutuhanTipe === 'keinginan' || ['cat-exp-ent', 'cat-exp-shop'].includes(t.kategoriId)) {
          wantsAmount += t.nominal;
        } else {
          needsAmount += t.nominal;
        }
      });

    const needsRatio = income > 0 ? Math.round((needsAmount / income) * 100) : 0;
    const wantsRatio = income > 0 ? Math.round((wantsAmount / income) * 100) : 0;
    const savingsRatio = Math.max(0, 100 - needsRatio - wantsRatio);

    // Days remaining in activeMonth
    const [yearStr, monthStr] = activeMonth.split('-');
    const year = parseInt(yearStr, 10) || new Date().getFullYear();
    const month = parseInt(monthStr, 10) || new Date().getMonth() + 1;
    const daysInMonth = new Date(year, month, 0).getDate();
    const todayDate = new Date();
    const isCurrentActiveMonth =
      todayDate.getFullYear() === year && todayDate.getMonth() + 1 === month;
    const currentDay = isCurrentActiveMonth ? todayDate.getDate() : 1;
    const daysRemaining = Math.max(1, daysInMonth - currentDay + 1);

    // Safe Daily Spend: remaining budget or remaining positive cashflow
    const totalMonthBudget = budgets
      .filter((b) => b.bulan === activeMonth && !b.subkategoriId)
      .reduce((sum, b) => sum + b.nominal, 0);

    const budgetRemaining = Math.max(0, totalMonthBudget - expense);
    const safeDailySpend = Math.round(budgetRemaining > 0 ? budgetRemaining / daysRemaining : Math.max(0, (income - expense) / daysRemaining));
    const dailyBurnRate = currentDay > 0 ? Math.round(expense / currentDay) : 0;
    const projectedEndBalance = income - (expense + dailyBurnRate * (daysRemaining - 1));

    let status: FinancialHealth['status'] = 'Sehat';
    let advice = 'Pola keuangan Anda berada pada jalur yang baik.';

    if (netCashflow < 0) {
      status = 'Waspada Defisit';
      advice = 'Pengeluaran bulan ini melebihi pemasukan. Kurangi pos keinginan dan evaluasi belanja harian.';
    } else if (savingsRate >= 25 && needsRatio <= 50) {
      status = 'Sangat Sehat';
      advice = 'Luar biasa! Rasio tabungan Anda prima (>25%). Alokasikan kelebihan dana ke Dana Darurat atau Investasi.';
    } else if (savingsRate >= 15) {
      status = 'Sehat';
      advice = 'Arus kas stabil dan rasio 50/30/20 seimbang. Pertahankan ritme belanja harian Anda.';
    } else {
      status = 'Perlu Perhatian';
      advice = 'Tingkat tabungan Anda masih di bawah 15%. Coba batasi pos belanja & gaya hidup beberapa hari ke depan.';
    }

    return {
      income,
      expense,
      netCashflow,
      savingsRate,
      needsAmount,
      needsRatio,
      wantsAmount,
      wantsRatio,
      savingsRatio,
      safeDailySpend,
      daysRemainingInMonth: daysRemaining,
      dailyBurnRate,
      projectedEndBalance,
      status,
      advice,
    };
  }, [transactions, activeMonth, categories, budgets]);

  // Helper Lookups
  const getCategoryById = (id: string) => categories.find((c) => c.id === id);
  const getSubcategoryById = (id: string) => subcategories.find((s) => s.id === id);
  const getWalletById = (id: string) => wallets.find((w) => w.id === id);

  const getSubcategoriesForCategory = (catId: string, includeArchived = false) => {
    return subcategories
      .filter((s) => s.kategoriId === catId && (includeArchived || !s.diarsipkan))
      .sort((a, b) => a.urutan - b.urutan);
  };

  const getTransactionsCountForCategory = (catId: string) => {
    return transactions.filter((t) => t.kategoriId === catId).length;
  };

  const getTransactionsCountForSubcategory = (subId: string) => {
    return transactions.filter((t) => t.subkategoriId === subId).length;
  };

  // Wallets Management
  const addWallet = (walletData: Omit<Wallet, 'id'>) => {
    const newId = `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newWallet: Wallet = {
      ...walletData,
      id: newId,
      diarsipkan: false,
    };
    setWallets((prev) => [...prev, newWallet]);
    return { success: true, newId };
  };

  const updateWallet = (id: string, updates: Partial<Wallet>) => {
    setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, ...updates } : w)));
    return { success: true };
  };

  const deleteWallet = (id: string) => {
    const hasTransactions = transactions.some((t) => t.dompetId === id || t.tujuanDompetId === id);
    if (hasTransactions) {
      // Archive instead of hard delete to keep audit history
      setWallets((prev) => prev.map((w) => (w.id === id ? { ...w, diarsipkan: true } : w)));
      return { success: true, error: 'Dompet memiliki riwayat transaksi, sehingga diarsipkan.' };
    }
    setWallets((prev) => prev.filter((w) => w.id !== id));
    return { success: true };
  };

  const transferFunds = (
    sourceWalletId: string,
    targetWalletId: string,
    amount: number,
    adminFee = 0,
    note = 'Transfer Antar Dompet'
  ) => {
    if (sourceWalletId === targetWalletId) {
      return { success: false, error: 'Dompet sumber dan dompet tujuan tidak boleh sama.' };
    }
    const source = wallets.find((w) => w.id === sourceWalletId);
    const target = wallets.find((w) => w.id === targetWalletId);
    if (!source || !target) {
      return { success: false, error: 'Dompet tidak ditemukan.' };
    }
    if (amount <= 0) {
      return { success: false, error: 'Nominal transfer harus lebih besar dari 0.' };
    }
    if (source.saldo < amount + adminFee) {
      return {
        success: false,
        error: `Saldo ${source.nama} tidak mencukupi (Rp ${source.saldo.toLocaleString('id-ID')}).`,
      };
    }

    addTransaction({
      tanggal: getTodayDateString(),
      nominal: amount,
      tipe: 'transfer',
      kategoriId: 'cat-exp-other',
      subkategoriId: null,
      dompetId: sourceWalletId,
      tujuanDompetId: targetWalletId,
      biayaAdmin: adminFee,
      catatan: note || `Transfer dari ${source.nama} ke ${target.nama}`,
    });

    return { success: true };
  };

  // Savings Goals Management
  const addSavingsGoal = (goalData: Omit<SavingsGoal, 'id' | 'terkumpul'>) => {
    const newId = `goal-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newGoal: SavingsGoal = {
      ...goalData,
      id: newId,
      terkumpul: 0,
    };
    setSavingsGoals((prev) => [...prev, newGoal]);
    return { success: true, newId };
  };

  const updateSavingsGoal = (id: string, updates: Partial<SavingsGoal>) => {
    setSavingsGoals((prev) => prev.map((g) => (g.id === id ? { ...g, ...updates } : g)));
    return { success: true };
  };

  const deleteSavingsGoal = (id: string) => {
    setSavingsGoals((prev) => prev.filter((g) => g.id !== id));
    return { success: true };
  };

  const depositToGoal = (goalId: string, amount: number, sourceWalletId?: string) => {
    const goal = savingsGoals.find((g) => g.id === goalId);
    if (!goal) return { success: false, error: 'Target impian tidak ditemukan.' };
    if (amount <= 0) return { success: false, error: 'Nominal tabungan harus lebih dari 0.' };

    if (sourceWalletId) {
      const source = wallets.find((w) => w.id === sourceWalletId);
      if (!source) return { success: false, error: 'Dompet sumber tidak ditemukan.' };
      if (source.saldo < amount) {
        return { success: false, error: `Saldo ${source.nama} tidak cukup.` };
      }

      addTransaction({
        tanggal: getTodayDateString(),
        nominal: amount,
        tipe: 'pengeluaran',
        kategoriId: 'cat-exp-other',
        subkategoriId: null,
        dompetId: sourceWalletId,
        catatan: `Nabung: ${goal.nama}`,
      });
    }

    setSavingsGoals((prev) =>
      prev.map((g) => (g.id === goalId ? { ...g, terkumpul: g.terkumpul + amount } : g))
    );
    return { success: true };
  };

  // Quick Templates Management
  const addQuickTemplate = (tplData: Omit<QuickTemplate, 'id'>) => {
    const newId = `qt-${Date.now()}`;
    setQuickTemplates((prev) => [...prev, { ...tplData, id: newId }]);
  };

  const deleteQuickTemplate = (id: string) => {
    setQuickTemplates((prev) => prev.filter((t) => t.id !== id));
  };

  // Categories & Subcategories
  const addCategory = ({
    nama,
    tipe,
    ikon,
    warna,
    kebutuhanTipe = 'kebutuhan',
  }: {
    nama: string;
    tipe: 'pemasukan' | 'pengeluaran';
    ikon: string;
    warna: string;
    kebutuhanTipe?: 'kebutuhan' | 'keinginan';
  }) => {
    const trimmed = nama.trim();
    if (!trimmed) return { success: false, error: 'Nama kategori tidak boleh kosong.' };

    const exists = categories.some(
      (c) => c.tipe === tipe && !c.diarsipkan && c.nama.toLowerCase() === trimmed.toLowerCase()
    );
    if (exists) {
      return { success: false, error: `Kategori "${trimmed}" sudah ada.` };
    }

    const newId = `cat-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const maxOrder = categories
      .filter((c) => c.tipe === tipe)
      .reduce((max, c) => Math.max(max, c.urutan), 0);

    const newCategory: Category = {
      id: newId,
      nama: trimmed,
      tipe,
      ikon: ikon || '📁',
      warna: warna || '#10b981',
      urutan: maxOrder + 1,
      diarsipkan: false,
      kebutuhanTipe,
    };

    setCategories((prev) => [...prev, newCategory]);
    return { success: true, newId };
  };

  const updateCategory = (id: string, updates: Partial<Category>) => {
    const existing = categories.find((c) => c.id === id);
    if (!existing) return { success: false, error: 'Kategori tidak ditemukan.' };

    if (updates.nama !== undefined) {
      const trimmed = updates.nama.trim();
      if (!trimmed) return { success: false, error: 'Nama kategori tidak boleh kosong.' };
      updates.nama = trimmed;
    }

    setCategories((prev) => prev.map((c) => (c.id === id ? { ...c, ...updates } : c)));
    return { success: true };
  };

  const reorderCategory = (id: string, direction: 'up' | 'down') => {
    const current = categories.find((c) => c.id === id);
    if (!current) return;

    const sameType = categories
      .filter((c) => c.tipe === current.tipe && !c.diarsipkan)
      .sort((a, b) => a.urutan - b.urutan);

    const currentIndex = sameType.findIndex((c) => c.id === id);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= sameType.length) return;

    const swapWith = sameType[targetIndex];

    setCategories((prev) =>
      prev.map((c) => {
        if (c.id === current.id) return { ...c, urutan: swapWith.urutan };
        if (c.id === swapWith.id) return { ...c, urutan: current.urutan };
        return c;
      })
    );
  };

  const deleteCategory = (options: DeleteCategoryOptions) => {
    const {
      categoryId,
      action,
      targetCategoryId,
      subcategoriesAction = 'archive',
      targetCategoryForSubcategoriesId,
    } = options;

    if (action === 'archive') {
      setCategories((prev) =>
        prev.map((c) => (c.id === categoryId ? { ...c, diarsipkan: true } : c))
      );
      setSubcategories((prev) =>
        prev.map((s) => (s.kategoriId === categoryId ? { ...s, diarsipkan: true } : s))
      );
    } else {
      if (targetCategoryId) {
        setTransactions((prev) =>
          prev.map((t) =>
            t.kategoriId === categoryId
              ? { ...t, kategoriId: targetCategoryId, subkategoriId: null }
              : t
          )
        );
      } else {
        setTransactions((prev) => prev.filter((t) => t.kategoriId !== categoryId));
      }

      setBudgets((prev) => prev.filter((b) => b.kategoriId !== categoryId));

      if (subcategoriesAction === 'move_to_category' && targetCategoryForSubcategoriesId) {
        setSubcategories((prev) =>
          prev.map((s) =>
            s.kategoriId === categoryId
              ? { ...s, kategoriId: targetCategoryForSubcategoriesId }
              : s
          )
        );
      } else {
        setSubcategories((prev) => prev.filter((s) => s.kategoriId !== categoryId));
      }

      setCategories((prev) => prev.filter((c) => c.id !== categoryId));
    }
  };

  const addSubcategory = ({
    kategoriId,
    nama,
    ikon,
    warna,
  }: {
    kategoriId: string;
    nama: string;
    ikon: string;
    warna?: string;
  }) => {
    const trimmed = nama.trim();
    if (!trimmed) return { success: false, error: 'Nama subkategori tidak boleh kosong.' };

    const parent = categories.find((c) => c.id === kategoriId);
    if (!parent) return { success: false, error: 'Kategori induk tidak ditemukan.' };

    const newId = `sub-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const maxOrder = subcategories
      .filter((s) => s.kategoriId === kategoriId)
      .reduce((max, s) => Math.max(max, s.urutan), 0);

    const newSub: Subcategory = {
      id: newId,
      kategoriId,
      nama: trimmed,
      ikon: ikon || parent.ikon || '🏷️',
      warna: warna || parent.warna,
      urutan: maxOrder + 1,
      diarsipkan: false,
    };

    setSubcategories((prev) => [...prev, newSub]);
    return { success: true, newId };
  };

  const updateSubcategory = (id: string, updates: Partial<Subcategory>) => {
    setSubcategories((prev) => prev.map((s) => (s.id === id ? { ...s, ...updates } : s)));
    return { success: true };
  };

  const reorderSubcategory = (id: string, direction: 'up' | 'down') => {
    const current = subcategories.find((s) => s.id === id);
    if (!current) return;

    const siblings = subcategories
      .filter((s) => s.kategoriId === current.kategoriId && !s.diarsipkan)
      .sort((a, b) => a.urutan - b.urutan);

    const currentIndex = siblings.findIndex((s) => s.id === id);
    if (currentIndex < 0) return;

    const targetIndex = direction === 'up' ? currentIndex - 1 : currentIndex + 1;
    if (targetIndex < 0 || targetIndex >= siblings.length) return;

    const swapWith = siblings[targetIndex];

    setSubcategories((prev) =>
      prev.map((s) => {
        if (s.id === current.id) return { ...s, urutan: swapWith.urutan };
        if (s.id === swapWith.id) return { ...s, urutan: current.urutan };
        return s;
      })
    );
  };

  const deleteSubcategory = (options: {
    subcategoryId: string;
    action: 'archive' | 'delete_and_reassign';
    targetSubcategoryId?: string | null;
  }) => {
    const { subcategoryId, action, targetSubcategoryId } = options;
    if (action === 'archive') {
      setSubcategories((prev) =>
        prev.map((s) => (s.id === subcategoryId ? { ...s, diarsipkan: true } : s))
      );
    } else {
      setTransactions((prev) =>
        prev.map((t) =>
          t.subkategoriId === subcategoryId
            ? { ...t, subkategoriId: targetSubcategoryId || null }
            : t
        )
      );
      setBudgets((prev) => prev.filter((b) => b.subkategoriId !== subcategoryId));
      setSubcategories((prev) => prev.filter((s) => s.id !== subcategoryId));
    }
  };

  // Transaction Operations with automatic Wallet Balance adjustment
  const addTransaction = (tx: Omit<Transaction, 'id' | 'createdAt'>) => {
    const newId = `tx-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const newTx: Transaction = {
      ...tx,
      id: newId,
      createdAt: Date.now(),
    };

    // Update wallet balances automatically
    if (tx.dompetId) {
      setWallets((prev) =>
        prev.map((w) => {
          if (w.id === tx.dompetId) {
            if (tx.tipe === 'pengeluaran') return { ...w, saldo: w.saldo - tx.nominal };
            if (tx.tipe === 'pemasukan') return { ...w, saldo: w.saldo + tx.nominal };
            if (tx.tipe === 'transfer') {
              return { ...w, saldo: w.saldo - (tx.nominal + (tx.biayaAdmin || 0)) };
            }
          }
          if (tx.tipe === 'transfer' && w.id === tx.tujuanDompetId) {
            return { ...w, saldo: w.saldo + tx.nominal };
          }
          return w;
        })
      );
    }

    setTransactions((prev) => [newTx, ...prev]);
    return newId;
  };

  const updateTransaction = (id: string, updates: Partial<Transaction>) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (!oldTx) return;

    const mergedTx: Transaction = { ...oldTx, ...updates };

    // Reverse old wallet adjustment and apply new wallet adjustment
    setWallets((prev) => {
      let updated = [...prev];

      // Reverse oldTx
      if (oldTx.dompetId) {
        updated = updated.map((w) => {
          if (w.id === oldTx.dompetId) {
            if (oldTx.tipe === 'pengeluaran') return { ...w, saldo: w.saldo + oldTx.nominal };
            if (oldTx.tipe === 'pemasukan') return { ...w, saldo: w.saldo - oldTx.nominal };
            if (oldTx.tipe === 'transfer') return { ...w, saldo: w.saldo + (oldTx.nominal + (oldTx.biayaAdmin || 0)) };
          }
          if (oldTx.tipe === 'transfer' && w.id === oldTx.tujuanDompetId) {
            return { ...w, saldo: w.saldo - oldTx.nominal };
          }
          return w;
        });
      }

      // Apply mergedTx
      if (mergedTx.dompetId) {
        updated = updated.map((w) => {
          if (w.id === mergedTx.dompetId) {
            if (mergedTx.tipe === 'pengeluaran') return { ...w, saldo: w.saldo - mergedTx.nominal };
            if (mergedTx.tipe === 'pemasukan') return { ...w, saldo: w.saldo + mergedTx.nominal };
            if (mergedTx.tipe === 'transfer') {
              return { ...w, saldo: w.saldo - (mergedTx.nominal + (mergedTx.biayaAdmin || 0)) };
            }
          }
          if (mergedTx.tipe === 'transfer' && w.id === mergedTx.tujuanDompetId) {
            return { ...w, saldo: w.saldo + mergedTx.nominal };
          }
          return w;
        });
      }

      return updated;
    });

    setTransactions((prev) => prev.map((t) => (t.id === id ? mergedTx : t)));
  };

  const deleteTransaction = (id: string) => {
    const oldTx = transactions.find((t) => t.id === id);
    if (oldTx && oldTx.dompetId) {
      // Reverse wallet effect
      setWallets((prev) =>
        prev.map((w) => {
          if (w.id === oldTx.dompetId) {
            if (oldTx.tipe === 'pengeluaran') return { ...w, saldo: w.saldo + oldTx.nominal };
            if (oldTx.tipe === 'pemasukan') return { ...w, saldo: w.saldo - oldTx.nominal };
            if (oldTx.tipe === 'transfer') return { ...w, saldo: w.saldo + (oldTx.nominal + (oldTx.biayaAdmin || 0)) };
          }
          if (oldTx.tipe === 'transfer' && w.id === oldTx.tujuanDompetId) {
            return { ...w, saldo: w.saldo - oldTx.nominal };
          }
          return w;
        })
      );
    }
    setTransactions((prev) => prev.filter((t) => t.id !== id));
  };

  // Budgets
  const setBudget = (
    bulan: string,
    kategoriId: string,
    subkategoriId: string | null,
    nominal: number,
    persentase?: number | null
  ) => {
    setBudgets((prev) => {
      const existingIndex = prev.findIndex(
        (b) =>
          b.bulan === bulan &&
          b.kategoriId === kategoriId &&
          (subkategoriId ? b.subkategoriId === subkategoriId : !b.subkategoriId)
      );

      if (nominal <= 0) {
        if (existingIndex >= 0) return prev.filter((_, idx) => idx !== existingIndex);
        return prev;
      }

      let updated = [...prev];
      if (existingIndex >= 0) {
        updated[existingIndex] = {
          ...updated[existingIndex],
          nominal,
          persentase: persentase !== undefined ? persentase : updated[existingIndex].persentase,
        };
      } else {
        const newBudget: Budget = {
          id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          bulan,
          kategoriId,
          subkategoriId: subkategoriId || null,
          nominal,
          persentase: persentase !== undefined ? persentase : null,
        };
        updated.push(newBudget);
      }

      // If parent category budget is set or changed, auto-recalculate child subcategories with fixed percentage
      if (!subkategoriId && nominal > 0) {
        updated = updated.map((b) => {
          if (
            b.bulan === bulan &&
            b.kategoriId === kategoriId &&
            b.subkategoriId &&
            b.persentase &&
            b.persentase > 0
          ) {
            const calculatedNominal = Math.round((nominal * b.persentase) / 100);
            return {
              ...b,
              nominal: calculatedNominal,
            };
          }
          return b;
        });
      }

      return updated;
    });
  };

  const removeBudget = (id: string) => {
    setBudgets((prev) => prev.filter((b) => b.id !== id));
  };

  const deleteBudgetByTarget = (
    bulan: string,
    kategoriId: string,
    subkategoriId: string | null = null
  ) => {
    setBudgets((prev) =>
      prev.filter(
        (b) =>
          !(
            b.bulan === bulan &&
            b.kategoriId === kategoriId &&
            (subkategoriId ? b.subkategoriId === subkategoriId : !b.subkategoriId)
          )
      )
    );
  };

  const copyBudgetsFromMonth = (sourceMonth: string, targetMonth: string): { count: number } => {
    const sourceBudgets = budgets.filter((b) => b.bulan === sourceMonth && b.nominal > 0);
    if (sourceBudgets.length === 0) return { count: 0 };

    setBudgets((prev) => {
      const nonTargetBudgets = prev.filter((b) => b.bulan !== targetMonth);
      const copiedBudgets = sourceBudgets.map((b) => ({
        ...b,
        id: `b-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        bulan: targetMonth,
      }));
      return [...nonTargetBudgets, ...copiedBudgets];
    });

    return { count: sourceBudgets.length };
  };

  // Settings
  const toggleDarkMode = () => {
    setSettings((prev) => ({ ...prev, darkMode: !prev.darkMode }));
  };

  const resetToDefaultData = () => {
    const initCats = INITIAL_CATEGORIES;
    const initSubs = INITIAL_SUBCATEGORIES;
    const initTxs = generateInitialTransactions();
    const initBgs = generateInitialBudgets();
    const initWls = INITIAL_WALLETS;
    const initGls = INITIAL_SAVINGS_GOALS;
    const initQts = INITIAL_QUICK_TEMPLATES;

    setCategories(initCats);
    setSubcategories(initSubs);
    setTransactions(initTxs);
    setBudgets(initBgs);
    setWallets(initWls);
    setSavingsGoals(initGls);
    setQuickTemplates(initQts);

    localStorage.setItem(STORAGE_KEYS.CATEGORIES, JSON.stringify(initCats));
    localStorage.setItem(STORAGE_KEYS.SUBCATEGORIES, JSON.stringify(initSubs));
    localStorage.setItem(STORAGE_KEYS.TRANSACTIONS, JSON.stringify(initTxs));
    localStorage.setItem(STORAGE_KEYS.BUDGETS, JSON.stringify(initBgs));
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(initWls));
    localStorage.setItem(STORAGE_KEYS.SAVINGS_GOALS, JSON.stringify(initGls));
    localStorage.setItem(STORAGE_KEYS.QUICK_TEMPLATES, JSON.stringify(initQts));
  };

  const clearAllData = () => {
    setCategories([]);
    setSubcategories([]);
    setTransactions([]);
    setBudgets([]);
    setWallets([]);
    setSavingsGoals([]);
    setQuickTemplates([]);

    localStorage.removeItem(STORAGE_KEYS.CATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.SUBCATEGORIES);
    localStorage.removeItem(STORAGE_KEYS.TRANSACTIONS);
    localStorage.removeItem(STORAGE_KEYS.BUDGETS);
    localStorage.removeItem(STORAGE_KEYS.WALLETS);
    localStorage.removeItem(STORAGE_KEYS.SAVINGS_GOALS);
    localStorage.removeItem(STORAGE_KEYS.QUICK_TEMPLATES);
  };

  const exportDataJSON = () => {
    const data = {
      categories,
      subcategories,
      transactions,
      budgets,
      wallets,
      savingsGoals,
      quickTemplates,
      settings,
      version: '1.2.0',
      exportedAt: new Date().toISOString(),
    };
    return JSON.stringify(data, null, 2);
  };

  const importDataJSON = (jsonStr: string) => {
    try {
      const data = JSON.parse(jsonStr);
      if (!data.categories || !Array.isArray(data.categories)) {
        return { success: false, error: 'Format data tidak valid: kategori tidak ditemukan.' };
      }
      setCategories(data.categories || []);
      setSubcategories(data.subcategories || []);
      setTransactions(data.transactions || []);
      setBudgets(data.budgets || []);
      setWallets(data.wallets || INITIAL_WALLETS);
      setSavingsGoals(data.savingsGoals || INITIAL_SAVINGS_GOALS);
      setQuickTemplates(data.quickTemplates || INITIAL_QUICK_TEMPLATES);
      if (data.settings) setSettings(data.settings);
      return { success: true };
    } catch (e: any) {
      return { success: false, error: `Gagal membaca file JSON: ${e.message || 'Format salah'}` };
    }
  };

  // Auth Actions
  const signInGoogle = async () => {
    try {
      setIsAuthLoading(true);
      const signedUser = await signInWithGoogle();
      setUser(signedUser);
      return { success: true };
    } catch (err: any) {
      console.error('Google Sign-in failed:', err);
      return { success: false, error: err.message || 'Gagal masuk dengan Google.' };
    } finally {
      setIsAuthLoading(false);
    }
  };

  const signOutUser = async () => {
    try {
      await logOut();
      setUser(null);
    } catch (err) {
      console.error('Logout error:', err);
    }
  };

  const syncWithCloud = async () => {
    if (!user) return;
    setIsCloudSyncing(true);
    try {
      const userDocRef = doc(db, 'users', user.uid);
      await setDoc(
        userDocRef,
        {
          uid: user.uid,
          displayName: user.displayName || '',
          email: user.email || '',
          photoURL: user.photoURL || '',
          categories,
          subcategories,
          transactions,
          budgets,
          wallets,
          savingsGoals,
          quickTemplates,
          settings,
          lastSyncedAt: Date.now(),
        },
        { merge: true }
      );
      setLastSyncedTime(new Date());
    } catch (e) {
      console.error('Manual sync failed:', e);
    } finally {
      setIsCloudSyncing(false);
    }
  };

  return (
    <FinanceContext.Provider
      value={{
        categories,
        subcategories,
        transactions,
        budgets,
        wallets,
        savingsGoals,
        quickTemplates,
        activeMonth,
        setActiveMonth,
        settings,
        isLoaded,

        user,
        isAuthLoading,
        signInGoogle,
        signOutUser,
        isCloudSyncing,
        lastSyncedTime,
        syncWithCloud,

        totalNetWorth,
        financialHealth,
        addWallet,
        updateWallet,
        deleteWallet,
        transferFunds,

        addSavingsGoal,
        updateSavingsGoal,
        deleteSavingsGoal,
        depositToGoal,

        addQuickTemplate,
        deleteQuickTemplate,

        addCategory,
        updateCategory,
        reorderCategory,
        deleteCategory,

        addSubcategory,
        updateSubcategory,
        reorderSubcategory,
        deleteSubcategory,

        addTransaction,
        updateTransaction,
        deleteTransaction,

        setBudget,
        removeBudget,
        deleteBudgetByTarget,
        copyBudgetsFromMonth,

        getCategoryById,
        getSubcategoryById,
        getWalletById,
        getSubcategoriesForCategory,
        getTransactionsCountForCategory,
        getTransactionsCountForSubcategory,

        toggleDarkMode,
        resetToDefaultData,
        clearAllData,
        exportDataJSON,
        importDataJSON,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export const useFinance = () => {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
};
