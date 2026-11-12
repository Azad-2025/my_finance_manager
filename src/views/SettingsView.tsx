import React, { useState } from 'react';
import {
  Settings as SettingsIcon,
  Download,
  Upload,
  Database,
  Key,
  Copy,
  Check,
  RefreshCw,
  ShieldCheck,
  FileCode,
  AlertTriangle,
  Sun,
  Moon,
  User,
  Phone,
  Mail,
  Trash2,
  RotateCcw,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { getSavedSupabaseConfig } from '../lib/supabase';
import { BrandLogo } from '../components/common/BrandLogo';
import { PWAInstallButton } from '../components/common/PWAInstallButton';

interface SettingsViewProps {
  darkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenAuth: () => void;
}

const SUPABASE_SCHEMA_SQL = `-- MY FINANCE MANAGER - POSTGRESQL SCHEMA WITH RLS
create extension if not exists "uuid-ossp";

create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  currency text default 'BDT',
  timezone text default 'Asia/Dhaka',
  created_at timestamptz default now() not null
);

create table if not exists public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null,
  balance numeric(15, 2) default 0.00 not null,
  account_number text,
  is_default boolean default false,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null,
  color text,
  is_custom boolean default true,
  created_at timestamptz default now() not null
);

create table if not exists public.transactions (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  date date not null default current_date,
  type text not null check (type in ('income', 'personal_expense', 'office_expense')),
  category text not null,
  description text not null,
  amount numeric(15, 2) not null check (amount > 0),
  payment_method text not null,
  account_id uuid references public.accounts(id) on delete set null,
  notes text,
  receipt_url text,
  project_name text,
  reimbursement_status text default 'Not Submitted',
  reimbursed_amount numeric(15, 2) default 0.00,
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.borrowings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  person_name text not null,
  phone_number text,
  borrowed_date date not null default current_date,
  amount numeric(15, 2) not null check (amount > 0),
  purpose text,
  due_date date,
  notes text,
  repaid_amount numeric(15, 2) default 0.00,
  status text default 'Unpaid',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.borrowing_repayments (
  id uuid default gen_random_uuid() primary key,
  borrowing_id uuid references public.borrowings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  payment_date date not null default current_date,
  amount numeric(15, 2) not null check (amount > 0),
  payment_method text not null,
  account_id uuid references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz default now() not null
);

create table if not exists public.lendings (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  person_name text not null,
  phone_number text,
  lending_date date not null default current_date,
  amount numeric(15, 2) not null check (amount > 0),
  purpose text,
  expected_return_date date,
  notes text,
  collected_amount numeric(15, 2) default 0.00,
  status text default 'Uncollected',
  created_at timestamptz default now() not null,
  updated_at timestamptz default now() not null
);

create table if not exists public.lending_collections (
  id uuid default gen_random_uuid() primary key,
  lending_id uuid references public.lendings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  collection_date date not null default current_date,
  amount numeric(15, 2) not null check (amount > 0),
  payment_method text not null,
  account_id uuid references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz default now() not null
);

create table if not exists public.office_reimbursements (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  reimbursement_date date not null default current_date,
  amount numeric(15, 2) not null check (amount > 0),
  payment_method text not null,
  account_id uuid references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz default now() not null
);

create table if not exists public.account_transfers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  transfer_date date not null default current_date,
  from_account_id uuid references public.accounts(id) on delete cascade not null,
  to_account_id uuid references public.accounts(id) on delete cascade not null,
  amount numeric(15, 2) not null check (amount > 0),
  notes text,
  created_at timestamptz default now() not null
);

-- Enable RLS
alter table public.profiles enable row level security;
alter table public.accounts enable row level security;
alter table public.categories enable row level security;
alter table public.transactions enable row level security;
alter table public.borrowings enable row level security;
alter table public.borrowing_repayments enable row level security;
alter table public.lendings enable row level security;
alter table public.lending_collections enable row level security;
alter table public.office_reimbursements enable row level security;
alter table public.account_transfers enable row level security;

create policy "Users can manage own accounts" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own categories" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own borrowings" on public.borrowings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own borrowing repayments" on public.borrowing_repayments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own lendings" on public.lendings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own lending collections" on public.lending_collections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own office reimbursements" on public.office_reimbursements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own account transfers" on public.account_transfers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
`;

export const SettingsView: React.FC<SettingsViewProps> = ({
  darkMode,
  onToggleDarkMode,
  onOpenAuth,
}) => {
  const {
    exportCompleteJSON,
    importJSON,
    exportToCSV,
    syncToSupabase,
    syncing,
    clearAllData,
    transactions,
    borrowings,
    lendings,
    accounts,
  } = useFinance();
  const { user, userProfile, updateProfile, isConfigured, saveCredentials } = useAuth();
  const { language } = useLanguage();
  const isBn = language === 'bn';

  const savedCfg = getSavedSupabaseConfig();
  const [supabaseUrl, setSupabaseUrl] = useState(savedCfg.url);
  const [supabaseKey, setSupabaseKey] = useState(savedCfg.anonKey);
  const [copiedSql, setCopiedSql] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [importConfirmOpen, setImportConfirmOpen] = useState(false);
  const [pendingImportContent, setPendingImportContent] = useState<string | null>(null);
  const [resetConfirmOpen, setResetConfirmOpen] = useState(false);

  // Profile edit state
  const [profileName, setProfileName] = useState(userProfile.name);
  const [profilePhone, setProfilePhone] = useState(userProfile.phone);
  const [profileEmail, setProfileEmail] = useState(userProfile.email);
  const [profileSaved, setProfileSaved] = useState(false);

  const handleUpdateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    updateProfile({
      name: profileName.trim() || userProfile.name || 'Account Owner',
      phone: profilePhone.trim() || userProfile.phone || '',
      email: profileEmail.trim() || userProfile.email || '',
    });
    setProfileSaved(true);
    setStatusMsg({ type: 'success', text: 'Personal profile updated successfully!' });
    setTimeout(() => setProfileSaved(false), 2500);
  };

  const handleResetCleanData = () => {
    clearAllData();
    setResetConfirmOpen(false);
    setStatusMsg({ type: 'success', text: 'All transactions and records have been completely cleared! Ready for fresh entry.' });
  };

  const handleCopySql = () => {
    navigator.clipboard.writeText(SUPABASE_SCHEMA_SQL);
    setCopiedSql(true);
    setTimeout(() => setCopiedSql(false), 2000);
  };

  const handleDownloadJSON = () => {
    const jsonStr = exportCompleteJSON();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `my_finance_backup_${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setStatusMsg({ type: 'success', text: 'Complete JSON backup downloaded!' });
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (evt) => {
      const content = evt.target?.result as string;
      setPendingImportContent(content);
      setImportConfirmOpen(true);
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const executeImport = () => {
    if (!pendingImportContent) return;
    const res = importJSON(pendingImportContent);
    if (res.success) {
      setStatusMsg({ type: 'success', text: res.message });
    } else {
      setStatusMsg({ type: 'error', text: res.message });
    }
    setImportConfirmOpen(false);
    setPendingImportContent(null);
  };

  const handleSaveCredentials = (e: React.FormEvent) => {
    e.preventDefault();
    if (!supabaseUrl.startsWith('http') || !supabaseKey) {
      setStatusMsg({ type: 'error', text: 'Please enter a valid Supabase URL and Anon key.' });
      return;
    }
    saveCredentials(supabaseUrl.trim(), supabaseKey.trim());
    setStatusMsg({ type: 'success', text: 'Supabase credentials saved successfully!' });
  };

  const handleSyncToSupabase = async () => {
    setStatusMsg(null);
    const res = await syncToSupabase();
    if (res.success) {
      setStatusMsg({ type: 'success', text: 'Local finance records successfully synced with Supabase PostgreSQL!' });
    } else {
      setStatusMsg({ type: 'error', text: res.error || 'Failed to sync with Supabase.' });
    }
  };

  return (
    <div className="space-y-8 max-w-4xl mx-auto pb-16">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-lg sm:text-xl font-bold text-slate-900 dark:text-white flex items-center gap-2">
            <SettingsIcon className="w-5 h-5 text-slate-700 dark:text-slate-300" />
            <span>{isBn ? 'সেটিংস ও ডাটা ব্যবস্থাপনা' : 'Settings & Data Management'}</span>
          </h2>
          <p className="text-xs text-slate-500">
            {isBn
              ? 'সুপাবেস ডাটাবেজ কনফিগারেশন, ব্যাকআপ/রিস্টোর এবং পছন্দসমূহ'
              : 'Supabase PostgreSQL configuration, backup/restore, and application preferences'}
          </p>
        </div>
        <div className="self-start sm:self-auto py-1">
          <BrandLogo size="md" />
        </div>
      </div>

      {statusMsg && (
        <div
          className={`p-4 rounded-2xl border text-xs font-semibold ${
            statusMsg.type === 'success'
              ? 'bg-emerald-50 dark:bg-emerald-950/40 border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-400'
              : 'bg-red-50 dark:bg-red-950/40 border-red-200 dark:border-red-900 text-red-700 dark:text-red-400'
          }`}
        >
          {statusMsg.text}
        </div>
      )}

      {/* 1. Personal Profile Card */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-600 text-white flex items-center justify-center font-bold text-base shadow-sm">
              MS
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBn ? 'ব্যক্তিগত প্রোফাইল ও যোগাযোগ' : 'Personal Profile & Contact'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBn
                  ? 'লেজার এন্ট্রি, ঋণ এবং বিবরণীর জন্য মূল ব্যবহারকারীর পরিচয়'
                  : 'Primary user identity for ledger entries, borrowings, and statements'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-semibold px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400">
            {isBn ? 'সক্রিয় স্বত্বাধিকারী' : 'Active Owner'}
          </span>
        </div>

        <form onSubmit={handleUpdateProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'সম্পূর্ণ নাম' : 'Full Name'}
              </label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  required
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  placeholder="Muhammad Salah Uddin"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
                {isBn ? 'মোবাইল নম্বর (বিকাশ / নগদ)' : 'Mobile Number (bKash / Nagad)'}
              </label>
              <div className="relative">
                <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="tel"
                  required
                  value={profilePhone}
                  onChange={(e) => setProfilePhone(e.target.value)}
                  placeholder="01XXXXXXXXX"
                  className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono font-semibold focus:outline-none focus:ring-2 focus:ring-emerald-500"
                />
              </div>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'ইমেইল ঠিকানা' : 'Email Address'}
            </label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
              <input
                type="email"
                value={profileEmail}
                onChange={(e) => setProfileEmail(e.target.value)}
                placeholder="user@example.com"
                className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-medium focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>

          <div className="flex items-center justify-between pt-1">
            <div className="text-[11px] text-slate-500">
              {isBn ? 'বর্তমান:' : 'Current:'}{' '}
              <strong className="text-slate-800 dark:text-slate-200">{userProfile.name}</strong> •{' '}
              <span className="font-mono">{userProfile.phone}</span>
            </div>
            <button
              type="submit"
              className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              <Check className="w-3.5 h-3.5" />
              <span>
                {profileSaved
                  ? (isBn ? 'প্রোফাইল সংরক্ষিত!' : 'Profile Updated!')
                  : (isBn ? 'প্রোফাইল পরিবর্তন সংরক্ষণ করুন' : 'Save Profile Changes')}
              </span>
            </button>
          </div>
        </form>
      </div>

      {/* 2. Supabase Database Configuration & Status */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-5">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100 dark:border-slate-800">
          <div className="flex items-center gap-2">
            <Database className="w-5 h-5 text-emerald-600" />
            <h3 className="text-sm font-bold text-slate-900 dark:text-white">
              {isBn ? 'সুপাবেস পোস্টগ্রেসকিউএল ডাটাবেজ' : 'Supabase PostgreSQL Database'}
            </h3>
          </div>

          <div className="flex items-center gap-2">
            <span
              className={`text-[11px] font-semibold px-2.5 py-1 rounded-md flex items-center gap-1.5 ${
                isConfigured
                  ? 'bg-emerald-50 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400'
                  : 'bg-amber-50 text-amber-700 dark:bg-amber-950/60 dark:text-amber-400'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${isConfigured ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              <span>
                {isConfigured
                  ? (isBn ? 'সংযুক্ত' : 'Connected')
                  : (isBn ? 'অফলাইন স্যান্ডবক্স' : 'Offline Sandbox')}
              </span>
            </span>
          </div>
        </div>

        <form onSubmit={handleSaveCredentials} className="space-y-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'সুপাবেস প্রজেক্ট URL' : 'Supabase Project URL'}
            </label>
            <input
              type="url"
              placeholder="https://xyzproject.supabase.co"
              value={supabaseUrl}
              onChange={(e) => setSupabaseUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-600 dark:text-slate-400 mb-1">
              {isBn ? 'সুপাবেস অ্যানন পাবলিক API কী' : 'Supabase Anon Public API Key'}
            </label>
            <input
              type="password"
              placeholder="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
              value={supabaseKey}
              onChange={(e) => setSupabaseKey(e.target.value)}
              className="w-full px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-white text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 pt-2">
            <button
              type="submit"
              className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold transition shadow-xs"
            >
              {isBn ? 'ক্রেডেনশিয়াল সংরক্ষণ করুন' : 'Save Credentials'}
            </button>

            {user ? (
              <button
                type="button"
                onClick={handleSyncToSupabase}
                disabled={syncing}
                className="flex items-center gap-1.5 px-4 py-2 rounded-xl bg-slate-900 dark:bg-white text-white dark:text-slate-900 text-xs font-bold transition disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${syncing ? 'animate-spin' : ''}`} />
                <span>
                  {syncing
                    ? (isBn ? 'সিঙ্ক হচ্ছে...' : 'Syncing...')
                    : (isBn ? 'লোকাল ডাটা সুপাবেসে সিঙ্ক করুন' : 'Push Local Data to Supabase')}
                </span>
              </button>
            ) : (
              <button
                type="button"
                onClick={onOpenAuth}
                className="text-xs font-semibold text-emerald-600 dark:text-emerald-400 hover:underline"
              >
                {isBn ? 'ক্লাউড ব্যাকআপ সিঙ্কের জন্য সাইন ইন করুন →' : 'Sign In to enable cloud backup sync →'}
              </button>
            )}
          </div>
        </form>
      </div>

      {/* 2. SQL Schema Migration Script Viewer */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-indigo-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBn ? 'সুপাবেস SQL মাইগ্রেশন স্ক্রিপ্ট' : 'Supabase SQL Migration Script'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBn
                  ? 'সকল টেবিল ও নিরাপত্তা পলিসি তৈরি করতে এটি সুপাবেস SQL এডিটরে চালান'
                  : 'Run this once in your Supabase SQL Editor to provision all 10 tables, triggers, and RLS policies'}
              </p>
            </div>
          </div>

          <button
            onClick={handleCopySql}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 text-xs font-semibold text-slate-700 dark:text-slate-300 transition"
          >
            {copiedSql ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
            <span>{copiedSql ? (isBn ? 'কপি হয়েছে!' : 'Copied!') : (isBn ? 'SQL কপি করুন' : 'Copy SQL')}</span>
          </button>
        </div>

        <div className="relative">
          <pre className="p-4 rounded-xl bg-slate-950 text-slate-300 font-mono text-[11px] h-48 overflow-y-auto leading-relaxed border border-slate-800">
            {SUPABASE_SCHEMA_SQL}
          </pre>
        </div>
      </div>

      {/* 3. Data Backup and Restore (JSON & CSV) */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {isBn ? 'সম্পূর্ণ ডাটা ব্যাকআপ ও রিস্টোর' : 'Complete Data Backup & Restore'}
        </h3>
        <p className="text-xs text-slate-500">
          {isBn
            ? 'অ্যাকাউন্ট, লেনদেন, ঋণ এবং ক্যাটাগরিসহ পূর্ণাঙ্গ JSON আর্কাইভ এক্সপোর্ট করুন।'
            : 'Export full JSON archives including accounts, transactions, borrowings, lendings, and categories.'}
        </p>

        <div className="flex flex-wrap items-center gap-3 pt-2">
          <button
            onClick={handleDownloadJSON}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
          >
            <Download className="w-4 h-4 text-emerald-500" />
            <span>{isBn ? 'JSON ব্যাকআপ ডাউনলোড' : 'Download JSON Backup'}</span>
          </button>

          <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 cursor-pointer transition">
            <Upload className="w-4 h-4 text-blue-500" />
            <span>{isBn ? 'JSON ফাইল থেকে রিস্টোর' : 'Restore from JSON File'}</span>
            <input type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          </label>

          <button
            onClick={() => exportToCSV('all')}
            className="flex items-center gap-2 px-4 py-2.5 rounded-xl border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 text-xs font-semibold text-slate-800 dark:text-slate-200 transition"
          >
            <Download className="w-4 h-4 text-amber-500" />
            <span>{isBn ? 'সার্বজনীন CSV ডাউনলোড' : 'Export Universal CSV'}</span>
          </button>
        </div>
      </div>

      {/* 4. Clean Data & Database Reset */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-950/60 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-red-100 dark:border-red-950/40">
          <div className="flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-red-500" />
            <div>
              <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                {isBn ? 'ডাটাবেজ রিসেট ও শূন্য স্থিতি' : 'Database Reset & Clean Zero State'}
              </h3>
              <p className="text-[11px] text-slate-500">
                {isBn
                  ? 'নতুন ৳০.০০ ব্যালেন্স দিয়ে শুরু করতে সমস্ত রেকর্ড মুছে ফেলুন'
                  : 'Remove all demo records and transactions to start with fresh, ৳0.00 balances'}
              </p>
            </div>
          </div>
          <span className="text-[11px] font-mono font-semibold px-2.5 py-1 rounded-md bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300">
            {transactions.length} {isBn ? 'লেনদেন' : 'Tx'} | {borrowings.length} {isBn ? 'ধার গৃহীত' : 'Borrowed'} | {lendings.length} {isBn ? 'ধার প্রদত্ত' : 'Lent'}
          </span>
        </div>

        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs text-slate-600 dark:text-slate-400">
          <p>
            {isBn
              ? 'ক্যাটাগরি ও অ্যাকাউন্ট ধরে রেখে লেনদেনের ইতিহাস ও ঋণের রেকর্ড মুছে ফেলুন।'
              : 'Wipes all transaction history, borrowing records, and lent money collections while retaining categories and clean accounts for Muhammad Salah Uddin.'}
          </p>

          <button
            type="button"
            onClick={() => setResetConfirmOpen(true)}
            className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900 font-bold text-xs shrink-0 transition"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>{isBn ? 'রেকর্ড রিসেট করুন' : 'Reset to Clean 0 Records'}</span>
          </button>
        </div>
      </div>

      {/* PWA Mobile Installation Card */}
      <div className="space-y-2">
        <h3 className="text-xs font-bold uppercase tracking-wider text-slate-400">
          {isBn ? 'মোবাইল অ্যাপ ও PWA ইনস্টলেশন' : 'Mobile App & PWA Installation'}
        </h3>
        <PWAInstallButton variant="card" />
      </div>

      {/* 5. App Preferences */}
      <div className="p-6 rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 shadow-xs space-y-4">
        <h3 className="text-sm font-bold text-slate-900 dark:text-white">
          {isBn ? 'আঞ্চলিক ও ডিসপ্লে পছন্দসমূহ' : 'Regional & Display Preferences'}
        </h3>

        <div className="divide-y divide-slate-100 dark:divide-slate-800 text-xs">
          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isBn ? 'মুদ্রা' : 'Currency'}
              </span>
              <p className="text-slate-500 text-[11px]">
                {isBn ? 'প্রাথমিক আর্থিক মুদ্রার মান' : 'Primary financial currency standard'}
              </p>
            </div>
            <span className="font-mono font-bold text-emerald-600">
              {isBn ? 'বাংলাদেশি টাকা (BDT / ৳)' : 'Bangladeshi Taka (BDT / ৳)'}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isBn ? 'সময় অঞ্চল' : 'Timezone'}
              </span>
              <p className="text-slate-500 text-[11px]">
                {isBn ? 'ডিফল্ট লেনদেনের সময় অঞ্চল' : 'Default transaction timezone'}
              </p>
            </div>
            <span className="font-mono font-semibold text-slate-700 dark:text-slate-300">
              {isBn ? 'এশিয়া/ঢাকা (GMT+6)' : 'Asia/Dhaka (GMT+6)'}
            </span>
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isBn ? 'অ্যাপ্লিকেশন লোগো' : 'Application Logo'}
              </span>
              <p className="text-slate-500 text-[11px]">
                {isBn ? 'প্রাথমিক ব্র্যান্ড প্রতীক (স্বচ্ছ SVG)' : 'Primary visual brand emblem (Transparent SVG)'}
              </p>
            </div>
            <BrandLogo size="sm" />
          </div>

          <div className="py-3 flex items-center justify-between">
            <div>
              <span className="font-semibold text-slate-800 dark:text-slate-200">
                {isBn ? 'ইন্টারফেস থিম' : 'Interface Theme'}
              </span>
              <p className="text-slate-500 text-[11px]">
                {isBn ? 'ডার্ক / লাইট মোড পরিবর্তন' : 'Toggle Dark / Light Mode'}
              </p>
            </div>
            <button
              onClick={onToggleDarkMode}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 hover:bg-slate-100 dark:hover:bg-slate-800 font-semibold"
            >
              {darkMode ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-slate-600" />}
              <span>{darkMode ? (isBn ? 'ডার্ক মোড' : 'Dark Mode') : (isBn ? 'লাইট মোড' : 'Light Mode')}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Restore Confirmation Dialog */}
      {importConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-amber-50 dark:bg-amber-950/50 flex items-center justify-center text-amber-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isBn ? 'JSON রিস্টোর নিশ্চিত করুন' : 'Confirm JSON Restore'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBn
                    ? 'এটি ব্যাকআপ ফাইল থেকে সক্রিয় ডাটাবেজে রেকর্ড আমদানি করবে।'
                    : 'This will import financial records from your backup file into the active database.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => {
                  setImportConfirmOpen(false);
                  setPendingImportContent(null);
                }}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={executeImport}
                className="px-4 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold"
              >
                {isBn ? 'রিস্টোর সম্পন্ন করুন' : 'Proceed with Restore'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Reset Clean Data Confirmation Dialog */}
      {resetConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4">
          <div className="w-full max-w-sm rounded-2xl bg-white dark:bg-slate-900 border border-red-200 dark:border-red-900 p-6 shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-red-50 dark:bg-red-950/50 flex items-center justify-center text-red-600 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900 dark:text-white">
                  {isBn ? 'সব রেকর্ড মুছে ফেলবেন?' : 'Reset to Clean 0 Records?'}
                </h3>
                <p className="text-xs text-slate-500">
                  {isBn
                    ? 'আপনি কি নিশ্চিত যে সমস্ত লেনদেনের রেকর্ড মুছে ফেলতে চান? সমস্ত অ্যাকাউন্টের ব্যালেন্স ৳০.০০ এ সেট হবে।'
                    : 'Are you sure you want to delete all transaction records, borrowings, and lendings? All account balances will be set to ৳0.00.'}
                </p>
              </div>
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setResetConfirmOpen(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800"
              >
                {isBn ? 'বাতিল' : 'Cancel'}
              </button>
              <button
                onClick={handleResetCleanData}
                className="px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-bold shadow-xs transition"
              >
                {isBn ? 'হ্যাঁ, সব রেকর্ড মুছে ফেলুন' : 'Yes, Reset All Records'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
