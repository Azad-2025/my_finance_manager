import React, { useState, useMemo } from 'react';
import {
  BarChart3,
  Download,
  Calendar,
  Filter,
  TrendingUp,
  ShoppingBag,
  Building2,
  HandCoins,
  Send,
  FileSpreadsheet,
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

type ReportCadence = 'daily' | 'weekly' | 'monthly' | 'yearly';
type ReportSection = 'all' | 'personal' | 'office' | 'income' | 'borrowing' | 'lending';

export const ReportsView: React.FC = () => {
  const { transactions, borrowings, lendings, exportToCSV } = useFinance();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const [cadence, setCadence] = useState<ReportCadence>('monthly');
  const [activeSection, setActiveSection] = useState<ReportSection>('all');
  const [customStartDate, setCustomStartDate] = useState('');
  const [customEndDate, setCustomEndDate] = useState('');

  // Filtered transactions for the report
  const filteredTransactions = useMemo(() => {
    return transactions.filter((t) => {
      if (customStartDate && t.date < customStartDate) return false;
      if (customEndDate && t.date > customEndDate) return false;
      if (activeSection === 'personal' && t.type !== 'personal_expense') return false;
      if (activeSection === 'office' && t.type !== 'office_expense') return false;
      if (activeSection === 'income' && t.type !== 'income') return false;
      return true;
    });
  }, [transactions, activeSection, customStartDate, customEndDate]);

  // Aggregate numbers
  const totals = useMemo(() => {
    let income = 0;
    let personal = 0;
    let office = 0;

    filteredTransactions.forEach((t) => {
      if (t.type === 'income') income += Number(t.amount);
      if (t.type === 'personal_expense') personal += Number(t.amount);
      if (t.type === 'office_expense') office += Number(t.amount);
    });

    return {
      income,
      personal,
      office,
      totalExpenses: personal + office,
      netSavings: income - (personal + office),
    };
  }, [filteredTransactions]);

  // Income vs Expenses Monthly Chart
  const monthlyData = useMemo(() => {
    const monthMap: Record<string, { month: string; income: number; personal: number; office: number }> = {};
    const now = new Date();

    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
      const label = d.toLocaleString('en-US', { month: 'short', year: '2-digit' });
      monthMap[key] = { month: label, income: 0, personal: 0, office: 0 };
    }

    transactions.forEach((t) => {
      const key = t.date.substring(0, 7);
      if (monthMap[key]) {
        if (t.type === 'income') monthMap[key].income += Number(t.amount);
        if (t.type === 'personal_expense') monthMap[key].personal += Number(t.amount);
        if (t.type === 'office_expense') monthMap[key].office += Number(t.amount);
      }
    });

    return Object.values(monthMap);
  }, [transactions]);

  // Category Pie Data
  const categoryPieData = useMemo(() => {
    const map: Record<string, number> = {};
    filteredTransactions
      .filter((t) => t.type !== 'income')
      .forEach((t) => {
        map[t.category] = (map[t.category] || 0) + Number(t.amount);
      });

    const colors = [
      '#10b981', '#3b82f6', '#f59e0b', '#ec4899', '#8b5cf6',
      '#06b6d4', '#f97316', '#ef4444', '#14b8a6', '#64748b'
    ];

    return Object.entries(map).map(([name, value], i) => ({
      name,
      value,
      color: colors[i % colors.length],
    })).sort((a, b) => b.value - a.value);
  }, [filteredTransactions]);

  // Borrowed vs Repaid Comparison
  const debtChartData = useMemo(() => {
    let borrowed = 0;
    let repaid = 0;
    borrowings.forEach((b) => {
      borrowed += Number(b.amount);
      repaid += Number(b.repaid_amount || 0);
    });

    return [
      { name: 'Debt Status', Borrowed: borrowed, Repaid: repaid, Remaining: Math.max(0, borrowed - repaid) }
    ];
  }, [borrowings]);

  // Lent vs Collected Comparison
  const lendingChartData = useMemo(() => {
    let lent = 0;
    let collected = 0;
    lendings.forEach((l) => {
      lent += Number(l.amount);
      collected += Number(l.collected_amount || 0);
    });

    return [
      { name: 'Receivables Status', Lent: lent, Collected: collected, Remaining: Math.max(0, lent - collected) }
    ];
  }, [lendings]);

  return (
    <div className="space-y-6 max-w-7xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-indigo-500" />
            <span>{isBn ? 'আর্থিক প্রতিবেদন ও অ্যানালিটিক্স' : 'Financial Reports & Analytics'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {isBn
              ? 'অডিট গ্রেড রিপোর্টিং, ক্যাশফ্লো প্রবণতা এবং আর্থিক বিবরণী (টাকায় / ৳)'
              : 'Audit-grade reporting, cashflow trends, and balance sheets in BDT (৳)'}
          </p>
        </div>

        <div className="flex items-center gap-2 self-stretch sm:self-auto">
          <button
            onClick={() => exportToCSV(activeSection === 'personal' ? 'personal' : activeSection === 'office' ? 'office' : 'all')}
            className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 hover:bg-slate-800 text-xs font-bold shadow-xs transition"
          >
            <Download className="w-3.5 h-3.5" />
            <span>{isBn ? 'রিপোর্ট CSV ডাউনলোড' : 'Export Report CSV'}</span>
          </button>
        </div>
      </div>

      {/* Report Section Selector Tabs */}
      <div className="flex flex-wrap items-center gap-2 p-1.5 rounded-2xl bg-slate-100 dark:bg-slate-800 text-xs">
        {(
          [
            { id: 'all', labelEn: 'Consolidated Statement', labelBn: 'সমন্বিত বিবরণী' },
            { id: 'personal', labelEn: 'Personal Expenses', labelBn: 'ব্যক্তিগত ব্যয়' },
            { id: 'office', labelEn: 'Office & Reimbursements', labelBn: 'অফিস ও রিইমবার্সমেন্ট' },
            { id: 'income', labelEn: 'Income & Earnings', labelBn: 'আয় ও উপার্জন' },
            { id: 'borrowing', labelEn: 'Debt & Liabilities', labelBn: 'ঋণ ও দায়' },
            { id: 'lending', labelEn: 'Lent & Receivables', labelBn: 'ধার ও পাওনা' },
          ] as const
        ).map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveSection(tab.id)}
            className={`px-3 py-2 rounded-xl font-semibold transition ${
              activeSection === tab.id
                ? 'bg-white dark:bg-slate-900 text-slate-900 dark:text-white shadow-xs'
                : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
            }`}
          >
            {isBn ? tab.labelBn : tab.labelEn}
          </button>
        ))}
      </div>

      {/* Date Range Selector */}
      <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex items-center gap-2 font-semibold text-slate-700 dark:text-slate-300">
          <Calendar className="w-4 h-4 text-emerald-500" />
          <span>{isBn ? 'রিপোর্টের সময়কাল:' : 'Report Date Range:'}</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="date"
            value={customStartDate}
            onChange={(e) => setCustomStartDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
          />
          <span className="text-slate-400">{isBn ? 'থেকে' : 'to'}</span>
          <input
            type="date"
            value={customEndDate}
            onChange={(e) => setCustomEndDate(e.target.value)}
            className="px-2.5 py-1.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white"
          />
          {(customStartDate || customEndDate) && (
            <button
              onClick={() => {
                setCustomStartDate('');
                setCustomEndDate('');
              }}
              className="text-[11px] text-slate-400 hover:text-slate-600 underline ml-2"
            >
              {isBn ? 'রিসেট' : 'Reset'}
            </button>
          )}
        </div>
      </div>

      {/* KPI Financial Overview */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">
            {isBn ? 'সময়কালের আয়' : 'Period Income'}
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-emerald-600 dark:text-emerald-400 mt-1">
            {formatBDT(totals.income)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">
            {isBn ? 'ব্যক্তিগত ব্যয়' : 'Personal Spending'}
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-rose-600 dark:text-rose-400 mt-1">
            {formatBDT(totals.personal)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">
            {isBn ? 'অফিস খরচ' : 'Office Spending'}
          </span>
          <div className="text-xl font-bold font-mono tabular-nums text-amber-600 dark:text-amber-400 mt-1">
            {formatBDT(totals.office)}
          </div>
        </div>

        <div className="p-4 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <span className="text-[11px] font-semibold text-slate-500">
            {isBn ? 'নিট সঞ্চয়' : 'Net Period Savings'}
          </span>
          <div
            className={`text-xl font-bold font-mono tabular-nums mt-1 ${
              totals.netSavings >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
            }`}
          >
            {formatBDT(totals.netSavings)}
          </div>
        </div>
      </div>

      {/* Primary Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Income vs Expense Trend */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {isBn ? '১২ মাসের ক্যাশফ্লো প্রবণতা' : '12-Month Cashflow Trend'}
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            {isBn
              ? 'ব্যক্তিগত ও অফিস খরচের সাথে আয়ের তুলনা'
              : 'Monthly Income compared to Personal & Office Expenses'}
          </p>

          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={monthlyData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <XAxis dataKey="month" stroke="#94a3b8" fontSize={10} tickLine={false} />
                <YAxis stroke="#94a3b8" fontSize={10} tickLine={false} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  formatter={(v: any) => [formatBDT(Number(v)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '8px' }} />
                <Bar dataKey="income" name={isBn ? 'আয়' : 'Income'} fill="#10b981" radius={[4, 4, 0, 0]} />
                <Bar dataKey="personal" name={isBn ? 'ব্যক্তিগত' : 'Personal'} fill="#f43f5e" radius={[4, 4, 0, 0]} />
                <Bar dataKey="office" name={isBn ? 'অফিস' : 'Office'} fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Category Expense Breakdown */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {isBn ? 'ক্যাটাগরি ভিত্তিক ব্যয়' : 'Category Breakdown'}
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            {isBn ? 'ব্যয়ের আনুপাতিক অনুপাত' : 'Relative proportion of expenses'}
          </p>

          <div className="h-64 w-full">
            {categoryPieData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={categoryPieData}
                    dataKey="value"
                    nameKey="name"
                    innerRadius={55}
                    outerRadius={85}
                    paddingAngle={3}
                  >
                    {categoryPieData.map((e, idx) => (
                      <Cell key={`cell-${idx}`} fill={e.color} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(v: any) => [formatBDT(Number(v)), isBn ? 'পরিমাণ' : 'Amount']}
                    contentStyle={{
                      backgroundColor: '#0f172a',
                      border: '1px solid #1e293b',
                      borderRadius: '0.75rem',
                      color: '#fff',
                      fontSize: '11px',
                    }}
                  />
                  <Legend wrapperStyle={{ fontSize: '10px', paddingTop: '8px' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-xs text-slate-400">
                {isBn ? 'নির্বাচিত ফিল্টারে কোনো ব্যয়ের তথ্য নেই' : 'No expense data available for selected filters'}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Liabilities & Receivables Comparative Strip */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Borrowed vs Repaid */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {isBn ? 'দায়: ধার গ্রহণ বনাম পরিশোধ' : 'Liabilities: Borrowed vs Repaid'}
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            {isBn ? 'ঋণের অবস্থা এবং বকেয়া দেনা' : 'Debt status & outstanding debt liability'}
          </p>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={debtChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `৳${v / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} hide />
                <Tooltip
                  formatter={(v: any) => [formatBDT(Number(v)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Borrowed" name={isBn ? 'গৃহীত ধার' : 'Borrowed'} fill="#ea580c" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Repaid" name={isBn ? 'পরিশোধিত' : 'Repaid'} fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Remaining" name={isBn ? 'অবশিষ্ট বকেয়া' : 'Remaining'} fill="#dc2626" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Lent vs Collected */}
        <div className="p-5 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs">
          <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
            {isBn ? 'পাওনা: অন্যকে প্রদত্ত ধার বনাম আদায়' : 'Receivables: Lent vs Collected'}
          </h3>
          <p className="text-[11px] text-slate-500 mb-4">
            {isBn ? 'প্রাপ্য সম্পদের অবস্থা এবং আপনার পাওনা টাকা' : 'Receivable asset status & money owed to you'}
          </p>

          <div className="h-44 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={lendingChartData} layout="vertical" margin={{ top: 5, right: 20, left: 20, bottom: 5 }}>
                <XAxis type="number" stroke="#94a3b8" fontSize={10} tickFormatter={(v) => `৳${v / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="#94a3b8" fontSize={11} hide />
                <Tooltip
                  formatter={(v: any) => [formatBDT(Number(v)), '']}
                  contentStyle={{
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    borderRadius: '0.75rem',
                    color: '#fff',
                    fontSize: '11px',
                  }}
                />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Lent" name={isBn ? 'প্রদত্ত ধার' : 'Lent'} fill="#2563eb" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Collected" name={isBn ? 'আদায়কৃত' : 'Collected'} fill="#10b981" radius={[0, 4, 4, 0]} />
                <Bar dataKey="Remaining" name={isBn ? 'অবশিষ্ট বকেয়া' : 'Remaining'} fill="#4f46e5" radius={[0, 4, 4, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};
