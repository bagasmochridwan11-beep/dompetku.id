import React, { useState } from 'react';
import { useFinance } from '../../context/FinanceContext';
import { Category, Subcategory, TransactionType } from '../../types/finance';
import { CategoryModal } from './CategoryModal';
import { SubcategoryModal } from './SubcategoryModal';
import { CategoryDeleteModal } from './CategoryDeleteModal';
import {
  Plus,
  ChevronDown,
  ChevronUp,
  ArrowUp,
  ArrowDown,
  Edit2,
  Trash2,
  Archive,
  RotateCcw,
  Layers,
  FolderPlus,
} from 'lucide-react';

export const CategoryManagementView: React.FC = () => {
  const {
    categories,
    subcategories,
    addCategory,
    updateCategory,
    reorderCategory,
    deleteCategory,
    addSubcategory,
    updateSubcategory,
    reorderSubcategory,
    deleteSubcategory,
    getTransactionsCountForCategory,
    getTransactionsCountForSubcategory,
  } = useFinance();

  const [activeTab, setActiveTab] = useState<'pemasukan' | 'pengeluaran'>('pengeluaran');
  const [showArchived, setShowArchived] = useState(false);
  const [expandedCategories, setExpandedCategories] = useState<{ [catId: string]: boolean }>({});

  // Modals state
  const [isCatModalOpen, setIsCatModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);

  const [isSubModalOpen, setIsSubModalOpen] = useState(false);
  const [targetCatIdForNewSub, setTargetCatIdForNewSub] = useState<string>('');
  const [editingSubcategory, setEditingSubcategory] = useState<Subcategory | null>(null);

  // Deletion modal state
  const [deletingCat, setDeletingCat] = useState<Category | null>(null);
  const [deletingSub, setDeletingSub] = useState<Subcategory | null>(null);

  const toggleAccordion = (catId: string) => {
    setExpandedCategories((prev) => ({ ...prev, [catId]: !prev[catId] }));
  };

  const currentTabCategories = categories
    .filter((c) => c.tipe === activeTab && (showArchived ? c.diarsipkan : !c.diarsipkan))
    .sort((a, b) => a.urutan - b.urutan);

  // Unarchive category handler
  const handleUnarchiveCategory = (catId: string) => {
    updateCategory(catId, { diarsipkan: false });
  };

  // Unarchive subcategory handler
  const handleUnarchiveSubcategory = (subId: string) => {
    updateSubcategory(subId, { diarsipkan: false });
  };

  return (
    <div className="space-y-6 pb-24 md:pb-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-slate-900 dark:text-white">
            Kelola Kategori & Subkategori
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 dark:text-slate-400 mt-0.5">
            Atur hierarki kategori pemasukan dan pengeluaran 2 tingkat sesuai kebutuhan Anda
          </p>
        </div>

        <button
          type="button"
          onClick={() => {
            setEditingCategory(null);
            setIsCatModalOpen(true);
          }}
          className="flex items-center gap-2 px-4 py-2.5 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-semibold text-sm shadow-sm transition active:scale-95 self-start sm:self-auto min-h-[44px]"
        >
          <Plus className="w-4 h-4" />
          <span>Tambah Kategori {activeTab === 'pengeluaran' ? 'Pengeluaran' : 'Pemasukan'}</span>
        </button>
      </div>

      {/* Tabs: Pengeluaran | Pemasukan & Arsip Toggle */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-2xl self-start">
          <button
            type="button"
            onClick={() => setActiveTab('pengeluaran')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition min-h-[40px] ${
              activeTab === 'pengeluaran'
                ? 'bg-white dark:bg-slate-700 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pengeluaran ({categories.filter((c) => c.tipe === 'pengeluaran' && !c.diarsipkan).length})
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pemasukan')}
            className={`px-4 py-2 text-xs sm:text-sm font-semibold rounded-xl transition min-h-[40px] ${
              activeTab === 'pemasukan'
                ? 'bg-white dark:bg-slate-700 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900'
            }`}
          >
            Pemasukan ({categories.filter((c) => c.tipe === 'pemasukan' && !c.diarsipkan).length})
          </button>
        </div>

        <button
          type="button"
          onClick={() => setShowArchived(!showArchived)}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold transition min-h-[40px] ${
            showArchived
              ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/60 dark:text-amber-300'
              : 'text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'
          }`}
        >
          <Archive className="w-3.5 h-3.5" />
          <span>{showArchived ? 'Sembunyikan Arsip' : 'Lihat Kategori Diarsipkan'}</span>
        </button>
      </div>

      {/* Categories Accordion List */}
      {currentTabCategories.length === 0 ? (
        <div className="py-16 text-center bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl p-6">
          <Layers className="w-10 h-10 text-slate-300 dark:text-slate-600 mx-auto mb-2" />
          <h3 className="text-base font-bold text-slate-800 dark:text-slate-200">
            {showArchived ? 'Tidak Ada Kategori Diarsipkan' : 'Belum Ada Kategori'}
          </h3>
          <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-sm mx-auto">
            {showArchived
              ? 'Kategori yang Anda arsipkan akan muncul di sini agar riwayat tetap aman.'
              : 'Mulai dengan menambahkan kategori baru untuk mengatur keuangan Anda.'}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {currentTabCategories.map((cat, index) => {
            const isExpanded = !!expandedCategories[cat.id];
            const childSubs = subcategories
              .filter((s) => s.kategoriId === cat.id && (showArchived ? s.diarsipkan : !s.diarsipkan))
              .sort((a, b) => a.urutan - b.urutan);

            const txCount = getTransactionsCountForCategory(cat.id);

            return (
              <div
                key={cat.id}
                className="bg-white dark:bg-slate-900 border border-slate-200/80 dark:border-slate-800 rounded-3xl shadow-xs overflow-hidden"
              >
                {/* Category Header Row */}
                <div className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  {/* Left: Icon, Name & Count */}
                  <div
                    className="flex items-center gap-3.5 cursor-pointer select-none"
                    onClick={() => toggleAccordion(cat.id)}
                  >
                    <div
                      className="w-11 h-11 rounded-2xl flex items-center justify-center text-xl shrink-0 shadow-xs"
                      style={{ backgroundColor: `${cat.warna}25`, color: cat.warna }}
                    >
                      <span>{cat.ikon}</span>
                    </div>

                    <div>
                      <div className="flex items-center gap-2">
                        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                          {cat.nama}
                        </h3>
                        <span
                          className="w-3 h-3 rounded-full shrink-0"
                          style={{ backgroundColor: cat.warna }}
                          title={`Warna: ${cat.warna}`}
                        />
                      </div>
                      <p className="text-xs text-slate-400 mt-0.5">
                        {childSubs.length} subkategori · {txCount} transaksi
                      </p>
                    </div>
                  </div>

                  {/* Right Actions: Reorder, Edit, Add Sub, Delete */}
                  <div className="flex items-center gap-1 sm:gap-1.5 self-end sm:self-auto flex-wrap">
                    {!showArchived && (
                      <>
                        {/* Order Up */}
                        <button
                          type="button"
                          onClick={() => reorderCategory(cat.id, 'up')}
                          disabled={index === 0}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Geser Naik"
                        >
                          <ArrowUp className="w-4 h-4" />
                        </button>
                        {/* Order Down */}
                        <button
                          type="button"
                          onClick={() => reorderCategory(cat.id, 'down')}
                          disabled={index === currentTabCategories.length - 1}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-30 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Geser Turun"
                        >
                          <ArrowDown className="w-4 h-4" />
                        </button>

                        {/* + Subcategory Button */}
                        <button
                          type="button"
                          onClick={() => {
                            setTargetCatIdForNewSub(cat.id);
                            setEditingSubcategory(null);
                            setIsSubModalOpen(true);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-200 transition min-h-[40px]"
                        >
                          <FolderPlus className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                          <span>+ Subkategori</span>
                        </button>

                        {/* Edit Category */}
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCategory(cat);
                            setIsCatModalOpen(true);
                          }}
                          className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Ubah Kategori"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>

                        {/* Delete / Archive Category */}
                        <button
                          type="button"
                          onClick={() => setDeletingCat(cat)}
                          className="p-2 rounded-xl text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                          title="Hapus / Arsipkan Kategori"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </>
                    )}

                    {showArchived && (
                      <button
                        type="button"
                        onClick={() => handleUnarchiveCategory(cat.id)}
                        className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 text-xs font-semibold hover:bg-emerald-100 min-h-[40px]"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                        <span>Pulihkan</span>
                      </button>
                    )}

                    {/* Accordion toggle button */}
                    <button
                      type="button"
                      onClick={() => toggleAccordion(cat.id)}
                      className="p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition min-h-[40px] min-w-[40px] flex items-center justify-center"
                    >
                      {isExpanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* Subcategories Accordion Content */}
                {isExpanded && (
                  <div className="border-t border-slate-100 dark:border-slate-800 bg-slate-50/60 dark:bg-slate-850 p-4 space-y-2.5">
                    <div className="flex items-center justify-between px-1">
                      <span className="text-xs font-bold text-slate-600 dark:text-slate-400">
                        Daftar Subkategori: {cat.nama}
                      </span>
                      {!showArchived && (
                        <button
                          type="button"
                          onClick={() => {
                            setTargetCatIdForNewSub(cat.id);
                            setEditingSubcategory(null);
                            setIsSubModalOpen(true);
                          }}
                          className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline flex items-center gap-1"
                        >
                          <Plus className="w-3 h-3" /> Tambah Subkategori
                        </button>
                      )}
                    </div>

                    {childSubs.length === 0 ? (
                      <p className="text-xs text-slate-400 italic py-2 px-1">
                        Belum ada subkategori pada kategori ini. Transaksi dapat dicatat langsung menggunakan kategori utama.
                      </p>
                    ) : (
                      <div className="divide-y divide-slate-200/60 dark:divide-slate-800">
                        {childSubs.map((sub, sIdx) => {
                          const subTxCount = getTransactionsCountForSubcategory(sub.id);

                          return (
                            <div
                              key={sub.id}
                              className="py-2.5 px-2 flex items-center justify-between gap-3 hover:bg-white/60 dark:hover:bg-slate-800/60 rounded-xl transition"
                            >
                              <div className="flex items-center gap-2.5 min-w-0">
                                <span className="text-base">{sub.ikon}</span>
                                <div>
                                  <div className="flex items-center gap-1.5">
                                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                                      {sub.nama}
                                    </span>
                                    <span
                                      className="w-2.5 h-2.5 rounded-full"
                                      style={{ backgroundColor: sub.warna }}
                                      title={`Warna: ${sub.warna}`}
                                    />
                                  </div>
                                  <span className="text-[11px] text-slate-400">
                                    {subTxCount} transaksi
                                  </span>
                                </div>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                {!showArchived ? (
                                  <>
                                    <button
                                      type="button"
                                      onClick={() => reorderSubcategory(sub.id, 'up')}
                                      disabled={sIdx === 0}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center"
                                      title="Geser Naik"
                                    >
                                      <ArrowUp className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => reorderSubcategory(sub.id, 'down')}
                                      disabled={sIdx === childSubs.length - 1}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 disabled:opacity-30 min-h-[36px] min-w-[36px] flex items-center justify-center"
                                      title="Geser Turun"
                                    >
                                      <ArrowDown className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => {
                                        setEditingSubcategory(sub);
                                        setTargetCatIdForNewSub(sub.kategoriId);
                                        setIsSubModalOpen(true);
                                      }}
                                      className="p-1.5 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 min-h-[36px] min-w-[36px] flex items-center justify-center"
                                      title="Ubah Subkategori"
                                    >
                                      <Edit2 className="w-3.5 h-3.5" />
                                    </button>
                                    <button
                                      type="button"
                                      onClick={() => setDeletingSub(sub)}
                                      className="p-1.5 text-slate-400 hover:text-rose-600 dark:hover:text-rose-400 min-h-[36px] min-w-[36px] flex items-center justify-center"
                                      title="Hapus / Arsipkan Subkategori"
                                    >
                                      <Trash2 className="w-3.5 h-3.5" />
                                    </button>
                                  </>
                                ) : (
                                  <button
                                    type="button"
                                    onClick={() => handleUnarchiveSubcategory(sub.id)}
                                    className="p-1.5 text-emerald-600 hover:text-emerald-700 text-xs font-semibold flex items-center gap-1"
                                  >
                                    <RotateCcw className="w-3 h-3" />
                                    <span>Pulihkan</span>
                                  </button>
                                )}
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* Category Modal (Add / Edit) */}
      <CategoryModal
        isOpen={isCatModalOpen}
        onClose={() => setIsCatModalOpen(false)}
        initialData={editingCategory}
        defaultType={activeTab}
        onSave={(data) => {
          if (editingCategory) {
            return updateCategory(editingCategory.id, data);
          } else {
            return addCategory(data);
          }
        }}
      />

      {/* Subcategory Modal (Add / Edit) */}
      <SubcategoryModal
        isOpen={isSubModalOpen}
        onClose={() => setIsSubModalOpen(false)}
        categories={categories}
        defaultCategoryId={targetCatIdForNewSub}
        initialData={editingSubcategory}
        onSave={(data) => {
          if (editingSubcategory) {
            return updateSubcategory(editingSubcategory.id, data);
          } else {
            return addSubcategory(data);
          }
        }}
      />

      {/* Delete / Archive Category Dialog with full options */}
      <CategoryDeleteModal
        isOpen={!!deletingCat}
        onClose={() => setDeletingCat(null)}
        targetCategory={deletingCat || undefined}
        categories={categories}
        subcategories={subcategories}
        transactionsCount={deletingCat ? getTransactionsCountForCategory(deletingCat.id) : 0}
        onConfirmCategory={(options) => {
          if (deletingCat) {
            deleteCategory({
              categoryId: deletingCat.id,
              ...options,
            });
          }
        }}
        onConfirmSubcategory={() => {}}
      />

      {/* Delete / Archive Subcategory Dialog */}
      <CategoryDeleteModal
        isOpen={!!deletingSub}
        onClose={() => setDeletingSub(null)}
        targetSubcategory={deletingSub || undefined}
        categories={categories}
        subcategories={subcategories}
        transactionsCount={deletingSub ? getTransactionsCountForSubcategory(deletingSub.id) : 0}
        onConfirmCategory={() => {}}
        onConfirmSubcategory={(options) => {
          if (deletingSub) {
            deleteSubcategory({
              subcategoryId: deletingSub.id,
              ...options,
            });
          }
        }}
      />
    </div>
  );
};
