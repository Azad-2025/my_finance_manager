/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { AuthProvider } from './context/AuthContext';
import { FinanceProvider } from './context/FinanceContext';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { Navbar } from './components/layout/Navbar';
import { Sidebar, NavView } from './components/layout/Sidebar';
import { BottomNav } from './components/layout/BottomNav';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { SplashScreen } from './components/common/SplashScreen';
import { PWAUpdatePrompt } from './components/common/PWAUpdatePrompt';

// Modals
import { TransactionModal } from './components/modals/TransactionModal';
import { BorrowingModal } from './components/modals/BorrowingModal';
import { RepaymentModal } from './components/modals/RepaymentModal';
import { LendingModal } from './components/modals/LendingModal';
import { CollectionModal } from './components/modals/CollectionModal';
import { OfficeReimbursementModal } from './components/modals/OfficeReimbursementModal';
import { TransferModal } from './components/modals/TransferModal';
import { CategoryModal } from './components/modals/CategoryModal';
import { AccountModal } from './components/modals/AccountModal';
import { AuthModal } from './components/modals/AuthModal';

// Views
import { DashboardView } from './views/DashboardView';
import { TransactionsView } from './views/TransactionsView';
import { PersonalExpensesView } from './views/PersonalExpensesView';
import { OfficeExpensesView } from './views/OfficeExpensesView';
import { IncomeView } from './views/IncomeView';
import { BorrowedMoneyView } from './views/BorrowedMoneyView';
import { LentMoneyView } from './views/LentMoneyView';
import { ReportsView } from './views/ReportsView';
import { CategoriesView } from './views/CategoriesView';
import { SettingsView } from './views/SettingsView';
import { LoansView } from './views/LoansView';

// Types
import {
  Transaction,
  TransactionType,
  Borrowing,
  Lending,
  Category,
  Account,
} from './types/finance';

function MainLayout() {
  const [currentView, setCurrentView] = useState<NavView>('dashboard');
  const [darkMode, setDarkMode] = useState<boolean>(() => {
    try {
      const saved = localStorage.getItem('my_finance_theme');
      if (saved) return saved === 'dark';
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    } catch {
      return true; // Default dark
    }
  });

  useEffect(() => {
    if (darkMode) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('my_finance_theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('my_finance_theme', 'light');
    }
  }, [darkMode]);

  // Modal States
  const [transactionModalOpen, setTransactionModalOpen] = useState(false);
  const [transactionModalType, setTransactionModalType] = useState<TransactionType>('personal_expense');
  const [editingTransaction, setEditingTransaction] = useState<Transaction | null>(null);

  const [borrowingModalOpen, setBorrowingModalOpen] = useState(false);
  const [editingBorrowing, setEditingBorrowing] = useState<Borrowing | null>(null);
  const [repaymentModalOpen, setRepaymentModalOpen] = useState(false);
  const [activeBorrowingForRepayment, setActiveBorrowingForRepayment] = useState<Borrowing | null>(null);

  const [lendingModalOpen, setLendingModalOpen] = useState(false);
  const [editingLending, setEditingLending] = useState<Lending | null>(null);
  const [collectionModalOpen, setCollectionModalOpen] = useState(false);
  const [activeLendingForCollection, setActiveLendingForCollection] = useState<Lending | null>(null);

  const [officeReimbursementModalOpen, setOfficeReimbursementModalOpen] = useState(false);
  const [activeOfficeTransaction, setActiveOfficeTransaction] = useState<Transaction | null>(null);

  const [transferModalOpen, setTransferModalOpen] = useState(false);

  const [categoryModalOpen, setCategoryModalOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [defaultCategoryType, setDefaultCategoryType] = useState<'personal_expense' | 'office_expense' | 'income'>('personal_expense');

  const [accountModalOpen, setAccountModalOpen] = useState(false);
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);

  const [authModalOpen, setAuthModalOpen] = useState(false);

  const { t } = useLanguage();

  // View Title Lookup
  const viewTitles: Record<NavView, string> = {
    dashboard: t('nav_dashboard'),
    transactions: t('nav_transactions'),
    personal: t('nav_personal'),
    office: t('nav_office'),
    income: t('nav_income'),
    loans: t('nav_loans'),
    borrowed: t('nav_borrowed'),
    lent: t('nav_lent'),
    reports: t('nav_reports'),
    categories: t('nav_categories'),
    settings: t('nav_settings'),
  };

  // Handlers for launching modals
  const handleOpenAddTransaction = (initialType: TransactionType = 'personal_expense') => {
    setEditingTransaction(null);
    setTransactionModalType(initialType);
    setTransactionModalOpen(true);
  };

  const handleEditTransaction = (tx: Transaction) => {
    setEditingTransaction(tx);
    setTransactionModalType(tx.type);
    setTransactionModalOpen(true);
  };

  const handleOpenAddBorrowing = () => {
    setEditingBorrowing(null);
    setBorrowingModalOpen(true);
  };

  const handleEditBorrowing = (b: Borrowing) => {
    setEditingBorrowing(b);
    setBorrowingModalOpen(true);
  };

  const handleOpenAddLending = () => {
    setEditingLending(null);
    setLendingModalOpen(true);
  };

  const handleEditLending = (l: Lending) => {
    setEditingLending(l);
    setLendingModalOpen(true);
  };

  const handleOpenRepaymentModal = (borrowing: Borrowing) => {
    setActiveBorrowingForRepayment(borrowing);
    setRepaymentModalOpen(true);
  };

  const handleOpenCollectionModal = (lending: Lending) => {
    setActiveLendingForCollection(lending);
    setCollectionModalOpen(true);
  };

  const handleOpenReimbursementModal = (tx: Transaction) => {
    setActiveOfficeTransaction(tx);
    setOfficeReimbursementModalOpen(true);
  };

  const handleOpenCategoryModal = (
    category?: Category,
    defaultType: 'personal_expense' | 'office_expense' | 'income' = 'personal_expense'
  ) => {
    setEditingCategory(category || null);
    setDefaultCategoryType(defaultType);
    setCategoryModalOpen(true);
  };

  const handleOpenAccountModal = (account?: Account) => {
    setEditingAccount(account || null);
    setAccountModalOpen(true);
  };

  return (
    <div className="flex min-h-screen bg-slate-50 dark:bg-slate-950 text-slate-900 dark:text-slate-100 font-sans">
      {/* Desktop Sidebar */}
      <Sidebar currentView={currentView} onSelectView={setCurrentView} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        <Navbar
          currentViewTitle={viewTitles[currentView]}
          onOpenAuth={() => setAuthModalOpen(true)}
          darkMode={darkMode}
          onToggleDarkMode={() => setDarkMode(!darkMode)}
        />

        <main className="flex-1 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          {currentView === 'dashboard' && (
            <DashboardView
              onOpenAddTransaction={() => handleOpenAddTransaction('personal_expense')}
              onSelectView={setCurrentView}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {currentView === 'transactions' && (
            <TransactionsView
              onOpenAddTransaction={() => handleOpenAddTransaction('personal_expense')}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {currentView === 'personal' && (
            <PersonalExpensesView
              onOpenAddExpense={() => handleOpenAddTransaction('personal_expense')}
              onEditTransaction={handleEditTransaction}
              onOpenCategoryModal={() => handleOpenCategoryModal(undefined, 'personal_expense')}
            />
          )}

          {currentView === 'office' && (
            <OfficeExpensesView
              onOpenAddOfficeExpense={() => handleOpenAddTransaction('office_expense')}
              onEditTransaction={handleEditTransaction}
              onOpenReimbursementModal={handleOpenReimbursementModal}
            />
          )}

          {currentView === 'income' && (
            <IncomeView
              onOpenAddIncome={() => handleOpenAddTransaction('income')}
              onEditTransaction={handleEditTransaction}
            />
          )}

          {currentView === 'loans' && (
            <LoansView
              onOpenAddBorrowing={handleOpenAddBorrowing}
              onOpenRepaymentModal={handleOpenRepaymentModal}
              onOpenAddLending={handleOpenAddLending}
              onOpenCollectionModal={handleOpenCollectionModal}
              onEditBorrowing={handleEditBorrowing}
              onEditLending={handleEditLending}
            />
          )}

          {currentView === 'borrowed' && (
            <BorrowedMoneyView
              onOpenAddBorrowing={handleOpenAddBorrowing}
              onOpenRepaymentModal={handleOpenRepaymentModal}
              onEditBorrowing={handleEditBorrowing}
            />
          )}

          {currentView === 'lent' && (
            <LentMoneyView
              onOpenAddLending={handleOpenAddLending}
              onOpenCollectionModal={handleOpenCollectionModal}
              onEditLending={handleEditLending}
            />
          )}

          {currentView === 'reports' && <ReportsView />}

          {currentView === 'categories' && (
            <CategoriesView
              onOpenCategoryModal={handleOpenCategoryModal}
              onOpenAccountModal={handleOpenAccountModal}
              onOpenTransferModal={() => setTransferModalOpen(true)}
            />
          )}

          {currentView === 'settings' && (
            <SettingsView
              darkMode={darkMode}
              onToggleDarkMode={() => setDarkMode(!darkMode)}
              onOpenAuth={() => setAuthModalOpen(true)}
            />
          )}
        </main>
      </div>

      {/* Mobile Bottom Navigation (Exactly 5 Items: Home, Transactions, Add (+), Loans, More) */}
      <BottomNav
        currentView={currentView}
        onSelectView={setCurrentView}
        onOpenAddIncome={() => handleOpenAddTransaction('income')}
        onOpenAddExpense={() => handleOpenAddTransaction('personal_expense')}
        onOpenAddOfficeExpense={() => handleOpenAddTransaction('office_expense')}
        onOpenAddBorrowing={handleOpenAddBorrowing}
        onOpenAddLending={handleOpenAddLending}
      />

      {/* App Launch Splash Screen (plays on initial app load, session guarded) */}
      <SplashScreen />

      {/* Safe PWA Update Prompt (non-intrusive notification) */}
      <PWAUpdatePrompt />

      {/* Offline Status & Sync Queue Toast */}
      <OfflineIndicator />

      {/* Modals Container */}
      <TransactionModal
        isOpen={transactionModalOpen}
        onClose={() => setTransactionModalOpen(false)}
        initialType={transactionModalType}
        editingTransaction={editingTransaction}
      />

      <BorrowingModal
        isOpen={borrowingModalOpen}
        onClose={() => {
          setBorrowingModalOpen(false);
          setEditingBorrowing(null);
        }}
        editingBorrowing={editingBorrowing}
      />

      <RepaymentModal
        isOpen={repaymentModalOpen}
        onClose={() => {
          setRepaymentModalOpen(false);
          setActiveBorrowingForRepayment(null);
        }}
        borrowing={activeBorrowingForRepayment}
      />

      <LendingModal
        isOpen={lendingModalOpen}
        onClose={() => {
          setLendingModalOpen(false);
          setEditingLending(null);
        }}
        editingLending={editingLending}
      />

      <CollectionModal
        isOpen={collectionModalOpen}
        onClose={() => {
          setCollectionModalOpen(false);
          setActiveLendingForCollection(null);
        }}
        lending={activeLendingForCollection}
      />

      <OfficeReimbursementModal
        isOpen={officeReimbursementModalOpen}
        onClose={() => {
          setOfficeReimbursementModalOpen(false);
          setActiveOfficeTransaction(null);
        }}
        transaction={activeOfficeTransaction}
      />

      <TransferModal
        isOpen={transferModalOpen}
        onClose={() => setTransferModalOpen(false)}
      />

      <CategoryModal
        isOpen={categoryModalOpen}
        onClose={() => {
          setCategoryModalOpen(false);
          setEditingCategory(null);
        }}
        editingCategory={editingCategory}
        defaultType={defaultCategoryType}
      />

      <AccountModal
        isOpen={accountModalOpen}
        onClose={() => {
          setAccountModalOpen(false);
          setEditingAccount(null);
        }}
        editingAccount={editingAccount}
      />

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <FinanceProvider>
        <LanguageProvider>
          <MainLayout />
        </LanguageProvider>
      </FinanceProvider>
    </AuthProvider>
  );
}
