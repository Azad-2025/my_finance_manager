import React, { useState } from 'react';
import {
  Tags,
  Plus,
  Wallet,
  ArrowRightLeft,
  Edit2,
  Trash2,
  Layers,
  ShoppingBag,
  Building2,
  TrendingUp,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { Category, Account } from '../types/finance';
import { formatBDT, formatDate } from '../utils/formatters';

interface CategoriesViewProps {
  onOpenCategoryModal: (category?: Category, defaultType?: 'personal_expense' | 'office_expense' | 'income') => void;
  onOpenAccountModal: (account?: Account) => void;
  onOpenTransferModal: () => void;
}

export const CategoriesView: React.FC<CategoriesViewProps> = ({
  onOpenCategoryModal,
  onOpenAccountModal,
  onOpenTransferModal,
}) => {
  const {
    categories,
    accounts,
    transfers,
    deleteCategory,
    deleteAccount,
  } = useFinance();

  const [activeCategoryTab, setActiveCategoryTab] = useState<'personal' | 'office' | 'income'>('personal');

  const personalCategories = categories.filter((c) => c.type === 'personal_expense');
  const officeCategories = categories.filter((c) => c.type === 'office_expense');
  const incomeCategories = categories.filter((c) => c.type === 'income');

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-16">
      {/* 1. Accounts & Wallets Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Wallet className="w-5 h-5 text-emerald-500" />
              <span>Accounts & Wallets</span>
            </h2>
            <p className="text-xs text-slate-500">
              Manage Cash, Bank accounts, bKash, Nagad, and execute account transfers
            </p>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onOpenTransferModal}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-slate-900 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
            >
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
              <span>Transfer Funds</span>
            </button>
            <button
              onClick={() => onOpenAccountModal()}
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold shadow-sm transition"
            >
              <Plus className="w-4 h-4" />
              <span>Add Account</span>
            </button>
          </div>
        </div>

        {/* Accounts Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {accounts.map((acc) => (
            <div
              key={acc.id}
              className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col justify-between group"
            >
              <div>
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    {acc.type}
                  </span>
                  <div className="flex items-center gap-1 opacity-90 sm:opacity-0 sm:group-hover:opacity-100 transition">
                    <button
                      onClick={() => onOpenAccountModal(acc)}
                      className="p-1 rounded-md text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                    </button>
                    {accounts.length > 1 && (
                      <button
                        onClick={() => deleteAccount(acc.id)}
                        className="p-1 rounded-md text-slate-400 hover:text-rose-600"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>

                <div className="text-base font-bold text-slate-900 dark:text-white mt-1">
                  {acc.name}
                </div>
                {acc.account_number && (
                  <div className="text-[11px] text-slate-400 font-mono mt-0.5">
                    {acc.account_number}
                  </div>
                )}
              </div>

              <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800">
                <span className="text-[10px] text-slate-400">Available Balance</span>
                <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
                  {formatBDT(acc.balance)}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Transfers Log */}
        {transfers.length > 0 && (
          <div className="p-4 rounded-2xl bg-slate-50 dark:bg-slate-900/40 border border-slate-200 dark:border-slate-800 space-y-2">
            <h4 className="text-xs font-bold text-slate-700 dark:text-slate-300 flex items-center gap-1.5">
              <ArrowRightLeft className="w-3.5 h-3.5 text-blue-500" />
              <span>Recent Account-to-Account Transfers</span>
            </h4>
            <div className="divide-y divide-slate-200 dark:divide-slate-800">
              {transfers.slice(0, 3).map((tr) => (
                <div key={tr.id} className="py-2 flex items-center justify-between text-xs">
                  <div>
                    <span className="font-semibold text-slate-900 dark:text-white">{tr.from_account_name}</span>
                    <span className="text-slate-400 mx-2">➔</span>
                    <span className="font-semibold text-slate-900 dark:text-white">{tr.to_account_name}</span>
                    <span className="text-[11px] text-slate-400 ml-2">({formatDate(tr.transfer_date)})</span>
                  </div>
                  <span className="font-mono font-bold text-slate-900 dark:text-white tabular-nums">
                    {formatBDT(tr.amount)}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 2. Categories Section */}
      <div className="space-y-4">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
              <Tags className="w-5 h-5 text-indigo-500" />
              <span>Expense & Income Categories</span>
            </h2>
            <p className="text-xs text-slate-500">
              Personalize spending and revenue classifications
            </p>
          </div>

          <button
            onClick={() =>
              onOpenCategoryModal(
                undefined,
                activeCategoryTab === 'personal'
                  ? 'personal_expense'
                  : activeCategoryTab === 'office'
                  ? 'office_expense'
                  : 'income'
              )
            }
            className="flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold shadow-sm transition"
          >
            <Plus className="w-4 h-4" />
            <span>New Custom Category</span>
          </button>
        </div>

        {/* Category Tabs */}
        <div className="flex items-center gap-2 p-1.5 rounded-xl bg-slate-100 dark:bg-slate-800 text-xs w-fit">
          <button
            onClick={() => setActiveCategoryTab('personal')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeCategoryTab === 'personal'
                ? 'bg-white dark:bg-slate-900 text-rose-600 dark:text-rose-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <ShoppingBag className="w-3.5 h-3.5" />
            <span>Personal ({personalCategories.length})</span>
          </button>
          <button
            onClick={() => setActiveCategoryTab('office')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeCategoryTab === 'office'
                ? 'bg-white dark:bg-slate-900 text-amber-600 dark:text-amber-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>Office ({officeCategories.length})</span>
          </button>
          <button
            onClick={() => setActiveCategoryTab('income')}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg font-semibold transition ${
              activeCategoryTab === 'income'
                ? 'bg-white dark:bg-slate-900 text-emerald-600 dark:text-emerald-400 shadow-xs'
                : 'text-slate-600 dark:text-slate-400'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            <span>Income ({incomeCategories.length})</span>
          </button>
        </div>

        {/* Categories Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
          {(activeCategoryTab === 'personal'
            ? personalCategories
            : activeCategoryTab === 'office'
            ? officeCategories
            : incomeCategories
          ).map((c) => (
            <div
              key={c.id}
              className="p-3.5 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex items-center justify-between group"
            >
              <div className="flex items-center gap-2 truncate">
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: c.color || '#10b981' }}
                />
                <span className="text-xs font-semibold text-slate-800 dark:text-slate-200 truncate">
                  {c.name}
                </span>
              </div>

              <div className="flex items-center gap-0.5 opacity-80 sm:opacity-0 sm:group-hover:opacity-100 transition">
                <button
                  onClick={() => onOpenCategoryModal(c)}
                  className="p-1 rounded text-slate-400 hover:text-slate-700 dark:hover:text-slate-200"
                >
                  <Edit2 className="w-3 h-3" />
                </button>
                {c.is_custom && (
                  <button
                    onClick={() => deleteCategory(c.id)}
                    className="p-1 rounded text-slate-400 hover:text-rose-600"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
