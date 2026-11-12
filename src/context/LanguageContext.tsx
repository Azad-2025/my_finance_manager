import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'bn';

const STORAGE_KEY = 'my_finance_lang';

export const translations = {
  en: {
    // Brand & App
    appName: 'My Finance Manager',
    owner: 'Owner',
    tagline: 'Personal & Office Financial Management',

    // Navigation & Views
    nav_home: 'Home',
    nav_dashboard: 'Financial Overview',
    nav_transactions: 'Transactions',
    nav_loans: 'Loans & Debts Hub',
    nav_more: 'More',
    nav_add: 'Add',
    nav_personal: 'Personal Expenses',
    nav_office: 'Office Expenses',
    nav_income: 'Income & Revenue',
    nav_borrowed: 'Borrowed Money',
    nav_lent: 'Lent Money',
    nav_reports: 'Reports & Analytics',
    nav_categories: 'Categories & Accounts',
    nav_settings: 'Settings & Sync',

    // Dashboard Cards & Summaries
    totalBalance: 'Total Balance',
    totalIncome: 'Total Income',
    personalExpenses: 'Personal Expenses',
    officeExpenses: 'Office Expenses',
    totalBorrowed: 'Total Borrowed',
    totalLent: 'Total Lent',
    amountIOwe: 'Amount I Owe',
    amountOwedToMe: 'Amount Owed to Me',
    netSavings: 'Net Savings',
    todayExpenses: "Today's Expenses",
    todayIncome: "Today's Income",
    thisWeek: 'This Week',
    thisMonth: 'This Month',
    lastMonth: 'Last Month',
    allTime: 'All Time',
    recentActivity: 'Recent Financial Activity',
    viewAll: 'View All',
    noTransactionsYet: 'No transactions recorded yet. Click Add to start.',
    cashInHand: 'Cash in Hand',
    bankAccounts: 'Bank Accounts',
    mobileBanking: 'Mobile Banking (bKash / Nagad)',
    activeLiability: 'Active Debt Liability',
    activeAsset: 'Active Receivable Asset',

    // Common Buttons & Actions
    save: 'Save',
    saveChanges: 'Save Changes',
    cancel: 'Cancel',
    delete: 'Delete',
    edit: 'Edit',
    update: 'Update',
    add: 'Add',
    close: 'Close',
    clear: 'Clear',
    filter: 'Filter',
    search: 'Search',
    submit: 'Submit',
    confirm: 'Confirm',
    back: 'Back',
    next: 'Next',
    view: 'View',
    history: 'History',
    actions: 'Actions',
    status: 'Status',
    date: 'Date',
    amount: 'Amount',
    purpose: 'Purpose',
    description: 'Description',
    notes: 'Notes',
    notesOptional: 'Notes (Optional)',
    phoneOptional: 'Phone (Optional)',
    paymentMethod: 'Payment Method',
    category: 'Category',
    account: 'Account',
    all: 'All',
    allCategories: 'All Categories',
    allMethods: 'All Payment Methods',
    allMonths: 'All Months',
    selectMonth: 'Select Month',
    customRange: 'Custom Range',
    startDate: 'Start Date',
    endDate: 'End Date',
    applyFilter: 'Apply Filter',
    resetFilter: 'Reset Filter',
    export: 'Export',
    exportPDF: 'Export (PDF)',
    exportCSV: 'Export CSV',
    syncing: 'Syncing...',
    synced: 'All Synced',
    offline: 'Offline Mode',
    online: 'Online',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode',
    searchPlaceholder: 'Search records...',
    deleteConfirmTitle: 'Are you sure?',
    deleteConfirmDesc: 'This action cannot be undone and will permanently delete the record.',

    // Payment Methods
    method_cash: 'Cash',
    method_bkash: 'bKash',
    method_nagad: 'Nagad',
    method_bank: 'Bank Transfer',
    method_other: 'Other',

    // Transaction Types & Modals
    addTransaction: 'Add Transaction',
    addRecord: 'Add New Record',
    selectTransactionType: 'Select the type of transaction to create',
    type_personal_expense: 'Personal Expense',
    type_personal_expense_desc: 'Food, commute, shopping & daily costs',
    type_income: 'Income & Revenue',
    type_income_desc: 'Salary, freelance, business & gifts',
    type_office_expense: 'Office Expense',
    type_office_expense_desc: 'Supplies, client meals & claims',
    type_borrowed: 'Borrowed Money',
    type_borrowed_desc: 'Take loan / debt liability to repay in installments',
    type_lent: 'Lent Money',
    type_lent_desc: 'Lend funds to others / receivable asset',
    type_transfer: 'Transfer',
    type_transfer_desc: 'Move funds between accounts',

    // Loans & Debts Hub (Section A & Section B)
    loansHubTitle: 'Loans & Debts Hub',
    loansHubDesc: 'Unified tracking for borrowed liabilities and lent receivables',
    lentSectionTitle: 'Money Lent (Receivables)',
    lentSectionBengaliSub: 'Money Lent (যে টাকা আমি অন্যকে ধার দিয়েছি)',
    lentSectionDesc: 'Track loans given to colleagues, friends & family and collection tracking',
    borrowedSectionTitle: 'Money Borrowed (Liabilities)',
    borrowedSectionBengaliSub: 'Money Borrowed / Loan Repayment (যে টাকা আমি ধার নিয়েছি বা পরিশোধ করেছি)',
    borrowedSectionDesc: 'Track money borrowed from others and installment repayments',
    borrowedTab: 'Money Borrowed',
    lentTab: 'Money Lent',
    remainingDebt: 'Remaining Debt',
    pendingReceivable: 'Pending Receivable',
    grossBorrowed: 'Total Borrowed (Gross)',
    grossLent: 'Total Lent (Principal)',
    totalRepaidToDate: 'Total Repaid to Date',
    totalCollectedBack: 'Total Collected Back',
    recordBorrowing: 'Record Borrowing',
    editBorrowing: 'Edit Borrowing Record',
    recordLending: 'Record Lending',
    editLending: 'Edit Lending Record',
    recordRepayment: 'Pay Repayment',
    recordCollection: 'Collect Money',
    borrowerName: "Borrower's Name *",
    lenderName: "Lender's Name *",
    borrowedDate: 'Borrowed Date *',
    lendingDate: 'Lending Date *',
    dueDate: 'Due Date (Optional)',
    expectedReturnDate: 'Expected Return Date (Optional)',
    repaymentHistory: 'Repayment History',
    collectionHistory: 'Collection History',
    exportLentReportPDF: 'Export Lent Report (PDF)',
    exportBorrowedReportPDF: 'Export Borrowed & Repaid Report (PDF)',
    noLentRecords: 'No money lent records found.',
    noBorrowedRecords: 'No borrowed money records found.',
    installmentVouchers: 'Installment Repayment Vouchers',
    installmentCollections: 'Installment Collection Receipts',
    deleteBorrowingPrompt: 'Delete Borrowing Record?',
    deleteBorrowingWarning: 'This will remove this loan liability and its installment history.',
    deleteLendingPrompt: 'Delete Lending Record?',
    deleteLendingWarning: 'This will remove this receivable record and its collection history.',
    unpaid: 'Unpaid',
    partiallyRepaid: 'Partially Repaid',
    fullyRepaid: 'Fully Repaid',
    uncollected: 'Uncollected',
    partiallyCollected: 'Partially Collected',
    fullyCollected: 'Fully Collected',
    collected: 'Collected',
    repaid: 'Repaid',
    remaining: 'Remaining',
    filterByMonth: 'Filter by Month',
    allRecords: 'All Records',

    // Office Expenses & Salary Advance
    officeExpensesTitle: 'Office Expense Management',
    officeExpensesDesc: 'Segregated office project expenses & reimbursement claims receivable',
    addOfficeExpense: 'Add Office Expense',
    totalOfficeExpenses: 'Total Office Expenses',
    totalReimbursed: 'Total Reimbursed',
    pendingReimbursement: 'Pending Reimbursement Receivable',
    reimbursementFilter: 'Reimbursement Filter:',
    allStatuses: 'All Statuses',
    notSubmitted: 'Not Submitted',
    submitted: 'Submitted',
    approved: 'Approved',
    reimbursed: 'Reimbursed',
    paidFrom: 'Paid From',
    salaryAdvanceTitle: 'Salary Advance & Adjustments',
    salaryAdvanceDesc: 'Track company advance loans and monthly salary deductions without affecting income ledgers',
    addSalaryAdvance: 'Add Salary Advance',
    adjustSalary: 'Adjust Salary',
    exportSalaryAdvancePDF: 'Export Statement (PDF)',
    totalAdvanceReceived: 'Total Advance Received',
    totalSalaryAdjusted: 'Total Salary Adjusted',
    outstandingAdvanceBalance: 'Outstanding Advance Balance',
    advancesReceivedHistory: 'Advances Received History',
    salaryAdjustmentsHistory: 'Salary Adjustments History',
    noAdvancesRecorded: 'No advance entries recorded yet.',
    noAdjustmentsRecorded: 'No salary adjustments recorded yet.',

    // Personal Expenses & Income
    personalExpensesTitle: 'Personal Expenses',
    personalExpensesDesc: 'Track daily personal expenditures, food, commute, shopping and bills',
    addPersonalExpense: 'Add Personal Expense',
    incomeTitle: 'Income & Revenue',
    incomeDesc: 'Track regular salary, freelancing, business earnings and other inflows',
    addIncomeTitle: 'Add Income',

    // Reports & Analytics
    reportsTitle: 'Financial Reports & Analytics',
    reportsDesc: 'Comprehensive breakdown, category spending, trends and cash flow audits',
    monthlyCashFlow: 'Monthly Cash Flow',
    expenseByCategory: 'Expenses by Category',
    incomeVsExpense: 'Income vs. Expenses',

    // Categories & Accounts
    categoriesTitle: 'Categories & Accounts',
    categoriesDesc: 'Organize payment sources, bank wallets, and expense tags',
    addCategory: 'Add Category',
    addAccount: 'Add Account',
    transferFunds: 'Transfer Funds',

    // Settings & PWA
    settingsTitle: 'Settings & Cloud Sync',
    settingsDesc: 'Configure backup, offline persistence, Supabase synchronization and profile',
    dataBackup: 'Data Backup & Restore',
    downloadJSONBackup: 'Download JSON Backup',
    restoreFromBackup: 'Restore from Backup',
    pwaAppTitle: 'Mobile App (PWA)',
    installApp: 'Install App on Phone',
    installed: 'App Installed',

    // Language
    language: 'Language',
    currentLang: 'English',
    switchLangPrompt: 'বাংলায় পরিবর্তন করুন',
  },
  bn: {
    // Brand & App
    appName: 'মাই ফিন্যান্স ম্যানেজার',
    owner: 'স্বত্বাধিকারী',
    tagline: 'ব্যক্তিগত ও অফিস আর্থিক হিসাব ব্যবস্থাপনা',

    // Navigation & Views
    nav_home: 'হোম',
    nav_dashboard: 'আর্থিক ওভারভিউ',
    nav_transactions: 'লেনদেন',
    nav_loans: 'ধার ও ঋণ কেন্দ্র',
    nav_more: 'আরও',
    nav_add: 'যুক্ত করুন',
    nav_personal: 'ব্যক্তিগত খরচ',
    nav_office: 'অফিস খরচ',
    nav_income: 'আয় ও রাজস্ব',
    nav_borrowed: 'ধার নেওয়া টাকা',
    nav_lent: 'ধার দেওয়া টাকা',
    nav_reports: 'রিপোর্ট ও বিশ্লেষণ',
    nav_categories: 'ক্যাটাগরি ও একাউন্ট',
    nav_settings: 'সেটিংস ও সিঙ্ক',

    // Dashboard Cards & Summaries
    totalBalance: 'মোট ব্যালেন্স',
    totalIncome: 'মোট আয়',
    personalExpenses: 'ব্যক্তিগত খরচ',
    officeExpenses: 'অফিস খরচ',
    totalBorrowed: 'মোট ধার নেওয়া',
    totalLent: 'মোট ধার দেওয়া',
    amountIOwe: 'আমার দেনা (দিতে হবে)',
    amountOwedToMe: 'আমার পাওনা (পাবো)',
    netSavings: 'নীট সঞ্চয়',
    todayExpenses: 'আজকের খরচ',
    todayIncome: 'আজকের আয়',
    thisWeek: 'চলতি সপ্তাহ',
    thisMonth: 'চলতি মাস',
    lastMonth: 'গত মাস',
    allTime: 'সর্বমোট সময়',
    recentActivity: 'সাম্প্রতিক আর্থিক লেনদেন',
    viewAll: 'সবগুলো দেখুন',
    noTransactionsYet: 'এখনও কোনো লেনদেন লিপিবদ্ধ নেই। শুরু করতে যুক্ত করুন।',
    cashInHand: 'হাতে নগদ টাকা',
    bankAccounts: 'ব্যাংক হিসাবসমূহ',
    mobileBanking: 'মোবাইল ব্যাংকিং (বিকাশ / নগদ)',
    activeLiability: 'বর্তমান দেনার দায়',
    activeAsset: 'বর্তমান পাওনা সম্পদ',

    // Common Buttons & Actions
    save: 'সংরক্ষণ করুন',
    saveChanges: 'পরিবর্তন সংরক্ষণ করুন',
    cancel: 'বাতিল',
    delete: 'মুছে ফেলুন',
    edit: 'সম্পাদনা',
    update: 'আপডেট করুন',
    add: 'যুক্ত করুন',
    close: 'বন্ধ করুন',
    clear: 'মুছে দিন',
    filter: 'ফিল্টার',
    search: 'অনুসন্ধান করুন',
    submit: 'সাবমিট করুন',
    confirm: 'নিশ্চিত করুন',
    back: 'পেছনে',
    next: 'পরবর্তী',
    view: 'দেখুন',
    history: 'ইতিহাস',
    actions: 'অ্যাকশন',
    status: 'অবস্থা',
    date: 'তারিখ',
    amount: 'পরিমাণ',
    purpose: 'উদ্দেশ্য',
    description: 'বিবরণ',
    notes: 'নোট',
    notesOptional: 'নোট (ঐচ্ছিক)',
    phoneOptional: 'ফোন নম্বর (ঐচ্ছিক)',
    paymentMethod: 'লেনদেনের মাধ্যম',
    category: 'ক্যাটাগরি',
    account: 'হিসাব/একাউন্ট',
    all: 'সকল',
    allCategories: 'সকল ক্যাটাগরি',
    allMethods: 'সকল মাধ্যম',
    allMonths: 'সকল মাস',
    selectMonth: 'মাস নির্বাচন করুন',
    customRange: 'নির্দিষ্ট সময়সীমা',
    startDate: 'শুরুর তারিখ',
    endDate: 'শেষের তারিখ',
    applyFilter: 'ফিল্টার প্রয়োগ করুন',
    resetFilter: 'রিসেট করুন',
    export: 'এক্সপোর্ট',
    exportPDF: 'পিডিএফ এক্সপোর্ট',
    exportCSV: 'সিএসভি এক্সপোর্ট',
    syncing: 'সিঙ্ক হচ্ছে...',
    synced: 'সব সিঙ্ক সম্পন্ন',
    offline: 'অফলাইন মোড',
    online: 'অনলাইন',
    lightMode: 'লাইট মোড',
    darkMode: 'ডার্ক মোড',
    switchToLight: 'লাইট মোডে যান',
    switchToDark: 'ডার্ক মোডে যান',
    searchPlaceholder: 'খুঁজুন...',
    deleteConfirmTitle: 'আপনি কি নিশ্চিত?',
    deleteConfirmDesc: 'এই রেকর্ডটি স্থায়ীভাবে মুছে যাবে এবং পুনরুদ্ধার করা যাবে না।',

    // Payment Methods
    method_cash: 'নগদ (Cash)',
    method_bkash: 'বিকাশ (bKash)',
    method_nagad: 'নগদ (Nagad)',
    method_bank: 'ব্যাংক ট্রান্সফার',
    method_other: 'অন্যান্য',

    // Transaction Types & Modals
    addTransaction: 'লেনদেন যুক্ত করুন',
    addRecord: 'নতুন রেকর্ড যুক্ত করুন',
    selectTransactionType: 'লেনদেনের ধরন নির্বাচন করুন',
    type_personal_expense: 'ব্যক্তিগত খরচ',
    type_personal_expense_desc: 'খাবার, যাতায়াত, কেনাকাটা ও দৈনন্দিন খরচ',
    type_income: 'আয় ও রাজস্ব',
    type_income_desc: 'বেতন, ফ্রিল্যান্সিং, ব্যবসা ও উপহার',
    type_office_expense: 'অফিস খরচ',
    type_office_expense_desc: 'অফিস সামগ্রী, ক্লায়েন্ট মিটিং ও ক্লেইম',
    type_borrowed: 'ধার নেওয়া টাকা',
    type_borrowed_desc: 'ঋণ বা ধার গ্রহণ যা কিস্তিতে পরিশোধ করতে হবে',
    type_lent: 'ধার দেওয়া টাকা',
    type_lent_desc: 'অন্যকে দেওয়া ধার যা ফেরত পাওয়া যাবে',
    type_transfer: 'তহবিল স্থানান্তর',
    type_transfer_desc: 'এক একাউন্ট থেকে অন্য একাউন্টে স্থানান্তর',

    // Loans & Debts Hub (Section A & Section B)
    loansHubTitle: 'ধার ও ঋণ কেন্দ্র',
    loansHubDesc: 'ধার নেওয়া দেনা ও কাউকে দেওয়া ধারের সমন্বিত সুনির্দিষ্ট হিসাব',
    lentSectionTitle: 'ধার দেওয়া টাকা (পাওনা)',
    lentSectionBengaliSub: 'যে টাকা আমি অন্যকে ধার দিয়েছি',
    lentSectionDesc: 'সহকর্মী, বন্ধু ও পরিবারকে দেওয়া ধার এবং আদায় ট্র্যাকিং',
    borrowedSectionTitle: 'ধার নেওয়া টাকা (দেনা)',
    borrowedSectionBengaliSub: 'যে টাকা আমি ধার নিয়েছি বা পরিশোধ করেছি',
    borrowedSectionDesc: 'অন্যদের থেকে নেওয়া ঋণ এবং কিস্তি পরিশোধ ট্র্যাকিং',
    borrowedTab: 'ধার নেওয়া (দেনা)',
    lentTab: 'ধার দেওয়া (পাওনা)',
    remainingDebt: 'অবশিষ্ট ঋণ (দেনা)',
    pendingReceivable: 'বকেয়া পাওনা (পাবো)',
    grossBorrowed: 'মোট ধার নেওয়া (মূলধন)',
    grossLent: 'মোট ধার দেওয়া (মূলধন)',
    totalRepaidToDate: 'পরিশোধ করা হয়েছে',
    totalCollectedBack: 'আদায় করা হয়েছে',
    recordBorrowing: 'ধার গ্রহণ লিপিবদ্ধ করুন',
    editBorrowing: 'ধার রেকর্ড সম্পাদনা করুন',
    recordLending: 'ধার দেওয়া লিপিবদ্ধ করুন',
    editLending: 'ধার দেওয়া সম্পাদনা করুন',
    recordRepayment: 'ঋণ পরিশোধ করুন',
    recordCollection: 'টাকা আদায় করুন',
    borrowerName: 'গ্রহীতার নাম *',
    lenderName: 'যার থেকে ধার নিয়েছেন তার নাম *',
    borrowedDate: 'ধার নেওয়ার তারিখ *',
    lendingDate: 'ধার দেওয়ার তারিখ *',
    dueDate: 'পরিশোধের শেষ তারিখ (ঐচ্ছিক)',
    expectedReturnDate: 'ফেরতের সম্ভাব্য তারিখ (ঐচ্ছিক)',
    repaymentHistory: 'পরিশোধের ইতিহাস',
    collectionHistory: 'আদায়ের ইতিহাস',
    exportLentReportPDF: 'ধার দেওয়া রিপোর্ট (PDF)',
    exportBorrowedReportPDF: 'ধার নেওয়া ও পরিশোধ রিপোর্ট (PDF)',
    noLentRecords: 'কোনো ধার দেওয়ার রেকর্ড নেই।',
    noBorrowedRecords: 'কোনো ধার নেওয়ার রেকর্ড নেই।',
    installmentVouchers: 'কিস্তি পরিশোধের ভাউচারসমূহ',
    installmentCollections: 'কিস্তি আদায়ের রশিদসমূহ',
    deleteBorrowingPrompt: 'ধার নেওয়া রেকর্ড মুছে ফেলতে চান?',
    deleteBorrowingWarning: 'এটি এই ধারের ঋণ এবং কিস্তির ইতিহাস মুছে ফেলবে।',
    deleteLendingPrompt: 'ধার দেওয়ার রেকর্ড মুছে ফেলতে চান?',
    deleteLendingWarning: 'এটি এই পাওনা এবং কিস্তি আদায়ের ইতিহাস মুছে ফেলবে।',
    unpaid: 'অপরিশোধিত',
    partiallyRepaid: 'আংশিক পরিশোধিত',
    fullyRepaid: 'সম্পূর্ণ পরিশোধিত',
    uncollected: 'অনাদায়কৃত',
    partiallyCollected: 'আংশিক আদায়কৃত',
    fullyCollected: 'সম্পূর্ণ আদায়কৃত',
    collected: 'আদায়কৃত',
    repaid: 'পরিশোধিত',
    remaining: 'অবশিষ্ট',
    filterByMonth: 'মাস অনুযায়ী ফিল্টার',
    allRecords: 'সকল রেকর্ড',

    // Office Expenses & Salary Advance
    officeExpensesTitle: 'অফিস খরচ ব্যবস্থাপনা',
    officeExpensesDesc: 'অফিস প্রজেক্টের খরচের হিসাব ও রিইমবার্সমেন্ট ক্লেইম পাওনা',
    addOfficeExpense: 'অফিস খরচ যুক্ত করুন',
    totalOfficeExpenses: 'মোট অফিস খরচ',
    totalReimbursed: 'মোট পরিশোধিত রিইমবার্সমেন্ট',
    pendingReimbursement: 'বকেয়া রিইমবার্সমেন্ট পাওনা',
    reimbursementFilter: 'রিইমবার্সমেন্ট ফিল্টার:',
    allStatuses: 'সকল স্ট্যাটাস',
    notSubmitted: 'জমা দেওয়া হয়নি',
    submitted: 'জমা দেওয়া হয়েছে',
    approved: 'অনুমোদিত',
    reimbursed: 'পরিশোধিত',
    paidFrom: 'প্রদান করা হয়েছে',
    salaryAdvanceTitle: 'অগ্রিম বেতন ও সমন্বয়',
    salaryAdvanceDesc: 'অফিস থেকে নেওয়া অগ্রিম বেতন ও মাসিক বেতন কর্তন ট্র্যাকিং',
    addSalaryAdvance: 'অগ্রিম বেতন যুক্ত করুন',
    adjustSalary: 'বেতন সমন্বয় করুন',
    exportSalaryAdvancePDF: 'স্টেটমেন্ট ডাউনলোড (PDF)',
    totalAdvanceReceived: 'মোট অগ্রিম গ্রহণ',
    totalSalaryAdjusted: 'মোট বেতন সমন্বয়',
    outstandingAdvanceBalance: 'বকেয়া অগ্রিমের পরিমাণ',
    advancesReceivedHistory: 'গৃহীত অগ্রিমের তালিকা',
    salaryAdjustmentsHistory: 'বেতন কর্তন ও সমন্বয়ের তালিকা',
    noAdvancesRecorded: 'কোনো অগ্রিম বেতন লিপিবদ্ধ নেই।',
    noAdjustmentsRecorded: 'কোনো বেতন সমন্বয় লিপিবদ্ধ নেই।',

    // Personal Expenses & Income
    personalExpensesTitle: 'ব্যক্তিগত খরচ',
    personalExpensesDesc: 'দৈনন্দিন ব্যক্তিগত খরচ, খাবার, যাতায়াত ও কেনাকাটার হিসাব',
    addPersonalExpense: 'ব্যক্তিগত খরচ যুক্ত করুন',
    incomeTitle: 'আয় ও রাজস্ব',
    incomeDesc: 'নিয়মিত বেতন, ফ্রিল্যান্সিং, ব্যবসা ও অন্যান্য আয়ের হিসাব',
    addIncomeTitle: 'আয় যুক্ত করুন',

    // Reports & Analytics
    reportsTitle: 'আর্থিক রিপোর্ট ও বিশ্লেষণ',
    reportsDesc: 'বিস্তারিত আর্থিক চিত্র, ক্যাটাগরি বিশ্লেষণ ও লেনদেন অডিট',
    monthlyCashFlow: 'মাসিক নগদ প্রবাহ',
    expenseByCategory: 'ক্যাটাগরি ভিত্তিক ব্যয়',
    incomeVsExpense: 'আয় বনাম ব্যয়',

    // Categories & Accounts
    categoriesTitle: 'ক্যাটাগরি ও হিসাবসমূহ',
    categoriesDesc: 'পেমেন্ট মাধ্যম, ব্যাংক একাউন্ট ও খরচের ক্যাটাগরি সাজান',
    addCategory: 'ক্যাটাগরি যুক্ত করুন',
    addAccount: 'হিসাব যুক্ত করুন',
    transferFunds: 'তহবিল স্থানান্তর',

    // Settings & PWA
    settingsTitle: 'সেটিংস ও ক্লাউড সিঙ্ক',
    settingsDesc: 'ডাটা ব্যাকআপ, অফলাইন স্টোরেজ, সুপাবেস সিঙ্ক ও প্রোফাইল ব্যবস্থাপনা',
    dataBackup: 'ডাটা ব্যাকআপ ও রিস্টোর',
    downloadJSONBackup: 'জেসন ব্যাকআপ ডাউনলোড করুন',
    restoreFromBackup: 'ব্যাকআপ থেকে রিস্টোর করুন',
    pwaAppTitle: 'মোবাইল অ্যাপ (PWA)',
    installApp: 'ফোনে অ্যাপ ইনস্টল করুন',
    installed: 'ইনস্টল সম্পন্ন',

    // Language
    language: 'ভাষা',
    currentLang: 'বাংলা',
    switchLangPrompt: 'Switch to English',
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  isBn: boolean;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string, fallback?: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'bn' || saved === 'en') return saved;
    } catch {
      // Ignore
    }
    return 'en';
  });

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, language);
    } catch {
      // Ignore
    }
  }, [language]);

  const setLanguage = (lang: Language) => {
    setLanguageState(lang);
  };

  const toggleLanguage = () => {
    setLanguageState((prev) => (prev === 'en' ? 'bn' : 'en'));
  };

  const isBn = language === 'bn';

  const t = (key: string, fallback?: string): string => {
    const activeDict = (translations as any)[language] || {};
    const enDict = translations.en as any;
    if (activeDict[key] !== undefined) return activeDict[key];
    if (language === 'en') return fallback !== undefined ? fallback : enDict[key] || key;
    // For Bengali: if direct key not found, check fallback or enDict
    return fallback !== undefined ? fallback : enDict[key] || key;
  };

  return (
    <LanguageContext.Provider value={{ language, isBn, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
