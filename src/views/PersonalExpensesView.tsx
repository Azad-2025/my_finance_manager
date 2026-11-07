import React, { useState, useMemo } from 'react';
import {
  ShoppingBag,
  Plus,
  Filter,
  Download,
  Calendar,
  Trash2,
  Edit2,
  Tags,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';

interface PersonalExpensesViewProps {
  onOpenAddExpense: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenCategoryModal: () => void;
}

export const PersonalExpensesView: React.FC<PersonalExpensesViewProps> = ({
  onOpenAddExpense,
  onEditTransaction,
  onOpenCategoryModal,
}) => {
  const { transactions, categories, deleteTransaction, exportToCSV } = useFinance();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter only personal expenses
  const personalExpenses = useMemo(() => {
    return transactions.filter((t) => t.type === 'personal_expense');
  }, [transactions]);

  // Distinct months available
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    personalExpenses.forEach((t) => {
      if (t.date && t.date.length >= 7) {
        set.add(t.date.substring(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [personalExpenses]);

  // Filtered personal expenses
  const filteredList = useMemo(() => {
    return personalExpenses.filter((t) => {
      if (selectedCategory !== 'all' && t.category !== selectedCategory) return false;
      if (selectedMonth !== 'all' && !t.date.startsWith(selectedMonth)) return false;
      return true;
    });
  }, [personalExpenses, selectedCategory, selectedMonth]);

  const totalFilteredAmount = useMemo(() => {
    return filteredList.reduce((acc, t) => acc + Number(t.amount), 0);
  }, [filteredList]);

  // Category summary for personal expenses
  const categorySummary = useMemo(() => {
    const map: Record<string, number> = {};
    personalExpenses.forEach((t) => {
      map[t.category] = (map[t.category] || 0) + Number(t.amount);
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [personalExpenses]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-rose-500" />
            <span>Personal Expenses</span>
          </h2>
          <p className="text-xs text-slate-500">
            Track daily living, food, commute, utilities, and lifestyle spending
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={onOpenCategoryModal}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            <Tags className="w-3.5 h-3.5" />
            <span>Categories</span>
          </button>
          <button
            onClick={() => exportToCSV('personal')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={onOpenAddExpense}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Personal Expense</span>
          </button>
        </div>
      </div>

      {/* Summary KPI Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Filtered Personal Total</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
            {formatBDT(totalFilteredAmount)}
          </div>
          <span className="text-[10px] text-slate-400">{filteredList.length} expense items</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Top Expense Category</span>
          <div className="text-base font-bold text-slate-900 dark:text-white truncate mt-1">
            {categorySummary[0] ? categorySummary[0][0] : 'None'}
          </div>
          <span className="text-[11px] text-slate-500 font-mono tabular-nums">
            {categorySummary[0] ? formatBDT(categorySummary[0][1]) : '৳0'}
          </span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">All-Time Personal Spending</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
            {formatBDT(personalExpenses.reduce((acc, t) => acc + Number(t.amount), 0))}
          </div>
          <span className="text-[10px] text-slate-400">{personalExpenses.length} all-time records</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-rose-500" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Filter By:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">All Categories</option>
            {categories
              .filter((c) => c.type === 'personal_expense')
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
            <option value="all">All Months</option>
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {m}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredList.map((tx) => (
          <div
            key={tx.id}
            className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
          >
            <div className="min-w-0">
              <div className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                {tx.description}
              </div>
              <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                <span className="font-medium text-rose-600 dark:text-rose-400">{tx.category}</span>
                <span>·</span>
                <span>{tx.payment_method}</span>
                {tx.account_name && (
                  <>
                    <span>·</span>
                    <span>{tx.account_name}</span>
                  </>
                )}
                <span>·</span>
                <span>{formatDate(tx.date)}</span>
              </div>
              {tx.notes && <p className="text-[11px] text-slate-400 italic mt-0.5">"{tx.notes}"</p>}
            </div>

            <div className="flex items-center gap-3 shrink-0">
              <span className="text-sm sm:text-base font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
                -{formatBDT(tx.amount)}
              </span>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => onEditTransaction(tx)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                >
                  <Edit2 className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setDeletingId(tx.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400">
            No personal expenses match the chosen filters.
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Expense Record?</h3>
            <p className="text-xs text-slate-500">This will restore the balance back to your account.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteTransaction(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold"
              >
                Delete
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
