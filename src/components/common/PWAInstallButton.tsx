import React, { useState } from 'react';
import { usePWAInstall } from '../../hooks/usePWAInstall';
import { Download, Share, X, PlusSquare } from 'lucide-react';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already installed in standalone mode, hide
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        className={`flex items-center gap-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-medium shadow-sm transition active:scale-95 ${
          compact ? 'px-3 py-1.5 text-xs' : 'px-4 py-2.5 text-sm min-h-[44px]'
        }`}
        title="Pasang aplikasi ke layar utama"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Install App</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          className={`flex items-center gap-1.5 rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800 text-slate-700 dark:text-slate-200 hover:bg-slate-50 dark:hover:bg-slate-700/50 font-medium transition active:scale-95 ${
            compact ? 'px-2.5 py-1.5 text-xs' : 'px-3.5 py-2 text-sm min-h-[44px]'
          }`}
          title="Pasang di iPhone / iPad"
        >
          <Download className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
          <span>Install iOS</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
            <div className="w-full max-w-sm rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800">
              <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
                <h3 className="text-base font-bold text-slate-900 dark:text-white">Pasang di iPhone / iPad</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 min-h-[44px] min-w-[44px] flex items-center justify-center"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="mt-4 space-y-3.5 text-sm text-slate-600 dark:text-slate-300">
                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                    1
                  </div>
                  <div>
                    Ketuk tombol <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1"><Share className="w-3.5 h-3.5 inline" /> Bagikan (Share)</strong> di baris menu bawah browser Safari.
                  </div>
                </div>

                <div className="flex items-start gap-3 p-2.5 rounded-xl bg-slate-50 dark:bg-slate-800/60">
                  <div className="w-7 h-7 rounded-lg bg-emerald-100 dark:bg-emerald-950 flex items-center justify-center text-emerald-700 dark:text-emerald-400 font-bold text-xs shrink-0">
                    2
                  </div>
                  <div>
                    Gulir ke bawah dan pilih opsi <strong className="text-slate-900 dark:text-white inline-flex items-center gap-1"><PlusSquare className="w-3.5 h-3.5 inline" /> Tambah ke Layar Utama</strong> (Add to Home Screen).
                  </div>
                </div>
              </div>

              <button
                onClick={() => setShowIOSGuide(false)}
                className="mt-5 w-full rounded-xl bg-emerald-600 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-emerald-700 transition min-h-[44px]"
              >
                Mengerti
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
