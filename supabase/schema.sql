-- =========================================================================
-- MY FINANCE MANAGER - FULL SUPABASE POSTGRESQL SCHEMA WITH RLS & INDEXES
-- Currency: Bangladeshi Taka (BDT / ৳)
-- =========================================================================

-- Enable UUID extension if not already enabled
create extension if not exists "uuid-ossp";

-- 1. Profiles Table (linked with auth.users)
create table if not exists public.profiles (
  id uuid references auth.users(id) on delete cascade primary key,
  email text,
  full_name text,
  currency text default 'BDT',
  timezone text default 'Asia/Dhaka',
  theme text default 'dark',
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 2. Accounts Table (Cash Wallet, bKash, Nagad, Bank, etc.)
create table if not exists public.accounts (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null, -- 'Cash Wallet', 'Bank Account', 'bKash', 'Nagad', 'Rocket', 'Other'
  balance numeric(15, 2) default 0.00 not null,
  account_number text,
  is_default boolean default false,
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 3. Categories Table (Personal Expense, Office Expense, Income)
create table if not exists public.categories (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  name text not null,
  type text not null check (type in ('personal_expense', 'office_expense', 'income')),
  icon text,
  color text,
  is_custom boolean default true,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 4. Transactions Table (Income, Personal Expense, Office Expense)
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
  -- Office expense tracking fields
  project_name text,
  reimbursement_status text default 'Not Submitted' check (reimbursement_status in ('Not Submitted', 'Submitted', 'Partially Reimbursed', 'Fully Reimbursed')),
  reimbursed_amount numeric(15, 2) default 0.00 check (reimbursed_amount >= 0),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 5. Borrowings Table (Money received as loan from other people - Liability)
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
  repaid_amount numeric(15, 2) default 0.00 check (repaid_amount >= 0),
  status text default 'Unpaid' check (status in ('Unpaid', 'Partially Repaid', 'Fully Repaid')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 6. Borrowing Repayments Table (Tracking debt repayment history)
create table if not exists public.borrowing_repayments (
  id uuid default gen_random_uuid() primary key,
  borrowing_id uuid references public.borrowings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  payment_date date not null default current_date,
  amount numeric(15, 2) not null check (amount > 0),
  payment_method text not null,
  account_id uuid references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 7. Lendings Table (Money lent to others - Receivable Asset)
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
  collected_amount numeric(15, 2) default 0.00 check (collected_amount >= 0),
  status text default 'Uncollected' check (status in ('Uncollected', 'Partially Collected', 'Fully Collected')),
  created_at timestamptz default timezone('utc'::text, now()) not null,
  updated_at timestamptz default timezone('utc'::text, now()) not null
);

-- 8. Lending Collections Table (Tracking loan collection history)
create table if not exists public.lending_collections (
  id uuid default gen_random_uuid() primary key,
  lending_id uuid references public.lendings(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  collection_date date not null default current_date,
  amount numeric(15, 2) not null check (amount > 0),
  payment_method text not null,
  account_id uuid references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 9. Office Reimbursements Table (Tracking office reimbursement events)
create table if not exists public.office_reimbursements (
  id uuid default gen_random_uuid() primary key,
  transaction_id uuid references public.transactions(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  reimbursement_date date not null default current_date,
  amount numeric(15, 2) not null check (amount > 0),
  payment_method text not null,
  account_id uuid references public.accounts(id) on delete set null,
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- 10. Account Transfers Table (Transfers between own accounts - Balance neutral)
create table if not exists public.account_transfers (
  id uuid default gen_random_uuid() primary key,
  user_id uuid references auth.users(id) on delete cascade not null,
  transfer_date date not null default current_date,
  from_account_id uuid references public.accounts(id) on delete cascade not null,
  to_account_id uuid references public.accounts(id) on delete cascade not null,
  amount numeric(15, 2) not null check (amount > 0),
  notes text,
  created_at timestamptz default timezone('utc'::text, now()) not null
);

-- =========================================================================
-- INDEXES FOR HIGH QUERY PERFORMANCE
-- =========================================================================
create index if not exists idx_transactions_user_date on public.transactions(user_id, date desc);
create index if not exists idx_transactions_type on public.transactions(user_id, type);
create index if not exists idx_transactions_category on public.transactions(user_id, category);
create index if not exists idx_borrowings_user on public.borrowings(user_id, status);
create index if not exists idx_lendings_user on public.lendings(user_id, status);
create index if not exists idx_borrowing_repayments_b_id on public.borrowing_repayments(borrowing_id);
create index if not exists idx_lending_collections_l_id on public.lending_collections(lending_id);
create index if not exists idx_office_reimbursements_t_id on public.office_reimbursements(transaction_id);

-- =========================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =========================================================================
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

-- Policies for profiles
create policy "Users can view own profile" on public.profiles for select using (auth.uid() = id);
create policy "Users can update own profile" on public.profiles for update using (auth.uid() = id);
create policy "Users can insert own profile" on public.profiles for insert with check (auth.uid() = id);

-- Macro policies for user-owned tables
create policy "Users can manage own accounts" on public.accounts for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own categories" on public.categories for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own transactions" on public.transactions for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own borrowings" on public.borrowings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own borrowing repayments" on public.borrowing_repayments for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own lendings" on public.lendings for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own lending collections" on public.lending_collections for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own office reimbursements" on public.office_reimbursements for all using (auth.uid() = user_id) with check (auth.uid() = user_id);
create policy "Users can manage own account transfers" on public.account_transfers for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Function to handle new user signup automatically creating default categories and accounts
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, email, full_name)
  values (new.id, new.email, new.raw_user_meta_data->>'full_name');

  -- Default Accounts
  insert into public.accounts (user_id, name, type, balance, is_default) values
  (new.id, 'Cash Wallet', 'Cash Wallet', 0, true),
  (new.id, 'bKash Account', 'bKash', 0, false),
  (new.id, 'Nagad Wallet', 'Nagad', 0, false),
  (new.id, 'Bank Account', 'Bank Account', 0, false);

  -- Default Personal Expense Categories
  insert into public.categories (user_id, name, type, is_custom) values
  (new.id, 'Food & Dining', 'personal_expense', false),
  (new.id, 'Transportation', 'personal_expense', false),
  (new.id, 'Shopping', 'personal_expense', false),
  (new.id, 'Groceries', 'personal_expense', false),
  (new.id, 'Mobile Recharge', 'personal_expense', false),
  (new.id, 'Internet', 'personal_expense', false),
  (new.id, 'Entertainment', 'personal_expense', false),
  (new.id, 'Health & Medicine', 'personal_expense', false),
  (new.id, 'Education', 'personal_expense', false),
  (new.id, 'Rent', 'personal_expense', false),
  (new.id, 'Utilities', 'personal_expense', false),
  (new.id, 'Travel', 'personal_expense', false),
  (new.id, 'Personal Care', 'personal_expense', false),
  (new.id, 'Family', 'personal_expense', false),
  (new.id, 'Other', 'personal_expense', false);

  -- Default Office Expense Categories
  insert into public.categories (user_id, name, type, is_custom) values
  (new.id, 'Office Supplies', 'office_expense', false),
  (new.id, 'Client Meeting & Meals', 'office_expense', false),
  (new.id, 'Office Travel & Conveyance', 'office_expense', false),
  (new.id, 'Software & Tools', 'office_expense', false),
  (new.id, 'Stationery & Printing', 'office_expense', false),
  (new.id, 'Office Refreshment', 'office_expense', false),
  (new.id, 'Miscellaneous Office', 'office_expense', false);

  -- Default Income Categories
  insert into public.categories (user_id, name, type, is_custom) values
  (new.id, 'Salary', 'income', false),
  (new.id, 'Freelancing', 'income', false),
  (new.id, 'Business', 'income', false),
  (new.id, 'Gift', 'income', false),
  (new.id, 'Other Income', 'income', false);

  return new;
end;
$$ language plpgsql security definer;

-- Trigger for new user auto-provisioning
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();
