import React, { useState } from 'react';
import { HandCoins, Send, CheckCircle2, ArrowDownLeft, ArrowUpRight, Banknote } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Borrowing, Lending } from '../types/finance';
import { formatBDT } from '../utils/formatters';
import { BorrowedMoneyView } from './BorrowedMoneyView';
import { LentMoneyView } from './LentMoneyView';
import { RepaidLoansView } from './RepaidLoansView';

interface LoansViewProps {
  onOpenAddBorrowing: () => void;
  onOpenRepaymentModal: (borrowing: Borrowing) => void;
  onOpenAddLending: () => void;
  onOpenCollectionModal: (lending: Lending) => void;
  onEditBorrowing?: (borrowing: Borrowing) => void;
  onEditLending?: (lending: Lending) => void;
  initialTab?: 'borrowed' | 'repaid' | 'lent';
}

export const LoansView: React.FC<LoansViewProps> = ({
  onOpenAddBorrowing,
  onOpenRepaymentModal,
  onOpenAddLending,
  onOpenCollectionModal,
  onEditBorrowing,
  onEditLending,
  initialTab = 'borrowed',
}) => {
  const { summary, borrowings, lendings, borrowingRepayments } = useFinance();
  const { isBn } = useLanguage();
  const [activeTab, setActiveTab] = useState<'borrowed' | 'repaid' | 'lent'>(initialTab);

  return (
    <div className="space-y-5 sm:space-y-6 max-w-7xl mx-auto pb-16">
      {/* Executive Loans Overview Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md border border-slate-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-700/60">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-emerald-400" />
              <span>{isBn ? 'ধার ও ঋণ কেন্দ্র' : 'Loans & Debts Hub'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? 'ধার নেওয়া দেনা, পরিশোধের কিস্তি ও কাউকে দেওয়া ধারের সমন্বিত সুনির্দিষ্ট হিসাব'
                : 'Unified tracking for borrowed debt, repayments, and lent receivables'}
            </p>
          </div>

          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-amber-950/70 text-amber-300 border border-amber-800/60">
              {borrowings.length} {isBn ? 'ধার নেওয়া' : 'Borrowed'}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-emerald-950/70 text-emerald-300 border border-emerald-800/60">
              {borrowingRepayments.length} {isBn ? 'পরিশোধ' : 'Repaid'}
            </span>
            <span className="text-[11px] font-mono px-2 py-0.5 rounded-lg bg-blue-950/70 text-blue-300 border border-blue-800/60">
              {lendings.length} {isBn ? 'ধার দেওয়া' : 'Lent'}
            </span>
          </div>
        </div>

        {/* 3 Overview Amount Cards in 3 Distinct Colors:
            1. Amber / Orange: টোটাল কত টাকা ঋণ আছে
            2. Emerald / Green: আমি কত টাকা পরিশোধ করেছি
            3. Blue / Sky: আমি টোটাল কত টাকা ধার দিয়েছি
        */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 sm:gap-3 pt-4">
          {/* Card 1: টোটাল কত টাকা ঋণ আছে (Amber / Orange) */}
          <div
            onClick={() => setActiveTab('borrowed')}
            role="button"
            tabIndex={0}
            className={`p-3.5 rounded-xl cursor-pointer transition border text-left ${
              activeTab === 'borrowed'
                ? 'bg-amber-950/50 border-amber-500 ring-2 ring-amber-500/50 shadow-md'
                : 'bg-slate-800/60 border-amber-500/30 hover:border-amber-500/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-amber-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4 text-amber-400" />
                <span className="font-bold">
                  {isBn ? 'টোটাল ঋণ আছে' : 'Total Debt Remaining'}
                </span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-amber-900/60 text-amber-300">
                {isBn ? 'বাকি দেনা' : 'Unpaid'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-amber-300">
              {formatBDT(summary.amountIOwe)}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
              <span>{isBn ? 'মোট ঋণ নেওয়া:' : 'Total Borrowed:'}</span>
              <span className="font-mono text-white font-semibold">
                {formatBDT(summary.totalBorrowed)}
              </span>
            </div>
          </div>

          {/* Card 2: আমি কত টাকা পরিশোধ করেছি (Emerald / Green) */}
          <div
            onClick={() => setActiveTab('repaid')}
            role="button"
            tabIndex={0}
            className={`p-3.5 rounded-xl cursor-pointer transition border text-left ${
              activeTab === 'repaid'
                ? 'bg-emerald-950/50 border-emerald-500 ring-2 ring-emerald-500/50 shadow-md'
                : 'bg-slate-800/60 border-emerald-500/30 hover:border-emerald-500/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-emerald-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span className="font-bold">
                  {isBn ? 'পরিশোধ করেছি' : 'Total Debt Repaid'}
                </span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-900/60 text-emerald-300">
                {isBn ? 'পরিশোধিত' : 'Repaid'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-emerald-400">
              {formatBDT(summary.totalBorrowedRepaid)}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
              <span>{isBn ? 'পরিশোধের সংখ্যা:' : 'Installments:'}</span>
              <span className="font-mono text-white font-semibold">
                {borrowingRepayments.length} {isBn ? 'টি কিস্তি' : 'vouchers'}
              </span>
            </div>
          </div>

          {/* Card 3: আমি টোটাল কত টাকা ধার দিয়েছি (Blue / Sky) */}
          <div
            onClick={() => setActiveTab('lent')}
            role="button"
            tabIndex={0}
            className={`p-3.5 rounded-xl cursor-pointer transition border text-left ${
              activeTab === 'lent'
                ? 'bg-blue-950/50 border-blue-500 ring-2 ring-blue-500/50 shadow-md'
                : 'bg-slate-800/60 border-blue-500/30 hover:border-blue-500/60 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-blue-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4 text-blue-400" />
                <span className="font-bold">
                  {isBn ? 'টোটাল ধার দিয়েছি' : 'Total Money Lent'}
                </span>
              </span>
              <span className="text-[10px] font-mono uppercase tracking-wider px-1.5 py-0.5 rounded bg-blue-900/60 text-blue-300">
                {isBn ? 'অন্যকে ধার' : 'Receivable'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-blue-400">
              {formatBDT(summary.totalLent)}
            </div>
            <div className="text-[11px] text-slate-300 mt-1 flex items-center justify-between">
              <span>{isBn ? 'বকেয়া পাওনা:' : 'Pending:'}</span>
              <span className="font-mono text-white font-semibold">
                {formatBDT(summary.amountOwedToMe)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Exactly 3 Option Boxes in the SAME LINE with 3 Distinct Colors:
          1. ধার নেওয়া (Amber / Orange)
          2. ধার পরিশোধ (Emerald / Green)
          3. ধার দেওয়া (Blue / Sky)
          Text is kept strictly inside the boxes on all mobile screens without overflow.
      */}
      <div className="w-full p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800/80 border border-slate-200/80 dark:border-slate-700/60 shadow-xs">
        <div className="grid grid-cols-3 gap-1.5 sm:gap-2.5 w-full">
          {/* Box 1: ধার নেওয়া (Amber / Orange) */}
          <button
            type="button"
            onClick={() => setActiveTab('borrowed')}
            className={`min-w-0 w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl transition text-center select-none ${
              activeTab === 'borrowed'
                ? 'bg-amber-600 text-white shadow-sm ring-2 ring-amber-400/60 dark:ring-amber-500/50'
                : 'bg-white dark:bg-slate-900 text-amber-700 dark:text-amber-400 border border-amber-300/80 dark:border-amber-800/50 hover:bg-amber-50 dark:hover:bg-amber-950/40'
            }`}
          >
            <HandCoins className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate max-w-full text-[11px] sm:text-xs font-bold leading-tight">
              {isBn ? 'ধার নেওয়া' : 'Borrowed'}
            </span>
            <span
              className={`hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                activeTab === 'borrowed'
                  ? 'bg-amber-700/80 text-amber-100'
                  : 'bg-amber-100 dark:bg-amber-950/70 text-amber-800 dark:text-amber-300'
              }`}
            >
              {formatBDT(summary.amountIOwe)}
            </span>
          </button>

          {/* Box 2: ধার পরিশোধ (Emerald / Green) */}
          <button
            type="button"
            onClick={() => setActiveTab('repaid')}
            className={`min-w-0 w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl transition text-center select-none ${
              activeTab === 'repaid'
                ? 'bg-emerald-600 text-white shadow-sm ring-2 ring-emerald-400/60 dark:ring-emerald-500/50'
                : 'bg-white dark:bg-slate-900 text-emerald-700 dark:text-emerald-400 border border-emerald-300/80 dark:border-emerald-800/50 hover:bg-emerald-50 dark:hover:bg-emerald-950/40'
            }`}
          >
            <CheckCircle2 className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate max-w-full text-[11px] sm:text-xs font-bold leading-tight">
              {isBn ? 'ধার পরিশোধ' : 'Repaid'}
            </span>
            <span
              className={`hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                activeTab === 'repaid'
                  ? 'bg-emerald-700/80 text-emerald-100'
                  : 'bg-emerald-100 dark:bg-emerald-950/70 text-emerald-800 dark:text-emerald-300'
              }`}
            >
              {formatBDT(summary.totalBorrowedRepaid)}
            </span>
          </button>

          {/* Box 3: ধার দেওয়া (Blue / Sky) */}
          <button
            type="button"
            onClick={() => setActiveTab('lent')}
            className={`min-w-0 w-full flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-2.5 px-1.5 sm:px-3 rounded-xl transition text-center select-none ${
              activeTab === 'lent'
                ? 'bg-blue-600 text-white shadow-sm ring-2 ring-blue-400/60 dark:ring-blue-500/50'
                : 'bg-white dark:bg-slate-900 text-blue-700 dark:text-blue-400 border border-blue-300/80 dark:border-blue-800/50 hover:bg-blue-50 dark:hover:bg-blue-950/40'
            }`}
          >
            <Send className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" />
            <span className="truncate max-w-full text-[11px] sm:text-xs font-bold leading-tight">
              {isBn ? 'ধার দেওয়া' : 'Lent'}
            </span>
            <span
              className={`hidden sm:inline-block text-[10px] font-mono px-1.5 py-0.5 rounded shrink-0 ${
                activeTab === 'lent'
                  ? 'bg-blue-700/80 text-blue-100'
                  : 'bg-blue-100 dark:bg-blue-950/70 text-blue-700 dark:text-blue-300'
              }`}
            >
              {formatBDT(summary.totalLent)}
            </span>
          </button>
        </div>
      </div>

      {/* Tab Content Display */}
      <div className="pt-1">
        {activeTab === 'borrowed' && (
          <BorrowedMoneyView
            onOpenAddBorrowing={onOpenAddBorrowing}
            onOpenRepaymentModal={onOpenRepaymentModal}
            onEditBorrowing={onEditBorrowing}
          />
        )}

        {activeTab === 'repaid' && (
          <RepaidLoansView
            onOpenRepaymentModal={onOpenRepaymentModal}
            onSwitchToBorrowedTab={() => setActiveTab('borrowed')}
          />
        )}

        {activeTab === 'lent' && (
          <LentMoneyView
            onOpenAddLending={onOpenAddLending}
            onOpenCollectionModal={onOpenCollectionModal}
            onEditLending={onEditLending}
          />
        )}
      </div>
    </div>
  );
};
