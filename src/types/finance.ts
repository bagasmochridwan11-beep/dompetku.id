export type TransactionType = 'pemasukan' | 'pengeluaran' | 'transfer';

export type WalletType = 'bank' | 'ewallet' | 'cash' | 'investment';

export interface Wallet {
  id: string;
  nama: string;
  tipe: WalletType;
  saldo: number;
  ikon: string;
  warna: string;
  nomorRekening?: string;
  diarsipkan?: boolean;
}

export interface Category {
  id: string;
  nama: string;
  tipe: 'pemasukan' | 'pengeluaran';
  ikon: string;
  warna: string;
  urutan: number;
  diarsipkan: boolean;
  kebutuhanTipe?: 'kebutuhan' | 'keinginan' | 'tabungan'; // For 50/30/20 analysis
}

export interface Subcategory {
  id: string;
  kategoriId: string;
  nama: string;
  ikon: string;
  warna: string;
  urutan: number;
  diarsipkan: boolean;
}

export interface Transaction {
  id: string;
  tanggal: string; // YYYY-MM-DD
  nominal: number;
  tipe: TransactionType;
  kategoriId: string;
  subkategoriId?: string | null;
  dompetId?: string; // Akun asal
  tujuanDompetId?: string; // Akun tujuan (untuk tipe transfer)
  biayaAdmin?: number; // Biaya admin transfer
  catatan: string;
  createdAt: number;
}

export interface Budget {
  id: string;
  bulan: string; // YYYY-MM
  kategoriId: string;
  subkategoriId?: string | null;
  nominal: number;
  persentase?: number | null; // Persentase dari budget kategori induk (0 - 100)
}

export interface SavingsGoal {
  id: string;
  nama: string;
  targetNominal: number;
  terkumpul: number;
  tenggatWaktu: string; // YYYY-MM-DD
  kategori: 'Darurat' | 'Liburan' | 'Investasi' | 'Gadget' | 'Kendaraan' | 'Pendidikan' | 'Lainnya';
  ikon: string;
  warna: string;
  catatan?: string;
  dompetSimpananId?: string;
}

export interface QuickTemplate {
  id: string;
  nama: string;
  nominal: number;
  tipe: TransactionType;
  kategoriId: string;
  subkategoriId?: string | null;
  dompetId?: string;
  catatan: string;
  ikon: string;
}

export interface AppSettings {
  darkMode: boolean;
  currency: 'IDR';
  hasInitializedData: boolean;
  monthlyIncomeTarget?: number;
}

export interface DeleteCategoryOptions {
  categoryId: string;
  subcategoryId?: string | null;
  action: 'archive' | 'delete_and_reassign';
  targetCategoryId?: string;
  targetSubcategoryId?: string | null;
  subcategoriesAction?: 'archive' | 'delete' | 'move_to_category';
  targetCategoryForSubcategoriesId?: string;
}
