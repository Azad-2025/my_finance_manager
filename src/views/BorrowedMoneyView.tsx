import React, { useState, useMemo } from 'react';
import {
  HandCoins,
  Plus,
  FileDown,
  Search,
  Filter,
  Phone,
  Calendar,
  CreditCard,
  Edit2,
  Trash2,
  History,
  Banknote,
  CheckCircle2,
  Clock,
  ArrowDownLeft,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Borrowing } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';
import { exportBorrowedAndRepaidReportToPDF } from '../utils/pdfExport';

interface BorrowedMoneyViewProps {
  onOpenAddBorrowing: () => void;
  onOpenRepaymentModal: (borrowing: Borrowing) => void;
  onEditBorrowing?: (borrowing: Borrowing) => void;
}

export const BorrowedMoneyView: React.FC<BorrowedMoneyViewProps> = ({
  onOpenAddBorrowing,
  onOpenRepaymentModal,
  onEditBorrowing,
}) => {
  const { borrowings, borrowingRepayments, deleteBorrowing } = useFinance();
  const { t, isBn } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Unpaid' | 'Partially Repaid' | 'Fully Repaid'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

  const [selectedBorrowingHistory, setSelectedBorrowingHistory] = useState<Borrowing | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Derive unique months available in borrowing records (YYYY-MM)
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    borrowings.forEach((b) => {
      if (b.borrowed_date) {
        set.add(b.borrowed_date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [borrowings]);

  // Format YYYY-MM into readable month name
  const formatMonthLabel = (ym: string) => {
    try {
      const [year, month] = ym.split('-');
      const d = new Date(parseInt(year, 10), parseInt(month, 10) - 1, 1);
      return d.toLocaleDateString(isBn ? 'bn-BD' : 'en-US', { month: 'long', year: 'numeric' });
    } catch {
      return ym;
    }
  };

  // Filtered borrowings list
  const filteredList = useMemo(() => {
    return borrowings.filter((b) => {
      // Status filter
      if (statusFilter !== 'all' && b.status !== statusFilter) return false;

      // Month filter
      if (selectedMonth !== 'all' && b.borrowed_date) {
        if (!b.borrowed_date.startsWith(selectedMonth)) return false;
      }

      // Custom date range
      if (startDate && b.borrowed_date && b.borrowed_date < startDate) return false;
      if (endDate && b.borrowed_date && b.borrowed_date > endDate) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = b.person_name.toLowerCase().includes(q);
        const matchPhone = b.phone_number?.toLowerCase().includes(q);
        const matchPurpose = b.purpose?.toLowerCase().includes(q);
        const matchMethod = b.payment_method?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchPurpose && !matchMethod) return false;
      }

      return true;
    });
  }, [borrowings, statusFilter, selectedMonth, startDate, endDate, searchQuery]);

  // Totals based on filtered list
  const { totalBorrowed, totalRepaid, remainingDebt } = useMemo(() => {
    let bor = 0;
    let rep = 0;
    filteredList.forEach((b) => {
      bor += Number(b.amount);
      rep += Number(b.repaid_amount || 0);
    });
    return {
      totalBorrowed: bor,
      totalRepaid: rep,
      remainingDebt: Math.max(0, bor - rep),
    };
  }, [filteredList]);

  // Filtered repayments for PDF
  const filteredRepayments = useMemo(() => {
    const validIds = new Set(filteredList.map((b) => b.id));
    return borrowingRepayments.filter((r) => validIds.has(r.borrowing_id));
  }, [filteredList, borrowingRepayments]);

  // Handle PDF Export (Export Option 2)
  const handleExportPDF = () => {
    let periodTitle = isBn ? 'সকল রেকর্ড' : 'All Records';
    if (selectedMonth !== 'all') {
      periodTitle = formatMonthLabel(selectedMonth);
    } else if (startDate || endDate) {
      periodTitle = `${startDate || 'Start'} to ${endDate || 'Present'}`;
    }

    exportBorrowedAndRepaidReportToPDF(filteredList, filteredRepayments, {
      periodTitle,
      totalBorrowed,
      totalRepaid,
      remainingDebt,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300 text-[11px] font-bold mb-1.5">
            {isBn ? 'সেকশন বি · দেনা ও ঋণ' : 'Section B · Liabilities'}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <HandCoins className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            <span>
              {isBn
                ? 'ধার নেওয়া টাকা ও পরিশোধ (যে টাকা আমি ধার নিয়েছি বা পরিশোধ করেছি)'
                : 'Money Borrowed & Repaid (Liabilities Hub)'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'অন্যদের থেকে নেওয়া ঋণ, পেমেন্ট মাধ্যম, কিস্তিতে পরিশোধ ও অবশিষ্ট দেনার সঠিক হিসাব'
              : 'Track money borrowed from lenders, payment method, dates & installment repayments'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-orange-200 dark:border-orange-900/60 bg-orange-50 dark:bg-orange-950/40 hover:bg-orange-100 dark:hover:bg-orange-900/60 text-xs font-bold text-orange-700 dark:text-orange-300 transition shadow-2xs"
            title={isBn ? 'পিডিএফ রিপোর্ট ডাউনলোড করুন' : 'Export Borrowed & Repaid Report PDF'}
          >
            <FileDown className="w-4 h-4 text-orange-600 dark:text-orange-400" />
            <span>{isBn ? 'এক্সপোর্ট রিপোর্ট (PDF)' : 'Export (PDF)'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddBorrowing}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-orange-600 hover:bg-orange-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'ধার নেওয়া যোগ করুন' : 'Record Borrowing'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Total Borrowed */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            {isBn ? 'মোট ধার নেওয়া (মূলধন)' : 'Total Borrowed (Gross)'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-orange-600 dark:text-orange-400 mt-1">
            {formatBDT(totalBorrowed)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isBn ? `${filteredList.length}টি ঋণ বা ধারের হিসাব` : `${filteredList.length} total borrowed entries`}
          </span>
        </div>

        {/* KPI 2: Total Repaid to Date */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            {isBn ? 'মোট পরিশোধিত টাকা' : 'Total Repaid to Date'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(totalRepaid)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isBn ? 'কিস্তিতে পরিশোধ করা হয়েছে' : 'Installments settled'}
          </span>
        </div>

        {/* KPI 3: Remaining Debt */}
        <div className="p-4 rounded-2xl bg-red-50/70 dark:bg-red-950/20 border border-red-200 dark:border-red-900/60 shadow-xs">
          <span className="text-[11px] font-bold text-red-800 dark:text-red-300 block">
            {isBn ? 'অবশিষ্ট ঋণ বা দেনা (দিতে হবে)' : 'Remaining Debt (Amount I Owe)'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400 mt-1">
            {formatBDT(remainingDebt)}
          </div>
          <span className="text-[10px] text-red-700/80 dark:text-red-400/80 mt-0.5 block">
            {isBn ? 'বর্তমান অপরিশোধিত ঋণের দায়' : 'Net current debt liability balance'}
          </span>
        </div>
      </div>

      {/* Filter and Search Controls */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
        <div className="flex flex-col md:flex-row items-stretch md:items-center justify-between gap-3">
          {/* Search bar */}
          <div className="relative flex-1">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <input
              type="text"
              placeholder={isBn ? 'নাম, ফোন নম্বর, উদ্দেশ্য বা মাধ্যম দিয়ে খুঁজুন...' : "Search by lender's name, phone, purpose or method..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
          </div>

          {/* Month Dropdown Filter */}
          <div className="flex items-center gap-2 shrink-0">
            <div className="relative">
              <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none" />
              <select
                value={selectedMonth}
                onChange={(e) => {
                  setSelectedMonth(e.target.value);
                  if (e.target.value !== 'all') {
                    setStartDate('');
                    setEndDate('');
                  }
                }}
                className="pl-8 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
              >
                <option value="all">{isBn ? 'সকল মাস (All Months)' : 'All Months'}</option>
                {availableMonths.map((ym) => (
                  <option key={ym} value={ym}>
                    {formatMonthLabel(ym)}
                  </option>
                ))}
              </select>
            </div>

            {/* Custom Date Range Toggle */}
            <button
              type="button"
              onClick={() => setShowCustomDate(!showCustomDate)}
              className={`flex items-center gap-1 px-3 py-2 rounded-xl border text-xs font-semibold transition ${
                showCustomDate || startDate || endDate
                  ? 'border-orange-500 bg-orange-50 dark:bg-orange-950/60 text-orange-700 dark:text-orange-300'
                  : 'border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-600 dark:text-slate-400 hover:bg-slate-100'
              }`}
            >
              <Filter className="w-3.5 h-3.5" />
              <span>{isBn ? 'তারিখ ফিল্টার' : 'Date Range'}</span>
            </button>
          </div>
        </div>

        {/* Custom Date Range Row */}
        {showCustomDate && (
          <div className="flex flex-wrap items-center gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
            <span className="text-xs font-medium text-slate-500">{isBn ? 'শুরু:' : 'From:'}</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => {
                setStartDate(e.target.value);
                setSelectedMonth('all');
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            <span className="text-xs font-medium text-slate-500">{isBn ? 'শেষ:' : 'To:'}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedMonth('all');
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
            />
            {(startDate || endDate) && (
              <button
                type="button"
                onClick={() => {
                  setStartDate('');
                  setEndDate('');
                }}
                className="text-xs text-rose-600 hover:underline px-2 py-1"
              >
                {isBn ? 'ক্লিয়ার' : 'Clear'}
              </button>
            )}
          </div>
        )}

        {/* Status Segment Pills */}
        <div className="flex flex-wrap items-center gap-1.5 pt-1">
          {(['all', 'Unpaid', 'Partially Repaid', 'Fully Repaid'] as const).map((st) => {
            const labelMap: Record<string, string> = {
              all: isBn ? 'সকল রেকর্ড' : 'All',
              Unpaid: isBn ? 'অপরিশোধিত' : 'Unpaid',
              'Partially Repaid': isBn ? 'আংশিক পরিশোধিত' : 'Partially Repaid',
              'Fully Repaid': isBn ? 'সম্পূর্ণ পরিশোধিত' : 'Fully Repaid',
            };
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-orange-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {labelMap[st]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Organized List of Borrowed Money Records */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredList.map((b) => {
          const remaining = Math.max(0, b.amount - (b.repaid_amount || 0));
          const isFully = b.status === 'Fully Repaid';
          const methodDisplay = b.payment_method || 'Cash';

          return (
            <div
              key={b.id}
              className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Record Left: Details */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {b.person_name}
                  </span>

                  {/* Payment Method Badge (Cash or bKash) */}
                  <span className="inline-flex items-center gap-1 text-[11px] font-bold px-2.5 py-0.5 rounded-lg bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800">
                    <Banknote className="w-3 h-3" />
                    <span>{methodDisplay}</span>
                  </span>

                  {/* Status Badge */}
                  <span
                    className={`text-[10px] font-semibold px-2 py-0.5 rounded-md ${
                      isFully
                        ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/80 dark:text-emerald-300'
                        : b.status === 'Partially Repaid'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-red-100 text-red-800 dark:bg-red-950/80 dark:text-red-300'
                    }`}
                  >
                    {isFully
                      ? (isBn ? 'সম্পূর্ণ পরিশোধিত' : 'Fully Repaid')
                      : b.status === 'Partially Repaid'
                      ? (isBn ? 'আংশিক পরিশোধিত' : 'Partially Repaid')
                      : (isBn ? 'অপরিশোধিত' : 'Unpaid')}
                  </span>
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isBn ? 'তারিখ:' : 'Date:'} {formatDate(b.borrowed_date)}</span>
                  </span>

                  {b.phone_number && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{b.phone_number}</span>
                    </span>
                  )}

                  {b.due_date && (
                    <span className="flex items-center gap-1 text-red-600 dark:text-red-400 font-semibold font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isBn ? 'পরিশোধের শেষ তারিখ:' : 'Due Date:'} {formatDate(b.due_date)}</span>
                    </span>
                  )}

                  {b.purpose && (
                    <span className="text-slate-600 dark:text-slate-300">
                      <strong>{isBn ? 'উদ্দেশ্য:' : 'Purpose:'}</strong> {b.purpose}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="max-w-md pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>
                      {isBn ? 'পরিশোধ করা হয়েছে:' : 'Repaid:'}{' '}
                      <strong className="text-emerald-600 font-mono">{formatBDT(b.repaid_amount || 0)}</strong>
                    </span>
                    <span>
                      {isBn ? 'বাকি দেনা:' : 'Remaining:'}{' '}
                      <strong className="text-red-600 font-mono">{formatBDT(remaining)}</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((b.repaid_amount || 0) / b.amount) * 100)}%` }}
                    />
                  </div>
                </div>

                {b.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg inline-block">
                    "{b.notes}"
                  </p>
                )}
              </div>

              {/* Record Right: Amount and Actions */}
              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-left md:text-right">
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {formatBDT(b.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {isBn ? 'মোট ধার নেওয়া' : 'Principal Borrowed'}
                  </div>
                </div>

                {/* Repay Button (reduces outstanding balance of this loan, does NOT create new borrowing) */}
                {!isFully && remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenRepaymentModal(b)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isBn ? 'ঋণ পরিশোধ' : 'Repay'}</span>
                  </button>
                )}

                {/* Edit Button */}
                {onEditBorrowing && (
                  <button
                    type="button"
                    onClick={() => onEditBorrowing(b)}
                    className="p-2 rounded-xl text-slate-500 hover:text-orange-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={isBn ? 'সম্পাদনা করুন' : 'Edit borrowing record'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {/* History Button */}
                <button
                  type="button"
                  onClick={() => setSelectedBorrowingHistory(b)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <History className="w-3.5 h-3.5 inline mr-1" />
                  <span>{isBn ? 'ইতিহাস' : 'History'}</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setDeletingId(b.id)}
                  className="p-2 rounded-xl text-slate-400 hover:text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
                  title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          );
        })}

        {filteredList.length === 0 && (
          <div className="p-12 text-center text-xs text-slate-400">
            {isBn ? 'কোনো ধার নেওয়ার রেকর্ড পাওয়া যায়নি।' : 'No borrowed money records found.'}
          </div>
        )}
      </div>

      {/* Repayments History Modal */}
      {selectedBorrowingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isBn ? 'পরিশোধের ইতিহাস' : 'Repayment History'} - {selectedBorrowingHistory.person_name}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {isBn ? 'মোট ঋণ:' : 'Total Loan:'} {formatBDT(selectedBorrowingHistory.amount)} ·{' '}
                  {isBn ? 'অবশিষ্ট দেনা:' : 'Remaining Debt:'}{' '}
                  {formatBDT(selectedBorrowingHistory.amount - (selectedBorrowingHistory.repaid_amount || 0))}
                </p>
              </div>
              <button
                type="button"
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
                        {r.payment_method || 'bKash'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
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
                  {isBn ? 'এই ঋণের জন্য এখনও কোনো কিস্তি পরিশোধ করা হয়নি।' : 'No repayment installments recorded yet for this loan.'}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedBorrowingHistory(null)}
              className="w-full py-2.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-200 transition"
            >
              {isBn ? 'বন্ধ করুন' : 'Close'}
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Dialog */}
      {deletingId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isBn ? 'ধার নেওয়ার রেকর্ড মুছে ফেলবেন?' : 'Delete Borrowing Record?'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn
                ? 'এটি এই ঋণ বা দেনার রেকর্ড এবং এর সাথে সম্পর্কিত সকল কিস্তি পরিশোধের ইতিহাস স্থায়ীভাবে মুছে দেবে।'
                : 'This will remove this loan liability and its installment history permanently.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteBorrowing(deletingId);
                  setDeletingId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 text-white text-xs font-bold hover:bg-rose-700 shadow-sm"
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
