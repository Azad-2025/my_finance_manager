import React, { useState, useMemo } from 'react';
import {
  Wallet,
  TrendingUp,
  ShoppingBag,
  Building2,
  HandCoins,
  Send,
  ArrowUpRight,
  ArrowDownRight,
  Calendar,
  Clock,
  Filter,
  CreditCard,
  AlertCircle,
  Plus,
} from 'lucide-react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts';
import { useFinance } from '../context/FinanceContext';
import { useLanguage } from '../context/LanguageContext';
import { formatBDT, formatDate, getTodayString } from '../utils/formatters';
import { Transaction } from '../types/finance';

interface DashboardViewProps {
  onOpenAddTransaction: () => void;
  onSelectView: (view: any) => void;
  onEditTransaction: (tx: Transaction) => void;
}

type DateFilterOption = 'all' | 'today' | 'yesterday' | 'week' | 'month' | 'last_month' | 'custom';

export const DashboardView: React.FC<DashboardViewProps> = ({
  onOpenAddTransaction,
  onSelectView,
  onEditTransaction,
}) => {
  const { summary, transactions, categories, borrowings, lendings, accounts } = useFinance();
  const { t, isBn } = useLanguage();

  const [dateFilter, setDateFilter] = useState<DateFilterOption>('month');
  const [customStart, setCustomStart] = useState('');
  const [customEnd, setCustomEnd] = useState('');

  // Date filtering logic
  const filteredTransactions = useMemo(() => {
    const today = getTodayString();
    const now = new Date();

    const yesterdayDate = new Date(now.getTime() - 86400000);
    const yesterday = `${yesterdayDate.getFullYear()}-${String(yesterdayDate.getMonth() + 1).padStart(2, '0')}-${String(yesterdayDate.getDate()).padStart(2, '0')}`;

    const weekAgoDate = new Date(now.getTime() - 7 * 86400000);
    const weekAgo = `${weekAgoDate.getFullYear()}-${String(weekAgoDate.getMonth() + 1).padStart(2, '0')}-${String(weekAgoDate.getDate()).padStart(2, '0')}`;

    const thisMonthPrefix = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;

    const lastMonthDate = new Date(now.getFullYear(), now.getMonth() - 1, 1);
    const lastMonthPrefix = `${lastMonthDate.getFullYear()}-${String(lastMonthDate.getMonth() + 1).padStart(2, '0')}`;

    return transactions.filter((t) => {
      if (dateFilter === 'all') return true;
      if (dateFilter === 'today') return t.date === today;
      if (dateFilter === 'yesterday') return t.date === yesterday;
      if (dateFilter === 'week') return t.date >= weekAgo && t.date <= today;
      if (dateFilter === 'month') return t.date.startsWith(thisMonthPrefix);
      if (dateFilter === 'last_month') return t.date.startsWith(lastMonthPrefix);
      if (dateFilter === 'custom') {
        if (customStart && t.date < customStart) return false;
        if (customEnd && t.date > customEnd) return false;
        return true;
      }
      return true;
    });
  }, [transactions, dateFilter, customStart, customEnd]);

  // Dynamic calculations for the filtered period
  const periodStats = useMemo(() => {
    let income = 0;
    let personalExpense = 0;
    let officeExpense = 0;

    filteredTransactions.forEach((tx) => {
      if (tx.type === 'income') income += Number(tx.amount);
      if (tx.type === 'personal_expense') personalExpense += Number(tx.amount);
      if (tx.type === 'office_expense') officeExpense += Number(tx.amount);
    });

    const totalExpense = personalExpense + officeExpense;
    const netSavings = income - totalExpense;

    return {
      income,
      personalExpense,
      officeExpense,
      totalExpense,
      netSavings,
    };
  }, [filteredTransactions]);

  // Category breakdown for Donut Chart
  const categoryChartData = useMemo(() => {
    const expenseMap: Record<string, number> = {};

    filteredTransactions
      .filter((t) => t.type === 'personal_expense' || t.type === 'office_expense')
      .forEach((t) => {
        const cat = t.category || 'Other';
        expenseMap[cat] = (expenseMap[cat] || 0) + Number(t.amount);
      });

    const colors = [
      '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6',
      '#06b6d4', '#f97316', '#ef4444', '#14b8a6', '#64748b'
    ];

    return Object.entries(expenseMap)
      .map(([name, value], idx) => ({
        name,
        value,
        color: colors[idx % colors.length],
      }))
      .sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Income vs Expenses Monthly Trend (Last 6 Months)
  const monthlyTrendData = useMemo(() => {
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const now = new Date();
    const result = [];

    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const prefix = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = `${monthNames[d.getMonth()]} ${String(d.getFullYear()).slice(-2)}`;

      let mIncome = 0;
      let mPersonal = 0;
      let mOffice = 0;

      transactions.forEach((t) => {
        if (t.date.startsWith(prefix)) {
          if (t.type === 'income') mIncome += Number(t.amount);
          if (t.type === 'personal_expense') mPersonal += Number(t.amount);
          if (t.type === 'office_expense') mOffice += Number(t.amount);
        }
      });

      result.push({
        month: label,
        income: mIncome,
        personal: mPersonal,
        office: mOffice,
        totalExpenses: mPersonal + mOffice,
      });
    }

    return result;
  }, [transactions]);

  // Personal vs Office comparison data for bar chart
  const personalVsOfficeData = useMemo(() => {
    return [
      {
        name: 'Spending',
        Personal: periodStats.personalExpense,
        Office: periodStats.officeExpense,
      },
    ];
  }, [periodStats]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-3 p-3 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
        <div className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 dark:text-slate-400">
          <Filter className="w-3.5 h-3.5 text-emerald-600" />
          <span className="hidden sm:inline">{isBn ? 'সময়কাল:' : 'Timeline:'}</span>
        </div>

        <div className="flex flex-wrap items-center gap-1">
          {(
            [
              { id: 'today', label: isBn ? 'আজ' : 'Today' },
              { id: 'yesterday', label: isBn ? 'গতকাল' : 'Yesterday' },
              { id: 'week', label: isBn ? 'চলতি সপ্তাহ' : 'This Week' },
              { id: 'month', label: isBn ? 'চলতি মাস' : 'This Month' },
              { id: 'last_month', label: isBn ? 'গত মাস' : 'Last Month' },
              { id: 'all', label: isBn ? 'সকল সময়' : 'All Time' },
              { id: 'custom', label: isBn ? 'কাস্টম' : 'Custom' },
            ] as const
          ).map((opt) => (
            <button
              key={opt.id}
              onClick={() => setDateFilter(opt.id)}
              className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold transition ${
                dateFilter === opt.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs'
                  : 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800'
              }`}
            >
              {opt.label}
            </button>
          ))}
        </div>

        {dateFilter === 'custom' && (
          <div className="flex items-center gap-2 pt-2 sm:pt-0 w-full sm:w-auto">
            <input
              type="date"
              value={customStart}
              onChange={(e) => setCustomStart(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
            />
            <span className="text-xs text-slate-400">{isBn ? 'থেকে' : 'to'}</span>
            <input
              type="date"
              value={customEnd}
              onChange={(e) => setCustomEnd(e.target.value)}
              className="px-2 py-1 rounded-lg border border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-950 text-xs font-medium"
            />
          </div>
        )}
      </div>

      {/* 8 Primary Financial Cards required by prompt */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
        {/* Total Balance */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">{t('totalBalance')}</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <Wallet className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold font-mono tabular-nums text-slate-900 dark:text-white">
            {formatBDT(summary.totalBalance)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 truncate">
            {isBn ? `${accounts.length}টি সক্রিয় ওয়ালেট` : `Across ${accounts.length} active wallets`}
          </div>
        </div>

        {/* Total Income */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">{t('totalIncome')}</span>
            <div className="w-7 h-7 rounded-lg bg-teal-50 dark:bg-teal-950/50 flex items-center justify-center text-teal-600 dark:text-teal-400">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400">
            {formatBDT(summary.totalIncome)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {isBn ? 'নির্বাচিত:' : 'Selected:'} <span className="font-semibold text-slate-700 dark:text-slate-300">{formatBDT(periodStats.income)}</span>
          </div>
        </div>

        {/* Personal Expenses */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">{t('personalExpenses')}</span>
            <div className="w-7 h-7 rounded-lg bg-rose-50 dark:bg-rose-950/50 flex items-center justify-center text-rose-600 dark:text-rose-400">
              <ShoppingBag className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400">
            {formatBDT(summary.totalPersonalExpenses)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {isBn ? 'নির্বাচিত:' : 'Selected:'} <span className="font-semibold text-slate-700 dark:text-slate-300">{formatBDT(periodStats.personalExpense)}</span>
          </div>
        </div>

        {/* Office Expenses */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">{t('officeExpenses')}</span>
            <div className="w-7 h-7 rounded-lg bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 dark:text-amber-400">
              <Building2 className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400">
            {formatBDT(summary.totalOfficeExpenses)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400 truncate">
            {isBn ? 'বকেয়া ক্লেইম:' : 'Pending Reimb:'} <span className="font-semibold text-amber-600">{formatBDT(summary.pendingOfficeReimbursement)}</span>
          </div>
        </div>

        {/* Total Borrowed */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">{t('totalBorrowed')}</span>
            <div className="w-7 h-7 rounded-lg bg-orange-50 dark:bg-orange-950/50 flex items-center justify-center text-orange-600 dark:text-orange-400">
              <HandCoins className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold font-mono tabular-nums text-orange-600 dark:text-orange-400">
            {formatBDT(summary.totalBorrowed)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {isBn ? 'পরিশোধিত:' : 'Repaid:'} <span className="font-semibold text-emerald-600">{formatBDT(summary.totalBorrowedRepaid)}</span>
          </div>
        </div>

        {/* Amount I Owe (Liability) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">{t('amountIOwe')}</span>
            <div className="w-7 h-7 rounded-lg bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold font-mono tabular-nums text-red-600 dark:text-red-400">
            {formatBDT(summary.amountIOwe)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {borrowings.filter((b) => b.status !== 'Fully Repaid').length} {isBn ? 'টি সক্রিয় দেনা' : 'active debt loan(s)'}
          </div>
        </div>

        {/* Total Lent */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">{t('totalLent')}</span>
            <div className="w-7 h-7 rounded-lg bg-blue-50 dark:bg-blue-950/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Send className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold font-mono tabular-nums text-blue-600 dark:text-blue-400">
            {formatBDT(summary.totalLent)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {isBn ? 'আদায়কৃত:' : 'Collected:'} <span className="font-semibold text-emerald-600">{formatBDT(summary.totalLentCollected)}</span>
          </div>
        </div>

        {/* Amount Owed to Me (Receivable Asset) */}
        <div className="p-4 sm:p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between">
            <span className="text-[11px] sm:text-xs font-semibold text-slate-500">{t('amountOwedToMe')}</span>
            <div className="w-7 h-7 rounded-lg bg-indigo-50 dark:bg-indigo-950/50 flex items-center justify-center text-indigo-600 dark:text-indigo-400">
              <ArrowDownRight className="w-4 h-4" />
            </div>
          </div>
          <div className="mt-2 text-lg sm:text-2xl font-bold font-mono tabular-nums text-indigo-600 dark:text-indigo-400">
            {formatBDT(summary.amountOwedToMe)}
          </div>
          <div className="mt-1 text-[10px] text-slate-400">
            {lendings.filter((l) => l.status !== 'Fully Collected').length} {isBn ? 'টি বকেয়া পাওনা' : 'pending collection(s)'}
          </div>
        </div>
      </div>

      {/* Quick Cadence Summary: Today, This Week, This Month */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-4 rounded-2xl bg-emerald-950/5 dark:bg-emerald-950/20 border border-emerald-200/50 dark:border-emerald-800/40">
        <div>
          <span className="text-[11px] text-slate-500 font-medium">{t('todayExpenses')}</span>
          <div className="text-base font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-0.5">
            {formatBDT(summary.todayExpenses)}
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-medium">{t('todayIncome')}</span>
          <div className="text-base font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-0.5">
            {formatBDT(summary.todayIncome)}
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-medium">{isBn ? 'চলতি সপ্তাহের খরচ' : "This Week's Expenses"}</span>
          <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
            {formatBDT(summary.weekExpenses)}
          </div>
        </div>
        <div>
          <span className="text-[11px] text-slate-500 font-medium">{isBn ? 'চলতি মাসের খরচ' : "This Month's Expenses"}</span>
          <div className="text-base font-bold font-mono tabular-nums text-slate-900 dark:text-white mt-0.5">
            {formatBDT(summary.monthExpenses)}
          </div>
        </div>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Income vs Expenses 6-Month Trend */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBn ? 'মাসিক নগদ প্রবাহ ট্রেন্ড' : 'Monthly Cash Flow Trend'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBn ? 'গত ৬ মাসের আয় ও ব্যয়ের তুলনামূলক চিত্র' : 'Income vs Total Expenses over past 6 months'}
              </p>
            </div>
            <div className="text-xs font-semibold text-emerald-600 dark:text-emerald-400">
              BDT (৳)
            </div>
          </div>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={monthlyTrendData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatBDT(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend iconType="circle" wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Line type="monotone" dataKey="income" name={isBn ? 'আয়' : 'Income'} stroke="#10b981" strokeWidth={3} dot={{ r: 4 }} />
                <Line type="monotone" dataKey="totalExpenses" name={isBn ? 'মোট ব্যয়' : 'Total Expenses'} stroke="#f43f5e" strokeWidth={3} dot={{ r: 4 }} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category-wise Expense Breakdown (Donut Chart) */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBn ? 'ক্যাটাগরি ভিত্তিক ব্যয়' : 'Category Breakdown'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBn ? 'নির্বাচিত সময়ের ব্যয়ের বণ্টন' : 'Spending in selected period'}
              </p>
            </div>
          </div>

          <div className="h-52 w-full my-auto">
            {categoryChartData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryChartData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={50}
                    outerRadius={75}
                    paddingAngle={3}
                  >
                    {categoryChartData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatBDT(Number(val)), isBn ? 'পরিমাণ' : 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '12px',
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {isBn ? 'এই সময়সীমার মধ্যে কোনো খরচের রেকর্ড নেই' : 'No expense records in this range'}
              </div>
            )}
          </div>

          {/* Top 3 categories list */}
          <div className="space-y-1.5 pt-2 border-t border-slate-100 dark:border-slate-800">
            {categoryChartData.slice(0, 3).map((item) => (
              <div key={item.name} className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-1.5 truncate">
                  <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="text-slate-600 dark:text-slate-300 truncate">{item.name}</span>
                </div>
                <span className="font-mono font-semibold text-slate-900 dark:text-white tabular-nums">
                  {formatBDT(item.value)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Personal vs Office Comparison & Recent Transactions */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal vs Office Bar Card */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {isBn ? 'ব্যক্তিগত বনাম অফিস খরচ' : 'Personal vs Office'}
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            {isBn ? 'নির্বাচিত সময়ের ব্যয়ের তুলনামূলক চিত্র' : 'Spending breakdown in selected period'}
          </p>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={personalVsOfficeData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="name" stroke="#94a3b8" fontSize={11} tickLine={false} />
                <YAxis
                  stroke="#94a3b8"
                  fontSize={11}
                  tickLine={false}
                  tickFormatter={(val) => `৳${(val / 1000).toFixed(0)}k`}
                />
                <Tooltip
                  formatter={(val: any) => [formatBDT(Number(val)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '12px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '4px' }} />
                <Bar dataKey="Personal" name={isBn ? 'ব্যক্তিগত' : 'Personal'} fill="#f43f5e" radius={[6, 6, 0, 0]} />
                <Bar dataKey="Office" name={isBn ? 'অফিস' : 'Office'} fill="#f59e0b" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="mt-4 pt-3 border-t border-slate-100 dark:border-slate-800 space-y-2 text-xs">
            <div className="flex justify-between items-center">
              <span className="text-slate-500">{isBn ? 'ব্যক্তিগত ব্যয়:' : 'Personal Spending:'}</span>
              <span className="font-mono font-bold text-rose-600">{formatBDT(periodStats.personalExpense)}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-slate-500">{isBn ? 'অফিস ব্যয়:' : 'Office Spending:'}</span>
              <span className="font-mono font-bold text-amber-600">{formatBDT(periodStats.officeExpense)}</span>
            </div>
            <div className="flex justify-between items-center font-bold text-slate-900 dark:text-white">
              <span>{isBn ? 'সর্বমোট ব্যয়:' : 'Total Spending:'}</span>
              <span className="font-mono">{formatBDT(periodStats.totalExpense)}</span>
            </div>
          </div>
        </div>

        {/* Recent Transactions List */}
        <div className="lg:col-span-2 p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">{t('recentActivity')}</h3>
              <p className="text-[11px] text-slate-500">
                {isBn ? 'আপনার লেজারের সর্বশেষ লিপিবদ্ধ লেনদেনসমূহ' : 'Latest records in your transaction ledger'}
              </p>
            </div>
            <button
              onClick={() => onSelectView('transactions')}
              className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              {t('viewAll')}
            </button>
          </div>

          <div className="flex-1 space-y-2 overflow-y-auto max-h-80">
            {transactions.slice(0, 6).map((tx) => {
              const isIncome = tx.type === 'income';
              const isOffice = tx.type === 'office_expense';

              return (
                <div
                  key={tx.id}
                  onClick={() => onEditTransaction(tx)}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800/60 cursor-pointer transition"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div
                      className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${
                        isIncome
                          ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400'
                          : isOffice
                          ? 'bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400'
                          : 'bg-rose-50 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? (
                        <ArrowUpRight className="w-4 h-4" />
                      ) : (
                        <ArrowDownRight className="w-4 h-4" />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 dark:text-white truncate">
                        {tx.description}
                      </div>
                      <div className="text-[11px] text-slate-500 flex items-center gap-1.5 truncate mt-0.5">
                        <span>{tx.category}</span>
                        <span>·</span>
                        <span>{tx.payment_method}</span>
                        <span>·</span>
                        <span>{formatDate(tx.date)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="text-right shrink-0 pl-2">
                    <div
                      className={`text-xs font-bold font-mono tabular-nums ${
                        isIncome
                          ? 'text-emerald-600 dark:text-emerald-400'
                          : isOffice
                          ? 'text-amber-600 dark:text-amber-400'
                          : 'text-rose-600 dark:text-rose-400'
                      }`}
                    >
                      {isIncome ? '+' : '-'}{formatBDT(tx.amount)}
                    </div>
                    {isOffice && tx.reimbursement_status && (
                      <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium">
                        {tx.reimbursement_status}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {transactions.length === 0 && (
              <div className="p-8 text-center text-xs text-slate-400">
                {t('noTransactionsYet')}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
