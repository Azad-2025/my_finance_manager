import React, { useState, useMemo } from 'react';
import {
  TrendingUp,
  Plus,
  Download,
  Filter,
  DollarSign,
  Calendar,
  Trash2,
  Edit2,
  ArrowUpRight,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Transaction } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';

interface IncomeViewProps {
  onOpenAddIncome: () => void;
  onEditTransaction: (tx: Transaction) => void;
}

export const IncomeView: React.FC<IncomeViewProps> = ({
  onOpenAddIncome,
  onEditTransaction,
}) => {
  const { transactions, categories, deleteTransaction, exportToCSV } = useFinance();
  const { t, isBn } = useLanguage();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  const incomeTransactions = useMemo(() => {
    return transactions.filter((t) => t.type === 'income');
  }, [transactions]);

  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    incomeTransactions.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [incomeTransactions]);

  const filteredList = useMemo(() => {
    return incomeTransactions.filter((t) => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;
      return true;
    });
  }, [incomeTransactions, selectedCategory, selectedMonth]);

  const totalFilteredIncome = useMemo(() => {
    return filteredList.reduce((acc, t) => acc + Number(t.amount), 0);
  }, [filteredList]);

  // Income sources summary
  const incomeCategorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    incomeTransactions.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [incomeTransactions]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
            <span>{isBn ? 'আয় ও রাজস্ব ব্যবস্থাপনা' : 'Income Management'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {isBn
              ? 'বেতন, ফ্রিল্যান্সিং, ব্যবসা, বোনাস ও উপহারের আয়ের বিস্তারিত হিসাব'
              : 'Track salary, freelance earnings, business revenue, and gifts'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => exportToCSV('income')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{t('exportCSV')}</span>
          </button>
          <button
            onClick={onOpenAddIncome}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'আয় যুক্ত করুন' : 'Add Income'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">
            {isBn ? 'ফিল্টারকৃত মোট আয়' : 'Filtered Total Income'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(totalFilteredIncome)}
          </div>
          <span className="text-[10px] text-slate-400">
            {isBn ? `${filteredList.length}টি আয়ের এন্ট্রি` : `${filteredList.length} income entries`}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">
            {isBn ? 'প্রধান আয়ের উৎস' : 'Primary Revenue Source'}
          </span>
          <div className="text-base font-bold text-slate-900 dark:text-white truncate mt-1">
            {incomeCategorySummary[0] ? incomeCategorySummary[0][0] : (isBn ? 'কোনোটি নয়' : 'None')}
          </div>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
            {incomeCategorySummary[0] ? formatBDT(incomeCategorySummary[0][1]) : '৳0'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">
            {isBn ? 'সর্বমোট সর্বকালীন আয়' : 'All-Time Cumulative Income'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {formatBDT(incomeTransactions.reduce((acc, t) => acc + Number(t.amount), 0))}
          </div>
          <span className="text-[10px] text-slate-400">
            {isBn ? `${incomeTransactions.length}টি মোট রেকর্ড` : `${incomeTransactions.length} total income records`}
          </span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-emerald-500" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
            {isBn ? 'ফিল্টার করুন:' : 'Filter By:'}
          </span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">{isBn ? 'সকল উৎস' : 'All Sources'}</option>
            {categories
              .filter((c) => c.type === 'income')
              .map((c) => (
                <option key={c.id} value={c.name}>
                  {c.name}
                </option>
              ))}
          </select>

          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">{isBn ? 'সকল মাস' : 'All Months'}</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Income Records List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredList.map((tx) => (
          <div
            key={tx.id}
            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                <ArrowUpRight className="w-5 h-5" />
              </div>

              <div className="min-w-0">
                <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                  {tx.description}
                </div>
                <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                  <span className="font-semibold text-emerald-600 dark:text-emerald-400">{tx.category}</span>
                  <span>·</span>
                  <span>{tx.payment_method}</span>
                  {tx.account_name && (
                    <>
                      <span>·</span>
                      <span>{isBn ? 'জমা হয়েছে:' : 'Deposited to:'} {tx.account_name}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatDate(tx.date)}</span>
                </div>
                {tx.notes && <p className="text-[11px] text-slate-400 italic mt-0.5">"{tx.notes}"</p>}
              </div>
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                +{formatBDT(tx.amount)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditTransaction(tx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                  title={isBn ? 'সম্পাদনা করুন' : 'Edit'}
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingId(tx.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                  title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400">
            {isBn ? 'কোনো আয়ের রেকর্ড পাওয়া যায়নি।' : 'No income records found under this filter.'}
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isBn ? 'আয়ের রেকর্ড মুছে ফেলবেন?' : 'Delete Income Entry?'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn
                ? 'এটি একাউন্ট ব্যালেন্স থেকে এই আয়ের পরিমাণ বিয়োগ করবে।'
                : 'This will deduct the income amount from your account balance.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={async () => {
                  await deleteTransaction(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
