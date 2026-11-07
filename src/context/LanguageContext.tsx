import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'bn';

const STORAGE_KEY = 'my_finance_lang';

export const translations = {
  en: {
    // Brand
    appName: 'My Finance Manager',
    owner: 'Owner',

    // Navigation & Views
    nav_home: 'Home',
    nav_dashboard: 'Financial Overview',
    nav_transactions: 'Transactions',
    nav_loans: 'Loans & Debts Hub',
    nav_more: 'More',
    nav_add: 'Add',
    nav_personal: 'Personal Expenses',
    nav_office: 'Office Expenses',
    nav_income: 'Income',
    nav_borrowed: 'Borrowed Money',
    nav_lent: 'Lent Money',
    nav_reports: 'Reports & Analytics',
    nav_categories: 'Categories & Accounts',
    nav_settings: 'Settings & Sync',

    // Dashboard Cards
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

    // Common Actions & Labels
    addTransaction: 'Add Transaction',
    addRecord: 'Add New Record',
    selectTransactionType: 'Select the type of transaction to create',
    export: 'Export CSV',
    syncing: 'Syncing...',
    lightMode: 'Light Mode',
    darkMode: 'Dark Mode',
    switchToLight: 'Switch to Light Mode',
    switchToDark: 'Switch to Dark Mode',
    searchPlaceholder: 'Search records...',
    allCategories: 'All Categories',
    allMethods: 'All Payment Methods',

    // Transaction Types
    type_personal_expense: 'Personal Expense',
    type_personal_expense_desc: 'Food, commute, shopping & daily costs',
    type_income: 'Income',
    type_income_desc: 'Salary, freelance, business & gifts',
    type_office_expense: 'Office Expense',
    type_office_expense_desc: 'Supplies, client meals & claims',
    type_borrowed: 'Borrowed Money',
    type_borrowed_desc: 'Take loan / debt liability to repay',
    type_lent: 'Lent Money',
    type_lent_desc: 'Lend funds to others / receivable asset',

    // Loans Hub
    loansHubTitle: 'Loans & Debts Hub',
    loansHubDesc: 'Unified tracking for borrowed liabilities and lent receivables',
    borrowedTab: 'Borrowed Money',
    lentTab: 'Lent Money',
    remainingDebt: 'Remaining Debt',
    pendingReceivable: 'Pending Receivable',
    recordBorrowing: 'Record Borrowing',
    recordLending: 'Record Lending',
    recordRepayment: 'Record Repayment',
    recordCollection: 'Record Collection',

    // Language
    language: 'Language',
    currentLang: 'English',
    switchLangPrompt: 'বাংলায় পরিবর্তন করুন',
  },
  bn: {
    // Brand
    appName: 'মাই ফিন্যান্স ম্যানেজার',
    owner: 'স্বত্বাধিকারী',

    // Navigation & Views
    nav_home: 'হোম',
    nav_dashboard: 'আর্থিক ওভারভিউ',
    nav_transactions: 'লেনদেন',
    nav_loans: 'ধার ও ঋণ',
    nav_more: 'আরও',
    nav_add: 'যুক্ত করুন',
    nav_personal: 'ব্যক্তিগত খরচ',
    nav_office: 'অফিস খরচ',
    nav_income: 'আয় ও রাজস্ব',
    nav_borrowed: 'ধার নেওয়া টাকা',
    nav_lent: 'ধার দেওয়া টাকা',
    nav_reports: 'রিপোর্ট ও বিশ্লেষণ',
    nav_categories: 'ক্যাটাগরি ও একাউন্ট',
    nav_settings: 'সেটিংস ও ব্যাকআপ',

    // Dashboard Cards
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

    // Common Actions & Labels
    addTransaction: 'লেনদেন যুক্ত করুন',
    addRecord: 'নতুন রেকর্ড যুক্ত করুন',
    selectTransactionType: 'লেনদেনের ধরন নির্বাচন করুন',
    export: 'এক্সপোর্ট করুন',
    syncing: 'সিঙ্ক হচ্ছে...',
    lightMode: 'লাইট মোড',
    darkMode: 'ডার্ক মোড',
    switchToLight: 'লাইট মোডে যান',
    switchToDark: 'ডার্ক মোডে যান',
    searchPlaceholder: 'খুঁজুন...',
    allCategories: 'সকল ক্যাটাগরি',
    allMethods: 'সকল মাধ্যম',

    // Transaction Types
    type_personal_expense: 'ব্যক্তিগত খরচ',
    type_personal_expense_desc: 'খাবার, যাতায়াত, কেনাকাটা ও দৈনিক খরচ',
    type_income: 'আয়',
    type_income_desc: 'বেতন, ফ্রিল্যান্সিং, ব্যবসা ও উপহার',
    type_office_expense: 'অফিস খরচ',
    type_office_expense_desc: 'অফিস সামগ্রী, ক্লায়েন্ট মিটিং ও ক্লেইম',
    type_borrowed: 'ধার নেওয়া টাকা',
    type_borrowed_desc: 'ঋণ বা ধার গ্রহণ যা পরিশোধ করতে হবে',
    type_lent: 'ধার দেওয়া টাকা',
    type_lent_desc: 'অন্যকে দেওয়া ধার যা ফেরত পাওয়া যাবে',

    // Loans Hub
    loansHubTitle: 'ধার ও ঋণ ব্যবস্থাপনা',
    loansHubDesc: 'ধার নেওয়া দেনা ও কাউকে দেওয়া ধারের সমন্বিত হিসাব',
    borrowedTab: 'ধার নেওয়া (দেনা)',
    lentTab: 'ধার দেওয়া (পাওনা)',
    remainingDebt: 'অবশিষ্ট ঋণ',
    pendingReceivable: 'বকেয়া পাওনা',
    recordBorrowing: 'ধার গ্রহণ লিপিবদ্ধ করুন',
    recordLending: 'ধার দেওয়া লিপিবদ্ধ করুন',
    recordRepayment: 'পরিশোধ লিপিবদ্ধ করুন',
    recordCollection: 'আদায় লিপিবদ্ধ করুন',

    // Language
    language: 'ভাষা',
    currentLang: 'বাংলা',
    switchLangPrompt: 'Switch to English',
  },
};

export type TranslationKey = keyof typeof translations.en;

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: TranslationKey) => string;
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

  const t = (key: TranslationKey): string => {
    return translations[language][key] || translations.en[key] || String(key);
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
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
