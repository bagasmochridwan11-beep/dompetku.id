import React, { useState, useRef, useEffect } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { formatRupiah, getTodayDateString } from '../../utils/formatters';
import {
  Send,
  Bot,
  User,
  Sparkles,
  CheckCircle2,
  X,
  Loader2,
  Plus,
  ArrowRight,
  Receipt,
  HelpCircle,
} from 'lucide-react';
import confetti from 'canvas-confetti';

interface ChatMessage {
  id: string;
  sender: 'user' | 'ai';
  text: string;
  timestamp: string;
  detectedTransactions?: Array<{
    nominal: number;
    tipe: 'pengeluaran' | 'pemasukan';
    kategoriId: string;
    subkategoriId?: string | null;
    tanggal: string;
    catatan: string;
    saved?: boolean;
  }>;
}

const QUICK_PROMPTS = [
  'Tadi beli bensin 50rb dan bayar parkir 3rb',
  'Makan siang nasi padang 35.000 dan es teh 5.000',
  'Bayar token listrik 200rb kemarin',
  'Dapet bonus proyek 1.500.000 hari ini',
  'Belanja bulanan di supermarket 450.000',
];

interface ChatTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenReceiptScan?: () => void;
}

export const ChatTransactionModal: React.FC<ChatTransactionModalProps> = ({
  isOpen,
  onClose,
  onOpenReceiptScan,
}) => {
  const { categories, subcategories, addTransaction, getCategoryById, getSubcategoryById } =
    useFinance();

  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'msg-welcome',
      sender: 'ai',
      text: 'Halo! Saya asisten DompetKu AI. Ceritakan pengeluaran atau pemasukan Anda secara santai, misalnya: "Makan siang 35rb dan kopi 20rb tadi siang". Saya akan otomatis mencatatnya ke kategori yang sesuai.',
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    },
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    if (isOpen) {
      setTimeout(scrollToBottom, 100);
    }
  }, [messages, isOpen]);

  if (!isOpen) return null;

  const handleSendMessage = async (textToSend?: string) => {
    const text = (textToSend || inputMessage).trim();
    if (!text || isLoading) return;

    const userMsgId = `msg-${Date.now()}`;
    const newMsg: ChatMessage = {
      id: userMsgId,
      sender: 'user',
      text,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, newMsg]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/api/chat-transaction', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          message: text,
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
        throw new Error('Gagal menghubungi AI');
      }

      const data = await response.json();

      const aiMsg: ChatMessage = {
        id: `msg-ai-${Date.now()}`,
        sender: 'ai',
        text: data.reply || 'Berikut transaksi yang berhasil saya deteksi:',
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        detectedTransactions: (data.transactions || []).map((t: any) => ({
          ...t,
          saved: false,
        })),
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err: any) {
      const errorMsg: ChatMessage = {
        id: `msg-err-${Date.now()}`,
        sender: 'ai',
        text: 'Maaf, terjadi kendala saat memproses pesan: ' + (err.message || 'Coba periksa koneksi server.'),
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveTransaction = (
    msgId: string,
    txIndex: number,
    tx: {
      nominal: number;
      tipe: 'pengeluaran' | 'pemasukan';
      kategoriId: string;
      subkategoriId?: string | null;
      tanggal: string;
      catatan: string;
    }
  ) => {
    addTransaction({
      nominal: tx.nominal,
      tipe: tx.tipe,
      kategoriId: tx.kategoriId,
      subkategoriId: tx.subkategoriId || null,
      tanggal: tx.tanggal,
      catatan: tx.catatan,
    });

    try {
      confetti({ particleCount: 30, spread: 60, origin: { y: 0.8 } });
    } catch (e) {}

    // Mark as saved
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.detectedTransactions) {
          const updated = [...m.detectedTransactions];
          updated[txIndex] = { ...updated[txIndex], saved: true };
          return { ...m, detectedTransactions: updated };
        }
        return m;
      })
    );
  };

  const handleSaveAllTransactions = (msgId: string) => {
    const msg = messages.find((m) => m.id === msgId);
    if (!msg || !msg.detectedTransactions) return;

    msg.detectedTransactions.forEach((tx) => {
      if (!tx.saved) {
        addTransaction({
          nominal: tx.nominal,
          tipe: tx.tipe,
          kategoriId: tx.kategoriId,
          subkategoriId: tx.subkategoriId || null,
          tanggal: tx.tanggal,
          catatan: tx.catatan,
        });
      }
    });

    try {
      confetti({ particleCount: 60, spread: 80, origin: { y: 0.7 } });
    } catch (e) {}

    setMessages((prev) =>
      prev.map((m) => {
        if (m.id === msgId && m.detectedTransactions) {
          return {
            ...m,
            detectedTransactions: m.detectedTransactions.map((t) => ({ ...t, saved: true })),
          };
        }
        return m;
      })
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-2 sm:p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-2xl h-[90vh] max-h-[750px] rounded-3xl bg-white dark:bg-slate-900 shadow-2xl border border-slate-200 dark:border-slate-800 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between shrink-0 bg-white/80 dark:bg-slate-900/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-emerald-600 to-teal-500 flex items-center justify-center text-white shadow-sm shadow-emerald-500/30">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">
                  Catat Transaksi via Chat AI
                </h3>
                <span className="text-[10px] font-semibold px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-950 dark:text-emerald-400">
                  Gemini 3.8
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Ketik kalimat bebas dalam Bahasa Indonesia, AI langsung mengkategorikannya
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1">
            {onOpenReceiptScan && (
              <button
                type="button"
                onClick={() => {
                  onClose();
                  onOpenReceiptScan();
                }}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 text-xs font-semibold text-slate-700 dark:text-slate-200 transition min-h-[38px]"
                title="Pindah ke mode Scan Nota"
              >
                <Receipt className="w-4 h-4 text-emerald-600" />
                <span className="hidden sm:inline">Scan Nota</span>
              </button>
            )}

            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Chat Feed */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex items-start gap-2.5 ${
                msg.sender === 'user' ? 'flex-row-reverse' : 'flex-row'
              }`}
            >
              <div
                className={`w-8 h-8 rounded-xl flex items-center justify-center shrink-0 text-sm ${
                  msg.sender === 'user'
                    ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900'
                    : 'bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300'
                }`}
              >
                {msg.sender === 'user' ? <User className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>

              <div
                className={`max-w-[85%] sm:max-w-[75%] space-y-2.5 ${
                  msg.sender === 'user' ? 'items-end' : 'items-start'
                }`}
              >
                {/* Bubble */}
                <div
                  className={`p-3.5 rounded-2xl text-xs sm:text-sm leading-relaxed ${
                    msg.sender === 'user'
                      ? 'bg-slate-900 text-white dark:bg-slate-100 dark:text-slate-900 rounded-tr-xs'
                      : 'bg-slate-100 dark:bg-slate-800 text-slate-800 dark:text-slate-100 rounded-tl-xs'
                  }`}
                >
                  <p>{msg.text}</p>
                  <span
                    className={`block text-[10px] mt-1 text-right ${
                      msg.sender === 'user' ? 'text-slate-400 dark:text-slate-500' : 'text-slate-400'
                    }`}
                  >
                    {msg.timestamp}
                  </span>
                </div>

                {/* Detected Transactions Card List */}
                {msg.detectedTransactions && msg.detectedTransactions.length > 0 && (
                  <div className="space-y-2 pt-1 w-full">
                    <div className="flex items-center justify-between text-xs font-bold text-slate-700 dark:text-slate-300 px-1">
                      <span>{msg.detectedTransactions.length} Transaksi Ditemukan:</span>
                      {msg.detectedTransactions.length > 1 &&
                        msg.detectedTransactions.some((t) => !t.saved) && (
                          <button
                            type="button"
                            onClick={() => handleSaveAllTransactions(msg.id)}
                            className="text-xs font-bold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" />
                            <span>Simpan Semua</span>
                          </button>
                        )}
                    </div>

                    {msg.detectedTransactions.map((tx, idx) => {
                      const cat = getCategoryById(tx.kategoriId);
                      const sub = tx.subkategoriId ? getSubcategoryById(tx.subkategoriId) : null;

                      return (
                        <div
                          key={idx}
                          className={`p-3 rounded-2xl border transition ${
                            tx.saved
                              ? 'bg-emerald-50/60 dark:bg-emerald-950/30 border-emerald-200 dark:border-emerald-800'
                              : 'bg-white dark:bg-slate-800/90 border-slate-200 dark:border-slate-700 shadow-xs'
                          }`}
                        >
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2.5 min-w-0">
                              <span className="text-xl">{sub ? sub.ikon : cat ? cat.ikon : '💰'}</span>
                              <div className="min-w-0">
                                <div className="flex items-center gap-1.5 flex-wrap">
                                  <span className="text-xs font-bold text-slate-900 dark:text-white">
                                    {cat ? cat.nama : 'Kategori'}
                                  </span>
                                  {sub && (
                                    <>
                                      <span className="text-slate-400 text-xs">›</span>
                                      <span className="text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                        {sub.nama}
                                      </span>
                                    </>
                                  )}
                                  <span
                                    className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                                      tx.tipe === 'pemasukan'
                                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950 dark:text-emerald-300'
                                        : 'bg-rose-100 text-rose-800 dark:bg-rose-950 dark:text-rose-300'
                                    }`}
                                  >
                                    {tx.tipe}
                                  </span>
                                </div>
                                <p className="text-xs text-slate-600 dark:text-slate-300 mt-0.5 truncate">
                                  {tx.catatan}
                                </p>
                                <span className="text-[11px] text-slate-400">{tx.tanggal}</span>
                              </div>
                            </div>

                            <div className="text-right shrink-0">
                              <span className="text-sm font-bold text-slate-900 dark:text-white tabular-nums block">
                                {formatRupiah(tx.nominal)}
                              </span>

                              <div className="mt-1">
                                {tx.saved ? (
                                  <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-600 dark:text-emerald-400">
                                    <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleSaveTransaction(msg.id, idx, tx)}
                                    className="px-2.5 py-1 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition flex items-center gap-1 min-h-[32px]"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                    <span>Simpan</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>
          ))}

          {isLoading && (
            <div className="flex items-center gap-2 text-xs text-slate-500 italic p-3 bg-slate-50 dark:bg-slate-800/40 rounded-2xl w-fit">
              <Loader2 className="w-4 h-4 animate-spin text-emerald-600" />
              <span>DompetKu AI sedang menganalisa pesan Anda...</span>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts Carousel */}
        <div className="px-4 py-2 border-t border-slate-100 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/40 overflow-x-auto shrink-0 flex items-center gap-2">
          <span className="text-[11px] font-semibold text-slate-400 whitespace-nowrap flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-amber-500" /> Contoh:
          </span>
          {QUICK_PROMPTS.map((p, i) => (
            <button
              key={i}
              type="button"
              onClick={() => handleSendMessage(p)}
              disabled={isLoading}
              className="px-2.5 py-1 rounded-xl bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 text-[11px] text-slate-700 dark:text-slate-300 hover:border-emerald-500 whitespace-nowrap transition min-h-[32px] disabled:opacity-50"
            >
              "{p}"
            </button>
          ))}
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 border-t border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-center gap-2"
          >
            <input
              type="text"
              value={inputMessage}
              onChange={(e) => setInputMessage(e.target.value)}
              placeholder="Ketik transaksi Anda di sini (misal: Beli makan siang 30rb)..."
              disabled={isLoading}
              className="flex-1 px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-sm text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 min-h-[44px]"
            />
            <button
              type="submit"
              disabled={!inputMessage.trim() || isLoading}
              className="w-12 h-12 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center transition active:scale-95 disabled:opacity-50 shrink-0 shadow-md shadow-emerald-600/20 min-h-[44px] min-w-[44px]"
            >
              {isLoading ? (
                <Loader2 className="w-5 h-5 animate-spin" />
              ) : (
                <Send className="w-5 h-5" />
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};
