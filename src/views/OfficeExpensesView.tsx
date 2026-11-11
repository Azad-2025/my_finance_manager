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
  Wallet,
  Calendar,
  FileSpreadsheet,
  Coins,
  ArrowDownRight,
  TrendingDown,
  Layers,
  Info,
  X,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Transaction, SalaryAdvance, SalaryAdjustment } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';
import { exportOfficeExpensesToPDF, exportSalaryAdvanceStatementToPDF } from '../utils/pdfExport';

interface OfficeExpensesViewProps {
  onOpenAddOfficeExpense: () => void;
  onEditTransaction: (tx: Transaction) => void;
  onOpenReimbursementModal: (tx: Transaction) => void;
}

type PeriodFilterType = 'all' | 'today' | 'week' | 'month';
type MainTabType = 'office_expenses' | 'salary_advance';

/**
 * Calculates start of day, start of week (Monday), and start of month in Asia/Dhaka (UTC+6)
 */
function getDhakaDateBoundaries() {
  const now = new Date();
  // Get current YYYY-MM-DD in Asia/Dhaka
  const dhakaDateStr = new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Dhaka',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now); // e.g. "2026-11-11"

  const [yearStr, monthStr, dayStr] = dhakaDateStr.split('-');
  const year = parseInt(yearStr, 10);
  const month = parseInt(monthStr, 10) - 1; // 0-indexed
  const day = parseInt(dayStr, 10);

  const today = dhakaDateStr;

  // First day of current month in Dhaka
  const startOfMonth = `${yearStr}-${monthStr}-01`;

  // Start of week (Monday) in Dhaka
  const dhakaDate = new Date(year, month, day);
  const dayOfWeek = dhakaDate.getDay(); // 0 is Sunday, 1 is Monday
  const distanceToMonday = dayOfWeek === 0 ? 6 : dayOfWeek - 1;
  const mondayDate = new Date(dhakaDate);
  mondayDate.setDate(dhakaDate.getDate() - distanceToMonday);

  const startOfWeek = new Intl.DateTimeFormat('en-CA', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(mondayDate);

  return { today, startOfWeek, startOfMonth };
}

export const OfficeExpensesView: React.FC<OfficeExpensesViewProps> = ({
  onOpenAddOfficeExpense,
  onEditTransaction,
  onOpenReimbursementModal,
}) => {
  const {
    transactions,
    deleteTransaction,
    salaryAdvances,
    salaryAdjustments,
    salaryAdvanceSummary,
    addSalaryAdvance,
    updateSalaryAdvance,
    deleteSalaryAdvance,
    recordSalaryAdjustment,
    deleteSalaryAdjustment,
  } = useFinance();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  // Navigation Tab: Office Expenses vs Salary Advance
  const [activeTab, setActiveTab] = useState<MainTabType>('office_expenses');

  // Office Expenses Filters
  const [periodFilter, setPeriodFilter] = useState<PeriodFilterType>('all');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [projectFilter, setProjectFilter] = useState<string>('all');
  const [deletingTxId, setDeletingTxId] = useState<string | null>(null);

  // Salary Advance State & Modals
  const [salaryMonthFilter, setSalaryMonthFilter] = useState<string>('all');
  const [isAddAdvanceModalOpen, setIsAddAdvanceModalOpen] = useState(false);
  const [isAdjustSalaryModalOpen, setIsAdjustSalaryModalOpen] = useState(false);
  const [editingAdvance, setEditingAdvance] = useState<SalaryAdvance | null>(null);
  const [deletingAdvanceId, setDeletingAdvanceId] = useState<string | null>(null);
  const [deletingAdjustmentId, setDeletingAdjustmentId] = useState<string | null>(null);

  // Salary Advance Form state
  const [advAmount, setAdvAmount] = useState('');
  const [advDate, setAdvDate] = useState(() => getDhakaDateBoundaries().today);
  const [advPurpose, setAdvPurpose] = useState('');
  const [advReceivedFrom, setAdvReceivedFrom] = useState('Office Manager');
  const [advPaymentMethod, setAdvPaymentMethod] = useState('Cash');
  const [advFormError, setAdvFormError] = useState('');

  // Salary Adjustment Form state
  const [adjAmount, setAdjAmount] = useState('');
  const [adjDate, setAdjDate] = useState(() => getDhakaDateBoundaries().today);
  const [adjSalaryMonth, setAdjSalaryMonth] = useState(() => {
    const now = new Date();
    return `${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`;
  });
  const [adjNotes, setAdjNotes] = useState('');
  const [adjFormError, setAdjFormError] = useState('');

  // All office expenses
  const officeExpenses = useMemo(() => {
    return transactions.filter((t) => t.type === 'office_expense');
  }, [transactions]);

  // Unique projects for filtering
  const uniqueProjects = useMemo(() => {
    const set = new Set<string>();
    officeExpenses.forEach((t) => {
      if (t.project_name) set.add(t.project_name);
    });
    return Array.from(set);
  }, [officeExpenses]);

  // Lifetime Totals (preserved across period changes)
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

  // Filtered List based on Period, Status, and Project
  const filteredList = useMemo(() => {
    const { today, startOfWeek, startOfMonth } = getDhakaDateBoundaries();

    return officeExpenses.filter((t) => {
      // 1. Period filter (Asia/Dhaka)
      if (periodFilter === 'today' && t.date !== today) return false;
      if (periodFilter === 'week' && (t.date < startOfWeek || t.date > today)) return false;
      if (periodFilter === 'month' && (t.date < startOfMonth || t.date > today)) return false;

      // 2. Status filter
      if (statusFilter !== 'all' && t.reimbursement_status !== statusFilter) return false;

      // 3. Project filter
      if (projectFilter !== 'all' && t.project_name !== projectFilter) return false;

      return true;
    });
  }, [officeExpenses, periodFilter, statusFilter, projectFilter]);

  // Filtered period total
  const filteredPeriodTotal = useMemo(() => {
    return filteredList.reduce((acc, t) => acc + Number(t.amount || 0), 0);
  }, [filteredList]);

  // Handler for Direct PDF Export
  const handleExportPDF = () => {
    let periodTitle = 'All Time';
    if (periodFilter === 'today') periodTitle = 'Today';
    else if (periodFilter === 'week') periodTitle = 'This Week (Mon-Sun)';
    else if (periodFilter === 'month') periodTitle = 'This Month';

    exportOfficeExpensesToPDF(filteredList, {
      periodTitle,
      totalExpense,
      totalReimbursed,
      pendingReimbursement,
    });
  };

  // Handler for Salary Advance Statement PDF Export
  const handleExportSalaryAdvancePDF = () => {
    exportSalaryAdvanceStatementToPDF(
      salaryAdvances,
      salaryAdjustments,
      {
        totalAdvanceReceived: salaryAdvanceSummary.totalAdvanceReceived,
        totalSalaryAdjusted: salaryAdvanceSummary.totalSalaryAdjusted,
        outstandingAdvance: salaryAdvanceSummary.outstandingAdvance,
        salaryMonthFilter,
      }
    );
  };

  // Salary advance handlers
  const handleOpenAddAdvance = () => {
    setAdvAmount('');
    setAdvDate(getDhakaDateBoundaries().today);
    setAdvPurpose('');
    setAdvReceivedFrom('Office Manager');
    setAdvPaymentMethod('Cash');
    setAdvFormError('');
    setIsAddAdvanceModalOpen(true);
  };

  const handleSaveSalaryAdvance = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdvFormError('');
    const amt = parseFloat(advAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setAdvFormError(isBn ? 'সঠিক টাকার পরিমাণ দিন' : 'Please enter a valid amount greater than 0');
      return;
    }
    if (!advPurpose.trim()) {
      setAdvFormError(isBn ? 'উদ্দেশ্য বা বিবরণ লিখুন' : 'Please enter a purpose or note');
      return;
    }

    try {
      if (editingAdvance) {
        await updateSalaryAdvance({
          ...editingAdvance,
          amount: amt,
          date: advDate,
          purpose: advPurpose.trim(),
          received_from: advReceivedFrom.trim() || 'Office Manager',
          payment_method: advPaymentMethod,
        });
        setEditingAdvance(null);
      } else {
        await addSalaryAdvance({
          amount: amt,
          date: advDate,
          purpose: advPurpose.trim(),
          received_from: advReceivedFrom.trim() || 'Office Manager',
          payment_method: advPaymentMethod,
        });
      }
      setIsAddAdvanceModalOpen(false);
    } catch (err: any) {
      setAdvFormError(err.message || 'Error saving salary advance');
    }
  };

  const handleOpenEditAdvance = (adv: SalaryAdvance) => {
    setEditingAdvance(adv);
    setAdvAmount(String(adv.amount));
    setAdvDate(adv.date);
    setAdvPurpose(adv.purpose);
    setAdvReceivedFrom(adv.received_from);
    setAdvPaymentMethod(adv.payment_method);
    setAdvFormError('');
    setIsAddAdvanceModalOpen(true);
  };

  const handleOpenAdjustSalary = () => {
    setAdjAmount('');
    setAdjDate(getDhakaDateBoundaries().today);
    const now = new Date();
    setAdjSalaryMonth(`${now.toLocaleString('en-US', { month: 'long' })} ${now.getFullYear()}`);
    setAdjNotes('');
    setAdjFormError('');
    setIsAdjustSalaryModalOpen(true);
  };

  const handleSaveSalaryAdjustment = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdjFormError('');
    const amt = parseFloat(adjAmount);
    if (!amt || isNaN(amt) || amt <= 0) {
      setAdjFormError(isBn ? 'সঠিক সমন্বয় পরিমাণ দিন' : 'Please enter a valid adjustment amount');
      return;
    }
    if (amt > salaryAdvanceSummary.outstandingAdvance) {
      setAdjFormError(
        isBn
          ? `সমন্বয়ের পরিমাণ বকেয়া অগ্রিমের (${formatBDT(salaryAdvanceSummary.outstandingAdvance)}) চেয়ে বেশি হতে পারে না`
          : `Adjustment amount cannot exceed outstanding advance balance (${formatBDT(salaryAdvanceSummary.outstandingAdvance)})`
      );
      return;
    }

    try {
      await recordSalaryAdjustment({
        amount: amt,
        adjustment_date: adjDate,
        salary_month: adjSalaryMonth.trim(),
        notes: adjNotes.trim() || undefined,
      });
      setIsAdjustSalaryModalOpen(false);
    } catch (err: any) {
      setAdjFormError(err.message || 'Error recording salary adjustment');
    }
  };

  // Unique months in salary adjustments for filter
  const uniqueSalaryMonths = useMemo(() => {
    const set = new Set<string>();
    salaryAdjustments.forEach((adj) => {
      if (adj.salary_month) set.add(adj.salary_month);
    });
    return Array.from(set);
  }, [salaryAdjustments]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Top Segmented Navigation Tabs */}
      <div className="flex items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200 dark:border-slate-800 max-w-md">
        <button
          type="button"
          onClick={() => setActiveTab('office_expenses')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'office_expenses'
              ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Building2 className="w-4 h-4 shrink-0" />
          <span>{isBn ? 'অফিস খরচ' : 'Office Expenses'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('salary_advance')}
          className={`flex-1 flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs sm:text-sm font-bold transition ${
            activeTab === 'salary_advance'
              ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Wallet className="w-4 h-4 shrink-0" />
          <span>{isBn ? 'অগ্রিম বেতন' : 'Salary Advance'}</span>
        </button>
      </div>

      {/* ========================================================================= */}
      {/* TAB 1: OFFICE EXPENSES MANAGEMENT */}
      {/* ========================================================================= */}
      {activeTab === 'office_expenses' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Building2 className="w-5 h-5 text-amber-500" />
                <span>{isBn ? 'অফিস খরচ ব্যবস্থাপনা' : 'Office Expense Management'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {isBn
                  ? 'অফিস প্রজেক্টের খরচ ও রিইমবার্সমেন্ট দাবি'
                  : 'Segregated office project expenses & reimbursement claims receivable'}
              </p>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto">
              {/* Direct PDF Export Button */}
              <button
                type="button"
                onClick={handleExportPDF}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition active:scale-95 shadow-xs"
                title={isBn ? 'পিডিএফ রিপোর্ট ডাউনলোড করুন' : 'Download clean PDF report'}
              >
                <Download className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
                <span>{isBn ? 'এক্সপোর্ট (PDF)' : 'Export (PDF)'}</span>
              </button>
              <button
                type="button"
                onClick={onOpenAddOfficeExpense}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-amber-600 hover:bg-amber-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? '+ অফিস খরচ যোগ করুন' : '+ Add Office Expense'}</span>
              </button>
            </div>
          </div>

          {/* Lifetime Summary KPI Cards (Always preserved) */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500">
                {isBn ? 'মোট অফিস খরচ' : 'Total Office Expenses'}
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                {formatBDT(totalExpense)}
              </div>
              <span className="text-[10px] text-slate-400">
                {isBn ? `${officeExpenses.length}টি মোট ভাউচার রসিদ` : `${officeExpenses.length} total office receipts`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500">
                {isBn ? 'মোট রিইমবার্সড গৃহীত' : 'Total Reimbursed'}
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                {formatBDT(totalReimbursed)}
              </div>
              <span className="text-[10px] text-slate-400">
                {isBn ? 'অ্যাকাউন্টে সরাসরি ক্রেডিট হয়েছে' : 'Credited directly to your account'}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-amber-50/70 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-900/60 shadow-xs">
              <span className="text-[11px] font-bold text-amber-800 dark:text-amber-300">
                {isBn ? 'বকেয়া রিইমবার্সমেন্ট পাওনা' : 'Pending Reimbursement Receivable'}
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
                {formatBDT(pendingReimbursement)}
              </div>
              <span className="text-[10px] text-amber-700/80 dark:text-amber-400/80">
                {isBn ? 'অফিসের নিকট আপনার পাওনা টাকা' : 'Amount owed to you by office'}
              </span>
            </div>
          </div>

          {/* Period Filter Strip & Status/Project Selectors */}
          <div className="p-3.5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-3">
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
              {/* Segmented Period Filter (Today / This Week / This Month / All) */}
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-xs font-semibold text-slate-500 mr-1 flex items-center gap-1">
                  <Calendar className="w-3.5 h-3.5 text-amber-500" />
                  <span>{isBn ? 'সময়কাল:' : 'Period:'}</span>
                </span>
                {(
                  [
                    { key: 'all', labelEn: 'All Time', labelBn: 'সব সময়' },
                    { key: 'today', labelEn: 'Today', labelBn: 'আজকে' },
                    { key: 'week', labelEn: 'This Week', labelBn: 'এই সপ্তাহ' },
                    { key: 'month', labelEn: 'This Month', labelBn: 'এই মাস' },
                  ] as const
                ).map((tab) => (
                  <button
                    key={tab.key}
                    type="button"
                    onClick={() => setPeriodFilter(tab.key)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition active:scale-95 ${
                      periodFilter === tab.key
                        ? 'bg-amber-500 text-white shadow-xs'
                        : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-700'
                    }`}
                  >
                    {isBn ? tab.labelBn : tab.labelEn}
                  </button>
                ))}
              </div>

              {/* Status and Project Dropdown Filters */}
              <div className="flex flex-wrap items-center gap-2">
                <div className="flex items-center gap-1.5">
                  <Filter className="w-3.5 h-3.5 text-slate-400" />
                  <select
                    value={statusFilter}
                    onChange={(e) => setStatusFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <option value="all">{isBn ? 'সব স্ট্যাটাস' : 'All Statuses'}</option>
                    <option value="Not Submitted">{isBn ? 'জমা দেওয়া হয়নি' : 'Not Submitted'}</option>
                    <option value="Submitted">{isBn ? 'জমা দেওয়া হয়েছে' : 'Submitted'}</option>
                    <option value="Partially Reimbursed">{isBn ? 'আংশিক পরিশোধিত' : 'Partially Reimbursed'}</option>
                    <option value="Fully Reimbursed">{isBn ? 'সম্পূর্ণ পরিশোধিত' : 'Fully Reimbursed'}</option>
                  </select>
                </div>

                {uniqueProjects.length > 0 && (
                  <select
                    value={projectFilter}
                    onChange={(e) => setProjectFilter(e.target.value)}
                    className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium"
                  >
                    <option value="all">{isBn ? 'সব প্রজেক্ট' : 'All Projects'}</option>
                    {uniqueProjects.map((p) => (
                      <option key={p} value={p}>
                        {p}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </div>

            {/* Filtered Period Indicator */}
            {periodFilter !== 'all' && (
              <div className="pt-2 border-t border-slate-100 dark:border-slate-800 flex items-center justify-between text-xs text-slate-500">
                <span>
                  {isBn ? 'ফিল্টারকৃত সময়কালের মোট খরচ:' : 'Filtered Period Office Expense:'}{' '}
                  <strong className="text-amber-600 dark:text-amber-400 font-mono tabular-nums">
                    {formatBDT(filteredPeriodTotal)}
                  </strong>
                </span>
                <span className="text-[11px] text-slate-400">
                  {filteredList.length} {isBn ? 'টি এন্ট্রি' : 'entries'}
                </span>
              </div>
            )}
          </div>

          {/* Office Expenses Records List */}
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
                        {isBn ? 'পরিশোধিত:' : 'Reimbursed:'}{' '}
                        <strong className="text-emerald-600 font-mono tabular-nums">
                          {formatBDT(reimbursedAmount)}
                        </strong>
                      </span>
                      <span className="text-slate-400">|</span>
                      <span className="text-slate-500">
                        {isBn ? 'বকেয়া দাবি:' : 'Pending Claim:'}{' '}
                        <strong className="text-amber-600 font-mono tabular-nums">
                          {formatBDT(pendingThis)}
                        </strong>
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
                        type="button"
                        onClick={() => onOpenReimbursementModal(tx)}
                        className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold shadow-xs transition active:scale-95"
                        title={isBn ? 'রিইমবার্সমেন্ট পেমেন্ট রেকর্ড করুন' : 'Record reimbursement payment'}
                      >
                        <FileCheck className="w-3.5 h-3.5" />
                        <span>{isBn ? 'ক্লেম ক্লিয়ার' : 'Clear Claim'}</span>
                      </button>
                    )}

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onEditTransaction(tx)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                        title={isBn ? 'সম্পাদনা' : 'Edit'}
                      >
                        <Edit2 className="w-4 h-4" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingTxId(tx.id)}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 transition"
                        title={isBn ? 'মুছে ফেলুন' : 'Delete'}
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
                {isBn ? 'কোন অফিস খরচের রেকর্ড পাওয়া যায়নি।' : 'No office expenses recorded under this filter.'}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* TAB 2: SALARY ADVANCE & ADJUSTMENTS */}
      {/* ========================================================================= */}
      {activeTab === 'salary_advance' && (
        <div className="space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div>
              <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Wallet className="w-5 h-5 text-emerald-500" />
                <span>{isBn ? 'অগ্রিম বেতন ও সমন্বয়' : 'Salary Advance & Adjustments'}</span>
              </h2>
              <p className="text-xs text-slate-500">
                {isBn
                  ? 'কোম্পানি থেকে অগ্রিম গ্রহণ ও বেতন সমন্বয় ট্র্যাকিং (আয় বা ব্যয়ের সাথে দ্বৈত গণনা মুক্ত)'
                  : 'Track company advance loans and monthly salary deductions without affecting income ledgers'}
              </p>
            </div>
            <div className="flex items-center gap-2 self-stretch sm:self-auto flex-wrap">
              <button
                type="button"
                onClick={handleExportSalaryAdvancePDF}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition active:scale-95 shadow-xs"
                title={isBn ? 'অগ্রিম বেতনের পিডিএফ স্টেটমেন্ট ডাউনলোড করুন' : 'Download clean PDF statement'}
              >
                <Download className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                <span>{isBn ? 'এক্সপোর্ট (PDF)' : 'Export (PDF)'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAdjustSalary}
                disabled={salaryAdvanceSummary.outstandingAdvance <= 0}
                className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl border border-emerald-600 text-emerald-700 dark:text-emerald-400 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-xs font-bold transition active:scale-95 disabled:opacity-40 disabled:cursor-not-allowed"
              >
                <TrendingDown className="w-4 h-4" />
                <span>{isBn ? '+ বেতন থেকে সমন্বয়' : '+ Adjust Salary'}</span>
              </button>
              <button
                type="button"
                onClick={handleOpenAddAdvance}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>{isBn ? '+ অগ্রিম বেতন গ্রহণ' : '+ Add Salary Advance'}</span>
              </button>
            </div>
          </div>

          {/* Accounting Rules Info Card */}
          <div className="flex items-start gap-3 p-3.5 rounded-2xl bg-slate-50 dark:bg-slate-900/60 border border-slate-200 dark:border-slate-800 text-xs text-slate-600 dark:text-slate-400">
            <Info className="w-4 h-4 text-emerald-500 shrink-0 mt-0.5" />
            <p className="leading-relaxed">
              {isBn ? (
                <>
                  <strong>অ্যাকাউন্টিং নীতি:</strong> অগ্রিম বেতন হলো কোম্পানি থেকে প্রাপ্ত ঋণ, যা নিয়মিত
                  আয়ের অন্তর্ভুক্ত নয়। একইভাবে বেতন থেকে সমন্বয় কোনো ব্যক্তিগত ব্যয় নয়, বরং বকেয়া
                  অগ্রিম ব্যালেন্স পরিশোধ।
                </>
              ) : (
                <>
                  <strong>Accounting Rule:</strong> Salary advances are company advance loans and not counted
                  as monthly income. Similarly, monthly payroll adjustments deduct from outstanding advances
                  without creating double-counted expenses.
                </>
              )}
            </p>
          </div>

          {/* 3 KPI Summary Cards */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500">
                {isBn ? 'মোট গৃহীত অগ্রিম' : 'Total Advance Received'}
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-1">
                {formatBDT(salaryAdvanceSummary.totalAdvanceReceived)}
              </div>
              <span className="text-[10px] text-slate-400">
                {isBn
                  ? `${salaryAdvances.length} বার অফিস থেকে প্রাপ্ত`
                  : `${salaryAdvances.length} advance entries recorded`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <span className="text-[11px] font-semibold text-slate-500">
                {isBn ? 'মোট বেতন থেকে সমন্বয়' : 'Total Salary Adjusted'}
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                {formatBDT(salaryAdvanceSummary.totalSalaryAdjusted)}
              </div>
              <span className="text-[10px] text-slate-400">
                {isBn
                  ? `${salaryAdjustments.length} মাসের বেতন থেকে কর্তন`
                  : `${salaryAdjustments.length} payroll deductions completed`}
              </span>
            </div>

            <div className="p-4 rounded-2xl bg-emerald-50/70 dark:bg-emerald-950/20 border border-emerald-200 dark:border-emerald-900/60 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-800 dark:text-emerald-300">
                {isBn ? 'বকেয়া অগ্রিম স্থিতি' : 'Outstanding Advance Balance'}
              </span>
              <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
                {formatBDT(salaryAdvanceSummary.outstandingAdvance)}
              </div>
              <span className="text-[10px] text-emerald-700/80 dark:text-emerald-400/80">
                {salaryAdvanceSummary.outstandingAdvance > 0
                  ? isBn
                    ? 'পরবর্তী মাসের বেতন থেকে সমন্বয়যোগ্য'
                    : 'Pending deduction in future salary'
                  : isBn
                  ? 'কোনো বকেয়া নেই (সম্পূর্ণ পরিশোধিত)'
                  : 'All advances fully cleared'}
              </span>
            </div>
          </div>

          {/* Month Filter Selector */}
          {uniqueSalaryMonths.length > 0 && (
            <div className="flex items-center justify-between p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
              <div className="flex items-center gap-2">
                <Filter className="w-4 h-4 text-emerald-500" />
                <span className="text-xs font-semibold text-slate-600 dark:text-slate-400">
                  {isBn ? 'বেতনের মাস ফিল্টার:' : 'Filter by Salary Month:'}
                </span>
              </div>
              <select
                value={salaryMonthFilter}
                onChange={(e) => setSalaryMonthFilter(e.target.value)}
                className="px-3 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-700 dark:text-slate-300 font-medium"
              >
                <option value="all">{isBn ? 'সকল মাস' : 'All Months'}</option>
                {uniqueSalaryMonths.map((m) => (
                  <option key={m} value={m}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}

          {/* Split Sections: Salary Advances List & Salary Adjustments List */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left: Advances Received */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <Coins className="w-4 h-4 text-emerald-500" />
                  <span>{isBn ? 'গৃহীত অগ্রিম তালিকা' : 'Advances Received History'}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {salaryAdvances.length} {isBn ? 'টি রেকর্ড' : 'records'}
                </span>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {salaryAdvances.map((adv) => (
                  <div
                    key={adv.id}
                    className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs sm:text-sm font-bold text-slate-900 dark:text-white truncate">
                          {adv.purpose}
                        </span>
                      </div>
                      <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                        <span>{formatDate(adv.date)}</span>
                        <span>·</span>
                        <span>{isBn ? 'প্রদানকারী:' : 'From:'} {adv.received_from}</span>
                        <span>·</span>
                        <span className="px-1.5 py-0.2 rounded bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
                          {adv.payment_method}
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <div className="text-sm font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                        {formatBDT(adv.amount)}
                      </div>
                      <button
                        type="button"
                        onClick={() => handleOpenEditAdvance(adv)}
                        className="p-1 rounded-lg text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition"
                        title={isBn ? 'সম্পাদনা' : 'Edit'}
                      >
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setDeletingAdvanceId(adv.id)}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                        title={isBn ? 'মুছে ফেলুন' : 'Delete'}
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                ))}

                {salaryAdvances.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    {isBn ? 'কোন অগ্রিম বেতনের রেকর্ড নেই।' : 'No salary advances recorded.'}
                  </div>
                )}
              </div>
            </div>

            {/* Right: Salary Adjustments / Payroll Deductions */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-slate-900 dark:text-white flex items-center gap-2">
                  <TrendingDown className="w-4 h-4 text-emerald-500" />
                  <span>{isBn ? 'বেতন সমন্বয় রেকর্ড' : 'Salary Adjustments Record'}</span>
                </h3>
                <span className="text-xs text-slate-400">
                  {salaryAdjustments.length} {isBn ? 'টি সমন্বয়' : 'deductions'}
                </span>
              </div>

              <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
                {salaryAdjustments
                  .filter((adj) => salaryMonthFilter === 'all' || adj.salary_month === salaryMonthFilter)
                  .map((adj) => (
                    <div
                      key={adj.id}
                      className="p-3.5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex items-center justify-between gap-3"
                    >
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="text-xs sm:text-sm font-bold text-emerald-600 dark:text-emerald-400">
                            {adj.salary_month}
                          </span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-emerald-100 dark:bg-emerald-950/80 text-emerald-800 dark:text-emerald-300 font-semibold">
                            {isBn ? 'সমন্বিত' : 'Adjusted'}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-slate-500 mt-1">
                          <span>{isBn ? 'সমন্বয়ের তারিখ:' : 'Date:'} {formatDate(adj.adjustment_date)}</span>
                          {adj.notes && (
                            <>
                              <span>·</span>
                              <span className="truncate italic">"{adj.notes}"</span>
                            </>
                          )}
                        </div>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <div className="text-sm font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
                          -{formatBDT(adj.amount)}
                        </div>
                        <button
                          type="button"
                          onClick={() => setDeletingAdjustmentId(adj.id)}
                          className="p-1 rounded-lg text-slate-400 hover:text-rose-600 transition"
                          title={isBn ? 'সমন্বয় বাতিল' : 'Delete Adjustment'}
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}

                {salaryAdjustments.length === 0 && (
                  <div className="p-8 text-center text-xs text-slate-400">
                    {isBn
                      ? 'এখনো কোন বেতন সমন্বয় করা হয়নি।'
                      : 'No salary adjustments recorded yet.'}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 1: ADD / EDIT SALARY ADVANCE */}
      {/* ========================================================================= */}
      {isAddAdvanceModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <Coins className="w-5 h-5 text-emerald-500" />
                <span>
                  {editingAdvance
                    ? isBn
                      ? 'অগ্রিম বেতন সম্পাদনা'
                      : 'Edit Salary Advance'
                    : isBn
                    ? 'অগ্রিম বেতন গ্রহণ যোগ করুন'
                    : 'Add Salary Advance'}
                </span>
              </h3>
              <button
                type="button"
                onClick={() => {
                  setIsAddAdvanceModalOpen(false);
                  setEditingAdvance(null);
                }}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {advFormError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{advFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSalaryAdvance} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isBn ? 'টাকার পরিমাণ (BDT) *' : 'Advance Amount (BDT) *'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  value={advAmount}
                  onChange={(e) => setAdvAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isBn ? 'গ্রহণের তারিখ *' : 'Received Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={advDate}
                    onChange={(e) => setAdvDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isBn ? 'পেমেন্ট মাধ্যম' : 'Payment Method'}
                  </label>
                  <select
                    value={advPaymentMethod}
                    onChange={(e) => setAdvPaymentMethod(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank">Bank Transfer</option>
                    <option value="bKash">bKash</option>
                    <option value="Nagad">Nagad</option>
                    <option value="Other">Other</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isBn ? 'কার নিকট হতে প্রাপ্ত' : 'Received From'}
                </label>
                <input
                  type="text"
                  placeholder="Office Manager / HR / Accounts"
                  value={advReceivedFrom}
                  onChange={(e) => setAdvReceivedFrom(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isBn ? 'উদ্দেশ্য বা নোট *' : 'Purpose / Note *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={isBn ? 'যেমন: পারিবারিক জরুরি খরচ' : 'e.g., Medical emergency, Festival'}
                  value={advPurpose}
                  onChange={(e) => setAdvPurpose(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => {
                    setIsAddAdvanceModalOpen(false);
                    setEditingAdvance(null);
                  }}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  {editingAdvance ? (isBn ? 'আপডেট করুন' : 'Update') : (isBn ? 'সংরক্ষণ করুন' : 'Save Advance')}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* MODAL 2: ADJUST SALARY MODAL */}
      {/* ========================================================================= */}
      {isAdjustSalaryModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-base font-bold text-slate-900 dark:text-white flex items-center gap-2">
                <TrendingDown className="w-5 h-5 text-emerald-500" />
                <span>{isBn ? 'মাসিক বেতন থেকে সমন্বয়' : 'Adjust from Monthly Salary'}</span>
              </h3>
              <button
                type="button"
                onClick={() => setIsAdjustSalaryModalOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-3 rounded-xl bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900/50 flex items-center justify-between text-xs">
              <span className="text-slate-600 dark:text-slate-400">
                {isBn ? 'বর্তমান বকেয়া অগ্রিম:' : 'Current Outstanding Advance:'}
              </span>
              <strong className="text-emerald-700 dark:text-emerald-300 font-mono text-sm">
                {formatBDT(salaryAdvanceSummary.outstandingAdvance)}
              </strong>
            </div>

            {adjFormError && (
              <div className="p-3 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs font-semibold text-rose-600 dark:text-rose-400 flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{adjFormError}</span>
              </div>
            )}

            <form onSubmit={handleSaveSalaryAdjustment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isBn ? 'সমন্বয়ের পরিমাণ (BDT) *' : 'Adjustment Amount (BDT) *'}
                </label>
                <input
                  type="number"
                  step="any"
                  required
                  placeholder="0.00"
                  max={salaryAdvanceSummary.outstandingAdvance}
                  value={adjAmount}
                  onChange={(e) => setAdjAmount(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-sm font-bold font-mono text-slate-900 dark:text-white focus:outline-hidden focus:ring-2 focus:ring-emerald-500"
                />
                <span className="text-[10px] text-slate-400 mt-1 block">
                  {isBn
                    ? `সর্বোচ্চ সমন্বয় সম্ভব: ${formatBDT(salaryAdvanceSummary.outstandingAdvance)}`
                    : `Max allowable adjustment: ${formatBDT(salaryAdvanceSummary.outstandingAdvance)}`}
                </span>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isBn ? 'বেতনের মাস *' : 'Salary Month *'}
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g., November 2026"
                    value={adjSalaryMonth}
                    onChange={(e) => setAdjSalaryMonth(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                    {isBn ? 'সমন্বয়ের তারিখ *' : 'Adjustment Date *'}
                  </label>
                  <input
                    type="date"
                    required
                    value={adjDate}
                    onChange={(e) => setAdjDate(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                  {isBn ? 'নোট / রেফারেন্স' : 'Notes / Salary Slip Ref'}
                </label>
                <input
                  type="text"
                  placeholder={isBn ? 'যেমন: নভেম্বর মাসের বেতন স্লিপে কর্তন' : 'e.g., Deducted in salary voucher #89'}
                  value={adjNotes}
                  onChange={(e) => setAdjNotes(e.target.value)}
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2 border-t border-slate-100 dark:border-slate-800">
                <button
                  type="button"
                  onClick={() => setIsAdjustSalaryModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  {isBn ? 'বাতিল' : 'Cancel'}
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition active:scale-95"
                >
                  {isBn ? 'সমন্বয় নিশ্চিত করুন' : 'Confirm Adjustment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* DELETE DIALOGS */}
      {/* ========================================================================= */}
      {deletingTxId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isBn ? 'অফিস খরচ মুছে ফেলবেন?' : 'Delete Office Expense?'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn
                ? 'এই লেনদেনটি মুছে ফেলা হবে এবং সংশ্লিষ্ট হিসাব সমন্বয় করা হবে।'
                : 'This will remove the transaction and restore account balances.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingTxId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteTransaction(deletingTxId);
                  setDeletingTxId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
              >
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingAdvanceId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isBn ? 'অগ্রিম বেতনের রেকর্ড মুছে ফেলবেন?' : 'Delete Salary Advance Record?'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn
                ? 'এটি বকেয়া অগ্রিম হিসাব থেকে অপসারিত হবে।'
                : 'This record will be removed from your advance balance.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingAdvanceId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteSalaryAdvance(deletingAdvanceId);
                  setDeletingAdvanceId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
              >
                {isBn ? 'মুছে ফেলুন' : 'Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {deletingAdjustmentId && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isBn ? 'বেতন সমন্বয় রেকর্ড মুছে ফেলবেন?' : 'Delete Salary Adjustment Record?'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn
                ? 'এটি মুছে ফেললে সমন্বিত অর্থ পুনরায় বকেয়া অগ্রিমে যোগ হবে।'
                : 'This will revert the deduction back into outstanding advance.'}
            </p>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingAdjustmentId(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteSalaryAdjustment(deletingAdjustmentId);
                  setDeletingAdjustmentId(null);
                }}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition"
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
