export type TransactionType = 'income' | 'personal_expense' | 'office_expense';

export type PaymentMethod =
  | 'Cash'
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Bank Transfer'
  | 'Debit Card'
  | 'Credit Card'
  | 'Other';

export type AccountType =
  | 'Cash Wallet'
  | 'Bank Account'
  | 'bKash'
  | 'Nagad'
  | 'Rocket'
  | 'Other';

export type OfficeReimbursementStatus =
  | 'Not Submitted'
  | 'Submitted'
  | 'Partially Reimbursed'
  | 'Fully Reimbursed';

export interface Account {
  id: string;
  user_id?: string;
  name: string;
  type: AccountType;
  balance: number;
  account_number?: string;
  is_default?: boolean;
  created_at: string;
  updated_at: string;
}

export interface Category {
  id: string;
  user_id?: string;
  name: string;
  type: 'personal_expense' | 'office_expense' | 'income';
  icon?: string;
  color?: string;
  is_custom?: boolean;
  created_at: string;
}

export interface Transaction {
  id: string;
  user_id?: string;
  date: string; // ISO date string YYYY-MM-DD
  type: TransactionType;
  category: string;
  description: string;
  amount: number;
  payment_method: PaymentMethod | string;
  account_id?: string;
  account_name?: string;
  notes?: string;
  receipt_url?: string;
  // Office specific fields
  project_name?: string;
  reimbursement_status?: OfficeReimbursementStatus;
  reimbursed_amount?: number;
  // Offline & Synchronization metadata
  sync_status?: 'synced' | 'pending' | 'failed';
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface Borrowing {
  id: string;
  user_id?: string;
  person_name: string;
  phone_number?: string;
  borrowed_date: string;
  amount: number;
  purpose?: string;
  due_date?: string;
  notes?: string;
  repaid_amount: number;
  status: 'Unpaid' | 'Partially Repaid' | 'Fully Repaid';
  sync_status?: 'synced' | 'pending' | 'failed';
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface BorrowingRepayment {
  id: string;
  borrowing_id: string;
  user_id?: string;
  payment_date: string;
  amount: number;
  payment_method: PaymentMethod | string;
  account_id?: string;
  notes?: string;
  sync_status?: 'synced' | 'pending' | 'failed';
  idempotency_key?: string;
  created_at: string;
}

export interface Lending {
  id: string;
  user_id?: string;
  person_name: string;
  phone_number?: string;
  lending_date: string;
  amount: number;
  purpose?: string;
  expected_return_date?: string;
  notes?: string;
  collected_amount: number;
  status: 'Uncollected' | 'Partially Collected' | 'Fully Collected';
  sync_status?: 'synced' | 'pending' | 'failed';
  idempotency_key?: string;
  created_at: string;
  updated_at: string;
}

export interface LendingCollection {
  id: string;
  lending_id: string;
  user_id?: string;
  collection_date: string;
  amount: number;
  payment_method: PaymentMethod | string;
  account_id?: string;
  notes?: string;
  sync_status?: 'synced' | 'pending' | 'failed';
  idempotency_key?: string;
  created_at: string;
}

export interface OfficeReimbursement {
  id: string;
  transaction_id: string;
  user_id?: string;
  reimbursement_date: string;
  amount: number;
  payment_method: PaymentMethod | string;
  account_id?: string;
  notes?: string;
  sync_status?: 'synced' | 'pending' | 'failed';
  idempotency_key?: string;
  created_at: string;
}

export interface AccountTransfer {
  id: string;
  user_id?: string;
  transfer_date: string;
  from_account_id: string;
  from_account_name: string;
  to_account_id: string;
  to_account_name: string;
  amount: number;
  notes?: string;
  sync_status?: 'synced' | 'pending' | 'failed';
  idempotency_key?: string;
  created_at: string;
}

export interface FinancialSummary {
  totalBalance: number;
  totalIncome: number;
  totalPersonalExpenses: number;
  totalOfficeExpenses: number;
  officeReimbursedAmount: number;
  pendingOfficeReimbursement: number;
  totalBorrowed: number;
  totalBorrowedRepaid: number;
  amountIOwe: number; // Remaining debt liability
  totalLent: number;
  totalLentCollected: number;
  amountOwedToMe: number; // Remaining receivable asset
  todayExpenses: number;
  todayIncome: number;
  weekExpenses: number;
  monthExpenses: number;
}
