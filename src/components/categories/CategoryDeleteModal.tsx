import React, { useState } from 'react';
import { Category, Subcategory } from '../../types/finance';
import { AlertCircle, Archive, Trash2, ArrowRight } from 'lucide-react';

interface CategoryDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetCategory?: Category;
  targetSubcategory?: Subcategory;
  categories: Category[];
  subcategories: Subcategory[];
  transactionsCount: number;
  onConfirmCategory: (options: {
    action: 'archive' | 'delete_and_reassign';
    targetCategoryId?: string;
    subcategoriesAction?: 'archive' | 'delete' | 'move_to_category';
    targetCategoryForSubcategoriesId?: string;
  }) => void;
  onConfirmSubcategory: (options: {
    action: 'archive' | 'delete_and_reassign';
    targetSubcategoryId?: string | null;
  }) => void;
}

export const CategoryDeleteModal: React.FC<CategoryDeleteModalProps> = ({
  isOpen,
  onClose,
  targetCategory,
  targetSubcategory,
  categories,
  subcategories,
  transactionsCount,
  onConfirmCategory,
  onConfirmSubcategory,
}) => {
  const isCategory = !!targetCategory;
  const isSubcategory = !!targetSubcategory;

  const childSubcategories = isCategory
    ? subcategories.filter((s) => s.kategoriId === targetCategory.id && !s.diarsipkan)
    : [];

  const otherCategories = isCategory
    ? categories.filter((c) => c.id !== targetCategory.id && c.tipe === targetCategory.tipe && !c.diarsipkan)
    : [];

  const otherSubcategories = isSubcategory
    ? subcategories.filter(
        (s) =>
          s.id !== targetSubcategory.id &&
          s.kategoriId === targetSubcategory.kategoriId &&
          !s.diarsipkan
      )
    : [];

  // Form states
  const [action, setAction] = useState<'archive' | 'delete_and_reassign'>(
    transactionsCount > 0 ? 'archive' : 'delete_and_reassign'
  );
  const [targetCategoryId, setTargetCategoryId] = useState<string>(
    otherCategories[0]?.id || ''
  );
  const [subcategoriesAction, setSubcategoriesAction] = useState<'archive' | 'delete' | 'move_to_category'>(
    'archive'
  );
  const [targetCatForSubs, setTargetCatForSubs] = useState<string>(
    otherCategories[0]?.id || ''
  );
  const [targetSubcategoryId, setTargetSubcategoryId] = useState<string | null>(
    otherSubcategories[0]?.id || null
  );

  if (!isOpen || (!targetCategory && !targetSubcategory)) return null;

  const handleConfirm = () => {
    if (isCategory && targetCategory) {
      onConfirmCategory({
        action,
        targetCategoryId: action === 'delete_and_reassign' ? targetCategoryId : undefined,
        subcategoriesAction: action === 'delete_and_reassign' ? subcategoriesAction : 'archive',
        targetCategoryForSubcategoriesId:
          subcategoriesAction === 'move_to_category' ? targetCatForSubs : undefined,
      });
    } else if (isSubcategory && targetSubcategory) {
      onConfirmSubcategory({
        action,
        targetSubcategoryId: action === 'delete_and_reassign' ? targetSubcategoryId : null,
      });
    }
    onClose();
  };

  const titleName = isCategory ? targetCategory?.nama : targetSubcategory?.nama;
  const typeLabel = isCategory ? 'Kategori' : 'Subkategori';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-in fade-in duration-150">
      <div className="w-full max-w-lg rounded-2xl bg-white p-6 shadow-2xl dark:bg-slate-900 border border-slate-200 dark:border-slate-800 max-h-[90vh] overflow-y-auto">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <AlertCircle className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900 dark:text-white">
              Hapus / Arsipkan {typeLabel} "{titleName}"
            </h3>
            <p className="mt-1 text-xs text-slate-500 dark:text-slate-400">
              {transactionsCount > 0
                ? `${transactionsCount} transaksi tercatat menggunakan ${typeLabel.toLowerCase()} ini.`
                : `Tidak ada transaksi yang terkait dengan ${typeLabel.toLowerCase()} ini.`}
            </p>
          </div>
        </div>

        <div className="mt-5 space-y-4">
          {/* Main Action Selection */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-700 dark:text-slate-200 block">
              Pilih tindakan yang diinginkan:
            </label>

            {/* Option A: Archive */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                action === 'archive'
                  ? 'border-emerald-500 bg-emerald-50/50 dark:bg-emerald-950/30 ring-1 ring-emerald-500'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <input
                type="radio"
                name="delete_action"
                checked={action === 'archive'}
                onChange={() => setAction('archive')}
                className="mt-0.5 text-emerald-600"
              />
              <div>
                <div className="flex items-center gap-1.5 font-medium text-sm text-slate-900 dark:text-white">
                  <Archive className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                  <span>Arsipkan (Disarankan)</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Menyembunyikan {typeLabel.toLowerCase()} dari pilihan transaksi baru, namun semua riwayat transaksi masa lalu tetap utuh.
                </p>
              </div>
            </label>

            {/* Option B: Delete and Reassign */}
            <label
              className={`flex items-start gap-3 p-3.5 rounded-xl border cursor-pointer transition ${
                action === 'delete_and_reassign'
                  ? 'border-rose-500 bg-rose-50/50 dark:bg-rose-950/30 ring-1 ring-rose-500'
                  : 'border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <input
                type="radio"
                name="delete_action"
                checked={action === 'delete_and_reassign'}
                onChange={() => setAction('delete_and_reassign')}
                className="mt-0.5 text-rose-600"
              />
              <div>
                <div className="flex items-center gap-1.5 font-medium text-sm text-slate-900 dark:text-white">
                  <Trash2 className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                  <span>Hapus Permanen & Pindahkan Transaksi</span>
                </div>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-0.5">
                  Menghapus {typeLabel.toLowerCase()} secara permanen dan memindahkan transaksinya ke kategori lain.
                </p>
              </div>
            </label>
          </div>

          {/* If Delete & Reassign is selected for Category */}
          {isCategory && action === 'delete_and_reassign' && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700 space-y-3">
              {transactionsCount > 0 && (
                <div>
                  <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                    Pindahkan {transactionsCount} transaksi ke kategori:
                  </label>
                  {otherCategories.length > 0 ? (
                    <select
                      value={targetCategoryId}
                      onChange={(e) => setTargetCategoryId(e.target.value)}
                      className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-[44px]"
                    >
                      {otherCategories.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.ikon} {c.nama}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <p className="text-xs text-amber-600">
                      Tidak ada kategori lain untuk menampung transaksi. Transaksi terkait akan ikut terhapus.
                    </p>
                  )}
                </div>
              )}

              {/* Child Subcategories options */}
              {childSubcategories.length > 0 && (
                <div className="pt-2 border-t border-slate-200 dark:border-slate-700">
                  <label className="block text-xs font-semibold text-slate-700 dark:text-slate-300 mb-1.5">
                    Tindakan untuk {childSubcategories.length} subkategori di dalamnya:
                  </label>
                  <div className="space-y-1.5 text-xs text-slate-700 dark:text-slate-300">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="subcategories_action"
                        value="archive"
                        checked={subcategoriesAction === 'archive'}
                        onChange={() => setSubcategoriesAction('archive')}
                      />
                      <span>Arsipkan semua subkategori</span>
                    </label>

                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="radio"
                        name="subcategories_action"
                        value="delete"
                        checked={subcategoriesAction === 'delete'}
                        onChange={() => setSubcategoriesAction('delete')}
                      />
                      <span>Hapus permanen semua subkategori</span>
                    </label>

                    {otherCategories.length > 0 && (
                      <div className="space-y-1.5">
                        <label className="flex items-center gap-2 cursor-pointer">
                          <input
                            type="radio"
                            name="subcategories_action"
                            value="move_to_category"
                            checked={subcategoriesAction === 'move_to_category'}
                            onChange={() => setSubcategoriesAction('move_to_category')}
                          />
                          <span>Pindahkan semua subkategori ke kategori lain</span>
                        </label>
                        {subcategoriesAction === 'move_to_category' && (
                          <div className="pl-5 pt-1">
                            <select
                              value={targetCatForSubs}
                              onChange={(e) => setTargetCatForSubs(e.target.value)}
                              className="w-full text-xs px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200"
                            >
                              {otherCategories.map((c) => (
                                <option key={c.id} value={c.id}>
                                  {c.ikon} {c.nama}
                                </option>
                              ))}
                            </select>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* If Delete & Reassign is selected for Subcategory */}
          {isSubcategory && action === 'delete_and_reassign' && transactionsCount > 0 && (
            <div className="p-3.5 rounded-xl bg-slate-50 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-700">
              <label className="block text-xs font-medium text-slate-700 dark:text-slate-300 mb-1">
                Pindahkan {transactionsCount} transaksi ke subkategori lain:
              </label>
              <select
                value={targetSubcategoryId || ''}
                onChange={(e) => setTargetSubcategoryId(e.target.value || null)}
                className="w-full text-sm px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-600 bg-white dark:bg-slate-900 text-slate-800 dark:text-slate-200 min-h-[44px]"
              >
                <option value="">(Tanpa subkategori - hanya kategori induk)</option>
                {otherSubcategories.map((s) => (
                  <option key={s.id} value={s.id}>
                    {s.ikon} {s.nama}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Buttons */}
        <div className="mt-6 flex items-center justify-end gap-3 pt-3 border-t border-slate-100 dark:border-slate-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800 font-medium text-sm transition min-h-[44px]"
          >
            Batal
          </button>
          <button
            type="button"
            onClick={handleConfirm}
            className={`px-4 py-2.5 rounded-xl font-medium text-sm text-white shadow-sm transition min-h-[44px] flex items-center gap-1.5 ${
              action === 'archive'
                ? 'bg-emerald-600 hover:bg-emerald-700'
                : 'bg-rose-600 hover:bg-rose-700'
            }`}
          >
            <span>Lanjutkan</span>
            <ArrowRight className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
};
