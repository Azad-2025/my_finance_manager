import React, { useState } from 'react';
import {
  Home,
  Receipt,
  Plus,
  HandCoins,
  Menu,
  X,
  ShoppingBag,
  TrendingUp,
  Building2,
  Send,
  BarChart3,
  Tags,
  Wallet,
  Settings,
  Download,
  ChevronRight,
  User,
} from 'lucide-react';
import { NavView } from './Sidebar';
import { useAuth } from '../../context/AuthContext';
import { useFinance } from '../../context/FinanceContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatBDT } from '../../utils/formatters';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface BottomNavProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
  onOpenAddIncome: () => void;
  onOpenAddExpense: () => void;
  onOpenAddOfficeExpense: () => void;
  onOpenAddBorrowing: () => void;
  onOpenAddLending: () => void;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  currentView,
  onSelectView,
  onOpenAddIncome,
  onOpenAddExpense,
  onOpenAddOfficeExpense,
  onOpenAddBorrowing,
  onOpenAddLending,
}) => {
  const [showAddMenu, setShowAddMenu] = useState(false);
  const [showMoreDrawer, setShowMoreDrawer] = useState(false);

  const { userProfile } = useAuth();
  const { summary } = useFinance();
  const { t, isBn } = useLanguage();

  // Active check helpers
  const isHomeActive = currentView === 'dashboard';
  const isTransactionsActive = currentView === 'transactions';
  const isLoansActive =
    currentView === 'loans' || currentView === 'borrowed' || currentView === 'lent';
  const isMoreActive =
    showMoreDrawer ||
    ['reports', 'categories', 'settings', 'personal', 'office', 'income'].includes(currentView);

  return (
    <>
      {/* ------------------------------------------------------------- */}
      {/* 1. Quick Add Bottom Sheet (Tapped on Center (+) Button)        */}
      {/* ------------------------------------------------------------- */}
      {showAddMenu && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
            onClick={() => setShowAddMenu(false)}
          />

          {/* Action Sheet Panel */}
          <div className="relative z-10 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />

            {/* Header */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div>
                <h3 className="text-sm font-extrabold text-slate-900 dark:text-white">
                  {t('addRecord')}
                </h3>
                <p className="text-[11px] text-slate-500">
                  {t('selectTransactionType')}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setShowAddMenu(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* 5 Transaction Options */}
            <div className="space-y-2 mt-4">
              {/* Option 1: Personal Expense */}
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  onOpenAddExpense();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-rose-100 dark:border-rose-950/60 bg-rose-50/50 dark:bg-rose-950/20 hover:bg-rose-50 dark:hover:bg-rose-950/40 text-left transition group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-rose-100 dark:bg-rose-900/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0">
                    <ShoppingBag className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-rose-600 dark:group-hover:text-rose-400 transition">
                      {t('type_personal_expense')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {t('type_personal_expense_desc')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-rose-500 transition" />
              </button>

              {/* Option 2: Income */}
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  onOpenAddIncome();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-emerald-100 dark:border-emerald-950/60 bg-emerald-50/50 dark:bg-emerald-950/20 hover:bg-emerald-50 dark:hover:bg-emerald-950/40 text-left transition group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-emerald-100 dark:bg-emerald-900/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0">
                    <TrendingUp className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-emerald-600 dark:group-hover:text-emerald-400 transition">
                      {t('type_income')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {t('type_income_desc')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-emerald-500 transition" />
              </button>

              {/* Option 3: Office Expense */}
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  onOpenAddOfficeExpense();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-amber-100 dark:border-amber-950/60 bg-amber-50/50 dark:bg-amber-950/20 hover:bg-amber-50 dark:hover:bg-amber-950/40 text-left transition group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-amber-100 dark:bg-amber-900/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <Building2 className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-amber-600 dark:group-hover:text-amber-400 transition">
                      {t('type_office_expense')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {t('type_office_expense_desc')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-amber-500 transition" />
              </button>

              {/* Option 4: Borrowed Money */}
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  onOpenAddBorrowing();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-orange-100 dark:border-orange-950/60 bg-orange-50/50 dark:bg-orange-950/20 hover:bg-orange-50 dark:hover:bg-orange-950/40 text-left transition group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-orange-100 dark:bg-orange-900/60 text-orange-600 dark:text-orange-400 flex items-center justify-center shrink-0">
                    <HandCoins className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-orange-600 dark:group-hover:text-orange-400 transition">
                      {t('type_borrowed')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {t('type_borrowed_desc')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-orange-500 transition" />
              </button>

              {/* Option 5: Lent Money */}
              <button
                type="button"
                onClick={() => {
                  setShowAddMenu(false);
                  onOpenAddLending();
                }}
                className="w-full flex items-center justify-between p-3.5 rounded-2xl border border-blue-100 dark:border-blue-950/60 bg-blue-50/50 dark:bg-blue-950/20 hover:bg-blue-50 dark:hover:bg-blue-950/40 text-left transition group active:scale-[0.99]"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0">
                    <Send className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                      {t('type_lent')}
                    </div>
                    <div className="text-[11px] text-slate-500">
                      {t('type_lent_desc')}
                    </div>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-blue-500 transition" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. More Navigation Drawer (Tapped on 5th "More" Item)          */}
      {/* ------------------------------------------------------------- */}
      {showMoreDrawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex flex-col justify-end">
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-slate-950/65 backdrop-blur-xs transition-opacity"
            onClick={() => setShowMoreDrawer(false)}
          />

          {/* Drawer Panel */}
          <div className="relative z-10 w-full bg-white dark:bg-slate-900 border-t border-slate-200 dark:border-slate-800 rounded-t-3xl p-5 shadow-2xl animate-in slide-in-from-bottom duration-200 max-h-[85vh] overflow-y-auto">
            {/* Grab Handle */}
            <div className="w-12 h-1 bg-slate-300 dark:bg-slate-700 rounded-full mx-auto mb-3" />

            {/* Header with User Info */}
            <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-xs shadow-xs">
                  <User className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-900 dark:text-white leading-tight">
                    {userProfile.name}
                  </h3>
                  <p className="text-[11px] text-slate-500 font-mono">
                    {userProfile.phone} · BDT (৳)
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowMoreDrawer(false)}
                className="p-1.5 rounded-xl text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* PWA Mobile Installation Card */}
            <div className="mt-3.5">
              <PWAInstallButton variant="card" />
            </div>

            {/* Primary More Grid: Reports, Categories, Accounts, Settings, Backup */}
            <div className="mt-4">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {isBn ? 'ব্যবস্থাপনা ও টুলস' : 'Management & Tools'}
              </div>
              <div className="grid grid-cols-2 gap-2.5">
                {/* Reports & Analytics */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectView('reports');
                    setShowMoreDrawer(false);
                  }}
                  className={`flex flex-col p-3 rounded-2xl text-left border transition ${
                    currentView === 'reports'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <BarChart3 className="w-5 h-5 text-indigo-500 mb-1.5" />
                  <span className="text-xs font-bold">{t('nav_reports')}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {isBn ? 'ট্রেন্ড, বিশ্লেষণ ও পরিসংখ্যান' : 'Trends, breakdown & stats'}
                  </span>
                </button>

                {/* Categories */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectView('categories');
                    setShowMoreDrawer(false);
                  }}
                  className={`flex flex-col p-3 rounded-2xl text-left border transition ${
                    currentView === 'categories'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Tags className="w-5 h-5 text-emerald-500 mb-1.5" />
                  <span className="text-xs font-bold">{t('nav_categories')}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {isBn ? 'কাস্টম খরচের ট্যাগ' : 'Custom expense tags'}
                  </span>
                </button>

                {/* Accounts */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectView('categories');
                    setShowMoreDrawer(false);
                  }}
                  className="flex flex-col p-3 rounded-2xl text-left border bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition"
                >
                  <Wallet className="w-5 h-5 text-teal-500 mb-1.5" />
                  <span className="text-xs font-bold">{isBn ? 'একাউন্ট ও ওয়ালেট' : 'Accounts & Wallets'}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {isBn ? 'ক্যাশ, বিকাশ, নগদ, ব্যাংক' : 'Cash, bKash, Nagad, Bank'}
                  </span>
                </button>

                {/* Settings & Supabase */}
                <button
                  type="button"
                  onClick={() => {
                    onSelectView('settings');
                    setShowMoreDrawer(false);
                  }}
                  className={`flex flex-col p-3 rounded-2xl text-left border transition ${
                    currentView === 'settings'
                      ? 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-300 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300'
                      : 'bg-slate-50 dark:bg-slate-800/70 border-slate-200 dark:border-slate-700/80 text-slate-800 dark:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800'
                  }`}
                >
                  <Settings className="w-5 h-5 text-slate-500 dark:text-slate-400 mb-1.5" />
                  <span className="text-xs font-bold">{t('nav_settings')}</span>
                  <span className="text-[10px] text-slate-500 mt-0.5">
                    {isBn ? 'ক্লাউড সিঙ্ক ও প্রোফাইল' : 'Supabase PostgreSQL & Profile'}
                  </span>
                </button>
              </div>

              {/* Backup & Export Row */}
              <button
                type="button"
                onClick={() => {
                  onSelectView('settings');
                  setShowMoreDrawer(false);
                }}
                className="w-full mt-2.5 flex items-center justify-between p-3 rounded-2xl border border-slate-200 dark:border-slate-700/80 bg-slate-50 dark:bg-slate-800/70 hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
              >
                <div className="flex items-center gap-2.5">
                  <div className="w-8 h-8 rounded-xl bg-amber-100 dark:bg-amber-950/80 text-amber-600 dark:text-amber-400 flex items-center justify-center">
                    <Download className="w-4 h-4" />
                  </div>
                  <div>
                    <span className="text-xs font-bold text-slate-900 dark:text-white block">
                      {t('dataBackup')}
                    </span>
                    <span className="text-[10px] text-slate-500">
                      {isBn ? 'ইউনিভার্সাল JSON ব্যাকআপ ও CSV আর্কাইভ' : 'Download universal JSON backup and CSV archives'}
                    </span>
                  </div>
                </div>
                <ChevronRight className="w-4 h-4 text-slate-400" />
              </button>
            </div>

            {/* Dedicated Ledgers Section (Preserving all existing functionality) */}
            <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800">
              <div className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">
                {isBn ? 'বিশেষায়িত লেজারসমূহ' : 'Dedicated Ledgers'}
              </div>
              <div className="space-y-1.5">
                <button
                  type="button"
                  onClick={() => {
                    onSelectView('personal');
                    setShowMoreDrawer(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <ShoppingBag className="w-4 h-4 text-rose-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {t('nav_personal')}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-slate-400">
                    {formatBDT(summary.totalPersonalExpenses)}
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectView('office');
                    setShowMoreDrawer(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <Building2 className="w-4 h-4 text-amber-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {t('nav_office')}
                    </span>
                  </div>
                  {summary.pendingOfficeReimbursement > 0 ? (
                    <span className="text-[10px] font-mono font-bold text-amber-600 bg-amber-50 dark:bg-amber-950/60 px-2 py-0.5 rounded">
                      {isBn ? 'ক্লেইম ' : 'Claim '} {formatBDT(summary.pendingOfficeReimbursement)}
                    </span>
                  ) : (
                    <span className="text-[11px] font-mono text-slate-400">
                      {formatBDT(summary.totalOfficeExpenses)}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    onSelectView('income');
                    setShowMoreDrawer(false);
                  }}
                  className="w-full flex items-center justify-between p-2.5 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition text-left"
                >
                  <div className="flex items-center gap-2.5">
                    <TrendingUp className="w-4 h-4 text-emerald-500" />
                    <span className="text-xs font-semibold text-slate-800 dark:text-slate-200">
                      {t('nav_income')}
                    </span>
                  </div>
                  <span className="text-[11px] font-mono text-emerald-600 dark:text-emerald-400 font-semibold">
                    {formatBDT(summary.totalIncome)}
                  </span>
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* 3. Exactly 5-Item Mobile Bottom Navigation Bar                */}
      {/* ------------------------------------------------------------- */}
      <nav
        className="lg:hidden fixed bottom-0 left-0 right-0 z-40 bg-white/95 dark:bg-slate-900/95 backdrop-blur-md border-t border-slate-200 dark:border-slate-800 px-2 py-1.5 pb-safe shadow-lg"
        aria-label="Mobile Navigation"
      >
        <div className="grid grid-cols-5 items-center justify-items-center">
          {/* 1. Home */}
          <button
            type="button"
            onClick={() => onSelectView('dashboard')}
            className={`flex flex-col items-center justify-center w-full py-1 min-h-[48px] rounded-xl transition ${
              isHomeActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Home className={`w-5 h-5 ${isHomeActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 leading-none tracking-tight">{t('nav_home')}</span>
          </button>

          {/* 2. Transactions */}
          <button
            type="button"
            onClick={() => onSelectView('transactions')}
            className={`flex flex-col items-center justify-center w-full py-1 min-h-[48px] rounded-xl transition ${
              isTransactionsActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Receipt className={`w-5 h-5 ${isTransactionsActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 leading-none tracking-tight">{t('nav_transactions')}</span>
          </button>

          {/* 3. Add (Prominent Circular Green (+) Button in Center) */}
          <div className="flex flex-col items-center justify-center -mt-6">
            <button
              type="button"
              onClick={() => setShowAddMenu(true)}
              className="w-13 h-13 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white flex items-center justify-center shadow-lg shadow-emerald-600/35 ring-4 ring-white dark:ring-slate-900 active:scale-90 transition-transform duration-150"
              aria-label={t('addTransaction')}
            >
              <Plus className="w-6 h-6 stroke-[2.75]" />
            </button>
            <span className="text-[10px] font-bold text-slate-600 dark:text-slate-400 mt-1 leading-none">
              {t('nav_add')}
            </span>
          </div>

          {/* 4. Loans (Combines Borrowed and Lent with tabs) */}
          <button
            type="button"
            onClick={() => onSelectView('loans')}
            className={`flex flex-col items-center justify-center w-full py-1 min-h-[48px] rounded-xl relative transition ${
              isLoansActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <HandCoins className={`w-5 h-5 ${isLoansActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 leading-none tracking-tight">{t('nav_loans')}</span>

            {/* Notification badge if active loans exist */}
            {(summary.amountIOwe > 0 || summary.amountOwedToMe > 0) && (
              <span className="absolute top-1.5 right-1/4 w-2 h-2 rounded-full bg-orange-500 ring-2 ring-white dark:ring-slate-900" />
            )}
          </button>

          {/* 5. More */}
          <button
            type="button"
            onClick={() => setShowMoreDrawer(true)}
            className={`flex flex-col items-center justify-center w-full py-1 min-h-[48px] rounded-xl transition ${
              isMoreActive
                ? 'text-emerald-600 dark:text-emerald-400 font-bold'
                : 'text-slate-500 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            <Menu className={`w-5 h-5 ${isMoreActive ? 'stroke-[2.5]' : 'stroke-2'}`} />
            <span className="text-[10px] mt-1 leading-none tracking-tight">{t('nav_more')}</span>
          </button>
        </div>
      </nav>
    </>
  );
};
