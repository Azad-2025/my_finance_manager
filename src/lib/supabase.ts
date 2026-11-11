import { createClient, SupabaseClient } from '@supabase/supabase-js';
import {
  Account,
  Category,
  Transaction,
  Borrowing,
  BorrowingRepayment,
  Lending,
  LendingCollection,
  OfficeReimbursement,
  AccountTransfer,
  SalaryAdvance,
  SalaryAdjustment,
} from '../types/finance';

// Storage keys
const SUPABASE_CONFIG_KEY = 'my_finance_supabase_config';
const LOCAL_DATA_KEY = 'my_finance_store_v2';
const USER_PROFILE_KEY = 'my_finance_user_profile';

export interface UserProfile {
  name: string;
  phone: string;
  email: string;
}

export const DEFAULT_USER_PROFILE: UserProfile = {
  name: 'Muhammad Salah Uddin',
  phone: '01305430838',
  email: 'azadtn56@gmail.com',
};

export function getSavedUserProfile(): UserProfile {
  try {
    const saved = localStorage.getItem(USER_PROFILE_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.name) return parsed;
    }
  } catch {
    // Ignore
  }
  return DEFAULT_USER_PROFILE;
}

export function saveUserProfile(profile: UserProfile) {
  try {
    localStorage.setItem(USER_PROFILE_KEY, JSON.stringify(profile));
  } catch {
    // Ignore
  }
}

export interface SupabaseConfig {
  url: string;
  anonKey: string;
}

export function getSavedSupabaseConfig(): SupabaseConfig {
  try {
    const saved = localStorage.getItem(SUPABASE_CONFIG_KEY);
    if (saved) {
      const parsed = JSON.parse(saved);
      if (parsed.url && parsed.anonKey) return parsed;
    }
  } catch {
    // Ignore JSON errors
  }

  return {
    url: import.meta.env.VITE_SUPABASE_URL || '',
    anonKey: import.meta.env.VITE_SUPABASE_ANON_KEY || '',
  };
}

export function saveSupabaseConfig(config: SupabaseConfig) {
  localStorage.setItem(SUPABASE_CONFIG_KEY, JSON.stringify(config));
  initClient();
}

let supabaseInstance: SupabaseClient | null = null;

export function initClient(): SupabaseClient | null {
  const config = getSavedSupabaseConfig();
  if (config.url && config.anonKey && config.url.startsWith('http')) {
    try {
      supabaseInstance = createClient(config.url, config.anonKey, {
        auth: {
          persistSession: true,
          autoRefreshToken: true,
        },
      });
      return supabaseInstance;
    } catch (e) {
      console.warn('Failed to initialize Supabase client:', e);
      supabaseInstance = null;
    }
  } else {
    supabaseInstance = null;
  }
  return null;
}

export function getSupabase(): SupabaseClient | null {
  if (!supabaseInstance) {
    return initClient();
  }
  return supabaseInstance;
}

export function isSupabaseConfigured(): boolean {
  const config = getSavedSupabaseConfig();
  return Boolean(config.url && config.anonKey && config.url.startsWith('http'));
}

// =========================================================================
// CLEAN INITIAL ACCOUNTS AND CATEGORIES
// =========================================================================
export const DEFAULT_ACCOUNTS: Account[] = [
  {
    id: 'acc-1',
    name: 'Cash Wallet',
    type: 'Cash Wallet',
    balance: 0,
    is_default: true,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'acc-2',
    name: 'bKash Personal',
    type: 'bKash',
    balance: 0,
    account_number: '01305430838',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'acc-3',
    name: 'Nagad Account',
    type: 'Nagad',
    balance: 0,
    account_number: '01305430838',
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
  {
    id: 'acc-4',
    name: 'Bank Account',
    type: 'Bank Account',
    balance: 0,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString(),
  },
];

export const DEFAULT_CATEGORIES: Category[] = [
  // Personal Expenses
  { id: 'cat-1', name: 'Food & Dining', type: 'personal_expense', color: '#10b981', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-2', name: 'Transportation', type: 'personal_expense', color: '#3b82f6', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-3', name: 'Shopping', type: 'personal_expense', color: '#8b5cf6', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-4', name: 'Groceries', type: 'personal_expense', color: '#06b6d4', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-5', name: 'Mobile Recharge', type: 'personal_expense', color: '#ec4899', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-6', name: 'Internet', type: 'personal_expense', color: '#6366f1', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-7', name: 'Entertainment', type: 'personal_expense', color: '#f59e0b', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-8', name: 'Health & Medicine', type: 'personal_expense', color: '#ef4444', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-9', name: 'Education', type: 'personal_expense', color: '#14b8a6', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-10', name: 'Rent', type: 'personal_expense', color: '#f97316', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-11', name: 'Utilities', type: 'personal_expense', color: '#84cc16', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-12', name: 'Travel', type: 'personal_expense', color: '#0ea5e9', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-13', name: 'Personal Care', type: 'personal_expense', color: '#d946ef', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-14', name: 'Family', type: 'personal_expense', color: '#eab308', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-15', name: 'Other', type: 'personal_expense', color: '#64748b', is_custom: false, created_at: new Date().toISOString() },

  // Office Expenses
  { id: 'cat-16', name: 'Office Supplies', type: 'office_expense', color: '#0284c7', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-17', name: 'Client Meeting & Meals', type: 'office_expense', color: '#d97706', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-18', name: 'Office Travel & Conveyance', type: 'office_expense', color: '#2563eb', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-19', name: 'Software & Tools', type: 'office_expense', color: '#7c3aed', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-20', name: 'Stationery & Printing', type: 'office_expense', color: '#059669', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-21', name: 'Office Refreshment', type: 'office_expense', color: '#db2777', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-22', name: 'Miscellaneous Office', type: 'office_expense', color: '#475569', is_custom: false, created_at: new Date().toISOString() },

  // Income
  { id: 'cat-23', name: 'Salary', type: 'income', color: '#16a34a', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-24', name: 'Freelancing', type: 'income', color: '#0d9488', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-25', name: 'Business', type: 'income', color: '#2563eb', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-26', name: 'Gift', type: 'income', color: '#9333ea', is_custom: false, created_at: new Date().toISOString() },
  { id: 'cat-27', name: 'Other Income', type: 'income', color: '#52525b', is_custom: false, created_at: new Date().toISOString() },
];

// Clean empty initial data (no demo transactions, borrowings, or lendings)
export const DEFAULT_TRANSACTIONS: Transaction[] = [];
export const DEFAULT_BORROWINGS: Borrowing[] = [];
export const DEFAULT_BORROWING_REPAYMENTS: BorrowingRepayment[] = [];
export const DEFAULT_LENDINGS: Lending[] = [];
export const DEFAULT_LENDING_COLLECTIONS: LendingCollection[] = [];
export const DEFAULT_OFFICE_REIMBURSEMENTS: OfficeReimbursement[] = [];
export const DEFAULT_TRANSFERS: AccountTransfer[] = [];
export const DEFAULT_SALARY_ADVANCES: SalaryAdvance[] = [];
export const DEFAULT_SALARY_ADJUSTMENTS: SalaryAdjustment[] = [];

// Local store interface
export interface FinanceDatabaseState {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  borrowings: Borrowing[];
  borrowing_repayments: BorrowingRepayment[];
  lendings: Lending[];
  lending_collections: LendingCollection[];
  office_reimbursements: OfficeReimbursement[];
  transfers: AccountTransfer[];
  salary_advances?: SalaryAdvance[];
  salary_adjustments?: SalaryAdjustment[];
}

export function loadLocalData(): FinanceDatabaseState {
  try {
    // Clean up legacy v1 mock store if present
    localStorage.removeItem('my_finance_offline_store_v1');
    const raw = localStorage.getItem(LOCAL_DATA_KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      if (parsed.transactions && parsed.accounts) {
        if (!parsed.salary_advances) parsed.salary_advances = [];
        if (!parsed.salary_adjustments) parsed.salary_adjustments = [];
        return parsed;
      }
    }
  } catch (e) {
    console.error('Failed to parse local finance store:', e);
  }

  // Fallback to clean default data
  const initial: FinanceDatabaseState = {
    accounts: DEFAULT_ACCOUNTS,
    categories: DEFAULT_CATEGORIES,
    transactions: DEFAULT_TRANSACTIONS,
    borrowings: DEFAULT_BORROWINGS,
    borrowing_repayments: DEFAULT_BORROWING_REPAYMENTS,
    lendings: DEFAULT_LENDINGS,
    lending_collections: DEFAULT_LENDING_COLLECTIONS,
    office_reimbursements: DEFAULT_OFFICE_REIMBURSEMENTS,
    transfers: DEFAULT_TRANSFERS,
    salary_advances: DEFAULT_SALARY_ADVANCES,
    salary_adjustments: DEFAULT_SALARY_ADJUSTMENTS,
  };
  saveLocalData(initial);
  return initial;
}

export function saveLocalData(data: FinanceDatabaseState) {
  try {
    localStorage.setItem(LOCAL_DATA_KEY, JSON.stringify(data));
  } catch (e) {
    console.error('Failed to save finance data locally:', e);
  }
}

export function resetAllDataToClean(): FinanceDatabaseState {
  const clean: FinanceDatabaseState = {
    accounts: DEFAULT_ACCOUNTS,
    categories: DEFAULT_CATEGORIES,
    transactions: [],
    borrowings: [],
    borrowing_repayments: [],
    lendings: [],
    lending_collections: [],
    office_reimbursements: [],
    transfers: [],
    salary_advances: [],
    salary_adjustments: [],
  };
  saveLocalData(clean);
  return clean;
}
