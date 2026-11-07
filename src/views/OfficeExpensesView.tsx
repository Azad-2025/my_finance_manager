import React, { useState, useMemo } from 'react';
import {
  Building2,
  Plus,
  Download,
  Filter,
  CheckCircle2,
  Clock,
  AlertCircle,
  FileCheck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Transaction } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';

interface OfficeExpensesViewProps {
  onOpenAddOfficeExpense: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenReimbursementModal: (tx: Transaction) => void;
}

export const OfficeExpensesView: React.FC<OfficeExpensesViewProps> = ({
  onOpenAddOfficeExpense,
  onEditTransaction,
  onOpenReimbursementModal,
}) => {
  const { transactions, deleteTransaction, exportToCSV } = useFinance();

  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Filter only office expenses
  const officeExpenses = useMemo(() => {
    return transactions.filter((t) => t.type === 'office_expense');
  }, [transactions]);

  // Unique projects
  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    officeExpenses.forEach((t) => {
      if (t.project_name) set.add(t.project_name);
    });
    return Array.from(set);
  }, [officeExpenses]);

  // Totals
  const { totalExpense, totalReimbursed, pendingReimbursement } = useMemo(() => {
    let exp = 0;
    let reimb = 0;
    officeExpenses.forEach((t) => {
      exp += Number(t.amount);
      reimb += Number(t.reimbursed_amount || 0);
    });
    return {
      totalExpense: exp,
      totalReimbursed: reimb,
      pendingReimbursement: Math.max(0, exp - reimb),
    };
  }, [officeExpenses]);

  // Filtered List
  const filteredList = useMemo(() => {
    return officeExpenses.filter((t) => {
      if (statusFilter !== 'all' && t.reimbursement_status !== statusFilter) return false;
      if (projectFilter !== 'all' && t.project_name !== projectFilter) return false;
      return true;
    });
  }, [officeExpenses, statusFilter, projectFilter]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Building2 className="w-5 h-5 text-amber-500" />
            <span>Office Expense Management</span>
          </h2>
          <p className="text-xs text-slate-500">
            Segregated office project expenses & reimbursement claims receivable
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => exportToCSV('office')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            onClick={onOpenAddOfficeExpense}
            className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>Add Office Expense</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Office Expenses</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {formatBDT(totalExpense)}
          </div>
          <span className="text-[10px] text-slate-400">{officeExpenses.length} total office receipts</span>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">Total Reimbursed</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(totalReimbursed)}
          </div>
          <span className="text-[10px] text-slate-400">Credited directly to your account</span>
        </div>

        <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-xs">
          <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">Pending Reimbursement Receivable</span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {formatBDT(pendingReimbursement)}
          </div>
          <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">Amount owed to you by office</span>
        </div>
      </div>

      {/* Filter Row */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-amber-500" />
          <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">Reimbursement Filter:</span>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium"
          >
            <option value="all">All Statuses</option>
            <option value="Not Submitted">Not Submitted</option>
            <option value="Submitted">Submitted</option>
            <option value="Partially Reimbursed">Partially Reimbursed</option>
            <option value="Fully Reimbursed">Fully Reimbursed</option>
          </select>

          {uniqueProjects.length > 0 && (
            <select
              value={projectFilter}
              onChange={(e) => setProjectFilter(e.target.value)}
              className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium"
            >
              <option value="all">All Projects</option>
              {uniqueProjects.map((p) => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          )}
        </div>
      </div>

      {/* Office Expenses Records */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredList.map((tx) => {
          const reimbursedAmount = Number(tx.reimbursed_amount || 0);
          const pendingThis = Math.max(0, tx.amount - reimbursedAmount);
          const isFully = tx.reimbursement_status === 'Fully Reimbursed';

          return (
            <div
              key={tx.id}
              className="p-4 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
            >
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                    {tx.description}
                  </span>
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md shrink-0 ${
                      isFully
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : tx.reimbursement_status === 'Partially Reimbursed'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300'
                    }`}
                  >
                    {tx.reimbursement_status}
                  </span>
                </div>

                <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                  <span className="font-medium text-amber-600 dark:text-amber-400">{tx.category}</span>
                  {tx.project_name && (
                    <>
                      <span>·</span>
                      <span className="font-semibold text-slate-700 dark:text-slate-300">
                        Project: {tx.project_name}
                      </span>
                    </>
                  )}
                  <span>·</span>
                  <span>{tx.payment_method}</span>
                  {tx.account_name && (
                    <>
                      <span>·</span>
                      <span>Paid From: {tx.account_name}</span>
                    </>
                  )}
                  <span>·</span>
                  <span>{formatDate(tx.date)}</span>
                </div>

                {/* Reimbursement progress detail */}
                <div className="mt-2 flex items-center gap-3 text-xs">
                  <span className="text-slate-500">
                    Reimbursed: <strong className="text-emerald-600 font-mono tabular-nums">{formatBDT(reimbursedAmount)}</strong>
                  </span>
                  <span className="text-slate-400">|</span>
                  <span className="text-slate-500">
                    Pending Claim: <strong className="text-amber-600 font-mono tabular-nums">{formatBDT(pendingThis)}</strong>
                  </span>
                </div>

                {tx.notes && <p className="text-[11px] text-slate-400 italic mt-1">"{tx.notes}"</p>}
              </div>

              {/* Actions & Amount */}
              <div className="flex items-center justify-between sm:justify-end gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-left sm:text-right">
                  <div className="text-sm sm:text-base font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
                    {formatBDT(tx.amount)}
                  </div>
                </div>

                {!isFully && pendingThis > 0 && (
                  <button
                    onClick={() => onOpenReimbursementModal(tx)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition"
                    title="Record reimbursement payment cleared by office"
                  >
                    <FileCheck className="w-3.5 h-3.5" />
                    <span>Clear Claim</span>
                  </button>
                )}

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
          );
        })}

        {filteredList.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400">
            No office expenses recorded under this filter.
          </div>
        )}
      </div>

      {/* Delete Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">Delete Office Expense?</h3>
            <p className="text-xs text-slate-500">This will remove the transaction and restore account balances.</p>
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
