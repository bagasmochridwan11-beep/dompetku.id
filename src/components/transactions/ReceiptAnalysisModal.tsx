import React, { useState, useRef } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, getTodayDateString } from '../../utils/formatters';
import { CurrencyInput } from '../common/CurrencyInput';
import {
  Upload,
  Camera,
  Receipt,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  AlertCircle,
  Store,
  Calendar,
  Layers,
  ArrowRight,
  RotateCw,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ReceiptAnalysisModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenChatModal?: () => void;
}

interface AnalyzedReceipt {
  merchantName: string;
  receiptDate: string;
  totalAmount: number;
  items: Array<{
    name: string;
    quantity?: number;
    price: number;
  }>;
  summary: string;
  suggestedTransaction: {
    nominal: number;
    tipe: 'pengeluaran';
    kategoriId: string;
    subkategoriId?: string | null;
    tanggal: string;
    catatan: string;
  };
}

export const ReceiptAnalysisModal: React.FC<ReceiptAnalysisModalProps> = ({
  isOpen,
  onClose,
  onOpenChatModal,
}) => {
  const { categories, subcategories, addTransaction } = useFinance();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [mimeType, setMimeType] = useState<string>('image/jpeg');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [analysisResult, setAnalysisResult] = useState<AnalyzedReceipt | null>(null);

  // Editable transaction form after analysis
  const [txNominal, setTxNominal] = useState<number>(0);
  const [txKategoriId, setTxKategoriId] = useState<string>('');
  const [txSubkategoriId, setTxSubkategoriId] = useState<string>('');
  const [txTanggal, setTxTanggal] = useState<string>(getTodayDateString());
  const [txCatatan, setTxCatatan] = useState<string>('');
  const [isSaved, setIsSaved] = useState(false);

  if (!isOpen) return null;

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setError('Harap pilih file gambar (JPG, PNG, atau WEBP).');
      return;
    }

    setMimeType(file.type);
    setError(null);
    setAnalysisResult(null);
    setIsSaved(false);

    const reader = new FileReader();
    reader.onload = (event) => {
      const base64 = event.target?.result as string;
      setSelectedImage(base64);
      // Auto analyze once image is selected
      runAnalysis(base64, file.type);
    };
    reader.readAsDataURL(file);
  };

  const runAnalysis = async (imgData: string, type: string) => {
    setIsLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/analyze-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          imageBase64: imgData,
          mimeType: type,
          categories: categories.map((c) => ({
            id: c.id,
            nama: c.nama,
            tipe: c.tipe,
          })),
          subcategories: subcategories.map((s) => ({
            id: s.id,
            kategoriId: s.kategoriId,
            nama: s.nama,
          })),
          todayDate: getTodayDateString(),
        }),
      });

      if (!response.ok) {
        const errJson = await response.json();
        throw new Error(errJson.error || 'Gagal memproses struk.');
      }

      const data: AnalyzedReceipt = await response.json();
      setAnalysisResult(data);

      // Pre-fill editable state
      const st = data.suggestedTransaction;
      setTxNominal(st?.nominal || data.totalAmount || 0);
      setTxKategoriId(st?.kategoriId || categories.find((c) => c.tipe === 'pengeluaran')?.id || '');
      setTxSubkategoriId(st?.subkategoriId || '');
      setTxTanggal(st?.tanggal || data.receiptDate || getTodayDateString());
      setTxCatatan(st?.catatan || `Belanja di ${data.merchantName}`);
    } catch (err: any) {
      setError(err.message || 'Gagal menganalisa nota. Pastikan gambar jelas dan coba lagi.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveToDompetKu = () => {
    if (txNominal <= 0) {
      setError('Nominal harus lebih dari 0.');
      return;
    }

    addTransaction({
      nominal: txNominal,
      tipe: 'pengeluaran',
      kategoriId: txKategoriId,
      subkategoriId: txSubkategoriId || null,
      tanggal: txTanggal,
      catatan: txCatatan,
    });

    setIsSaved(true);
    try {
      confetti({ particleCount: 50, spread: 70, origin: { y: 0.7 } });
    } catch (e) {}

    setTimeout(() => {
      onClose();
    }, 1200);
  };

  const handleReset = () => {
    setSelectedImage(null);
    setAnalysisResult(null);
    setError(null);
    setIsSaved(false);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  // Subcategories for current selected category
  const availableSubcategories = subcategories.filter(
    (s) => s.kategoriId === txKategoriId && !s.diarsipkan
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl h-[92vh] max-h-[820px] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-blue-600 to-indigo-600 flex items-center justify-center text-white shadow-sm shadow-blue-500/30">
              <Receipt className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Scan & Analisa Nota / Struk
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400">
                  AI OCR
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Unggah foto struk belanja, AI mengekstrak total, toko, dan barang secara otomatis
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 text-xs text-rose-700 bg-rose-50 dark:bg-rose-950/50 dark:text-rose-300 rounded-2xl border border-rose-200 dark:border-rose-900">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {/* Upload Area if no image selected */}
          {!selectedImage ? (
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 dark:border-slate-700 rounded-3xl p-8 sm:p-12 text-center cursor-pointer hover:border-emerald-500 dark:hover:border-emerald-500 hover:bg-slate-50 dark:hover:bg-slate-800/40 transition group flex flex-col items-center justify-center min-h-[280px]"
            >
              <div className="w-16 h-16 rounded-3xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform shadow-xs">
                <Camera className="w-8 h-8" />
              </div>
              <h4 className="text-base font-bold text-slate-900 dark:text-white">
                Pilih atau Foto Nota Pembayaran
              </h4>
              <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm">
                Mendukung struk Indomaret, Alfamart, restoran, SPBU bensin, apotek, belanja online, dan lainnya.
              </p>
              <button
                type="button"
                className="mt-4 px-4 py-2 rounded-xl bg-emerald-600 text-white text-xs font-semibold shadow-xs hover:bg-emerald-700 transition"
              >
                Pilih Foto dari Galeri / Kamera
              </button>
            </div>
          ) : (
            /* Image Preview & Analysis Card */
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200/80 dark:border-slate-800">
                <div className="flex items-center gap-3">
                  <div className="w-14 h-14 rounded-xl overflow-hidden bg-slate-900 shrink-0">
                    <img
                      src={selectedImage}
                      alt="Nota Terunggah"
                      className="w-full h-full object-cover"
                    />
                  </div>
                  <div>
                    <span className="text-xs font-semibold text-slate-900 dark:text-white block">
                      Foto Nota Terpilih
                    </span>
                    <span className="text-[11px] text-slate-400">
                      {isLoading ? 'Sedang dianalisa oleh Gemini AI...' : 'Analisis selesai'}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => runAnalysis(selectedImage, mimeType)}
                    disabled={isLoading}
                    className="p-2 text-slate-500 hover:text-slate-800 dark:hover:text-slate-200 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Analisa Ulang"
                  >
                    <RotateCw className={`w-4 h-4 ${isLoading ? 'animate-spin' : ''}`} />
                  </button>
                  <button
                    type="button"
                    onClick={handleReset}
                    className="p-2 text-slate-500 hover:text-rose-600 rounded-xl hover:bg-rose-50 dark:hover:bg-rose-950/40 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                    title="Ganti Foto"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {isLoading && (
                <div className="py-12 text-center space-y-3">
                  <Loader2 className="w-10 h-10 animate-spin text-emerald-600 mx-auto" />
                  <p className="text-sm font-bold text-slate-800 dark:text-slate-200">
                    Menganalisa Nota dengan Gemini AI...
                  </p>
                  <p className="text-xs text-slate-400 max-w-sm mx-auto">
                    Mengekstrak nama toko, tanggal, daftar belanjaan, dan total pembayaran.
                  </p>
                </div>
              )}

              {/* Analysis Results Display */}
              {analysisResult && !isLoading && (
                <div className="space-y-4 animate-in fade-in duration-200">
                  {/* Summary Header */}
                  <div className="p-4 rounded-2xl bg-gradient-to-tr from-emerald-500/10 to-teal-500/10 border border-emerald-500/20 space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Store className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        <span className="text-sm font-bold text-slate-900 dark:text-white">
                          {analysisResult.merchantName || 'Toko / Merchant'}
                        </span>
                      </div>
                      <div className="flex items-center gap-1.5 text-xs text-slate-500">
                        <Calendar className="w-3.5 h-3.5" />
                        <span>{analysisResult.receiptDate || getTodayDateString()}</span>
                      </div>
                    </div>

                    <p className="text-xs text-slate-600 dark:text-slate-300">
                      {analysisResult.summary}
                    </p>

                    <div className="flex items-center justify-between pt-2 border-t border-emerald-500/20 text-xs">
                      <span className="font-medium text-slate-500">Grand Total Nota:</span>
                      <span className="text-base font-bold text-slate-900 dark:text-white tabular-nums">
                        {formatRupiah(analysisResult.totalAmount)}
                      </span>
                    </div>
                  </div>

                  {/* Items List Breakdown */}
                  {analysisResult.items && analysisResult.items.length > 0 && (
                    <div className="space-y-2">
                      <span className="text-xs font-bold text-slate-700 dark:text-slate-300 block">
                        Rincian Item yang Terbaca ({analysisResult.items.length} item):
                      </span>
                      <div className="max-h-40 overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800 border border-slate-200 dark:border-slate-800 rounded-2xl p-2 bg-white dark:bg-slate-900">
                        {analysisResult.items.map((item, idx) => (
                          <div
                            key={idx}
                            className="py-1.5 px-2 flex items-center justify-between text-xs"
                          >
                            <span className="text-slate-800 dark:text-slate-200 font-medium truncate max-w-[240px]">
                              {item.quantity ? `${item.quantity}x ` : ''}
                              {item.name}
                            </span>
                            <span className="text-slate-900 dark:text-slate-100 font-bold tabular-nums">
                              {formatRupiah(item.price)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Form to Confirm / Tweak Before Saving */}
                  <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
                    <span className="text-xs font-bold text-slate-800 dark:text-slate-200 block">
                      Konfirmasi Transaksi untuk Disimpan:
                    </span>

                    <CurrencyInput
                      value={txNominal}
                      onChange={setTxNominal}
                      label="Nominal Pengeluaran (Rp)"
                    />

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
                      {/* Kategori */}
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Kategori
                        </label>
                        <select
                          value={txKategoriId}
                          onChange={(e) => {
                            setTxKategoriId(e.target.value);
                            setTxSubkategoriId('');
                          }}
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-[44px]"
                        >
                          {categories
                            .filter((c) => c.tipe === 'pengeluaran' && !c.diarsipkan)
                            .map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.ikon} {c.nama}
                              </option>
                            ))}
                        </select>
                      </div>

                      {/* Subkategori */}
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Subkategori (Opsional)
                        </label>
                        <select
                          value={txSubkategoriId}
                          onChange={(e) => setTxSubkategoriId(e.target.value)}
                          className="w-full text-xs px-3 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-[44px]"
                        >
                          <option value="">(Tanpa subkategori)</option>
                          {availableSubcategories.map((s) => (
                            <option key={s.id} value={s.id}>
                              {s.ikon} {s.nama}
                            </option>
                          ))}
                        </select>
                      </div>

                      {/* Tanggal */}
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Tanggal
                        </label>
                        <input
                          type="date"
                          value={txTanggal}
                          onChange={(e) => setTxTanggal(e.target.value)}
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-[44px]"
                        />
                      </div>

                      {/* Catatan */}
                      <div>
                        <label className="block font-medium text-slate-700 dark:text-slate-300 mb-1">
                          Catatan
                        </label>
                        <input
                          type="text"
                          value={txCatatan}
                          onChange={(e) => setTxCatatan(e.target.value)}
                          placeholder="Catatan belanja..."
                          className="w-full text-xs px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 text-slate-900 dark:text-white min-h-[44px]"
                        />
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={handleSaveToDompetKu}
                      disabled={isSaved}
                      className={`w-full py-3 rounded-xl font-bold text-sm text-white shadow-md transition flex items-center justify-center gap-2 min-h-[44px] ${
                        isSaved
                          ? 'bg-emerald-700 cursor-not-allowed'
                          : 'bg-emerald-600 hover:bg-emerald-700 active:scale-95 shadow-emerald-600/20'
                      }`}
                    >
                      {isSaved ? (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Berhasil Disimpan!</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle2 className="w-5 h-5" />
                          <span>Simpan Transaksi ke DompetKu</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            capture="environment"
            onChange={handleFileChange}
            className="hidden"
          />
        </div>
      </div>
    </div>
  );
};
