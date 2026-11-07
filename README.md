# My Finance Manager (আমার ফাইন্যান্স ম্যানেজার)

A complete, production-ready, modern Personal Finance & Expense Management Web Application built with **React 19**, **TypeScript**, **Vite**, **Tailwind CSS v4**, and **Supabase (PostgreSQL Database & Authentication with Row Level Security)**.

Primary Currency: **Bangladeshi Taka (BDT / ৳)**  
Default Timezone: **Asia/Dhaka (GMT+6)**  
Progressive Web App (PWA): Installable on mobile & desktop with offline cache support.

---

## 🌟 Key Features

1. **Executive Financial Dashboard**:
   - Total Net Balance, Total Income, Personal Expenses, Office Expenses, Total Borrowed, Total Lent, Amount Owed to Me, and Amount I Owe.
   - Dynamic date filtering: *Today, Yesterday, This Week, This Month, Last Month, All-Time, and Custom Date Range*.
   - Visual charts powered by Recharts: 6-month cashflow trend, category-wise spending donut chart, personal vs office spending comparison, and liabilities vs receivables bar charts.
   - All numbers dynamically computed directly from ledger records with zero hardcoding.

2. **Universal Transaction Management**:
   - Income, Personal Expense, and Office Expense tracking.
   - Full CRUD operations with modal confirmation dialogs.
   - Fast client-side searching across descriptions, categories, accounts, and notes.
   - Filter by date, category, type, and payment method (*Cash, bKash, Nagad, Rocket, Bank Transfer, Cards*).
   - One-click CSV and Excel-compatible export.

3. **Personal Expenses Module**:
   - Track daily living, food, commute, utilities, groceries, and healthcare.
   - Create, edit, and delete custom categories with color tags.

4. **Dedicated Office Expense Management**:
   - Segregated office-related project expenses.
   - Fields for project/task name, paid-from account, and office reimbursement status (*Not Submitted, Submitted, Partially Reimbursed, Fully Reimbursed*).
   - "Clear Claim" action to record partial or full reimbursement payments received from office.
   - Strict accounting rule: Office reimbursement reduces office receivable balance; never double-counted as new income.

5. **Borrowed Money (Liabilities Management)**:
   - Tracks debt received from lenders, family, or friends.
   - Records installment repayments, calculates remaining debt, and maintains complete repayment history logs.
   - Strict accounting rule: Borrowed money is a liability, NOT income. Repayments reduce debt liability and deduct from account balance.

6. **Lent Money (Receivables Asset Management)**:
   - Tracks loans given to others.
   - Records collections, calculates remaining receivables owed to you, and maintains collection logs.
   - Strict accounting rule: Lent money is a receivable asset, NOT an expense. Collections reduce receivables and credit your account balance.

7. **Income Management**:
   - Monthly salary, freelancing, business, and gifts.
   - Avoids double-counting loan collections or office reimbursements.

8. **Multi-Account & Account Transfers**:
   - Manage Cash Wallet, City Bank, bKash, Nagad, and Rocket accounts.
   - Transfer funds between own accounts with balance neutrality.

9. **Data Backup & Restore**:
   - Full JSON archive download and restore with schema validation and confirmation.
   - Universal and modular CSV exports.

10. **Progressive Web App (PWA)**:
    - Service Worker offline caching.
    - Responsive mobile layout with thumb-zone ergonomics and bottom navigation bar.
    - In-app install banner with Chromium and iOS Safari install guidance.

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ (tested on Node 20 & 22)
- npm or yarn

### 2. Installation
```bash
npm install
```

### 3. Environment Variables Setup
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```

Configure your Supabase credentials in `.env`:
```env
VITE_SUPABASE_URL="https://your-project-ref.supabase.co"
VITE_SUPABASE_ANON_KEY="your-anon-public-key"
```

> **Note**: Even without configuring `.env`, the app comes with a built-in **Offline Sandbox / Demo Mode** loaded with realistic Bangladeshi Taka financial seed data. You can test all features immediately and connect your Supabase database anytime via the in-app **Settings** tab.

### 4. Supabase Database Migration
1. Open your [Supabase Dashboard](https://supabase.com).
2. Go to **SQL Editor** -> **New query**.
3. Copy the migration SQL from `supabase/schema.sql` (or click **Copy SQL** in the in-app **Settings** tab) and click **Run**.
4. The migration provisions all 10 tables, triggers, and Row Level Security (RLS) policies so authenticated users can only access their own records.

### 5. Running Locally
```bash
npm run dev
```
Open your browser at `http://localhost:3000`.

### 6. Production Build
```bash
npm run build
```

---

## 📁 Database Architecture

The PostgreSQL schema consists of 10 normalized tables with Row Level Security (RLS):
- `profiles`: User preferences (currency, timezone, theme).
- `accounts`: Financial accounts (Cash Wallet, Bank Account, bKash, Nagad, etc.).
- `categories`: Expense & income categories with custom colors.
- `transactions`: Central ledger for income, personal expenses, and office expenses.
- `borrowings`: Borrowed loans (liabilities).
- `borrowing_repayments`: Installment payments made against borrowed loans.
- `lendings`: Money lent to others (receivable assets).
- `lending_collections`: Repayments collected from borrowers.
- `office_reimbursements`: Reimbursements cleared by employer.
- `account_transfers`: Balance-neutral transfers between own accounts.

---

## 📱 PWA Mobile Installation
- **Android / Chromium**: Click the **Install App** button in the top navbar or browser prompt.
- **iPhone / iPad (iOS Safari)**: Tap the **Share** button in Safari bottom bar -> tap **Add to Home Screen**.

---

## 📄 License
Apache-2.0
