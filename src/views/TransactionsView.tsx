import React, { useState, useMemo } from 'react';
import {
  Search,
  Filter,
  ArrowUpDown,
  Download,
  Plus,
  Trash2,
  Edit2,
  Calendar,
  Building,
  CreditCard,
  CheckCircle,
  Clock,
  ArrowUpRight,
  ArrowDownRight,
  AlertTriangle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Transaction, TransactionType, PaymentMethod } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';

interface TransactionsViewProps {
  onOpenAddTransaction: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const TransactionsView: React.FC<TransactionsViewProps> = ({
  onOpenAddTransaction,
  onEditTransaction,
}) => {
  const { transactions, categories, accounts, deleteTransaction, exportToCSV } = useFinance();
  const { t, isBn } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | TransactionType>('all');
  const [categoryFilter, setCategoryFilter] = useState<string>('all');
  const [paymentFilter, setPaymentFilter] = useState<string>('all');
  const [sortOrder, setSortOrder] = useState<'newest' | 'oldest'>('newest');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filtered and sorted transactions
  const filteredList = useMemo(() => {
    return transactions
      .filter((t) => {
        // Type filter
        if (typeFilter !== 'all' && t.type !== typeFilter) return false;
        // Category filter
        if (categoryFilter !== 'all' && t.category !== categoryFilter) return false;
        // Payment filter
        if (paymentFilter !== 'all' && t.payment_method !== paymentFilter) return false;
        // Search query
        if (searchQuery.trim()) {
          const q = searchQuery.toLowerCase();
          const matchDesc = t.description?.toLowerCase().includes(q);
          const matchCat = t.category?.toLowerCase().includes(q);
          const matchNotes = t.notes?.toLowerCase().includes(q);
          const matchAcc = t.account_name?.toLowerCase().includes(q);
          const matchProject = t.project_name?.toLowerCase().includes(q);
          if (!matchDesc && !matchCat && !matchNotes && !matchAcc && !matchProject) {
            return false;
          }
        }
        return true;
      })
      .sort((a, b) => {
        const timeA = new Date(a.date).getTime();
        const timeB = new Date(b.date).getTime();
        return sortOrder === 'newest' ? timeB - timeA : timeA - timeB;
      });
  }, [transactions, typeFilter, categoryFilter, paymentFilter, searchQuery, sortOrder]);

  const confirmDelete = async () => {
    if (deletingId) {
      await deleteTransaction(deletingId);
      setDeletingId(null);
    }
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header with Title & Action Controls */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white">
            {isBn ? 'সার্বজনীন লেনদেন লেজার' : 'Universal Transaction Ledger'}
          </h2>
          <p className="text-xs text-slate-500">
            {isBn
              ? `${filteredList.length}টি লেনদেন পাওয়া গেছে`
              : `${filteredList.length} total entries matching filters`}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => exportToCSV('transactions')}
            className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCSV')}</span>
          </button>
          <button
            onClick={onOpenAddTransaction}
            className="flex items-center justify-center gap-1.5 flex-1 sm:flex-none px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{t('addTransaction')}</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        {/* Search input */}
        <div className="relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder={isBn ? 'আইটেমের নাম, ক্যাটাগরি, একাউন্ট বা নোট দিয়ে খুঁজুন...' : 'Search transactions by item name, category, account, project or notes...'}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>

        {/* Filter Selectors Row */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
          {/* Type Filter */}
          <div>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value as any)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">{isBn ? 'সকল ধরন' : 'All Types'}</option>
              <option value="personal_expense">{t('type_personal_expense')}</option>
              <option value="office_expense">{t('type_office_expense')}</option>
              <option value="income">{t('type_income')}</option>
            </select>
          </div>

          {/* Category Filter */}
          <div>
            <select
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">{t('allCategories')}</option>
              {categories.map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>

          {/* Payment Method Filter */}
          <div>
            <select
              value={paymentFilter}
              onChange={(e) => setPaymentFilter(e.target.value)}
              className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium focus:outline-none focus:ring-1 focus:ring-emerald-500"
            >
              <option value="all">{t('allMethods')}</option>
              <option value="Cash">{isBn ? 'নগদ (Cash)' : 'Cash'}</option>
              <option value="bKash">{isBn ? 'বিকাশ (bKash)' : 'bKash'}</option>
              <option value="Nagad">{isBn ? 'নগদ (Nagad)' : 'Nagad'}</option>
              <option value="Rocket">Rocket</option>
              <option value="Bank Transfer">{isBn ? 'ব্যাংক একাউন্ট' : 'Bank Transfer'}</option>
              <option value="Debit Card">{isBn ? 'ডেবিট কার্ড' : 'Debit Card'}</option>
              <option value="Credit Card">{isBn ? 'ক্রেডিট কার্ড' : 'Credit Card'}</option>
              <option value="Other">{isBn ? 'অন্যান্য' : 'Other'}</option>
            </select>
          </div>

          {/* Sort Order */}
          <div>
            <button
              onClick={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
              className="w-full flex items-center justify-between px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-700 dark:text-slate-300 font-medium hover:bg-slate-100 dark:hover:bg-slate-800 transition"
            >
              <span>{sortOrder === 'newest' ? (isBn ? 'নতুনগুলো আগে' : 'Newest First') : (isBn ? 'পুরাতনগুলো আগে' : 'Oldest First')}</span>
              <ArrowUpDown className="w-3.5 h-3.5 text-slate-400" />
            </button>
          </div>
        </div>
      </div>

      {/* Transaction Records List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden">
        {filteredList.length === 0 ? (
          <div className="p-12 text-center space-y-2">
            <p className="text-sm font-semibold text-slate-700 dark:text-slate-300">
              {isBn ? 'কোনো লেনদেনের রেকর্ড পাওয়া যায়নি।' : 'No transactions match your search or filters.'}
            </p>
            <p className="text-xs text-slate-500">
              {isBn ? 'ফিল্টার পরিবর্তন করে চেষ্টা করুন অথবা নতুন লেনদেন যুক্ত করুন।' : 'Try adjusting the filters or click Add Transaction to record a new entry.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800">
            {filteredList.map((tx) => {
              const isIncome = tx.type === 'income';
              const isOffice = tx.type === 'office_expense';

              return (
                <div
                  key={tx.id}
                  className="p-4 hover:bg-slate-50/80 dark:hover:bg-slate-800/40 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3 group"
                >
                  <div className="flex items-start sm:items-center gap-3 min-w-0">
                    <div
                      className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 mt-0.5 sm:mt-0 ${
                        isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : isOffice
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-5 h-5" />
                      ) : (
                        <ArrowDownRight className="w-5 h-5" />
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {tx.description}
                        </span>
                        {isOffice && tx.reimbursement_status && (
                          <span
                            className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                              tx.reimbursement_status === 'Fully Reimbursed'
                                ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                                : tx.reimbursement_status === 'Partially Reimbursed'
                                ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                                : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                            }`}
                          >
                            {tx.reimbursement_status}
                          </span>
                        )}
                      </div>

                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <span className="font-medium text-slate-700 dark:text-slate-300">{tx.category}</span>
                        <span>·</span>
                        <span>{tx.payment_method}</span>
                        {tx.account_name && (
                          <>
                            <span>·</span>
                            <span>{tx.account_name}</span>
                          </>
                        )}
                        {tx.project_name && (
                          <>
                            <span>·</span>
                            <span className="text-amber-600 dark:text-amber-400 font-medium">
                              Project: {tx.project_name}
                            </span>
                          </>
                        )}
                        <span>·</span>
                        <span>{formatDate(tx.date)}</span>
                      </div>

                      {tx.notes && (
                        <p className="text-[11px] text-slate-400 mt-1 line-clamp-1 italic">
                          "{tx.notes}"
                        </p>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center justify-between sm:justify-end gap-4 shrink-0 pl-12 sm:pl-0">
                    <div className="text-left sm:text-right">
                      <div
                        className={`text-sm sm:text-base font-bold font-mono tabular-nums ${
                          isIncome
                            ? 'text-emerald-600 dark:text-emerald-400'
                            : isOffice
                            ? 'text-amber-600 dark:text-amber-400'
                            : 'text-rose-600 dark:text-rose-400'
                        }`}
                      >
                        {isIncome ? '+' : '-'}{formatBDT(tx.amount)}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        ID: {tx.id.slice(-6)}
                      </div>
                    </div>

                    <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition">
                      <button
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                        title="Edit transaction"
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        onClick={() => setDeletingId(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                        title="Delete transaction"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Confirmation Dialog for Deletion */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isBn ? 'লেনদেন মুছে ফেলবেন?' : 'Delete Transaction?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBn
                    ? 'এটি একাউন্ট ব্যালেন্স স্বয়ংক্রিয়ভাবে আগের অবস্থায় ফিরিয়ে নেবে।'
                    : 'This will revert account balance changes automatically.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={confirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
              >
                {isBn ? 'মুছে ফেলা নিশ্চিত করুন' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
