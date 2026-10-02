import { Category, Subcategory, Transaction, Budget, Wallet, SavingsGoal, QuickTemplate } from '../types/finance';
import { getCurrentMonthString, getTodayDateString } from '../utils/formatters';

export const INITIAL_WALLETS: Wallet[] = [
  {
    id: 'w-bca',
    nama: 'BCA Utama (Payroll)',
    tipe: 'bank',
    saldo: 14500000,
    ikon: '🏦',
    warna: '#00529C',
    nomorRekening: '8210-9281-12',
    diarsipkan: false,
  },
  {
    id: 'w-mandiri',
    nama: 'Mandiri Tabungan',
    tipe: 'bank',
    saldo: 5850000,
    ikon: '💳',
    warna: '#003366',
    nomorRekening: '137-00-192837-1',
    diarsipkan: false,
  },
  {
    id: 'w-gopay',
    nama: 'GoPay & E-Wallet',
    tipe: 'ewallet',
    saldo: 650000,
    ikon: '🟢',
    warna: '#00AA13',
    nomorRekening: '0812-9876-5432',
    diarsipkan: false,
  },
  {
    id: 'w-cash',
    nama: 'Dompet Tunai (Cash)',
    tipe: 'cash',
    saldo: 450000,
    ikon: '💵',
    warna: '#10B981',
    diarsipkan: false,
  },
  {
    id: 'w-bibit',
    nama: 'Bibit & Reksa Dana',
    tipe: 'investment',
    saldo: 15200000,
    ikon: '📈',
    warna: '#6366F1',
    diarsipkan: false,
  },
];

export const INITIAL_SAVINGS_GOALS: SavingsGoal[] = [
  {
    id: 'goal-1',
    nama: 'Dana Darurat (Emergency Fund)',
    targetNominal: 30000000,
    terkumpul: 18500000,
    tenggatWaktu: '2026-12-31',
    kategori: 'Darurat',
    ikon: '🛡️',
    warna: '#059669',
    catatan: 'Simpanan aman 6 bulan pengeluaran rutin',
    dompetSimpananId: 'w-mandiri',
  },
  {
    id: 'goal-2',
    nama: 'Liburan Akhir Tahun ke Jepang',
    targetNominal: 16000000,
    terkumpul: 9500000,
    tenggatWaktu: '2026-11-20',
    kategori: 'Liburan',
    ikon: '✈️',
    warna: '#3B82F6',
    catatan: 'Tiket pesawat & akomodasi Tokyo-Kyoto',
    dompetSimpananId: 'w-bca',
  },
  {
    id: 'goal-3',
    nama: 'Upgrade Laptop & Monitor Kerja',
    targetNominal: 20000000,
    terkumpul: 14000000,
    tenggatWaktu: '2026-10-15',
    kategori: 'Gadget',
    ikon: '💻',
    warna: '#8B5CF6',
    catatan: 'MacBook Pro M3 untuk produktivitas coding',
    dompetSimpananId: 'w-bca',
  },
];

export const INITIAL_QUICK_TEMPLATES: QuickTemplate[] = [
  {
    id: 'qt-coffee',
    nama: 'Kopi Susu Harian',
    nominal: 25000,
    tipe: 'pengeluaran',
    kategoriId: 'cat-exp-food',
    subkategoriId: 'sub-food-5',
    dompetId: 'w-gopay',
    catatan: 'Kopi susu gula aren',
    ikon: '☕',
  },
  {
    id: 'qt-lunch',
    nama: 'Makan Siang Kantor',
    nominal: 35000,
    tipe: 'pengeluaran',
    kategoriId: 'cat-exp-food',
    subkategoriId: 'sub-food-2',
    dompetId: 'w-gopay',
    catatan: 'Makan siang kantin/resto',
    ikon: '🍱',
  },
  {
    id: 'qt-fuel-motor',
    nama: 'Bensin Motor Pertalite/Max',
    nominal: 35000,
    tipe: 'pengeluaran',
    kategoriId: 'cat-exp-trans',
    subkategoriId: 'sub-trans-1',
    dompetId: 'w-cash',
    catatan: 'Isi bensin motor',
    ikon: '⛽',
  },
  {
    id: 'qt-parking',
    nama: 'Parkir Mall / Kantor',
    nominal: 5000,
    tipe: 'pengeluaran',
    kategoriId: 'cat-exp-trans',
    subkategoriId: 'sub-trans-2',
    dompetId: 'w-cash',
    catatan: 'Tiket parkir',
    ikon: '🅿️',
  },
  {
    id: 'qt-gojek',
    nama: 'Ojek Online / Transport',
    nominal: 20000,
    tipe: 'pengeluaran',
    kategoriId: 'cat-exp-trans',
    subkategoriId: 'sub-trans-3',
    dompetId: 'w-gopay',
    catatan: 'Gojek/Grab ke kantor',
    ikon: '🛵',
  },
  {
    id: 'qt-wifi',
    nama: 'Tagihan WiFi Indihome',
    nominal: 380000,
    tipe: 'pengeluaran',
    kategoriId: 'cat-exp-bills',
    subkategoriId: 'sub-bills-3',
    dompetId: 'w-bca',
    catatan: 'Internet bulanan',
    ikon: '📶',
  },
];

export const INITIAL_CATEGORIES: Category[] = [
  // Pengeluaran - Kebutuhan (Needs 50%)
  { id: 'cat-exp-food', nama: 'Makanan', tipe: 'pengeluaran', ikon: '🍔', warna: '#f97316', urutan: 1, diarsipkan: false, kebutuhanTipe: 'kebutuhan' },
  { id: 'cat-exp-trans', nama: 'Transportasi', tipe: 'pengeluaran', ikon: '🚗', warna: '#3b82f6', urutan: 2, diarsipkan: false, kebutuhanTipe: 'kebutuhan' },
  { id: 'cat-exp-bills', nama: 'Tagihan & Utilitas', tipe: 'pengeluaran', ikon: '💡', warna: '#eab308', urutan: 3, diarsipkan: false, kebutuhanTipe: 'kebutuhan' },
  { id: 'cat-exp-health', nama: 'Kesehatan', tipe: 'pengeluaran', ikon: '💊', warna: '#ef4444', urutan: 4, diarsipkan: false, kebutuhanTipe: 'kebutuhan' },
  { id: 'cat-exp-edu', nama: 'Pendidikan', tipe: 'pengeluaran', ikon: '📚', warna: '#14b8a6', urutan: 5, diarsipkan: false, kebutuhanTipe: 'kebutuhan' },

  // Pengeluaran - Keinginan (Wants 30%)
  { id: 'cat-exp-ent', nama: 'Hiburan & Hobi', tipe: 'pengeluaran', ikon: '🎮', warna: '#8b5cf6', urutan: 6, diarsipkan: false, kebutuhanTipe: 'keinginan' },
  { id: 'cat-exp-shop', nama: 'Belanja & Lifestyle', tipe: 'pengeluaran', ikon: '🛍️', warna: '#ec4899', urutan: 7, diarsipkan: false, kebutuhanTipe: 'keinginan' },
  { id: 'cat-exp-other', nama: 'Lain-lain', tipe: 'pengeluaran', ikon: '📦', warna: '#64748b', urutan: 8, diarsipkan: false, kebutuhanTipe: 'keinginan' },

  // Pemasukan
  { id: 'cat-inc-salary', nama: 'Gaji Pokok', tipe: 'pemasukan', ikon: '💼', warna: '#10b981', urutan: 1, diarsipkan: false },
  { id: 'cat-inc-bonus', nama: 'Bonus & THR', tipe: 'pemasukan', ikon: '🎁', warna: '#059669', urutan: 2, diarsipkan: false },
  { id: 'cat-inc-biz', nama: 'Usaha & Bisnis', tipe: 'pemasukan', ikon: '🏬', warna: '#0d9488', urutan: 3, diarsipkan: false },
  { id: 'cat-inc-inv', nama: 'Imbal Hasil Investasi', tipe: 'pemasukan', ikon: '📈', warna: '#0284c7', urutan: 4, diarsipkan: false },
  { id: 'cat-inc-gift', nama: 'Hadiah / Cashback', tipe: 'pemasukan', ikon: '🎊', warna: '#6366f1', urutan: 5, diarsipkan: false },
  { id: 'cat-inc-other', nama: 'Pemasukan Lainnya', tipe: 'pemasukan', ikon: '💰', warna: '#84cc16', urutan: 6, diarsipkan: false },
];

export const INITIAL_SUBCATEGORIES: Subcategory[] = [
  // Makanan
  { id: 'sub-food-1', kategoriId: 'cat-exp-food', nama: 'Sarapan Pagi', ikon: '🍳', warna: '#f97316', urutan: 1, diarsipkan: false },
  { id: 'sub-food-2', kategoriId: 'cat-exp-food', nama: 'Makan Siang', ikon: '🍱', warna: '#ea580c', urutan: 2, diarsipkan: false },
  { id: 'sub-food-3', kategoriId: 'cat-exp-food', nama: 'Makan Malam', ikon: '🍲', warna: '#c2410c', urutan: 3, diarsipkan: false },
  { id: 'sub-food-4', kategoriId: 'cat-exp-food', nama: 'Camilan & Jajanan', ikon: '🥨', warna: '#fb923c', urutan: 4, diarsipkan: false },
  { id: 'sub-food-5', kategoriId: 'cat-exp-food', nama: 'Kopi & Minuman', ikon: '☕', warna: '#d97706', urutan: 5, diarsipkan: false },

  // Transportasi
  { id: 'sub-trans-1', kategoriId: 'cat-exp-trans', nama: 'Bensin & BBM', ikon: '⛽', warna: '#2563eb', urutan: 1, diarsipkan: false },
  { id: 'sub-trans-2', kategoriId: 'cat-exp-trans', nama: 'Parkir & Tol', ikon: '🅿️', warna: '#1d4ed8', urutan: 2, diarsipkan: false },
  { id: 'sub-trans-3', kategoriId: 'cat-exp-trans', nama: 'Ojek Online & Taksi', ikon: '🛵', warna: '#3b82f6', urutan: 3, diarsipkan: false },
  { id: 'sub-trans-4', kategoriId: 'cat-exp-trans', nama: 'Kereta & MRT/LRT', ikon: '🚆', warna: '#60a5fa', urutan: 4, diarsipkan: false },

  // Tagihan
  { id: 'sub-bills-1', kategoriId: 'cat-exp-bills', nama: 'Listrik PLN', ikon: '⚡', warna: '#ca8a04', urutan: 1, diarsipkan: false },
  { id: 'sub-bills-2', kategoriId: 'cat-exp-bills', nama: 'Air PDAM', ikon: '💧', warna: '#0284c7', urutan: 2, diarsipkan: false },
  { id: 'sub-bills-3', kategoriId: 'cat-exp-bills', nama: 'Internet & WiFi', ikon: '📶', warna: '#d97706', urutan: 3, diarsipkan: false },
  { id: 'sub-bills-4', kategoriId: 'cat-exp-bills', nama: 'Pulsa & Paket Data', ikon: '📱', warna: '#eab308', urutan: 4, diarsipkan: false },

  // Hiburan
  { id: 'sub-ent-1', kategoriId: 'cat-exp-ent', nama: 'Streaming (Netflix/Spotify)', ikon: '🎬', warna: '#7c3aed', urutan: 1, diarsipkan: false },
  { id: 'sub-ent-2', kategoriId: 'cat-exp-ent', nama: 'Game & Top Up', ikon: '🎮', warna: '#6d28d9', urutan: 2, diarsipkan: false },
  { id: 'sub-ent-3', kategoriId: 'cat-exp-ent', nama: 'Bioskop & Nonton', ikon: '🍿', warna: '#8b5cf6', urutan: 3, diarsipkan: false },
  { id: 'sub-ent-4', kategoriId: 'cat-exp-ent', nama: 'Wisata & Staycation', ikon: '🏖️', warna: '#a78bfa', urutan: 4, diarsipkan: false },

  // Belanja
  { id: 'sub-shop-1', kategoriId: 'cat-exp-shop', nama: 'Kebutuhan Dapur & Bulanan', ikon: '🛒', warna: '#db2777', urutan: 1, diarsipkan: false },
  { id: 'sub-shop-2', kategoriId: 'cat-exp-shop', nama: 'Pakaian & Sepatu', ikon: '👕', warna: '#be185d', urutan: 2, diarsipkan: false },
  { id: 'sub-shop-3', kategoriId: 'cat-exp-shop', nama: 'Gadget & Elektronik', ikon: '💻', warna: '#ec4899', urutan: 3, diarsipkan: false },

  // Kesehatan
  { id: 'sub-health-1', kategoriId: 'cat-exp-health', nama: 'Obat & Resep', ikon: '💊', warna: '#dc2626', urutan: 1, diarsipkan: false },
  { id: 'sub-health-2', kategoriId: 'cat-exp-health', nama: 'Dokter & Lab', ikon: '🩺', warna: '#b91c1c', urutan: 2, diarsipkan: false },
  { id: 'sub-health-3', kategoriId: 'cat-exp-health', nama: 'Vitamin & Suplemen', ikon: '🍊', warna: '#f87171', urutan: 3, diarsipkan: false },

  // Pendidikan
  { id: 'sub-edu-1', kategoriId: 'cat-exp-edu', nama: 'Kursus & Sertifikasi', ikon: '💻', warna: '#0f766e', urutan: 1, diarsipkan: false },
  { id: 'sub-edu-2', kategoriId: 'cat-exp-edu', nama: 'Buku & E-book', ikon: '📖', warna: '#14b8a6', urutan: 2, diarsipkan: false },

  // Gaji
  { id: 'sub-salary-1', kategoriId: 'cat-inc-salary', nama: 'Gaji Pokok', ikon: '💵', warna: '#059669', urutan: 1, diarsipkan: false },
  { id: 'sub-salary-2', kategoriId: 'cat-inc-salary', nama: 'Tunjangan', ikon: '🪙', warna: '#10b981', urutan: 2, diarsipkan: false },
  { id: 'sub-salary-3', kategoriId: 'cat-inc-salary', nama: 'Uang Lembur', ikon: '⏰', warna: '#34d399', urutan: 3, diarsipkan: false },
];

/**
 * Generate starter transactions for current month with wallets
 */
export function generateInitialTransactions(): Transaction[] {
  const currentMonth = getCurrentMonthString();
  const today = new Date();
  const year = today.getFullYear();
  const month = today.getMonth() + 1;
  const pad = (n: number) => String(n).padStart(2, '0');

  return [
    {
      id: 'tx-1',
      tanggal: `${year}-${pad(month)}-01`,
      nominal: 13500000,
      tipe: 'pemasukan',
      kategoriId: 'cat-inc-salary',
      subkategoriId: 'sub-salary-1',
      dompetId: 'w-bca',
      catatan: 'Gaji bulanan kantor',
      createdAt: Date.now() - 25 * 86400000,
    },
    {
      id: 'tx-2',
      tanggal: `${year}-${pad(month)}-01`,
      nominal: 2000000,
      tipe: 'pemasukan',
      kategoriId: 'cat-inc-salary',
      subkategoriId: 'sub-salary-2',
      dompetId: 'w-bca',
      catatan: 'Tunjangan operasional',
      createdAt: Date.now() - 25 * 86400000 + 1000,
    },
    {
      id: 'tx-tf-1',
      tanggal: `${year}-${pad(month)}-02`,
      nominal: 1500000,
      tipe: 'transfer',
      kategoriId: 'cat-exp-other',
      subkategoriId: null,
      dompetId: 'w-bca',
      tujuanDompetId: 'w-gopay',
      biayaAdmin: 1000,
      catatan: 'Top Up saldo GoPay dari BCA',
      createdAt: Date.now() - 24 * 86400000 - 500,
    },
    {
      id: 'tx-3',
      tanggal: `${year}-${pad(month)}-02`,
      nominal: 450000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-bills',
      subkategoriId: 'sub-bills-1',
      dompetId: 'w-bca',
      catatan: 'Token listrik PLN 900VA',
      createdAt: Date.now() - 24 * 86400000,
    },
    {
      id: 'tx-4',
      tanggal: `${year}-${pad(month)}-03`,
      nominal: 380000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-bills',
      subkategoriId: 'sub-bills-3',
      dompetId: 'w-bca',
      catatan: 'Tagihan WiFi Indihome',
      createdAt: Date.now() - 23 * 86400000,
    },
    {
      id: 'tx-5',
      tanggal: `${year}-${pad(month)}-05`,
      nominal: 850000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-shop',
      subkategoriId: 'sub-shop-1',
      dompetId: 'w-mandiri',
      catatan: 'Belanja bulanan supermarket',
      createdAt: Date.now() - 20 * 86400000,
    },
    {
      id: 'tx-6',
      tanggal: `${year}-${pad(month)}-08`,
      nominal: 250000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-trans',
      subkategoriId: 'sub-trans-1',
      dompetId: 'w-mandiri',
      catatan: 'Isi full tank Pertamax',
      createdAt: Date.now() - 17 * 86400000,
    },
    {
      id: 'tx-7',
      tanggal: `${year}-${pad(month)}-10`,
      nominal: 75000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-food',
      subkategoriId: 'sub-food-2',
      dompetId: 'w-gopay',
      catatan: 'Makan siang Nasi Padang bareng tim',
      createdAt: Date.now() - 15 * 86400000,
    },
    {
      id: 'tx-8',
      tanggal: `${year}-${pad(month)}-12`,
      nominal: 186000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-ent',
      subkategoriId: 'sub-ent-1',
      dompetId: 'w-gopay',
      catatan: 'Langganan Netflix Premium & Spotify',
      createdAt: Date.now() - 13 * 86400000,
    },
    {
      id: 'tx-9',
      tanggal: `${year}-${pad(month)}-15`,
      nominal: 1500000,
      tipe: 'pemasukan',
      kategoriId: 'cat-inc-biz',
      subkategoriId: null,
      dompetId: 'w-bca',
      catatan: 'Penjualan toko online sampingan',
      createdAt: Date.now() - 10 * 86400000,
    },
    {
      id: 'tx-10',
      tanggal: `${year}-${pad(month)}-18`,
      nominal: 350000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-edu',
      subkategoriId: 'sub-edu-2',
      dompetId: 'w-bca',
      catatan: 'Beli buku investasi & finansial',
      createdAt: Date.now() - 7 * 86400000,
    },
    {
      id: 'tx-11',
      tanggal: `${year}-${pad(month)}-21`,
      nominal: 28000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-food',
      subkategoriId: 'sub-food-5',
      dompetId: 'w-gopay',
      catatan: 'Kopi susu gula aren siang',
      createdAt: Date.now() - 4 * 86400000,
    },
    {
      id: 'tx-12',
      tanggal: `${year}-${pad(month)}-24`,
      nominal: 120000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-health',
      subkategoriId: 'sub-health-3',
      dompetId: 'w-cash',
      catatan: 'Multivitamin & Vitamin C',
      createdAt: Date.now() - 2 * 86400000,
    },
    {
      id: 'tx-13',
      tanggal: getTodayDateString(),
      nominal: 45000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-food',
      subkategoriId: 'sub-food-2',
      dompetId: 'w-gopay',
      catatan: 'Makan siang ayam geprek',
      createdAt: Date.now(),
    },
    {
      id: 'tx-14',
      tanggal: getTodayDateString(),
      nominal: 24000,
      tipe: 'pengeluaran',
      kategoriId: 'cat-exp-trans',
      subkategoriId: 'sub-trans-3',
      dompetId: 'w-gopay',
      catatan: 'Gojek ke stasiun',
      createdAt: Date.now() + 10,
    },
  ];
}

/**
 * Generate starter budgets for current month
 */
export function generateInitialBudgets(): Budget[] {
  const currentMonth = getCurrentMonthString();
  return [
    // Makanan Total: 3.500.000
    { id: 'b-food', bulan: currentMonth, kategoriId: 'cat-exp-food', subkategoriId: null, nominal: 3500000 },
    { id: 'b-food-1', bulan: currentMonth, kategoriId: 'cat-exp-food', subkategoriId: 'sub-food-1', nominal: 600000 },
    { id: 'b-food-2', bulan: currentMonth, kategoriId: 'cat-exp-food', subkategoriId: 'sub-food-2', nominal: 1200000 },
    { id: 'b-food-3', bulan: currentMonth, kategoriId: 'cat-exp-food', subkategoriId: 'sub-food-3', nominal: 900000 },
    { id: 'b-food-5', bulan: currentMonth, kategoriId: 'cat-exp-food', subkategoriId: 'sub-food-5', nominal: 500000 },

    // Transportasi Total: 1.200.000
    { id: 'b-trans', bulan: currentMonth, kategoriId: 'cat-exp-trans', subkategoriId: null, nominal: 1200000 },
    { id: 'b-trans-1', bulan: currentMonth, kategoriId: 'cat-exp-trans', subkategoriId: 'sub-trans-1', nominal: 700000 },
    { id: 'b-trans-3', bulan: currentMonth, kategoriId: 'cat-exp-trans', subkategoriId: 'sub-trans-3', nominal: 300000 },

    // Tagihan Total: 1.500.000
    { id: 'b-bills', bulan: currentMonth, kategoriId: 'cat-exp-bills', subkategoriId: null, nominal: 1500000 },

    // Hiburan Total: 800.000
    { id: 'b-ent', bulan: currentMonth, kategoriId: 'cat-exp-ent', subkategoriId: null, nominal: 800000 },

    // Belanja Total: 2.000.000
    { id: 'b-shop', bulan: currentMonth, kategoriId: 'cat-exp-shop', subkategoriId: null, nominal: 2000000 },

    // Kesehatan Total: 600.000
    { id: 'b-health', bulan: currentMonth, kategoriId: 'cat-exp-health', subkategoriId: null, nominal: 600000 },

    // Pendidikan Total: 1.000.000
    { id: 'b-edu', bulan: currentMonth, kategoriId: 'cat-exp-edu', subkategoriId: null, nominal: 1000000 },

    // Target Pemasukan Gaji
    { id: 'b-inc-sal', bulan: currentMonth, kategoriId: 'cat-inc-salary', subkategoriId: null, nominal: 14000000 },
  ];
}
