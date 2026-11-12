import React, { useState, useMemo } from 'react';
import {
  CheckCircle2,
  FileDown,
  Plus,
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
  Trash2,
  X,
  FileText,
  DollarSign,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Borrowing, PaymentMethod } from '../types/finance';
import { formatBDT, formatDate, getTodayString } from '../utils/formatters';
import { exportBorrowedAndRepaidReportToPDF } from '../utils/pdfExport';

interface RepaidLoansViewProps {
  onOpenRepaymentModal: (borrowing: Borrowing) => void;
  onSwitchToBorrowedTab?: () => void;
}

const PAYMENT_METHODS: PaymentMethod[] = [
  'Cash',
  'bKash',
  'Nagad',
  'Rocket',
  'Bank Transfer',
  'Debit Card',
  'Credit Card',
  'Other',
];

export const RepaidLoansView: React.FC<RepaidLoansViewProps> = ({
  onOpenRepaymentModal,
  onSwitchToBorrowedTab,
}) => {
  const {
    borrowings,
    borrowingRepayments,
    recordBorrowingRepayment,
    deleteBorrowingRepayment,
    accounts,
  } = useFinance();
  const { isBn } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

  // Modal State for "+ ধার পরিশোধ যোগ করুন"
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [selectedBorrowingId, setSelectedBorrowingId] = useState<string>('');
  const [repayAmount, setRepayAmount] = useState<string>('');
  const [repayDate, setRepayDate] = useState<string>(getTodayString());
  const [repayMethod, setRepayMethod] = useState<PaymentMethod | string>('Cash');
  const [repayAccountId, setRepayAccountId] = useState<string>('');
  const [repayNotes, setRepayNotes] = useState<string>('');
  const [formError, setFormError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Delete Confirmation State
  const [deletingRepaymentId, setDeletingRepaymentId] = useState<string | null>(null);

  // Map borrowings for fast lookup
  const borrowingMap = useMemo(() => {
    const map = new Map<string, Borrowing>();
    borrowings.forEach((b) => map.set(b.id, b));
    return map;
  }, [borrowings]);

  // Unpaid or partially repaid borrowings that still have debt
  const activeDebtsToRepay = useMemo(() => {
    return borrowings.filter((b) => {
      const remaining = Number(b.amount) - Number(b.repaid_amount || 0);
      return remaining > 0;
    });
  }, [borrowings]);

  // Selected borrowing details in modal
  const activeSelectedBorrowing = useMemo(() => {
    return borrowingMap.get(selectedBorrowingId) || null;
  }, [selectedBorrowingId, borrowingMap]);

  const activeSelectedRemaining = useMemo(() => {
    if (!activeSelectedBorrowing) return 0;
    return Math.max(
      0,
      Number(activeSelectedBorrowing.amount) - Number(activeSelectedBorrowing.repaid_amount || 0)
    );
  }, [activeSelectedBorrowing]);

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

  // Open Add Repayment Modal
  const handleOpenAddRepayment = (preselectedBorrowing?: Borrowing) => {
    setFormError(null);
    setRepayAmount('');
    setRepayDate(getTodayString());
    setRepayMethod('Cash');
    setRepayAccountId(accounts[0]?.id || '');
    setRepayNotes('');

    if (preselectedBorrowing) {
      setSelectedBorrowingId(preselectedBorrowing.id);
      const rem = Math.max(
        0,
        Number(preselectedBorrowing.amount) - Number(preselectedBorrowing.repaid_amount || 0)
      );
      setRepayAmount(rem > 0 ? rem.toString() : '');
    } else if (activeDebtsToRepay.length > 0) {
      setSelectedBorrowingId(activeDebtsToRepay[0].id);
      const rem = Math.max(
        0,
        Number(activeDebtsToRepay[0].amount) - Number(activeDebtsToRepay[0].repaid_amount || 0)
      );
      setRepayAmount(rem > 0 ? rem.toString() : '');
    } else {
      setSelectedBorrowingId('');
    }

    setIsAddModalOpen(true);
  };

  // Submit Repayment
  const handleSubmitRepayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!selectedBorrowingId) {
      setFormError(isBn ? 'দয়া করে একজন ঋণদাতা নির্বাচন করুন।' : 'Please select a loan to repay.');
      return;
    }

    const amt = parseFloat(repayAmount);
    if (isNaN(amt) || amt <= 0) {
      setFormError(
        isBn
          ? 'দয়া করে সঠিক পরিশোধের পরিমাণ লিখুন।'
          : 'Please enter a valid repayment amount greater than 0.'
      );
      return;
    }

    if (activeSelectedRemaining > 0 && amt > activeSelectedRemaining) {
      setFormError(
        isBn
          ? `পরিশোধের পরিমাণ অবশিষ্ট দেনার (${formatBDT(activeSelectedRemaining)}) চেয়ে বেশি হতে পারে না।`
          : `Repayment amount cannot exceed remaining debt (${formatBDT(activeSelectedRemaining)}).`
      );
      return;
    }

    try {
      setIsSubmitting(true);
      await recordBorrowingRepayment(
        selectedBorrowingId,
        amt,
        repayMethod,
        repayAccountId || undefined,
        repayNotes.trim() || undefined
      );

      setIsAddModalOpen(false);
      setRepayAmount('');
      setRepayNotes('');
    } catch (err: any) {
      setFormError(err?.message || (isBn ? 'পরিশোধ সংরক্ষণ করতে সমস্যা হয়েছে।' : 'Failed to record repayment.'));
    } finally {
      setIsSubmitting(false);
    }
  };

  // Handle Delete Repayment
  const handleDeleteRepayment = async (id: string) => {
    try {
      if (deleteBorrowingRepayment) {
        await deleteBorrowingRepayment(id);
      }
      setDeletingRepaymentId(null);
    } catch (err) {
      console.error('Failed to delete repayment:', err);
    }
  };

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
      {/* Header Banner - Exactly matching the user's marked section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 text-[11px] font-bold mb-1.5">
            {isBn ? 'সেকশন বি · ঋণ পরিশোধ' : 'Section B · Debt Repayment'}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            <span>
              {isBn
                ? 'ধার ও ঋণ পরিশোধের হিসাব'
                : 'Loan Repayments & Settlements'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'অন্যদের থেকে নেওয়া ঋণের কিস্তি পরিশোধ, নোট ও অবশিষ্ট দেনার সঠিক সমন্বয়'
              : 'Track installment repayments, payment notes, methods & automated debt deduction'}
          </p>
        </div>

        {/* Action Buttons: Export PDF & + ধার পরিশোধ যোগ করুন */}
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

          <button
            type="button"
            onClick={() => handleOpenAddRepayment()}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-98"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'ধার পরিশোধ যোগ করুন' : 'Record Repayment'}</span>
          </button>
        </div>
      </div>

      {/* 3 KPI Cards for Repayments */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 sm:gap-4">
        {/* KPI 1: Total Repaid */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-emerald-500/30 dark:border-emerald-800/40 shadow-xs">
          <span className="text-[11px] font-semibold text-emerald-700 dark:text-emerald-400 block">
            {isBn ? 'মোট পরিশোধিত টাকা (পরিশোধ সম্পন্ন)' : 'Total Amount Repaid'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(totalRepaidAmount)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isBn
              ? `${filteredRepayments.length}টি পরিশোধ ভাউচার রেকর্ড`
              : `${filteredRepayments.length} payment vouchers`}
          </span>
        </div>

        {/* KPI 2: Outstanding Remaining Debt */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-amber-500/30 dark:border-amber-800/40 shadow-xs">
          <span className="text-[11px] font-semibold text-amber-700 dark:text-amber-400 block">
            {isBn ? 'অবশিষ্ট বাকি দেনা (এখনো দিতে হবে)' : 'Remaining Unpaid Debt'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {formatBDT(totalOutstandingDebt)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isBn
              ? `${activeDebtsToRepay.length}টি ঋণ এখনো বাকি আছে`
              : `${activeDebtsToRepay.length} active debts remaining`}
          </span>
        </div>

        {/* KPI 3: Fully Cleared Loans */}
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

      {/* Active Debts Requiring Payment */}
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
          <div className="p-6 text-center rounded-xl bg-emerald-50/50 dark:bg-emerald-950/20 border border-emerald-200/60 dark:border-emerald-900/40">
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
                  className="p-3.5 rounded-xl border border-amber-200/80 dark:border-amber-900/40 bg-amber-50/30 dark:bg-amber-950/10 flex flex-col justify-between gap-3 shadow-2xs"
                >
                  <div>
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-bold text-sm text-slate-900 dark:text-white truncate">
                        {b.person_name}
                      </span>
                      <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-amber-100 dark:bg-amber-900/50 text-amber-800 dark:text-amber-300 font-semibold shrink-0">
                        {b.status === 'Partially Repaid'
                          ? (isBn ? 'আংশিক পরিশোধ' : 'Partial')
                          : (isBn ? 'অপরিশোধিত' : 'Unpaid')}
                      </span>
                    </div>

                    <div className="mt-2 flex items-baseline justify-between text-xs">
                      <span className="text-slate-500">{isBn ? 'বাকি দেনা:' : 'Remaining:'}</span>
                      <span className="font-mono font-bold text-amber-600 dark:text-amber-400 text-sm">
                        {formatBDT(remaining)}
                      </span>
                    </div>

                    <div className="mt-1 flex items-baseline justify-between text-[11px] text-slate-400">
                      <span>{isBn ? 'মূল ধার:' : 'Total:'} {formatBDT(b.amount)}</span>
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
                    onClick={() => handleOpenAddRepayment(b)}
                    className="w-full flex items-center justify-center gap-1.5 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold transition shadow-xs"
                  >
                    <Plus className="w-3.5 h-3.5" />
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

      {/* Repayment Installments History Log with Notes */}
      <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex items-center justify-between pb-2 border-b border-slate-100 dark:border-slate-800">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Banknote className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
            <span>{isBn ? 'পরিশোধের সম্পূর্ণ ইতিহাস ও নোট' : 'Repayment Vouchers & Notes Log'}</span>
          </h3>
          <span className="text-xs font-mono text-slate-500">
            {filteredRepayments.length} {isBn ? 'টি ভাউচার' : 'records'}
          </span>
        </div>

        {filteredRepayments.length === 0 ? (
          <div className="py-12 text-center text-slate-400">
            <Clock className="w-10 h-10 mx-auto mb-2 opacity-40 text-emerald-500" />
            <p className="text-sm font-semibold">
              {isBn ? 'কোনো পরিশোধের রেকর্ড পাওয়া যায়নি' : 'No repayment records found'}
            </p>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
              {isBn
                ? 'যখন আপনি কোনো ধারের বিপরীতে কিস্তি বা টাকা পরিশোধ করবেন, তার হিসাব এবং বিস্তারিত নোট এখানে সংরক্ষিত থাকবে।'
                : 'Whenever you record a debt installment repayment, it will appear here with your notes.'}
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100 dark:divide-slate-800/80">
            {filteredRepayments.map((r, idx) => {
              const b = borrowingMap.get(r.borrowing_id);
              return (
                <div
                  key={r.id || idx}
                  className="py-3.5 sm:py-4 flex flex-col gap-2 hover:bg-slate-50/60 dark:hover:bg-slate-800/40 rounded-xl px-2.5 transition"
                >
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5">
                    <div className="flex items-start gap-3">
                      <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 mt-0.5">
                        <CheckCircle2 className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm text-slate-900 dark:text-white">
                            {b?.person_name || (isBn ? 'অজ্ঞাত ঋণদাতা' : 'Unknown Lender')}
                          </span>
                          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/60 dark:border-emerald-900/40 font-semibold">
                            {r.payment_method || 'Cash'}
                          </span>
                        </div>

                        <div className="flex items-center gap-3 text-xs text-slate-500 mt-1 flex-wrap">
                          <span className="flex items-center gap-1 font-mono">
                            <Calendar className="w-3.5 h-3.5 text-slate-400" />
                            <span>{formatDate(r.payment_date)}</span>
                          </span>
                          {b && (
                            <span className="text-[11px] text-slate-400 font-mono">
                              {isBn ? 'ঋণের মোট পরিমাণ:' : 'Loan Total:'} {formatBDT(b.amount)}
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center justify-between sm:justify-end gap-3 self-end sm:self-center shrink-0">
                      <div className="text-right">
                        <span className="text-base sm:text-lg font-bold font-mono text-emerald-600 dark:text-emerald-400">
                          + {formatBDT(r.amount)}
                        </span>
                        <div className="text-[10px] text-slate-400 font-mono text-right">
                          {isBn ? 'পরিশোধিত' : 'Paid Back'}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setDeletingRepaymentId(r.id)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/30 rounded-lg transition"
                        title={isBn ? 'পরিশোধের রেকর্ড মুছুন' : 'Delete payment record'}
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>

                  {/* Highlighted Note / Remarks - Fulfills user request:
                      "তো কখন কাকে কত টাকা পরিশোধ করেছি ওটা যাতে এখানে নোট হিসেবে থাকে আরকি" */}
                  {r.notes ? (
                    <div className="ml-12 mt-0.5 p-2 rounded-lg bg-emerald-50/60 dark:bg-emerald-950/30 border border-emerald-200/50 dark:border-emerald-900/30 text-xs text-emerald-900 dark:text-emerald-300 flex items-start gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                      <span className="leading-relaxed">
                        <strong>{isBn ? 'নোট / বিবরণ:' : 'Note:'}</strong> {r.notes}
                      </span>
                    </div>
                  ) : null}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Add Repayment Modal ("+ ধার পরিশোধ যোগ করুন") */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-md w-full border border-slate-200 dark:border-slate-800 shadow-2xl overflow-hidden flex flex-col max-h-[90vh]">
            {/* Modal Header */}
            <div className="p-4 sm:p-5 border-b border-slate-100 dark:border-slate-800 flex items-center justify-between bg-slate-50/50 dark:bg-slate-800/40">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/80 text-emerald-600 dark:text-emerald-400 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900 dark:text-white">
                    {isBn ? 'ধার ও ঋণ পরিশোধ যোগ করুন' : 'Record Debt Repayment'}
                  </h3>
                  <p className="text-xs text-slate-500">
                    {isBn
                      ? 'কিস্তি পরিশোধ ও অবশিষ্ট দেনা সমন্বয়'
                      : 'Record installment and deduct from debt'}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 rounded-lg transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Form */}
            <form onSubmit={handleSubmitRepayment} className="p-4 sm:p-5 space-y-4 overflow-y-auto flex-1">
              {formError && (
                <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/60 text-xs text-rose-700 dark:text-rose-300 flex items-start gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                  <span>{formError}</span>
                </div>
              )}

              {/* 1. Select Creditor / Borrowing */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'কার ঋণ পরিশোধ করছেন? (ঋণদাতা নির্বাচন) *' : 'Select Debt / Lender to Repay *'}
                </label>
                {activeDebtsToRepay.length === 0 ? (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-900/40 text-xs text-amber-800 dark:text-amber-300">
                    {isBn
                      ? 'বর্তমানে কোনো বকেয়া ঋণ নেই। অনুগ্রহ করে প্রথমে "ধার নেওয়া" সেকশন থেকে ঋণ যোগ করুন।'
                      : 'No outstanding debts found. Please add a borrowing record first.'}
                  </div>
                ) : (
                  <select
                    value={selectedBorrowingId}
                    onChange={(e) => {
                      setSelectedBorrowingId(e.target.value);
                      const target = borrowingMap.get(e.target.value);
                      if (target) {
                        const rem = Math.max(
                          0,
                          Number(target.amount) - Number(target.repaid_amount || 0)
                        );
                        setRepayAmount(rem > 0 ? rem.toString() : '');
                      }
                    }}
                    required
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {activeDebtsToRepay.map((b) => {
                      const rem = Math.max(0, Number(b.amount) - Number(b.repaid_amount || 0));
                      return (
                        <option key={b.id} value={b.id}>
                          {b.person_name} — {isBn ? 'বাকি দেনা:' : 'Due:'} ৳{rem.toLocaleString()}{' '}
                          ({isBn ? 'মূল ঋণ:' : 'Total:'} ৳{b.amount.toLocaleString()})
                        </option>
                      );
                    })}
                  </select>
                )}
              </div>

              {/* Active Loan Balance Card */}
              {activeSelectedBorrowing && (
                <div className="p-3 rounded-xl bg-slate-50 dark:bg-slate-800/60 border border-slate-200 dark:border-slate-700/60 text-xs space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isBn ? 'মোট ধার নেওয়া:' : 'Total Borrowed:'}</span>
                    <span className="font-mono font-semibold text-slate-800 dark:text-slate-200">
                      {formatBDT(activeSelectedBorrowing.amount)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">{isBn ? 'ইতিমধ্যে পরিশোধ:' : 'Already Repaid:'}</span>
                    <span className="font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                      {formatBDT(activeSelectedBorrowing.repaid_amount || 0)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between pt-1 border-t border-slate-200/60 dark:border-slate-700 font-bold">
                    <span className="text-amber-700 dark:text-amber-400">{isBn ? 'বর্তমান বাকি দেনা:' : 'Remaining Debt:'}</span>
                    <span className="font-mono text-amber-600 dark:text-amber-400 text-sm">
                      {formatBDT(activeSelectedRemaining)}
                    </span>
                  </div>
                </div>
              )}

              {/* 2. Repayment Amount */}
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="text-xs font-bold text-slate-700 dark:text-slate-300">
                    {isBn ? 'পরিশোধের পরিমাণ (টাকা / ৳) *' : 'Repayment Amount (BDT / ৳) *'}
                  </label>
                  {activeSelectedRemaining > 0 && (
                    <button
                      type="button"
                      onClick={() => setRepayAmount(activeSelectedRemaining.toString())}
                      className="text-[11px] font-bold text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      {isBn ? 'সম্পূর্ণ পরিশোধ করুন' : 'Pay Full Balance'}
                    </button>
                  )}
                </div>
                <input
                  type="number"
                  step="any"
                  min="1"
                  max={activeSelectedRemaining || undefined}
                  value={repayAmount}
                  onChange={(e) => setRepayAmount(e.target.value)}
                  placeholder="e.g. 2000"
                  required
                  className="w-full px-3 py-2.5 text-xs font-mono rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 3. Payment Date */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'পরিশোধের তারিখ *' : 'Payment Date *'}
                </label>
                <input
                  type="date"
                  value={repayDate}
                  onChange={(e) => setRepayDate(e.target.value)}
                  required
                  className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* 4. Payment Method & Account */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                  </label>
                  <select
                    value={repayMethod}
                    onChange={(e) => setRepayMethod(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {PAYMENT_METHODS.map((m) => (
                      <option key={m} value={m}>
                        {m}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                    {isBn ? 'পরিশোধের অ্যাকাউন্ট' : 'Paid From Account'}
                  </label>
                  <select
                    value={repayAccountId}
                    onChange={(e) => setRepayAccountId(e.target.value)}
                    className="w-full px-3 py-2.5 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                  >
                    {accounts.map((a) => (
                      <option key={a.id} value={a.id}>
                        {a.name} ({formatBDT(a.balance)})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {/* 5. Notes / Details - Crucial user requirement */}
              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                  {isBn ? 'নোট / বিবরণ (কখন কাকে কত টাকা দিয়েছেন তার নোট) *' : 'Repayment Notes & Details *'}
                </label>
                <textarea
                  rows={2}
                  value={repayNotes}
                  onChange={(e) => setRepayNotes(e.target.value)}
                  placeholder={
                    isBn
                      ? 'যেমন: ১ম কিস্তি ক্যাশে পরিশোধ করলাম / বিকাশ রেফারেন্স...'
                      : 'e.g. Paid 1st installment via cash / bKash TxID...'
                  }
                  className="w-full px-3 py-2 text-xs rounded-xl border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800 text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              {/* Submit Buttons */}
              <div className="pt-2 flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="flex-1 py-2.5 px-4 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting || activeDebtsToRepay.length === 0}
                  className="flex-1 py-2.5 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 active:scale-98 text-white text-xs font-bold shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting
                    ? (isBn ? 'সংরক্ষণ হচ্ছে...' : 'Saving...')
                    : (isBn ? 'পরিশোধ নিশ্চিত করুন' : 'Confirm Repayment')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {deletingRepaymentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-xs animate-in fade-in">
          <div className="bg-white dark:bg-slate-900 rounded-2xl max-w-sm w-full p-5 border border-slate-200 dark:border-slate-800 shadow-xl space-y-4">
            <div className="w-10 h-10 rounded-full bg-rose-100 dark:bg-rose-950/80 text-rose-600 dark:text-rose-400 flex items-center justify-center mx-auto">
              <Trash2 className="w-5 h-5" />
            </div>

            <div className="text-center">
              <h4 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBn ? 'পরিশোধের রেকর্ড মুছে ফেলতে চান?' : 'Delete Repayment Record?'}
              </h4>
              <p className="text-xs text-slate-500 mt-1">
                {isBn
                  ? 'এই পরিশোধের রেকর্ডটি মুছে দিলে সংশ্লিষ্ট ঋণের দেনা পুনরায় বৃদ্ধি পাবে।'
                  : 'Deleting this will restore the remaining balance on the loan.'}
              </p>
            </div>

            <div className="flex items-center gap-2 pt-2">
              <button
                type="button"
                onClick={() => setDeletingRepaymentId(null)}
                className="flex-1 py-2 px-3 rounded-xl border border-slate-200 dark:border-slate-700 text-xs font-semibold text-slate-700 dark:text-slate-300"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={() => handleDeleteRepayment(deletingRepaymentId)}
                className="flex-1 py-2 px-3 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold shadow-xs transition"
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
