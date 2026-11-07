import React from 'react';
import {
  LayoutDashboard,
  Receipt,
  ShoppingBag,
  Building2,
  TrendingUp,
  HandCoins,
  Send,
  BarChart3,
  Tags,
  Settings,
  ChevronRight,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useAuth } from '../../context/AuthContext';
import { useLanguage } from '../../context/LanguageContext';
import { formatBDT } from '../../utils/formatters';
import { BrandLogo } from '../common/BrandLogo';

export type NavView =
  | 'dashboard'
  | 'transactions'
  | 'personal'
  | 'office'
  | 'income'
  | 'borrowed'
  | 'lent'
  | 'loans'
  | 'reports'
  | 'categories'
  | 'settings';

interface SidebarProps {
  currentView: NavView;
  onSelectView: (view: NavView) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ currentView, onSelectView }) => {
  const { summary } = useFinance();
  const { userProfile } = useAuth();
  const { t } = useLanguage();

  const navItems: {
    id: NavView;
    label: string;
    icon: React.FC<{ className?: string }>;
    badge?: string;
    badgeColor?: string;
  }[] = [
    { id: 'dashboard', label: t('nav_home'), icon: LayoutDashboard },
    { id: 'transactions', label: t('nav_transactions'), icon: Receipt },
    { id: 'personal', label: t('nav_personal'), icon: ShoppingBag },
    {
      id: 'office',
      label: t('nav_office'),
      icon: Building2,
      badge: summary.pendingOfficeReimbursement > 0 ? formatBDT(summary.pendingOfficeReimbursement) : undefined,
      badgeColor: 'text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/60',
    },
    { id: 'income', label: t('nav_income'), icon: TrendingUp },
    {
      id: 'loans',
      label: t('nav_loans'),
      icon: HandCoins,
      badge: (summary.amountIOwe > 0 || summary.amountOwedToMe > 0) ? formatBDT(summary.amountIOwe + summary.amountOwedToMe) : undefined,
      badgeColor: 'text-indigo-600 dark:text-indigo-400 bg-indigo-50 dark:bg-indigo-950/60',
    },
    { id: 'reports', label: t('nav_reports'), icon: BarChart3 },
    { id: 'categories', label: t('nav_categories'), icon: Tags },
    { id: 'settings', label: t('nav_settings'), icon: Settings },
  ];

  return (
    <aside className="hidden lg:flex flex-col w-64 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 shrink-0 h-screen sticky top-0 overflow-y-auto transition-colors">
      {/* Brand Header */}
      <div className="p-4 border-b border-slate-100 dark:border-slate-800 space-y-3">
        {/* Transparent SVG Brand Logo without white container box */}
        <div className="py-1 px-1">
          <BrandLogo size="md" />
        </div>

        <div className="px-1 flex items-center justify-between">
          <div className="min-w-0">
            <h1 className="text-xs font-bold text-slate-900 dark:text-white leading-tight truncate">
              {userProfile.name}
            </h1>
            <span className="text-[11px] text-slate-500 font-mono block truncate">{userProfile.phone}</span>
          </div>
          <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            {t('owner')}
          </span>
        </div>
      </div>

      {/* Nav Menu */}
      <nav className="flex-1 p-3 space-y-1">
        {navItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentView === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onSelectView(item.id)}
              className={`w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-xs font-semibold transition group ${
                isActive
                  ? 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-400'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              <div className="flex items-center gap-2.5 truncate">
                <Icon
                  className={`w-4 h-4 shrink-0 transition ${
                    isActive
                      ? 'text-emerald-600 dark:text-emerald-400'
                      : 'text-slate-400 group-hover:text-slate-600 dark:group-hover:text-slate-300'
                  }`}
                />
                <span className="truncate">{item.label}</span>
              </div>

              {item.badge && (
                <span
                  className={`text-[10px] font-mono font-bold px-2 py-0.5 rounded-md shrink-0 tabular-nums ${item.badgeColor}`}
                >
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>

      {/* Quick Overview Tile in Sidebar bottom */}
      <div className="p-4 m-3 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800">
        <div className="text-[11px] font-medium text-slate-500">Net Account Balance</div>
        <div className="text-base font-bold text-slate-900 dark:text-white font-mono tabular-nums mt-0.5">
          {formatBDT(summary.totalBalance)}
        </div>
        <div className="mt-2 text-[10px] text-slate-400 flex items-center justify-between">
          <span>Income: <span className="text-emerald-600 font-semibold">{formatBDT(summary.totalIncome)}</span></span>
        </div>
      </div>
    </aside>
  );
};
