import React, { useState, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  Download,
  Search,
  CheckCircle2,
  Clock,
  Phone,
  Calendar,
  AlertCircle,
  CreditCard,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Borrowing } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';

interface BorrowedMoneyViewProps {
  onOpenAddBorrowing: () => void;
  onOpenRepaymentModal: (borrowing: Borrowing) => void;
}

export const BorrowedMoneyView: React.FC<BorrowedMoneyViewProps> = ({
  onOpenAddBorrowing,
  onOpenRepaymentModal,
}) => {
  const { borrowings, borrowingRepayments, deleteBorrowing, exportToCSV } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Unpaid' | 'Partially Repaid' | 'Fully Repaid'>('all');
  const [selectedBorrowingHistory, setSelectedBorrowingHistory] = useState<Borrowing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Totals
  const { totalBorrowed, totalRepaid, remainingDebt } = useMemo(() => {
    let bor = 0;
    let rep = 0;
    borrowings.forEach((b) => {
      bor += Number(b.amount);
      rep += Number(b.repaid_amount || 0);
    });
    return {
      totalBorrowed: bor,
      totalRepaid: rep,
      remainingDebt: Math.max(0, bor - rep),
    };
  }, [borrowings]);

  // Filtered
  const filteredList = useMemo(() => {
    return borrowings.filter((b) => {
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.person_name.toLowerCase().includes(q);
        const matchPhone = b.phone_number?.toLowerCase().includes(q);
        const matchPurpose = b.purpose?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchPurpose) return false;
      }
      return true;
    });
  }, [borrowings, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-orange-500" />
            <span>Borrowed Money (Liabilities)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Track loans received from friends, family, or lenders & installment repayments
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => exportToCSV('borrowings')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={onOpenAddBorrowing}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Borrowing</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Borrowed (Gross)</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-orange-600 dark:text-orange-400 mt-1">
            {formatBDT(totalBorrowed)}
          </div>
          <span className="text-[10px] text-slate-400">Total debt principal taken</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Repaid to Date</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(totalRepaid)}
          </div>
          <span className="text-[10px] text-slate-400">Installments returned</span>
        </div>

        <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 shadow-xs">
          <span className="text-[11px] font-bold text-red-800 dark:text-red-300">Remaining Debt (Amount I Owe)</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-1">
            {formatBDT(remainingDebt)}
          </div>
          <span className="text-[10px] text-red-700/80 dark:text-red-400/80">Net current liability balance</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by person's name, phone or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          {(['all', 'Unpaid', 'Partially Repaid', 'Fully Repaid'] as const).map((st) => (
            <button
              key={st}
              onClick={() => setStatusFilter(st)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                statusFilter === st
                  ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              {st === 'all' ? 'All' : st}
            </button>
          ))}
        </div>
      </div>

      {/* List */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredList.map((b) => {
          const remaining = Math.max(0, b.amount - b.repaid_amount);
          const isFully = b.status === 'Fully Repaid';

          return (
            <div
              key={b.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {b.person_name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                      isFully
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : b.status === 'Partially Repaid'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                    }`}
                  >
                    {b.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                  {b.phone_number && (
                    <>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{b.phone_number}</span>
                      </span>
                      <span>·</span>
                    </>
                  )}
                  <span>Borrowed: {formatDate(b.borrowed_date)}</span>
                  {b.due_date && (
                    <>
                      <span>·</span>
                      <span className="text-red-600 dark:text-red-400 font-medium">
                        Due: {formatDate(b.due_date)}
                      </span>
                    </>
                  )}
                  {b.purpose && (
                    <>
                      <span>·</span>
                      <span>Purpose: {b.purpose}</span>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 max-w-md">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>
                      Repaid: <strong className="text-emerald-600 font-mono">{formatBDT(b.repaid_amount)}</strong>
                    </span>
                    <span>
                      Remaining: <strong className="text-red-600 font-mono">{formatBDT(remaining)}</strong>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (b.repaid_amount / b.amount) * 100)}%` }}
                    />
                  </div>
                </div>

                {b.notes && <p className="text-[11px] text-slate-400 italic mt-1.5">"{b.notes}"</p>}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-left sm:text-right">
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {formatBDT(b.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400">Total Borrowed</div>
                </div>

                {!isFully && remaining > 0 && (
                  <button
                    onClick={() => onOpenRepaymentModal(b)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Pay Repayment</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedBorrowingHistory(b)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  History
                </button>

                <button
                  onClick={() => setDeletingId(b.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                  title="Delete borrowing"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400">
            No borrowed money records found.
          </div>
        )}
      </div>

      {/* Repayments History Drawer/Modal */}
      {selectedBorrowingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Repayment History - {selectedBorrowingHistory.person_name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Total Loan: {formatBDT(selectedBorrowingHistory.amount)} · Remaining: {formatBDT(selectedBorrowingHistory.amount - selectedBorrowingHistory.repaid_amount)}
                </p>
              </div>
              <button
                onClick={() => setSelectedBorrowingHistory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {borrowingRepayments
                .filter((r) => r.borrowing_id === selectedBorrowingHistory.id)
                .map((r) => (
                  <div
                    key={r.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {r.payment_method}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDate(r.payment_date)} {r.notes && `· ${r.notes}`}
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      -{formatBDT(r.amount)}
                    </span>
                  </div>
                ))}

              {borrowingRepayments.filter((r) => r.borrowing_id === selectedBorrowingHistory.id).length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No repayments recorded yet for this borrowing.
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedBorrowingHistory(null)}
              className="w-full py-2 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300"
            >
              Close
            </button>
          </div>
        </div>
      )}

      {/* Delete Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Borrowing Record?</h3>
            <p className="text-xs text-slate-500">This will remove this loan liability and its installment history.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteBorrowing(deletingId);
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
