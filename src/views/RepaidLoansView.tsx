import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  FileDown,
  Search,
  Filter,
  Calendar,
  CreditCard,
  Banknote,
  ArrowDownLeft,
  Clock,
  User,
  AlertCircle,
  TrendingDown,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Borrowing } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';
import { exportBorrowedAndRepaidReportToPDF } from '../utils/pdfExport';

interface RepaidLoansViewProps {
  onOpenRepaymentModal: (borrowing: Borrowing) => void;
  onSwitchToBorrowedTab?: () => void;
}

export const RepaidLoansView: React.FC<RepaidLoansViewProps> = ({
  onOpenRepaymentModal,
  onSwitchToBorrowedTab,
}) => {
  const { borrowings, borrowingRepayments } = useFinance();
  const { isBn } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

  // Map borrowings for fast lookup
  const borrowingMap = useMemo(() => {
    const map = new Map<string, Borrowing>();
    borrowings.forEach((b) => map.set(b.id, b));
    return map;
  }, [borrowings]);

  // Unpaid or partially repaid borrowings that still need payment
  const activeDebtsToRepay = useMemo(() => {
    return borrowings.filter((b) => {
      const remaining = Number(b.amount) - Number(b.repaid_amount || 0);
      return remaining > 0;
    });
  }, [borrowings]);

  // Available months from repayment dates (YYYY-MM)
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    borrowingRepayments.forEach((r) => {
      if (r.payment_date) {
        set.add(r.payment_date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [borrowingRepayments]);

  // Format month label
  const formatMonthLabel = (ym: string) => {
    try {
      const [year, month] = ym.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
    } catch {
      return ym;
    }
  };

  // Filtered repayments list
  const filteredRepayments = useMemo(() => {
    return borrowingRepayments.filter((r) => {
      // Month filter
      if (selectedMonth !== 'all' && r.payment_date) {
        if (!r.payment_date.startsWith(selectedMonth)) return false;
      }

      // Date range filter
      if (startDate && r.payment_date && r.payment_date < startDate) return false;
      if (endDate && r.payment_date && r.payment_date > endDate) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const borrowing = borrowingMap.get(r.borrowing_id);
        const personMatch = borrowing?.person_name?.toLowerCase().includes(q);
        const methodMatch = r.payment_method?.toLowerCase().includes(q);
        const notesMatch = r.notes?.toLowerCase().includes(q);
        if (!personMatch && !methodMatch && !notesMatch) return false;
      }

      return true;
    });
  }, [borrowingRepayments, selectedMonth, startDate, endDate, searchQuery, borrowingMap]);

  // Total metrics
  const totalRepaidAmount = useMemo(() => {
    return filteredRepayments.reduce((sum, r) => sum + Number(r.amount), 0);
  }, [filteredRepayments]);

  const totalOutstandingDebt = useMemo(() => {
    return activeDebtsToRepay.reduce(
      (sum, b) => sum + Math.max(0, Number(b.amount) - Number(b.repaid_amount || 0)),
      0
    );
  }, [activeDebtsToRepay]);

  // Handle PDF Export
  const handleExportPDF = () => {
    let periodTitle = isBn ? 'সকল পরিশোধিত কিস্তি' : 'All Repayment Installments';
    if (selectedMonth !== 'all') {
      periodTitle = formatMonthLabel(selectedMonth);
    } else if (startDate || endDate) {
      periodTitle = `${startDate || 'Start'} to ${endDate || 'Present'}`;
    }

    exportBorrowedAndRepaidReportToPDF(borrowings, filteredRepayments, {
      periodTitle,
      totalBorrowed: borrowings.reduce((s, b) => s + Number(b.amount), 0),
      totalRepaid: totalRepaidAmount,
      remainingDebt: totalOutstandingDebt,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold mb-1.5">
            {isBn ? 'ধার ও ঋণ পরিশোধ' : 'Debt Repayment'}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isBn
                ? 'ধার পরিশোধ ও কিস্তি হিসাব'
                : 'Loan Repayments & Installments'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'অন্যদের থেকে নেওয়া ঋণের কিস্তি পরিশোধ ও পরিশোধিত ভাউচারের হিসাব'
              : 'Complete history of repaid loan installments and active debt settlements'}
          </p>
        </div>

        {/* Action Button */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-emerald-200 dark:border-emerald-900/60 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-xs font-bold text-emerald-700 dark:text-emerald-300 transition shadow-2xs"
            title={isBn ? 'পরিশোধের পিডিএফ রিপোর্ট ডাউনলোড করুন' : 'Export Repayment Report PDF'}
          >
            <FileDown className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isBn ? 'এক্সপোর্ট রিপোর্ট (PDF)' : 'Export (PDF)'}</span>
          </button>
        </div>
      </div>

      {/* 3 KPI Cards for Repayments */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* KPI 1: Total Repaid */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-800/40 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
            {isBn ? 'মোট পরিশোধিত টাকা' : 'Total Amount Repaid'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(totalRepaidAmount)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isBn
              ? `${filteredRepayments.length}টি পরিশোধ ভাউচার`
              : `${filteredRepayments.length} payment vouchers`}
          </span>
        </div>

        {/* KPI 2: Outstanding Remaining Debt */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-800/40 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
            {isBn ? 'অবশিষ্ট বাকি দেনা' : 'Remaining Unpaid Debt'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {formatBDT(totalOutstandingDebt)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isBn
              ? `${activeDebtsToRepay.length}টি ঋণ এখনো বাকি`
              : `${activeDebtsToRepay.length} active debts remaining`}
          </span>
        </div>

        {/* KPI 3: Total Loans Fully Cleared */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            {isBn ? 'সম্পূর্ণ পরিশোধিত ঋণ' : 'Fully Cleared Loans'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-slate-800 dark:text-slate-100 mt-1">
            {borrowings.filter((b) => b.status === 'Fully Repaid').length} / {borrowings.length}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isBn ? 'ক্লিয়ার হওয়া ঋণের সংখ্যা' : 'Closed debt accounts'}
          </span>
        </div>
      </div>

      {/* Active Debts Quick Repay Section */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <ArrowDownLeft className="w-4 h-4 text-amber-600 dark:text-amber-400" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isBn ? 'যে ঋণগুলোর টাকা পরিশোধ বাকি আছে' : 'Active Debts Requiring Repayment'}
            </h3>
          </div>
          <span className="text-xs font-mono font-bold px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-950/80 text-amber-700 dark:text-amber-300">
            {activeDebtsToRepay.length} {isBn ? 'বাকি' : 'Active'}
          </span>
        </div>

        {activeDebtsToRepay.length === 0 ? (
          <div className="p-5 text-center rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
            <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-1.5" />
            <p className="text-sm font-bold text-emerald-800 dark:text-emerald-300">
              {isBn ? 'আলহামদুলিল্লাহ! কোনো দেনা বা ঋণ বকেয়া নেই' : 'All debts are fully cleared!'}
            </p>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/70 mt-0.5">
              {isBn
                ? 'আপনার সব ধার নেওয়া ঋণ সম্পূর্ণ পরিশোধ করা হয়েছে।'
                : 'You have cleared all recorded borrowings.'}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pt-1">
            {activeDebtsToRepay.map((b) => {
              const remaining = Math.max(0, Number(b.amount) - Number(b.repaid_amount || 0));
              const progressPct = Math.min(100, Math.round(((b.repaid_amount || 0) / b.amount) * 100));

              return (
                <div
                  key={b.id}
                  className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 flex flex-col justify-between gap-3"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {b.person_name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold shrink-0">
                        {b.status === 'Partially Repaid'
                          ? (isBn ? 'আংশিক পরিশোধ' : 'Partial')
                          : (isBn ? 'অপরিশোধিত' : 'Unpaid')}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">{isBn ? 'বাকি ঋণ:' : 'Remaining:'}</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {formatBDT(remaining)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-baseline justify-between text-[11px] text-slate-400">
                      <span>{isBn ? 'মোট ধার:' : 'Total Borrowed:'} {formatBDT(b.amount)}</span>
                      <span>{isBn ? 'পরিশোধ:' : 'Paid:'} {formatBDT(b.repaid_amount || 0)}</span>
                    </div>

                    {/* Progress bar */}
                    <div className="w-full bg-slate-200 dark:bg-slate-700 h-1.5 rounded-full mt-2 overflow-hidden">
                      <div
                        className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                        style={{ width: `${progressPct}%` }}
                      />
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => onOpenRepaymentModal(b)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition shadow-xs"
                  >
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    <span>{isBn ? 'পরিশোধ করুন' : 'Record Repayment'}</span>
                  </button>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Filter Bar & Search */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3">
          {/* Search box */}
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={
                isBn
                  ? 'নাম, পেমেন্ট মাধ্যম বা নোট দিয়ে খুঁজুন...'
                  : 'Search by person name, payment method, or notes...'
              }
              className="w-full pl-9 pr-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex items-center gap-2">
            {/* Month Filter */}
            <select
              value={selectedMonth}
              onChange={(e) => {
                setSelectedMonth(e.target.value);
                if (e.target.value !== 'all') {
                  setShowCustomDate(false);
                  setStartDate('');
                  setEndDate('');
                }
              }}
              className="px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-emerald-500"
            >
              <option value="all">{isBn ? 'সকল মাস' : 'All Months'}</option>
              {availableMonths.map((ym) => (
                <option key={ym} value={ym}>
                  {formatMonthLabel(ym)}
                </option>
              ))}
            </select>

            {/* Custom Date Range Toggle */}
            <button
              type="button"
              onClick={() => setShowCustomDate(!showCustomDate)}
              className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-semibold border transition ${
                showCustomDate
                  ? 'border-emerald-500 bg-emerald-50 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300'
                  : 'border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-800'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isBn ? 'কাস্টম তারিখ' : 'Date Range'}</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Inputs */}
        {showCustomDate && (
          <div className="flex flex-wrap items-center gap-3 pt-2 border-t border-slate-100 dark:border-slate-800 text-xs">
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">{isBn ? 'শুরু:' : 'From:'}</span>
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            <div className="flex items-center gap-1.5">
              <span className="text-slate-500">{isBn ? 'শেষ:' : 'To:'}</span>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="px-2.5 py-1.5 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white"
              />
            </div>
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-500 hover:underline ml-auto"
              >
                {isBn ? 'রিসেট' : 'Reset'}
              </button>
            )}
          </div>
        )}
      </div>

      {/* Repayment Installments History Log */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isBn ? 'পরিশোধের সম্পূর্ণ ইতিহাস ও ভাউচার' : 'Repayment Vouchers & History Log'}</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {filteredRepayments.length} {isBn ? 'টি ভাউচার' : 'records'}
          </span>
        </div>

        {filteredRepayments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
            <p className="text-sm font-semibold">
              {isBn ? 'কোনো পরিশোধের রেকর্ড পাওয়া যায়নি' : 'No repayment records found'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isBn
                ? 'যখন আপনি কোনো ধারের বিপরীতে কিস্তি বা টাকা পরিশোধ করবেন, তার হিসাব এখানে সংরক্ষিত থাকবে।'
                : 'Whenever you record a debt installment repayment, it will appear here.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredRepayments.map((r, idx) => {
              const b = borrowingMap.get(r.borrowing_id);
              return (
                <div
                  key={r.id || idx}
                  className="py-3 sm:py-3.5 flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2.5 transition"
                >
                  <div className="flex items-start gap-3">
                    <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <span className="font-bold text-sm text-slate-900 dark:text-white">
                          {b?.person_name || (isBn ? 'অজ্ঞাত ঋণদাতা' : 'Unknown Lender')}
                        </span>
                        <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40">
                          {r.payment_method || 'Cash'}
                        </span>
                      </div>

                      <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                        <span className="flex items-center gap-1 font-mono">
                          <Calendar className="w-3.5 h-3.5 text-slate-400" />
                          <span>{formatDate(r.payment_date)}</span>
                        </span>
                        {r.notes && (
                          <span className="text-slate-400 truncate max-w-xs sm:max-w-md">
                            • {r.notes}
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-baseline sm:flex-col sm:items-end justify-between sm:justify-center self-end sm:self-center shrink-0">
                    <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                      + {formatBDT(r.amount)}
                    </span>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {isBn ? 'পরিশোধিত' : 'Paid Back'}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};
