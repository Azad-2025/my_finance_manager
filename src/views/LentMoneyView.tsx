import React, { useState, useMemo } from 'react';
import {
  Send,
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
import { Lending } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';

interface LentMoneyViewProps {
  onOpenAddLending: () => void;
  onOpenCollectionModal: (lending: Lending) => void;
}

export const LentMoneyView: React.FC<LentMoneyViewProps> = ({
  onOpenAddLending,
  onOpenCollectionModal,
}) => {
  const { lendings, lendingCollections, deleteLending, exportToCSV } = useFinance();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Uncollected' | 'Partially Collected' | 'Fully Collected'>('all');
  const [selectedLendingHistory, setSelectedLendingHistory] = useState<Lending | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Totals
  const { totalLent, totalCollected, remainingReceivable } = useMemo(() => {
    let len = 0;
    let col = 0;
    lendings.forEach((l) => {
      len += Number(l.amount);
      col += Number(l.collected_amount || 0);
    });
    return {
      totalLent: len,
      totalCollected: col,
      remainingReceivable: Math.max(0, len - col),
    };
  }, [lendings]);

  // Filtered
  const filteredList = useMemo(() => {
    return lendings.filter((l) => {
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.person_name.toLowerCase().includes(q);
        const matchPhone = l.phone_number?.toLowerCase().includes(q);
        const matchPurpose = l.purpose?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchPurpose) return false;
      }
      return true;
    });
  }, [lendings, statusFilter, searchQuery]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-500" />
            <span>Lent Money (Receivables)</span>
          </h2>
          <p className="text-xs text-slate-500">
            Track loans given to colleagues, friends, and family & collection history
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => exportToCSV('lendings')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={onOpenAddLending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Record Lending</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Lent (Principal)</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
            {formatBDT(totalLent)}
          </div>
          <span className="text-[10px] text-slate-400">Total money lent out</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Collected Back</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(totalCollected)}
          </div>
          <span className="text-[10px] text-slate-400">Received back safely</span>
        </div>

        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300">Remaining Receivable (Owed to Me)</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
            {formatBDT(remainingReceivable)}
          </div>
          <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80">Active asset to be collected</span>
        </div>
      </div>

      {/* Search & Status Filters */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="relative flex-1">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by borrower's name, phone or purpose..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 dark:bg-slate-800 rounded-xl shrink-0">
          {(['all', 'Uncollected', 'Partially Collected', 'Fully Collected'] as const).map((st) => (
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
        {filteredList.map((l) => {
          const remaining = Math.max(0, l.amount - l.collected_amount);
          const isFully = l.status === 'Fully Collected';

          return (
            <div
              key={l.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-4"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-bold text-slate-900 dark:text-white truncate">
                    {l.person_name}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                      isFully
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : l.status === 'Partially Collected'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                    }`}
                  >
                    {l.status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                  {l.phone_number && (
                    <>
                      <span className="flex items-center gap-1">
                        <Phone className="w-3 h-3 text-slate-400" />
                        <span>{l.phone_number}</span>
                      </span>
                      <span>·</span>
                    </>
                  )}
                  <span>Lent On: {formatDate(l.lending_date)}</span>
                  {l.expected_return_date && (
                    <>
                      <span>·</span>
                      <span className="text-blue-600 dark:text-blue-400 font-medium">
                        Expected Return: {formatDate(l.expected_return_date)}
                      </span>
                    </>
                  )}
                  {l.purpose && (
                    <>
                      <span>·</span>
                      <span>Purpose: {l.purpose}</span>
                    </>
                  )}
                </div>

                {/* Progress bar */}
                <div className="mt-2.5 max-w-md">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>
                      Collected: <strong className="text-emerald-600 font-mono">{formatBDT(l.collected_amount)}</strong>
                    </span>
                    <span>
                      Remaining: <strong className="text-blue-600 font-mono">{formatBDT(remaining)}</strong>
                    </span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, (l.collected_amount / l.amount) * 100)}%` }}
                    />
                  </div>
                </div>

                {l.notes && <p className="text-[11px] text-slate-400 italic mt-1.5">"{l.notes}"</p>}
              </div>

              {/* Action buttons */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-left sm:text-right">
                  <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {formatBDT(l.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400">Total Lent</div>
                </div>

                {!isFully && remaining > 0 && (
                  <button
                    onClick={() => onOpenCollectionModal(l)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>Collect Money</span>
                  </button>
                )}

                <button
                  onClick={() => setSelectedLendingHistory(l)}
                  className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  History
                </button>

                <button
                  onClick={() => setDeletingId(l.id)}
                  className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                  title="Delete lending"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400">
            No lent money records found.
          </div>
        )}
      </div>

      {/* Collections History Drawer */}
      {selectedLendingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  Collection History - {selectedLendingHistory.person_name}
                </h3>
                <p className="text-[11px] text-slate-500">
                  Total Lent: {formatBDT(selectedLendingHistory.amount)} · Remaining: {formatBDT(selectedLendingHistory.amount - selectedLendingHistory.collected_amount)}
                </p>
              </div>
              <button
                onClick={() => setSelectedLendingHistory(null)}
                className="text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                ✕
              </button>
            </div>

            <div className="space-y-2 max-h-60 overflow-y-auto">
              {lendingCollections
                .filter((c) => c.lending_id === selectedLendingHistory.id)
                .map((c) => (
                  <div
                    key={c.id}
                    className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-100 dark:border-slate-800 flex justify-between items-center"
                  >
                    <div>
                      <div className="text-xs font-semibold text-slate-900 dark:text-white">
                        {c.payment_method}
                      </div>
                      <div className="text-[10px] text-slate-400">
                        {formatDate(c.collection_date)} {c.notes && `· ${c.notes}`}
                      </div>
                    </div>
                    <span className="text-xs font-bold font-mono text-emerald-600 dark:text-emerald-400 tabular-nums">
                      +{formatBDT(c.amount)}
                    </span>
                  </div>
                ))}

              {lendingCollections.filter((c) => c.lending_id === selectedLendingHistory.id).length === 0 && (
                <div className="p-4 text-center text-xs text-slate-400">
                  No repayment collections recorded yet for this loan.
                </div>
              )}
            </div>

            <button
              onClick={() => setSelectedLendingHistory(null)}
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
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Lending Record?</h3>
            <p className="text-xs text-slate-500">This will remove this receivable record and its collection history.</p>
            <div className="flex justify-end gap-2">
              <button
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  await deleteLending(deletingId);
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
