import React, { createContext, useContext, useEffect, useState, useMemo } from 'react';
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
  FinancialSummary,
  OfficeReimbursementStatus,
  PaymentMethod,
} from '../types/finance';
import {
  getSupabase,
  loadLocalData,
  saveLocalData,
  resetAllDataToClean,
  FinanceDatabaseState,
  DEFAULT_CATEGORIES,
  DEFAULT_ACCOUNTS,
} from '../lib/supabase';
import { useAuth } from './AuthContext';
import { getTodayString } from '../utils/formatters';

interface FinanceContextType {
  accounts: Account[];
  categories: Category[];
  transactions: Transaction[];
  borrowings: Borrowing[];
  borrowingRepayments: BorrowingRepayment[];
  lendings: Lending[];
  lendingCollections: LendingCollection[];
  officeReimbursements: OfficeReimbursement[];
  transfers: AccountTransfer[];
  summary: FinancialSummary;
  loading: boolean;
  syncing: boolean;

  // Transaction operations
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Borrowing operations
  addBorrowing: (b: Omit<Borrowing, 'id' | 'repaid_amount' | 'status' | 'created_at' | 'updated_at'>) => Promise<Borrowing>;
  recordBorrowingRepayment: (
    borrowingId: string,
    amount: number,
    paymentMethod: PaymentMethod | string,
    accountId?: string,
    notes?: string
  ) => Promise<void>;
  deleteBorrowing: (id: string) => Promise<void>;

  // Lending operations
  addLending: (l: Omit<Lending, 'id' | 'collected_amount' | 'status' | 'created_at' | 'updated_at'>) => Promise<Lending>;
  recordLendingCollection: (
    lendingId: string,
    amount: number,
    paymentMethod: PaymentMethod | string,
    accountId?: string,
    notes?: string
  ) => Promise<void>;
  deleteLending: (id: string) => Promise<void>;

  // Office Reimbursement
  recordOfficeReimbursement: (
    transactionId: string,
    amount: number,
    paymentMethod: PaymentMethod | string,
    accountId?: string,
    notes?: string
  ) => Promise<void>;

  // Account operations
  addAccount: (acc: Omit<Account, 'id' | 'created_at' | 'updated_at'>) => Promise<Account>;
  updateAccount: (acc: Account) => Promise<void>;
  deleteAccount: (id: string) => Promise<void>;
  transferBetweenAccounts: (
    fromId: string,
    toId: string,
    amount: number,
    notes?: string
  ) => Promise<void>;

  // Category operations
  addCategory: (cat: Omit<Category, 'id' | 'created_at'>) => Promise<Category>;
  updateCategory: (cat: Category) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;

  // Import / Export
  exportToCSV: (type?: 'all' | 'transactions' | 'personal' | 'office' | 'income' | 'borrowings' | 'lendings') => void;
  exportCompleteJSON: () => string;
  importJSON: (jsonStr: string) => { success: boolean; message: string };
  syncToSupabase: () => Promise<{ success: boolean; error?: string }>;
  refreshData: () => Promise<void>;
  clearAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [borrowingRepayments, setBorrowingRepayments] = useState<BorrowingRepayment[]>([]);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [lendingCollections, setLendingCollections] = useState<LendingCollection[]>([]);
  const [officeReimbursements, setOfficeReimbursements] = useState<OfficeReimbursement[]>([]);
  const [transfers, setTransfers] = useState<AccountTransfer[]>([]);

  // Load data on mount or when user changes
  const loadData = async () => {
    setLoading(true);
    const supabase = getSupabase();

    if (supabase && user) {
      try {
        // Fetch from Supabase
        const [
          { data: accData },
          { data: catData },
          { data: txData },
          { data: borData },
          { data: borRepData },
          { data: lenData },
          { data: lenColData },
          { data: offReimbData },
          { data: trData },
        ] = await Promise.all([
          supabase.from('accounts').select('*').order('created_at', { ascending: true }),
          supabase.from('categories').select('*').order('created_at', { ascending: true }),
          supabase.from('transactions').select('*').order('date', { ascending: false }),
          supabase.from('borrowings').select('*').order('borrowed_date', { ascending: false }),
          supabase.from('borrowing_repayments').select('*').order('payment_date', { ascending: false }),
          supabase.from('lendings').select('*').order('lending_date', { ascending: false }),
          supabase.from('lending_collections').select('*').order('collection_date', { ascending: false }),
          supabase.from('office_reimbursements').select('*').order('reimbursement_date', { ascending: false }),
          supabase.from('account_transfers').select('*').order('transfer_date', { ascending: false }),
        ]);

        setAccounts(accData || DEFAULT_ACCOUNTS);
        setCategories(catData || DEFAULT_CATEGORIES);
        setTransactions(txData || []);
        setBorrowings(borData || []);
        setBorrowingRepayments(borRepData || []);
        setLendings(lenData || []);
        setLendingCollections(lenColData || []);
        setOfficeReimbursements(offReimbData || []);
        setTransfers(trData || []);
        setLoading(false);
        return;
      } catch (e) {
        console.warn('Error fetching from Supabase, falling back to local store:', e);
      }
    }

    // Offline / Demo / Fallback Store
    const local = loadLocalData();
    setAccounts(local.accounts || DEFAULT_ACCOUNTS);
    setCategories(local.categories || DEFAULT_CATEGORIES);
    setTransactions(local.transactions || []);
    setBorrowings(local.borrowings || []);
    setBorrowingRepayments(local.borrowing_repayments || []);
    setLendings(local.lendings || []);
    setLendingCollections(local.lending_collections || []);
    setOfficeReimbursements(local.office_reimbursements || []);
    setTransfers(local.transfers || []);
    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Persist local store whenever state changes (keeps offline sandbox 100% updated)
  useEffect(() => {
    if (!loading) {
      saveLocalData({
        accounts,
        categories,
        transactions,
        borrowings,
        borrowing_repayments: borrowingRepayments,
        lendings,
        lending_collections: lendingCollections,
        office_reimbursements: officeReimbursements,
        transfers,
      });
    }
  }, [
    accounts,
    categories,
    transactions,
    borrowings,
    borrowingRepayments,
    lendings,
    lendingCollections,
    officeReimbursements,
    transfers,
    loading,
  ]);

  // Calculate comprehensive financial summary
  const summary = useMemo<FinancialSummary>(() => {
    const today = getTodayString();
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 86400000).toISOString().split('T')[0];
    const firstDayOfMonth = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-01`;

    let totalIncome = 0;
    let totalPersonalExpenses = 0;
    let totalOfficeExpenses = 0;
    let officeReimbursedAmount = 0;
    let todayExpenses = 0;
    let todayIncome = 0;
    let weekExpenses = 0;
    let monthExpenses = 0;

    transactions.forEach((tx) => {
      const isToday = tx.date === today;
      const isWeek = tx.date >= oneWeekAgo && tx.date <= today;
      const isMonth = tx.date >= firstDayOfMonth && tx.date <= today;

      if (tx.type === 'income') {
        totalIncome += Number(tx.amount);
        if (isToday) todayIncome += Number(tx.amount);
      } else if (tx.type === 'personal_expense') {
        totalPersonalExpenses += Number(tx.amount);
        if (isToday) todayExpenses += Number(tx.amount);
        if (isWeek) weekExpenses += Number(tx.amount);
        if (isMonth) monthExpenses += Number(tx.amount);
      } else if (tx.type === 'office_expense') {
        totalOfficeExpenses += Number(tx.amount);
        officeReimbursedAmount += Number(tx.reimbursed_amount || 0);
        if (isToday) todayExpenses += Number(tx.amount);
        if (isWeek) weekExpenses += Number(tx.amount);
        if (isMonth) monthExpenses += Number(tx.amount);
      }
    });

    // Pending office reimbursement receivable
    const pendingOfficeReimbursement = Math.max(0, totalOfficeExpenses - officeReimbursedAmount);

    // Borrowed Money (Liabilities)
    let totalBorrowed = 0;
    let totalBorrowedRepaid = 0;
    borrowings.forEach((b) => {
      totalBorrowed += Number(b.amount);
      totalBorrowedRepaid += Number(b.repaid_amount || 0);
    });
    const amountIOwe = Math.max(0, totalBorrowed - totalBorrowedRepaid);

    // Lent Money (Receivables)
    let totalLent = 0;
    let totalLentCollected = 0;
    lendings.forEach((l) => {
      totalLent += Number(l.amount);
      totalLentCollected += Number(l.collected_amount || 0);
    });
    const amountOwedToMe = Math.max(0, totalLent - totalLentCollected);

    // Total account balance
    const totalBalance = accounts.reduce((acc, a) => acc + Number(a.balance), 0);

    return {
      totalBalance,
      totalIncome,
      totalPersonalExpenses,
      totalOfficeExpenses,
      officeReimbursedAmount,
      pendingOfficeReimbursement,
      totalBorrowed,
      totalBorrowedRepaid,
      amountIOwe,
      totalLent,
      totalLentCollected,
      amountOwedToMe,
      todayExpenses,
      todayIncome,
      weekExpenses,
      monthExpenses,
    };
  }, [accounts, transactions, borrowings, lendings]);

  // =========================================================================
  // TRANSACTION OPERATIONS
  // =========================================================================
  const addTransaction = async (
    txData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Transaction> => {
    const id = `tx-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const nowStr = new Date().toISOString();

    const newTx: Transaction = {
      ...txData,
      id,
      reimbursed_amount: txData.reimbursed_amount || 0,
      reimbursement_status: txData.type === 'office_expense' ? (txData.reimbursement_status || 'Not Submitted') : undefined,
      created_at: nowStr,
      updated_at: nowStr,
    };

    // Update account balance
    if (newTx.account_id) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === newTx.account_id) {
            const delta = newTx.type === 'income' ? newTx.amount : -newTx.amount;
            return { ...acc, balance: acc.balance + delta, updated_at: nowStr };
          }
          return acc;
        })
      );
    }

    setTransactions((prev) => [newTx, ...prev]);

    // Supabase write
    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('transactions').insert({
          ...newTx,
          user_id: user.id,
        });
        if (newTx.account_id) {
          const acc = accounts.find((a) => a.id === newTx.account_id);
          if (acc) {
            const newBal = acc.balance + (newTx.type === 'income' ? newTx.amount : -newTx.amount);
            await supabase.from('accounts').update({ balance: newBal, updated_at: nowStr }).eq('id', acc.id);
          }
        }
      } catch (err) {
        console.error('Supabase transaction insert error:', err);
      }
    }

    return newTx;
  };

  const updateTransaction = async (updatedTx: Transaction) => {
    const existing = transactions.find((t) => t.id === updatedTx.id);
    const nowStr = new Date().toISOString();
    const txWithTs = { ...updatedTx, updated_at: nowStr };

    if (existing) {
      // Revert previous account impact
      setAccounts((prev) =>
        prev.map((acc) => {
          let bal = acc.balance;
          if (existing.account_id === acc.id) {
            bal -= existing.type === 'income' ? existing.amount : -existing.amount;
          }
          if (txWithTs.account_id === acc.id) {
            bal += txWithTs.type === 'income' ? txWithTs.amount : -txWithTs.amount;
          }
          return { ...acc, balance: bal, updated_at: nowStr };
        })
      );
    }

    setTransactions((prev) => prev.map((t) => (t.id === updatedTx.id ? txWithTs : t)));

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('transactions').update({ ...txWithTs }).eq('id', updatedTx.id);
      } catch (err) {
        console.error('Supabase transaction update error:', err);
      }
    }
  };

  const deleteTransaction = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;
    const nowStr = new Date().toISOString();

    // Revert account balance impact
    if (target.account_id) {
      setAccounts((prev) =>
        prev.map((acc) => {
          if (acc.id === target.account_id) {
            const delta = target.type === 'income' ? -target.amount : target.amount;
            return { ...acc, balance: acc.balance + delta, updated_at: nowStr };
          }
          return acc;
        })
      );
    }

    setTransactions((prev) => prev.filter((t) => t.id !== id));

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('transactions').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase transaction delete error:', err);
      }
    }
  };

  // =========================================================================
  // BORROWING OPERATIONS (Liabilities)
  // =========================================================================
  const addBorrowing = async (
    bData: Omit<Borrowing, 'id' | 'repaid_amount' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<Borrowing> => {
    const id = `bor-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const nowStr = new Date().toISOString();

    const newBorrowing: Borrowing = {
      ...bData,
      id,
      repaid_amount: 0,
      status: 'Unpaid',
      created_at: nowStr,
      updated_at: nowStr,
    };

    setBorrowings((prev) => [newBorrowing, ...prev]);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('borrowings').insert({
          ...newBorrowing,
          user_id: user.id,
        });
      } catch (err) {
        console.error('Supabase borrowing insert error:', err);
      }
    }

    return newBorrowing;
  };

  const recordBorrowingRepayment = async (
    borrowingId: string,
    amount: number,
    paymentMethod: PaymentMethod | string,
    accountId?: string,
    notes?: string
  ) => {
    const borrowing = borrowings.find((b) => b.id === borrowingId);
    if (!borrowing) return;

    const repId = `rep-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const nowStr = new Date().toISOString();

    const newRepayment: BorrowingRepayment = {
      id: repId,
      borrowing_id: borrowingId,
      payment_date: getTodayString(),
      amount,
      payment_method: paymentMethod,
      account_id: accountId,
      notes,
      created_at: nowStr,
    };

    const newRepaidAmount = Number(borrowing.repaid_amount) + Number(amount);
    const newStatus: Borrowing['status'] =
      newRepaidAmount >= borrowing.amount ? 'Fully Repaid' : 'Partially Repaid';

    setBorrowings((prev) =>
      prev.map((b) =>
        b.id === borrowingId
          ? { ...b, repaid_amount: newRepaidAmount, status: newStatus, updated_at: nowStr }
          : b
      )
    );

    setBorrowingRepayments((prev) => [newRepayment, ...prev]);

    // Repayment deducts from user's account balance (reducing liability)
    if (accountId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, balance: acc.balance - amount, updated_at: nowStr } : acc
        )
      );
    }

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('borrowing_repayments').insert({
          ...newRepayment,
          user_id: user.id,
        });
        await supabase
          .from('borrowings')
          .update({ repaid_amount: newRepaidAmount, status: newStatus, updated_at: nowStr })
          .eq('id', borrowingId);
      } catch (err) {
        console.error('Supabase borrowing repayment error:', err);
      }
    }
  };

  const deleteBorrowing = async (id: string) => {
    setBorrowings((prev) => prev.filter((b) => b.id !== id));
    setBorrowingRepayments((prev) => prev.filter((r) => r.borrowing_id !== id));

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('borrowings').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase borrowing delete error:', err);
      }
    }
  };

  // =========================================================================
  // LENDING OPERATIONS (Receivables)
  // =========================================================================
  const addLending = async (
    lData: Omit<Lending, 'id' | 'collected_amount' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<Lending> => {
    const id = `len-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const nowStr = new Date().toISOString();

    const newLending: Lending = {
      ...lData,
      id,
      collected_amount: 0,
      status: 'Uncollected',
      created_at: nowStr,
      updated_at: nowStr,
    };

    setLendings((prev) => [newLending, ...prev]);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('lendings').insert({
          ...newLending,
          user_id: user.id,
        });
      } catch (err) {
        console.error('Supabase lending insert error:', err);
      }
    }

    return newLending;
  };

  const recordLendingCollection = async (
    lendingId: string,
    amount: number,
    paymentMethod: PaymentMethod | string,
    accountId?: string,
    notes?: string
  ) => {
    const lending = lendings.find((l) => l.id === lendingId);
    if (!lending) return;

    const colId = `col-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const nowStr = new Date().toISOString();

    const newCollection: LendingCollection = {
      id: colId,
      lending_id: lendingId,
      collection_date: getTodayString(),
      amount,
      payment_method: paymentMethod,
      account_id: accountId,
      notes,
      created_at: nowStr,
    };

    const newCollectedAmount = Number(lending.collected_amount) + Number(amount);
    const newStatus: Lending['status'] =
      newCollectedAmount >= lending.amount ? 'Fully Collected' : 'Partially Collected';

    setLendings((prev) =>
      prev.map((l) =>
        l.id === lendingId
          ? { ...l, collected_amount: newCollectedAmount, status: newStatus, updated_at: nowStr }
          : l
      )
    );

    setLendingCollections((prev) => [newCollection, ...prev]);

    // Collection adds to user's account balance (reducing receivable)
    if (accountId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, balance: acc.balance + amount, updated_at: nowStr } : acc
        )
      );
    }

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('lending_collections').insert({
          ...newCollection,
          user_id: user.id,
        });
        await supabase
          .from('lendings')
          .update({ collected_amount: newCollectedAmount, status: newStatus, updated_at: nowStr })
          .eq('id', lendingId);
      } catch (err) {
        console.error('Supabase lending collection error:', err);
      }
    }
  };

  const deleteLending = async (id: string) => {
    setLendings((prev) => prev.filter((l) => l.id !== id));
    setLendingCollections((prev) => prev.filter((c) => c.lending_id !== id));

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('lendings').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase lending delete error:', err);
      }
    }
  };

  // =========================================================================
  // OFFICE REIMBURSEMENT
  // =========================================================================
  const recordOfficeReimbursement = async (
    transactionId: string,
    amount: number,
    paymentMethod: PaymentMethod | string,
    accountId?: string,
    notes?: string
  ) => {
    const tx = transactions.find((t) => t.id === transactionId && t.type === 'office_expense');
    if (!tx) return;

    const reimbId = `reimb-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const nowStr = new Date().toISOString();

    const newReimb: OfficeReimbursement = {
      id: reimbId,
      transaction_id: transactionId,
      reimbursement_date: getTodayString(),
      amount,
      payment_method: paymentMethod,
      account_id: accountId,
      notes,
      created_at: nowStr,
    };

    const newReimbursedAmount = Number(tx.reimbursed_amount || 0) + Number(amount);
    const newStatus: OfficeReimbursementStatus =
      newReimbursedAmount >= tx.amount ? 'Fully Reimbursed' : 'Partially Reimbursed';

    setTransactions((prev) =>
      prev.map((t) =>
        t.id === transactionId
          ? {
              ...t,
              reimbursed_amount: newReimbursedAmount,
              reimbursement_status: newStatus,
              updated_at: nowStr,
            }
          : t
      )
    );

    setOfficeReimbursements((prev) => [newReimb, ...prev]);

    // Reimbursement money received into user's account (not counted as new income, reduces receivable)
    if (accountId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, balance: acc.balance + amount, updated_at: nowStr } : acc
        )
      );
    }

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('office_reimbursements').insert({
          ...newReimb,
          user_id: user.id,
        });
        await supabase
          .from('transactions')
          .update({
            reimbursed_amount: newReimbursedAmount,
            reimbursement_status: newStatus,
            updated_at: nowStr,
          })
          .eq('id', transactionId);
      } catch (err) {
        console.error('Supabase office reimbursement error:', err);
      }
    }
  };

  // =========================================================================
  // ACCOUNT & TRANSFER OPERATIONS
  // =========================================================================
  const addAccount = async (
    accData: Omit<Account, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Account> => {
    const id = `acc-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const nowStr = new Date().toISOString();

    const newAccount: Account = {
      ...accData,
      id,
      created_at: nowStr,
      updated_at: nowStr,
    };

    setAccounts((prev) => [...prev, newAccount]);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('accounts').insert({
          ...newAccount,
          user_id: user.id,
        });
      } catch (err) {
        console.error('Supabase account insert error:', err);
      }
    }

    return newAccount;
  };

  const updateAccount = async (acc: Account) => {
    const nowStr = new Date().toISOString();
    const updated = { ...acc, updated_at: nowStr };

    setAccounts((prev) => prev.map((a) => (a.id === acc.id ? updated : a)));

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('accounts').update({ ...updated }).eq('id', acc.id);
      } catch (err) {
        console.error('Supabase account update error:', err);
      }
    }
  };

  const deleteAccount = async (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('accounts').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase account delete error:', err);
      }
    }
  };

  const transferBetweenAccounts = async (
    fromId: string,
    toId: string,
    amount: number,
    notes?: string
  ) => {
    const fromAcc = accounts.find((a) => a.id === fromId);
    const toAcc = accounts.find((a) => a.id === toId);
    if (!fromAcc || !toAcc || fromId === toId) return;

    const trId = `tr-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const nowStr = new Date().toISOString();

    const transferRecord: AccountTransfer = {
      id: trId,
      transfer_date: getTodayString(),
      from_account_id: fromId,
      from_account_name: fromAcc.name,
      to_account_id: toId,
      to_account_name: toAcc.name,
      amount,
      notes,
      created_at: nowStr,
    };

    setAccounts((prev) =>
      prev.map((acc) => {
        if (acc.id === fromId) {
          return { ...acc, balance: acc.balance - amount, updated_at: nowStr };
        }
        if (acc.id === toId) {
          return { ...acc, balance: acc.balance + amount, updated_at: nowStr };
        }
        return acc;
      })
    );

    setTransfers((prev) => [transferRecord, ...prev]);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('account_transfers').insert({
          ...transferRecord,
          user_id: user.id,
        });
        await supabase.from('accounts').update({ balance: fromAcc.balance - amount, updated_at: nowStr }).eq('id', fromId);
        await supabase.from('accounts').update({ balance: toAcc.balance + amount, updated_at: nowStr }).eq('id', toId);
      } catch (err) {
        console.error('Supabase account transfer error:', err);
      }
    }
  };

  // =========================================================================
  // CATEGORY OPERATIONS
  // =========================================================================
  const addCategory = async (
    catData: Omit<Category, 'id' | 'created_at'>
  ): Promise<Category> => {
    const id = `cat-${Date.now()}-${Math.random().toString(36).substr(2, 5)}`;
    const nowStr = new Date().toISOString();

    const newCat: Category = {
      ...catData,
      id,
      is_custom: true,
      created_at: nowStr,
    };

    setCategories((prev) => [...prev, newCat]);

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('categories').insert({
          ...newCat,
          user_id: user.id,
        });
      } catch (err) {
        console.error('Supabase category insert error:', err);
      }
    }

    return newCat;
  };

  const updateCategory = async (cat: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('categories').update({ name: cat.name, color: cat.color }).eq('id', cat.id);
      } catch (err) {
        console.error('Supabase category update error:', err);
      }
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

    const supabase = getSupabase();
    if (supabase && user) {
      try {
        await supabase.from('categories').delete().eq('id', id);
      } catch (err) {
        console.error('Supabase category delete error:', err);
      }
    }
  };

  // =========================================================================
  // EXPORT & IMPORT UTILITIES
  // =========================================================================
  const exportToCSV = (type: 'all' | 'transactions' | 'personal' | 'office' | 'income' | 'borrowings' | 'lendings' = 'all') => {
    let rows: string[][] = [];
    let filename = `my_finance_export_${getTodayString()}.csv`;

    if (type === 'all' || type === 'transactions' || type === 'personal' || type === 'office' || type === 'income') {
      rows.push(['ID', 'Date', 'Type', 'Category', 'Description', 'Amount (BDT)', 'Payment Method', 'Account', 'Project', 'Reimbursement Status', 'Reimbursed Amount', 'Notes']);
      
      const filtered = transactions.filter((t) => {
        if (type === 'personal') return t.type === 'personal_expense';
        if (type === 'office') return t.type === 'office_expense';
        if (type === 'income') return t.type === 'income';
        return true;
      });

      filtered.forEach((t) => {
        rows.push([
          t.id,
          t.date,
          t.type,
          `"${(t.category || '').replace(/"/g, '""')}"`,
          `"${(t.description || '').replace(/"/g, '""')}"`,
          String(t.amount),
          `"${t.payment_method}"`,
          `"${t.account_name || ''}"`,
          `"${t.project_name || ''}"`,
          `"${t.reimbursement_status || ''}"`,
          String(t.reimbursed_amount || 0),
          `"${(t.notes || '').replace(/"/g, '""')}"`,
        ]);
      });
    } else if (type === 'borrowings') {
      filename = `borrowings_${getTodayString()}.csv`;
      rows.push(['ID', 'Person Name', 'Phone', 'Borrowed Date', 'Amount (BDT)', 'Repaid Amount', 'Remaining Debt', 'Status', 'Due Date', 'Purpose', 'Notes']);
      borrowings.forEach((b) => {
        rows.push([
          b.id,
          `"${b.person_name}"`,
          b.phone_number || '',
          b.borrowed_date,
          String(b.amount),
          String(b.repaid_amount),
          String(b.amount - b.repaid_amount),
          b.status,
          b.due_date || '',
          `"${(b.purpose || '').replace(/"/g, '""')}"`,
          `"${(b.notes || '').replace(/"/g, '""')}"`,
        ]);
      });
    } else if (type === 'lendings') {
      filename = `lendings_${getTodayString()}.csv`;
      rows.push(['ID', 'Person Name', 'Phone', 'Lending Date', 'Amount Lent (BDT)', 'Collected Amount', 'Remaining Receivable', 'Status', 'Expected Return Date', 'Purpose', 'Notes']);
      lendings.forEach((l) => {
        rows.push([
          l.id,
          `"${l.person_name}"`,
          l.phone_number || '',
          l.lending_date,
          String(l.amount),
          String(l.collected_amount),
          String(l.amount - l.collected_amount),
          l.status,
          l.expected_return_date || '',
          `"${(l.purpose || '').replace(/"/g, '""')}"`,
          `"${(l.notes || '').replace(/"/g, '""')}"`,
        ]);
      });
    }

    const csvContent = 'data:text/csv;charset=utf-8,' + rows.map((e) => e.join(',')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const exportCompleteJSON = (): string => {
    const backup: FinanceDatabaseState = {
      accounts,
      categories,
      transactions,
      borrowings,
      borrowing_repayments: borrowingRepayments,
      lendings,
      lending_collections: lendingCollections,
      office_reimbursements: officeReimbursements,
      transfers,
    };
    return JSON.stringify(backup, null, 2);
  };

  const importJSON = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonStr) as Partial<FinanceDatabaseState>;
      if (!data.transactions || !Array.isArray(data.transactions)) {
        return { success: false, message: 'Invalid backup file: missing transactions array.' };
      }

      if (data.accounts && Array.isArray(data.accounts)) setAccounts(data.accounts);
      if (data.categories && Array.isArray(data.categories)) setCategories(data.categories);
      if (data.transactions && Array.isArray(data.transactions)) setTransactions(data.transactions);
      if (data.borrowings && Array.isArray(data.borrowings)) setBorrowings(data.borrowings);
      if (data.borrowing_repayments && Array.isArray(data.borrowing_repayments))
        setBorrowingRepayments(data.borrowing_repayments);
      if (data.lendings && Array.isArray(data.lendings)) setLendings(data.lendings);
      if (data.lending_collections && Array.isArray(data.lending_collections))
        setLendingCollections(data.lending_collections);
      if (data.office_reimbursements && Array.isArray(data.office_reimbursements))
        setOfficeReimbursements(data.office_reimbursements);
      if (data.transfers && Array.isArray(data.transfers)) setTransfers(data.transfers);

      return {
        success: true,
        message: `Successfully imported ${data.transactions.length} transactions and related financial data!`,
      };
    } catch (err: any) {
      return { success: false, message: `Failed to import JSON: ${err.message}` };
    }
  };

  const syncToSupabase = async (): Promise<{ success: boolean; error?: string }> => {
    const supabase = getSupabase();
    if (!supabase || !user) {
      return { success: false, error: 'Please sign in with a Supabase user account first.' };
    }

    setSyncing(true);
    try {
      // Upsert accounts
      for (const a of accounts) {
        await supabase.from('accounts').upsert({ ...a, user_id: user.id });
      }
      // Upsert categories
      for (const c of categories) {
        await supabase.from('categories').upsert({ ...c, user_id: user.id });
      }
      // Upsert transactions
      for (const t of transactions) {
        await supabase.from('transactions').upsert({ ...t, user_id: user.id });
      }
      // Upsert borrowings
      for (const b of borrowings) {
        await supabase.from('borrowings').upsert({ ...b, user_id: user.id });
      }
      // Upsert repayments
      for (const r of borrowingRepayments) {
        await supabase.from('borrowing_repayments').upsert({ ...r, user_id: user.id });
      }
      // Upsert lendings
      for (const l of lendings) {
        await supabase.from('lendings').upsert({ ...l, user_id: user.id });
      }
      // Upsert collections
      for (const col of lendingCollections) {
        await supabase.from('lending_collections').upsert({ ...col, user_id: user.id });
      }
      // Upsert office reimbursements
      for (const off of officeReimbursements) {
        await supabase.from('office_reimbursements').upsert({ ...off, user_id: user.id });
      }
      // Upsert transfers
      for (const tr of transfers) {
        await supabase.from('account_transfers').upsert({ ...tr, user_id: user.id });
      }

      setSyncing(false);
      return { success: true };
    } catch (err: any) {
      setSyncing(false);
      return { success: false, error: err.message };
    }
  };

  const clearAllData = () => {
    setTransactions([]);
    setBorrowings([]);
    setBorrowingRepayments([]);
    setLendings([]);
    setLendingCollections([]);
    setOfficeReimbursements([]);
    setTransfers([]);
    setAccounts(DEFAULT_ACCOUNTS);
    resetAllDataToClean();
  };

  return (
    <FinanceContext.Provider
      value={{
        accounts,
        categories,
        transactions,
        borrowings,
        borrowingRepayments,
        lendings,
        lendingCollections,
        officeReimbursements,
        transfers,
        summary,
        loading,
        syncing,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBorrowing,
        recordBorrowingRepayment,
        deleteBorrowing,
        addLending,
        recordLendingCollection,
        deleteLending,
        recordOfficeReimbursement,
        addAccount,
        updateAccount,
        deleteAccount,
        transferBetweenAccounts,
        addCategory,
        updateCategory,
        deleteCategory,
        exportToCSV,
        exportCompleteJSON,
        importJSON,
        syncToSupabase,
        refreshData: loadData,
        clearAllData,
      }}
    >
      {children}
    </FinanceContext.Provider>
  );
};

export function useFinance() {
  const context = useContext(FinanceContext);
  if (!context) {
    throw new Error('useFinance must be used within a FinanceProvider');
  }
  return context;
}
