import React, { useState } from 'react';
import { HandCoins, Send, ArrowDownLeft, ArrowUpRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { Borrowing, Lending } from '../types/finance';
import { formatBDT } from '../utils/formatters';
import { BorrowedMoneyView } from './BorrowedMoneyView';
import { LentMoneyView } from './LentMoneyView';

interface LoansViewProps {
  onOpenAddBorrowing: () => void;
  onOpenRepaymentModal: (borrowing: Borrowing) => void;
  onOpenAddLending: () => void;
  onOpenCollectionModal: (lending: Lending) => void;
  onEditBorrowing?: (borrowing: Borrowing) => void;
  onEditLending?: (lending: Lending) => void;
  initialTab?: 'borrowed' | 'lent';
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
  const { summary, borrowings, lendings } = useFinance();
  const { t, isBn } = useLanguage();
  const [activeTab, setActiveTab] = useState<'borrowed' | 'lent'>(initialTab);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Executive Loans Overview Bar */}
      <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 text-white shadow-md border border-slate-700/60">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-700/60">
          <div>
            <h2 className="text-base sm:text-lg font-bold flex items-center gap-2">
              <HandCoins className="w-5 h-5 text-emerald-400" />
              <span>{isBn ? 'ধার ও ঋণ কেন্দ্র' : 'Loans & Debts Hub'}</span>
            </h2>
            <p className="text-xs text-slate-400 mt-0.5">
              {isBn
                ? 'ধার নেওয়া দেনা ও কাউকে দেওয়া ধারের সমন্বিত সুনির্দিষ্ট হিসাব'
                : 'Unified tracking for borrowed liabilities and lent receivables'}
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-[11px] font-mono px-2.5 py-1 rounded-lg bg-slate-800 text-slate-300 border border-slate-700">
              {borrowings.length} {isBn ? 'ধার নেওয়া' : 'Borrowed'} · {lendings.length} {isBn ? 'ধার দেওয়া' : 'Lent'}
            </span>
          </div>
        </div>

        {/* 2-Column High Priority Balances */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-4">
          {/* Section B card: Amount I Owe */}
          <div
            onClick={() => setActiveTab('borrowed')}
            className={`p-3.5 rounded-xl cursor-pointer transition border ${
              activeTab === 'borrowed'
                ? 'bg-orange-950/40 border-orange-500/60 ring-1 ring-orange-500/40'
                : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-orange-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <ArrowDownLeft className="w-4 h-4" />
                <span>
                  {isBn
                    ? 'আমার দেনা (যে টাকা আমি ধার নিয়েছি)'
                    : 'Amount I Owe (Debt Liability)'}
                </span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-orange-900/50">
                {isBn ? 'অবশিষ্ট দেনা' : 'Remaining'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
              {formatBDT(summary.amountIOwe)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isBn ? 'মোট ঋণ নেওয়া:' : 'Gross Borrowed:'}{' '}
              <span className="font-mono text-slate-200">{formatBDT(summary.totalBorrowed)}</span>
            </div>
          </div>

          {/* Section A card: Amount Owed to Me */}
          <div
            onClick={() => setActiveTab('lent')}
            className={`p-3.5 rounded-xl cursor-pointer transition border ${
              activeTab === 'lent'
                ? 'bg-blue-950/40 border-blue-500/60 ring-1 ring-blue-500/40'
                : 'bg-slate-800/60 border-slate-700/80 hover:bg-slate-800'
            }`}
          >
            <div className="flex items-center justify-between text-xs text-blue-400 font-semibold mb-1">
              <span className="flex items-center gap-1.5">
                <ArrowUpRight className="w-4 h-4" />
                <span>
                  {isBn
                    ? 'আমার পাওনা (যে টাকা আমি অন্যকে ধার দিয়েছি)'
                    : 'Amount Owed to Me (Receivable Asset)'}
                </span>
              </span>
              <span className="text-[10px] uppercase font-mono tracking-wider px-1.5 py-0.5 rounded bg-blue-900/50">
                {isBn ? 'বকেয়া পাওনা' : 'Pending'}
              </span>
            </div>
            <div className="text-xl sm:text-2xl font-bold font-mono tabular-nums text-white">
              {formatBDT(summary.amountOwedToMe)}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">
              {isBn ? 'মোট ধার দেওয়া:' : 'Gross Lent:'}{' '}
              <span className="font-mono text-slate-200">{formatBDT(summary.totalLent)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Segmented Navigation Tabs */}
      <div className="flex items-center p-1 bg-slate-200/80 dark:bg-slate-800/80 rounded-2xl max-w-xl mx-auto shadow-inner">
        {/* Tab 1: Section B - Borrowed */}
        <button
          type="button"
          onClick={() => setActiveTab('borrowed')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition text-center ${
            activeTab === 'borrowed'
              ? 'bg-white dark:bg-slate-900 text-orange-600 dark:text-orange-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <HandCoins className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {isBn ? 'ধার নেওয়া ও পরিশোধ (Section B)' : 'Money Borrowed (Section B)'}
          </span>
          {summary.amountIOwe > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-orange-100 dark:bg-orange-950/80 text-orange-700 dark:text-orange-300 shrink-0">
              {formatBDT(summary.amountIOwe)}
            </span>
          )}
        </button>

        {/* Tab 2: Section A - Lent */}
        <button
          type="button"
          onClick={() => setActiveTab('lent')}
          className={`flex-1 flex items-center justify-center gap-2 py-2.5 px-3 rounded-xl text-xs font-bold transition text-center ${
            activeTab === 'lent'
              ? 'bg-white dark:bg-slate-900 text-blue-600 dark:text-blue-400 shadow-xs'
              : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
          }`}
        >
          <Send className="w-4 h-4 shrink-0" />
          <span className="truncate">
            {isBn ? 'ধার দেওয়া টাকা (Section A)' : 'Money Lent (Section A)'}
          </span>
          {summary.amountOwedToMe > 0 && (
            <span className="text-[10px] font-mono px-1.5 py-0.5 rounded-md bg-blue-100 dark:bg-blue-950/80 text-blue-700 dark:text-blue-300 shrink-0">
              {formatBDT(summary.amountOwedToMe)}
            </span>
          )}
        </button>
      </div>

      {/* Tab Content */}
      <div className="pt-2">
        {activeTab === 'borrowed' ? (
          <BorrowedMoneyView
            onOpenAddBorrowing={onOpenAddBorrowing}
            onOpenRepaymentModal={onOpenRepaymentModal}
            onEditBorrowing={onEditBorrowing}
          />
        ) : (
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
