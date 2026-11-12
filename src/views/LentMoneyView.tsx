import React, { useState, useMemo } from 'react';
import {
  Send,
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
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Lending } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';
import { exportMoneyLentReportToPDF } from '../utils/pdfExport';

interface LentMoneyViewProps {
  onOpenAddLending: () => void;
  onOpenCollectionModal: (lending: Lending) => void;
  onEditLending?: (lending: Lending) => void;
}

export const LentMoneyView: React.FC<LentMoneyViewProps> = ({
  onOpenAddLending,
  onOpenCollectionModal,
  onEditLending,
}) => {
  const { lendings, lendingCollections, deleteLending } = useFinance();
  const { t, isBn } = useLanguage();

  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'Uncollected' | 'Partially Collected' | 'Fully Collected'>('all');
  const [selectedMonth, setSelectedMonth] = useState<string>('all');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [showCustomDate, setShowCustomDate] = useState<boolean>(false);

  const [selectedLendingHistory, setSelectedLendingHistory] = useState<Lending | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  // Derive unique months available in lending records (YYYY-MM)
  const availableMonths = useMemo(() => {
    const set = new Set<string>();
    lendings.forEach((l) => {
      if (l.lending_date) {
        set.add(l.lending_date.slice(0, 7));
      }
    });
    return Array.from(set).sort().reverse();
  }, [lendings]);

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

  // Filtered lendings list
  const filteredList = useMemo(() => {
    return lendings.filter((l) => {
      // Status filter
      if (statusFilter !== 'all' && l.status !== statusFilter) return false;

      // Month filter
      if (selectedMonth !== 'all' && l.lending_date) {
        if (!l.lending_date.startsWith(selectedMonth)) return false;
      }

      // Custom date range
      if (startDate && l.lending_date && l.lending_date < startDate) return false;
      if (endDate && l.lending_date && l.lending_date > endDate) return false;

      // Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchName = l.person_name.toLowerCase().includes(q);
        const matchPhone = l.phone_number?.toLowerCase().includes(q);
        const matchPurpose = l.purpose?.toLowerCase().includes(q);
        const matchMethod = l.payment_method?.toLowerCase().includes(q);
        if (!matchName && !matchPhone && !matchPurpose && !matchMethod) return false;
      }

      return true;
    });
  }, [lendings, statusFilter, selectedMonth, startDate, endDate, searchQuery]);

  // Totals based on filtered list
  const { totalLent, totalCollected, remainingReceivable } = useMemo(() => {
    let len = 0;
    let col = 0;
    filteredList.forEach((l) => {
      len += Number(l.amount);
      col += Number(l.collected_amount || 0);
    });
    return {
      totalLent: len,
      totalCollected: col,
      remainingReceivable: Math.max(0, len - col),
    };
  }, [filteredList]);

  // Filtered collections for PDF
  const filteredCollections = useMemo(() => {
    const validIds = new Set(filteredList.map((l) => l.id));
    return lendingCollections.filter((c) => validIds.has(c.lending_id));
  }, [filteredList, lendingCollections]);

  // Handle PDF Export
  const handleExportPDF = () => {
    let periodTitle = isBn ? 'সকল রেকর্ড' : 'All Records';
    if (selectedMonth !== 'all') {
      periodTitle = formatMonthLabel(selectedMonth);
    } else if (startDate || endDate) {
      periodTitle = `${startDate || 'Start'} to ${endDate || 'Present'}`;
    }

    exportMoneyLentReportToPDF(filteredList, filteredCollections, {
      periodTitle,
      totalLent,
      totalCollected,
      remainingReceivable,
    });
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 text-[11px] font-bold mb-1.5">
            {isBn ? 'সেকশন এ · পাওনা টাকা' : 'Section A · Receivables'}
          </div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <Send className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span>
              {isBn
                ? 'ধার দেওয়া টাকা (যে টাকা আমি অন্যকে ধার দিয়েছি)'
                : 'Money Lent (Receivables Hub)'}
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {isBn
              ? 'সহকর্মী, বন্ধু ও পরিবারকে দেওয়া ধার, পেমেন্ট মাধ্যম, কিস্তি আদায় ও বকেয়া পাওনার হিসাব'
              : 'Track money lent to friends, family & colleagues with payment method, dates & collections'}
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-2.5 self-stretch sm:self-auto shrink-0">
          <button
            type="button"
            onClick={handleExportPDF}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-3.5 py-2.5 rounded-xl border border-blue-200 dark:border-blue-900/60 bg-blue-50 dark:bg-blue-950/40 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-xs font-bold text-blue-700 dark:text-blue-300 transition shadow-2xs"
            title={isBn ? 'পিডিএফ রিপোর্ট ডাউনলোড করুন' : 'Export Money Lent Report PDF'}
          >
            <FileDown className="w-4 h-4 text-blue-600 dark:text-blue-400" />
            <span>{isBn ? 'এক্সপোর্ট রিপোর্ট (PDF)' : 'Export (PDF)'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenAddLending}
            className="flex-1 sm:flex-initial flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>{isBn ? 'ধার দেওয়া যোগ করুন' : 'Record Lending'}</span>
          </button>
        </div>
      </div>

      {/* KPI Cards Strip */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* KPI 1: Total Lent */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            {isBn ? 'মোট ধার দেওয়া (মূলধন)' : 'Total Lent (Principal)'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400 mt-1">
            {formatBDT(totalLent)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isBn ? `${filteredList.length}টি ধার দেওয়ার হিসাব` : `${filteredList.length} total lending entries`}
          </span>
        </div>

        {/* KPI 2: Total Collected Back */}
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500 block">
            {isBn ? 'মোট আদায়কৃত টাকা' : 'Total Collected Back'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(totalCollected)}
          </div>
          <span className="text-[10px] text-slate-400 mt-0.5 block">
            {isBn ? 'নিরাপদে ফেরত পাওয়া গেছে' : 'Safely recovered installments'}
          </span>
        </div>

        {/* KPI 3: Remaining Receivable */}
        <div className="p-4 rounded-2xl bg-indigo-50/70 dark:bg-indigo-950/20 border border-indigo-200 dark:border-indigo-900/60 shadow-xs">
          <span className="text-[11px] font-bold text-indigo-800 dark:text-indigo-300 block">
            {isBn ? 'অবশিষ্ট বকেয়া পাওনা (পাবো)' : 'Remaining Receivable (Owed to Me)'}
          </span>
          <div className="text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400 mt-1">
            {formatBDT(remainingReceivable)}
          </div>
          <span className="text-[10px] text-indigo-700/80 dark:text-indigo-400/80 mt-0.5 block">
            {isBn ? 'বর্তমান বকেয়া পাওনা সম্পদ' : 'Active receivable asset balance'}
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
              placeholder={isBn ? 'নাম, ফোন নম্বর, উদ্দেশ্য বা মাধ্যম দিয়ে খুঁজুন...' : "Search by borrower's name, phone, purpose or method..."}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                className="pl-8 pr-8 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs font-semibold text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
                  ? 'border-blue-500 bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300'
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
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-xs font-medium text-slate-500">{isBn ? 'শেষ:' : 'To:'}</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => {
                setEndDate(e.target.value);
                setSelectedMonth('all');
              }}
              className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-xs text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
          {(['all', 'Uncollected', 'Partially Collected', 'Fully Collected'] as const).map((st) => {
            const labelMap: Record<string, string> = {
              all: isBn ? 'সকল রেকর্ড' : 'All',
              Uncollected: isBn ? 'অনাদায়কৃত' : 'Uncollected',
              'Partially Collected': isBn ? 'আংশিক আদায়কৃত' : 'Partially Collected',
              'Fully Collected': isBn ? 'সম্পূর্ণ আদায়কৃত' : 'Fully Collected',
            };
            return (
              <button
                key={st}
                type="button"
                onClick={() => setStatusFilter(st)}
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition ${
                  statusFilter === st
                    ? 'bg-blue-600 text-white shadow-2xs'
                    : 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700'
                }`}
              >
                {labelMap[st]}
              </button>
            );
          })}
        </div>
      </div>

      {/* Organized List of Money Lent Records */}
      <div className="rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs overflow-hidden divide-y divide-slate-100 dark:divide-slate-800">
        {filteredList.map((l) => {
          const remaining = Math.max(0, l.amount - (l.collected_amount || 0));
          const isFully = l.status === 'Fully Collected';
          const methodDisplay = l.payment_method || 'Cash';

          return (
            <div
              key={l.id}
              className="p-4 sm:p-5 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition flex flex-col md:flex-row md:items-center justify-between gap-4"
            >
              {/* Record Left: Details */}
              <div className="min-w-0 flex-1 space-y-2">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-base font-bold text-slate-900 dark:text-white">
                    {l.person_name}
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
                        : l.status === 'Partially Collected'
                        ? 'bg-amber-100 text-amber-800 dark:bg-amber-950/80 dark:text-amber-300'
                        : 'bg-blue-100 text-blue-800 dark:bg-blue-950/80 dark:text-blue-300'
                    }`}
                  >
                    {isFully
                      ? (isBn ? 'সম্পূর্ণ আদায়কৃত' : 'Fully Collected')
                      : l.status === 'Partially Collected'
                      ? (isBn ? 'আংশিক আদায়কৃত' : 'Partially Collected')
                      : (isBn ? 'অনাদায়কৃত' : 'Uncollected')}
                  </span>
                </div>

                {/* Metadata row */}
                <div className="flex flex-wrap items-center gap-y-1 gap-x-3 text-xs text-slate-500">
                  <span className="flex items-center gap-1 font-mono">
                    <Calendar className="w-3.5 h-3.5 text-slate-400" />
                    <span>{isBn ? 'তারিখ:' : 'Date:'} {formatDate(l.lending_date)}</span>
                  </span>

                  {l.phone_number && (
                    <span className="flex items-center gap-1 font-mono">
                      <Phone className="w-3.5 h-3.5 text-slate-400" />
                      <span>{l.phone_number}</span>
                    </span>
                  )}

                  {l.expected_return_date && (
                    <span className="flex items-center gap-1 text-blue-600 dark:text-blue-400 font-semibold font-mono">
                      <Clock className="w-3.5 h-3.5" />
                      <span>{isBn ? 'সম্ভাব্য ফেরত:' : 'Expected Return:'} {formatDate(l.expected_return_date)}</span>
                    </span>
                  )}

                  {l.purpose && (
                    <span className="text-slate-600 dark:text-slate-300">
                      <strong>{isBn ? 'উদ্দেশ্য:' : 'Purpose:'}</strong> {l.purpose}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                <div className="max-w-md pt-1">
                  <div className="flex justify-between text-[11px] text-slate-500 mb-1">
                    <span>
                      {isBn ? 'আদায় হয়েছে:' : 'Collected:'}{' '}
                      <strong className="text-emerald-600 font-mono">{formatBDT(l.collected_amount || 0)}</strong>
                    </span>
                    <span>
                      {isBn ? 'বাকি পাওনা:' : 'Remaining:'}{' '}
                      <strong className="text-blue-600 font-mono">{formatBDT(remaining)}</strong>
                    </span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 dark:bg-slate-800 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-emerald-500 rounded-full transition-all"
                      style={{ width: `${Math.min(100, ((l.collected_amount || 0) / l.amount) * 100)}%` }}
                    />
                  </div>
                </div>

                {l.notes && (
                  <p className="text-xs text-slate-500 italic bg-slate-50 dark:bg-slate-800/40 p-2 rounded-lg inline-block">
                    "{l.notes}"
                  </p>
                )}
              </div>

              {/* Record Right: Amount and Actions */}
              <div className="flex items-center justify-between md:justify-end gap-3 shrink-0 pt-3 md:pt-0 border-t md:border-t-0 border-slate-100 dark:border-slate-800">
                <div className="text-left md:text-right">
                  <div className="text-lg font-bold font-mono tabular-nums text-slate-900 dark:text-white">
                    {formatBDT(l.amount)}
                  </div>
                  <div className="text-[10px] text-slate-400 uppercase tracking-wider">
                    {isBn ? 'মোট ধার প্রদান' : 'Principal Lent'}
                  </div>
                </div>

                {/* Collect Button (if not fully collected) */}
                {!isFully && remaining > 0 && (
                  <button
                    type="button"
                    onClick={() => onOpenCollectionModal(l)}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-xs transition"
                  >
                    <CreditCard className="w-3.5 h-3.5" />
                    <span>{isBn ? 'টাকা আদায়' : 'Collect'}</span>
                  </button>
                )}

                {/* Edit Button */}
                {onEditLending && (
                  <button
                    type="button"
                    onClick={() => onEditLending(l)}
                    className="p-2 rounded-xl text-slate-500 hover:text-blue-600 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                    title={isBn ? 'সম্পাদনা করুন' : 'Edit lending record'}
                  >
                    <Edit2 className="w-4 h-4" />
                  </button>
                )}

                {/* History Button */}
                <button
                  type="button"
                  onClick={() => setSelectedLendingHistory(l)}
                  className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <History className="w-3.5 h-3.5 inline mr-1" />
                  <span>{isBn ? 'ইতিহাস' : 'History'}</span>
                </button>

                {/* Delete Button */}
                <button
                  type="button"
                  onClick={() => setDeletingId(l.id)}
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
            {isBn ? 'কোনো ধার দেওয়ার রেকর্ড পাওয়া যায়নি।' : 'No money lent records found.'}
          </div>
        )}
      </div>

      {/* Collection Installments History Modal */}
      {selectedLendingHistory && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-md rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex justify-between items-center pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isBn ? 'আদায়ের ইতিহাস' : 'Collection History'} - {selectedLendingHistory.person_name}
                </h3>
                <p className="text-[11px] text-slate-500 font-mono">
                  {isBn ? 'মোট ধার:' : 'Total Lent:'} {formatBDT(selectedLendingHistory.amount)} ·{' '}
                  {isBn ? 'বকেয়া পাওনা:' : 'Remaining:'}{' '}
                  {formatBDT(selectedLendingHistory.amount - (selectedLendingHistory.collected_amount || 0))}
                </p>
              </div>
              <button
                type="button"
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
                        {c.payment_method || 'Cash'}
                      </div>
                      <div className="text-[10px] text-slate-400 font-mono">
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
                  {isBn ? 'এই ঋণের জন্য এখনও কোনো কিস্তি আদায় করা হয়নি।' : 'No repayment collections recorded yet for this loan.'}
                </div>
              )}
            </div>

            <button
              type="button"
              onClick={() => setSelectedLendingHistory(null)}
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
              {isBn ? 'ধার দেওয়ার রেকর্ড মুছে ফেলবেন?' : 'Delete Lending Record?'}
            </h3>
            <p className="text-xs text-slate-500">
              {isBn
                ? 'এটি এই পাওনা রেকর্ড এবং এর সাথে সম্পর্কিত সকল কিস্তি আদায়ের ইতিহাস স্থায়ীভাবে মুছে দেবে।'
                : 'This will remove this receivable record and its collection history permanently.'}
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
                  await deleteLending(deletingId);
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
