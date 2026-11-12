import React, { createContext, useContext, useEffect, useState, useMemo, useCallback } from 'react';
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
  SalaryAdvance,
  SalaryAdjustment,
  SalaryAdvanceSummary,
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
import {
  generateUUID,
  generateIdempotencyKey,
  enqueueSyncItem,
  getPendingSyncQueue,
  removeQueueItem,
  updateQueueItemStatus,
  cacheStateSnapshot,
  getCachedStateSnapshot,
  OfflineQueueItem,
} from '../lib/indexedDb';
import { useAuth } from './AuthContext';
import { getTodayString } from '../utils/formatters';

export type SyncState = 'online' | 'offline' | 'syncing' | 'pending' | 'failed';

function isValidUUID(val?: string | null): boolean {
  if (!val) return false;
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(val);
}

/**
 * Sanitizes entity payloads before cloud synchronization to ensure
 * strict column adherence with PostgreSQL schema (no client helper fields).
 */
function sanitizeForSupabase(table: string, payload: any, userId: string): any {
  const now = new Date().toISOString();
  switch (table) {
    case 'transactions':
      return {
        id: isValidUUID(payload.id) ? payload.id : generateUUID(),
        user_id: userId,
        date: payload.date || getTodayString(),
        type: payload.type,
        category: payload.category || 'Other',
        description: payload.description || '',
        amount: Number(payload.amount),
        payment_method: payload.payment_method || 'Cash',
        account_id: isValidUUID(payload.account_id) ? payload.account_id : null,
        notes: payload.notes || null,
        receipt_url: payload.receipt_url || null,
        project_name: payload.project_name || null,
        reimbursement_status: payload.reimbursement_status || 'Not Submitted',
        reimbursed_amount: Number(payload.reimbursed_amount || 0),
        created_at: payload.created_at || now,
        updated_at: payload.updated_at || now,
      };
    case 'borrowings':
      return {
        id: isValidUUID(payload.id) ? payload.id : generateUUID(),
        user_id: userId,
        person_name: payload.person_name || '',
        phone_number: payload.phone_number || null,
        borrowed_date: payload.borrowed_date || getTodayString(),
        amount: Number(payload.amount),
        purpose: payload.purpose || null,
        due_date: payload.due_date || null,
        notes: payload.notes || null,
        repaid_amount: Number(payload.repaid_amount || 0),
        status: payload.status || 'Unpaid',
        created_at: payload.created_at || now,
        updated_at: payload.updated_at || now,
      };
    case 'borrowing_repayments':
      return {
        id: isValidUUID(payload.id) ? payload.id : generateUUID(),
        borrowing_id: isValidUUID(payload.borrowing_id) ? payload.borrowing_id : generateUUID(),
        user_id: userId,
        payment_date: payload.payment_date || getTodayString(),
        amount: Number(payload.amount),
        payment_method: payload.payment_method || 'Cash',
        account_id: isValidUUID(payload.account_id) ? payload.account_id : null,
        notes: payload.notes || null,
        created_at: payload.created_at || now,
      };
    case 'lendings':
      return {
        id: isValidUUID(payload.id) ? payload.id : generateUUID(),
        user_id: userId,
        person_name: payload.person_name || '',
        phone_number: payload.phone_number || null,
        lending_date: payload.lending_date || getTodayString(),
        amount: Number(payload.amount),
        purpose: payload.purpose || null,
        expected_return_date: payload.expected_return_date || null,
        notes: payload.notes || null,
        collected_amount: Number(payload.collected_amount || 0),
        status: payload.status || 'Uncollected',
        created_at: payload.created_at || now,
        updated_at: payload.updated_at || now,
      };
    case 'lending_collections':
      return {
        id: isValidUUID(payload.id) ? payload.id : generateUUID(),
        lending_id: isValidUUID(payload.lending_id) ? payload.lending_id : generateUUID(),
        user_id: userId,
        collection_date: payload.collection_date || getTodayString(),
        amount: Number(payload.amount),
        payment_method: payload.payment_method || 'Cash',
        account_id: isValidUUID(payload.account_id) ? payload.account_id : null,
        notes: payload.notes || null,
        created_at: payload.created_at || now,
      };
    case 'office_reimbursements':
      return {
        id: isValidUUID(payload.id) ? payload.id : generateUUID(),
        transaction_id: isValidUUID(payload.transaction_id) ? payload.transaction_id : generateUUID(),
        user_id: userId,
        reimbursement_date: payload.reimbursement_date || getTodayString(),
        amount: Number(payload.amount),
        payment_method: payload.payment_method || 'Cash',
        account_id: isValidUUID(payload.account_id) ? payload.account_id : null,
        notes: payload.notes || null,
        created_at: payload.created_at || now,
      };
    case 'account_transfers':
      return {
        id: isValidUUID(payload.id) ? payload.id : generateUUID(),
        user_id: userId,
        transfer_date: payload.transfer_date || getTodayString(),
        from_account_id: isValidUUID(payload.from_account_id) ? payload.from_account_id : generateUUID(),
        to_account_id: isValidUUID(payload.to_account_id) ? payload.to_account_id : generateUUID(),
        amount: Number(payload.amount),
        notes: payload.notes || null,
        created_at: payload.created_at || now,
      };
    case 'accounts':
      return {
        id: isValidUUID(payload.id) ? payload.id : generateUUID(),
        user_id: userId,
        name: payload.name,
        type: payload.type || 'Cash Wallet',
        balance: Number(payload.balance || 0),
        account_number: payload.account_number || null,
        is_default: Boolean(payload.is_default),
        created_at: payload.created_at || now,
        updated_at: payload.updated_at || now,
      };
    case 'categories':
      return {
        id: isValidUUID(payload.id) ? payload.id : generateUUID(),
        user_id: userId,
        name: payload.name,
        type: payload.type,
        icon: payload.icon || null,
        color: payload.color || null,
        is_custom: Boolean(payload.is_custom),
        created_at: payload.created_at || now,
      };
    default:
      return { ...payload, user_id: userId };
  }
}

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
  syncState: SyncState;
  pendingSyncCount: number;
  syncError?: string;

  // Transaction operations
  addTransaction: (tx: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>) => Promise<Transaction>;
  updateTransaction: (tx: Transaction) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;

  // Borrowing operations
  addBorrowing: (b: Omit<Borrowing, 'id' | 'repaid_amount' | 'status' | 'created_at' | 'updated_at'>) => Promise<Borrowing>;
  updateBorrowing: (b: Borrowing) => Promise<void>;
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
  updateLending: (l: Lending) => Promise<void>;
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

  // Salary Advance operations
  salaryAdvances: SalaryAdvance[];
  salaryAdjustments: SalaryAdjustment[];
  salaryAdvanceSummary: SalaryAdvanceSummary;
  addSalaryAdvance: (data: Omit<SalaryAdvance, 'id' | 'created_at' | 'updated_at'>) => Promise<SalaryAdvance>;
  updateSalaryAdvance: (adv: SalaryAdvance) => Promise<void>;
  deleteSalaryAdvance: (id: string) => Promise<void>;
  recordSalaryAdjustment: (adj: Omit<SalaryAdjustment, 'id' | 'created_at'>) => Promise<SalaryAdjustment>;
  deleteSalaryAdjustment: (id: string) => Promise<void>;

  // Import / Export & Sync
  exportToCSV: (type?: 'all' | 'transactions' | 'personal' | 'office' | 'income' | 'borrowings' | 'lendings') => void;
  exportCompleteJSON: () => string;
  importJSON: (jsonStr: string) => { success: boolean; message: string };
  syncToSupabase: () => Promise<{ success: boolean; error?: string }>;
  processPendingOfflineQueue: () => Promise<void>;
  refreshData: () => Promise<void>;
  clearAllData: () => void;
}

const FinanceContext = createContext<FinanceContextType | undefined>(undefined);

export const FinanceProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [isOnline, setIsOnline] = useState(typeof navigator !== 'undefined' ? navigator.onLine : true);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const [syncError, setSyncError] = useState<string | undefined>(undefined);

  const [accounts, setAccounts] = useState<Account[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [borrowings, setBorrowings] = useState<Borrowing[]>([]);
  const [borrowingRepayments, setBorrowingRepayments] = useState<BorrowingRepayment[]>([]);
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [lendingCollections, setLendingCollections] = useState<LendingCollection[]>([]);
  const [officeReimbursements, setOfficeReimbursements] = useState<OfficeReimbursement[]>([]);
  const [transfers, setTransfers] = useState<AccountTransfer[]>([]);
  const [salaryAdvances, setSalaryAdvances] = useState<SalaryAdvance[]>([]);
  const [salaryAdjustments, setSalaryAdjustments] = useState<SalaryAdjustment[]>([]);

  // Connectivity tracking
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      processPendingOfflineQueue();
    };
    const handleOffline = () => {
      setIsOnline(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Update pending queue count
  const refreshPendingCount = useCallback(async () => {
    try {
      const queue = await getPendingSyncQueue();
      setPendingSyncCount(queue.length);
    } catch {
      setPendingSyncCount(0);
    }
  }, []);

  // Load initial data safely from IndexedDB / LocalStorage / Supabase
  const loadData = async () => {
    setLoading(true);
    setSyncError(undefined);

    // 1. Initial hydrate from durable IndexedDB snapshot or LocalStorage
    let initialLoaded = false;
    try {
      const cached = await getCachedStateSnapshot<FinanceDatabaseState>('primary_finance_state');
      if (cached && cached.accounts && cached.accounts.length > 0) {
        setAccounts(cached.accounts);
        setCategories(cached.categories || DEFAULT_CATEGORIES);
        setTransactions(cached.transactions || []);
        setBorrowings(cached.borrowings || []);
        setBorrowingRepayments(cached.borrowing_repayments || []);
        setLendings(cached.lendings || []);
        setLendingCollections(cached.lending_collections || []);
        setOfficeReimbursements(cached.office_reimbursements || []);
        setTransfers(cached.transfers || []);
        setSalaryAdvances(cached.salary_advances || []);
        setSalaryAdjustments(cached.salary_adjustments || []);
        initialLoaded = true;
      }
    } catch (e) {
      console.debug('IndexedDB initial snapshot miss:', e);
    }

    if (!initialLoaded) {
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
      setSalaryAdvances(local.salary_advances || []);
      setSalaryAdjustments(local.salary_adjustments || []);
    }

    await refreshPendingCount();

    // 2. If online and Supabase is configured with user, pull cloud records safely
    const supabase = getSupabase();
    if (supabase && user && navigator.onLine) {
      try {
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

        if (accData && accData.length > 0) setAccounts(accData);
        if (catData && catData.length > 0) setCategories(catData);
        if (txData) setTransactions(txData);
        if (borData) setBorrowings(borData);
        if (borRepData) setBorrowingRepayments(borRepData);
        if (lenData) setLendings(lenData);
        if (lenColData) setLendingCollections(lenColData);
        if (offReimbData) setOfficeReimbursements(offReimbData);
        if (trData) setTransfers(trData);
      } catch (e: any) {
        console.warn('Error fetching from Supabase, using local state:', e);
      }
    }

    setLoading(false);
  };

  useEffect(() => {
    loadData();
  }, [user]);

  // Persist state to both LocalStorage and IndexedDB snapshots
  useEffect(() => {
    if (!loading) {
      const stateToPersist: FinanceDatabaseState = {
        accounts,
        categories,
        transactions,
        borrowings,
        borrowing_repayments: borrowingRepayments,
        lendings,
        lending_collections: lendingCollections,
        office_reimbursements: officeReimbursements,
        transfers,
        salary_advances: salaryAdvances,
        salary_adjustments: salaryAdjustments,
      };

      saveLocalData(stateToPersist);
      cacheStateSnapshot('primary_finance_state', stateToPersist).catch(() => {});
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
    salaryAdvances,
    salaryAdjustments,
    loading,
  ]);

  // -------------------------------------------------------------------------
  // Safe Offline Queue Processor
  // Processes pending offline sync records sequentially without duplicates
  // -------------------------------------------------------------------------
  const processPendingOfflineQueue = useCallback(async () => {
    const supabase = getSupabase();
    if (!supabase || !user || !navigator.onLine) return;

    const queue: OfflineQueueItem[] = await getPendingSyncQueue();
    if (queue.length === 0) {
      setPendingSyncCount(0);
      return;
    }

    setSyncing(true);
    setSyncError(undefined);

    for (const item of queue) {
      if (!item.queue_id) continue;
      try {
        await updateQueueItemStatus(item.queue_id, 'syncing');

        const table =
          item.entity_type === 'transaction'
            ? 'transactions'
            : item.entity_type === 'borrowing'
            ? 'borrowings'
            : item.entity_type === 'lending'
            ? 'lendings'
            : item.entity_type === 'repayment'
            ? 'borrowing_repayments'
            : item.entity_type === 'collection'
            ? 'lending_collections'
            : item.entity_type === 'reimbursement'
            ? 'office_reimbursements'
            : item.entity_type === 'account'
            ? 'accounts'
            : item.entity_type === 'category'
            ? 'categories'
            : 'account_transfers';

        if (item.action === 'insert' || item.action === 'update') {
          const sanitized = sanitizeForSupabase(table, item.payload, user.id);
          await supabase.from(table).upsert(sanitized);
        } else if (item.action === 'delete') {
          if (isValidUUID(item.record_id)) {
            await supabase.from(table).delete().eq('id', item.record_id);
          }
        }

        // Successfully synced
        await removeQueueItem(item.queue_id);
      } catch (err: any) {
        console.warn(`Sync failed for queue item ${item.queue_id}:`, err);
        await updateQueueItemStatus(item.queue_id, 'failed', err?.message || 'Sync error');
        setSyncError(err?.message || 'Sync encountered an error');
      }
    }

    setSyncing(false);
    await refreshPendingCount();
  }, [user, refreshPendingCount]);

  // Derive SyncState
  const syncState: SyncState = useMemo(() => {
    if (!isOnline) return 'offline';
    if (syncing) return 'syncing';
    if (syncError) return 'failed';
    if (pendingSyncCount > 0) return 'pending';
    return 'online';
  }, [isOnline, syncing, syncError, pendingSyncCount]);

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

    const pendingOfficeReimbursement = Math.max(0, totalOfficeExpenses - officeReimbursedAmount);

    let totalBorrowed = 0;
    let totalBorrowedRepaid = 0;
    borrowings.forEach((b) => {
      totalBorrowed += Number(b.amount);
      totalBorrowedRepaid += Number(b.repaid_amount || 0);
    });
    const amountIOwe = Math.max(0, totalBorrowed - totalBorrowedRepaid);

    let totalLent = 0;
    let totalLentCollected = 0;
    lendings.forEach((l) => {
      totalLent += Number(l.amount);
      totalLentCollected += Number(l.collected_amount || 0);
    });
    const amountOwedToMe = Math.max(0, totalLent - totalLentCollected);

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
  // SALARY ADVANCE & ADJUSTMENT SUMMARY (Isolated from income & office expense)
  // =========================================================================
  const salaryAdvanceSummary = useMemo<SalaryAdvanceSummary>(() => {
    let totalAdvanceReceived = 0;
    let totalSalaryAdjusted = 0;

    salaryAdvances.forEach((adv) => {
      totalAdvanceReceived += Number(adv.amount || 0);
    });

    salaryAdjustments.forEach((adj) => {
      totalSalaryAdjusted += Number(adj.amount || 0);
    });

    const outstandingAdvance = Math.max(0, totalAdvanceReceived - totalSalaryAdjusted);

    return {
      totalAdvanceReceived,
      totalSalaryAdjusted,
      outstandingAdvance,
    };
  }, [salaryAdvances, salaryAdjustments]);

  // =========================================================================
  // TRANSACTION OPERATIONS (Client UUID + Idempotency + Offline Queue)
  // =========================================================================
  const addTransaction = async (
    txData: Omit<Transaction, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Transaction> => {
    const id = generateUUID();
    const nowStr = new Date().toISOString();
    const idemKey = generateIdempotencyKey('tx', id);

    const isConnected = navigator.onLine && Boolean(getSupabase() && user);

    const newTx: Transaction = {
      ...txData,
      id,
      reimbursed_amount: txData.reimbursed_amount || 0,
      reimbursement_status:
        txData.type === 'office_expense' ? txData.reimbursement_status || 'Not Submitted' : undefined,
      sync_status: isConnected ? 'synced' : 'pending',
      idempotency_key: idemKey,
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

    // Handle Cloud or Offline Queue
    const supabase = getSupabase();
    if (isConnected && supabase && user) {
      try {
        const sanitized = sanitizeForSupabase('transactions', newTx, user.id);
        await supabase.from('transactions').insert(sanitized);

        if (newTx.account_id && isValidUUID(newTx.account_id)) {
          const acc = accounts.find((a) => a.id === newTx.account_id);
          if (acc) {
            const newBal = acc.balance + (newTx.type === 'income' ? newTx.amount : -newTx.amount);
            await supabase.from('accounts').update({ balance: newBal, updated_at: nowStr }).eq('id', acc.id);
          }
        }
      } catch (err) {
        console.warn('Online insert failed, queuing offline:', err);
        await enqueueSyncItem({
          idempotency_key: idemKey,
          entity_type: 'transaction',
          action: 'insert',
          record_id: id,
          payload: newTx,
          status: 'pending',
        });
        await refreshPendingCount();
      }
    } else {
      // Store in offline sync queue
      await enqueueSyncItem({
        idempotency_key: idemKey,
        entity_type: 'transaction',
        action: 'insert',
        record_id: id,
        payload: newTx,
        status: 'pending',
      });
      await refreshPendingCount();
    }

    return newTx;
  };

  const updateTransaction = async (updatedTx: Transaction) => {
    const existing = transactions.find((t) => t.id === updatedTx.id);
    const nowStr = new Date().toISOString();
    const txWithTs: Transaction = {
      ...updatedTx,
      sync_status: navigator.onLine ? 'synced' : 'pending',
      updated_at: nowStr,
    };

    if (existing) {
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
    if (navigator.onLine && supabase && user) {
      try {
        const sanitized = sanitizeForSupabase('transactions', txWithTs, user.id);
        await supabase.from('transactions').update(sanitized).eq('id', updatedTx.id);
      } catch (err) {
        console.warn('Update online failed, queuing:', err);
        await enqueueSyncItem({
          idempotency_key: generateIdempotencyKey('tx_upd', updatedTx.id),
          entity_type: 'transaction',
          action: 'update',
          record_id: updatedTx.id,
          payload: txWithTs,
          status: 'pending',
        });
        await refreshPendingCount();
      }
    } else {
      await enqueueSyncItem({
        idempotency_key: generateIdempotencyKey('tx_upd', updatedTx.id),
        entity_type: 'transaction',
        action: 'update',
        record_id: updatedTx.id,
        payload: txWithTs,
        status: 'pending',
      });
      await refreshPendingCount();
    }
  };

  const deleteTransaction = async (id: string) => {
    const target = transactions.find((t) => t.id === id);
    if (!target) return;
    const nowStr = new Date().toISOString();

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
    if (navigator.onLine && supabase && user) {
      try {
        if (isValidUUID(id)) {
          await supabase.from('transactions').delete().eq('id', id);
        }
      } catch (err) {
        await enqueueSyncItem({
          idempotency_key: generateIdempotencyKey('tx_del', id),
          entity_type: 'transaction',
          action: 'delete',
          record_id: id,
          payload: { id },
          status: 'pending',
        });
        await refreshPendingCount();
      }
    } else {
      await enqueueSyncItem({
        idempotency_key: generateIdempotencyKey('tx_del', id),
        entity_type: 'transaction',
        action: 'delete',
        record_id: id,
        payload: { id },
        status: 'pending',
      });
      await refreshPendingCount();
    }
  };

  // =========================================================================
  // BORROWING OPERATIONS (Liabilities)
  // =========================================================================
  const addBorrowing = async (
    bData: Omit<Borrowing, 'id' | 'repaid_amount' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<Borrowing> => {
    const id = generateUUID();
    const nowStr = new Date().toISOString();
    const idemKey = generateIdempotencyKey('bor', id);

    const newBorrowing: Borrowing = {
      ...bData,
      id,
      repaid_amount: 0,
      status: 'Unpaid',
      sync_status: navigator.onLine ? 'synced' : 'pending',
      idempotency_key: idemKey,
      created_at: nowStr,
      updated_at: nowStr,
    };

    setBorrowings((prev) => [newBorrowing, ...prev]);

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        const sanitized = sanitizeForSupabase('borrowings', newBorrowing, user.id);
        await supabase.from('borrowings').insert(sanitized);
      } catch (err) {
        await enqueueSyncItem({
          idempotency_key: idemKey,
          entity_type: 'borrowing',
          action: 'insert',
          record_id: id,
          payload: newBorrowing,
          status: 'pending',
        });
        await refreshPendingCount();
      }
    } else {
      await enqueueSyncItem({
        idempotency_key: idemKey,
        entity_type: 'borrowing',
        action: 'insert',
        record_id: id,
        payload: newBorrowing,
        status: 'pending',
      });
      await refreshPendingCount();
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

    const repId = generateUUID();
    const nowStr = new Date().toISOString();
    const idemKey = generateIdempotencyKey('rep', repId);

    const newRepayment: BorrowingRepayment = {
      id: repId,
      borrowing_id: borrowingId,
      payment_date: getTodayString(),
      amount,
      payment_method: paymentMethod,
      account_id: accountId,
      notes,
      sync_status: navigator.onLine ? 'synced' : 'pending',
      idempotency_key: idemKey,
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

    if (accountId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, balance: acc.balance - amount, updated_at: nowStr } : acc
        )
      );
    }

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        const sanitized = sanitizeForSupabase('borrowing_repayments', newRepayment, user.id);
        await supabase.from('borrowing_repayments').insert(sanitized);

        if (isValidUUID(borrowingId)) {
          await supabase
            .from('borrowings')
            .update({ repaid_amount: newRepaidAmount, status: newStatus, updated_at: nowStr })
            .eq('id', borrowingId);
        }
      } catch {
        await enqueueSyncItem({
          idempotency_key: idemKey,
          entity_type: 'repayment',
          action: 'insert',
          record_id: repId,
          payload: newRepayment,
          status: 'pending',
        });
        await refreshPendingCount();
      }
    } else {
      await enqueueSyncItem({
        idempotency_key: idemKey,
        entity_type: 'repayment',
        action: 'insert',
        record_id: repId,
        payload: newRepayment,
        status: 'pending',
      });
      await refreshPendingCount();
    }
  };

  const updateBorrowing = async (b: Borrowing) => {
    const nowStr = new Date().toISOString();
    const repaid = Number(b.repaid_amount || 0);
    const amount = Number(b.amount || 0);
    const newStatus: Borrowing['status'] =
      repaid >= amount ? 'Fully Repaid' : repaid > 0 ? 'Partially Repaid' : 'Unpaid';

    const updated: Borrowing = {
      ...b,
      amount,
      repaid_amount: repaid,
      status: newStatus,
      updated_at: nowStr,
    };

    setBorrowings((prev) => prev.map((item) => (item.id === b.id ? updated : item)));

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user && isValidUUID(b.id)) {
      try {
        const sanitized = sanitizeForSupabase('borrowings', updated, user.id);
        await supabase.from('borrowings').update(sanitized).eq('id', b.id);
      } catch (err) {
        console.debug('Borrowing update fallback:', err);
      }
    }
  };

  const deleteBorrowing = async (id: string) => {
    setBorrowings((prev) => prev.filter((b) => b.id !== id));
    setBorrowingRepayments((prev) => prev.filter((r) => r.borrowing_id !== id));

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        if (isValidUUID(id)) {
          await supabase.from('borrowings').delete().eq('id', id);
        }
      } catch {
        await enqueueSyncItem({
          idempotency_key: generateIdempotencyKey('bor_del', id),
          entity_type: 'borrowing',
          action: 'delete',
          record_id: id,
          payload: { id },
          status: 'pending',
        });
        await refreshPendingCount();
      }
    }
  };

  // =========================================================================
  // LENDING OPERATIONS (Receivables)
  // =========================================================================
  const addLending = async (
    lData: Omit<Lending, 'id' | 'collected_amount' | 'status' | 'created_at' | 'updated_at'>
  ): Promise<Lending> => {
    const id = generateUUID();
    const nowStr = new Date().toISOString();
    const idemKey = generateIdempotencyKey('len', id);

    const newLending: Lending = {
      ...lData,
      id,
      collected_amount: 0,
      status: 'Uncollected',
      sync_status: navigator.onLine ? 'synced' : 'pending',
      idempotency_key: idemKey,
      created_at: nowStr,
      updated_at: nowStr,
    };

    setLendings((prev) => [newLending, ...prev]);

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        const sanitized = sanitizeForSupabase('lendings', newLending, user.id);
        await supabase.from('lendings').insert(sanitized);
      } catch {
        await enqueueSyncItem({
          idempotency_key: idemKey,
          entity_type: 'lending',
          action: 'insert',
          record_id: id,
          payload: newLending,
          status: 'pending',
        });
        await refreshPendingCount();
      }
    } else {
      await enqueueSyncItem({
        idempotency_key: idemKey,
        entity_type: 'lending',
        action: 'insert',
        record_id: id,
        payload: newLending,
        status: 'pending',
      });
      await refreshPendingCount();
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

    const colId = generateUUID();
    const nowStr = new Date().toISOString();
    const idemKey = generateIdempotencyKey('col', colId);

    const newCollection: LendingCollection = {
      id: colId,
      lending_id: lendingId,
      collection_date: getTodayString(),
      amount,
      payment_method: paymentMethod,
      account_id: accountId,
      notes,
      sync_status: navigator.onLine ? 'synced' : 'pending',
      idempotency_key: idemKey,
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

    if (accountId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, balance: acc.balance + amount, updated_at: nowStr } : acc
        )
      );
    }

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        const sanitized = sanitizeForSupabase('lending_collections', newCollection, user.id);
        await supabase.from('lending_collections').insert(sanitized);

        if (isValidUUID(lendingId)) {
          await supabase
            .from('lendings')
            .update({ collected_amount: newCollectedAmount, status: newStatus, updated_at: nowStr })
            .eq('id', lendingId);
        }
      } catch {
        await enqueueSyncItem({
          idempotency_key: idemKey,
          entity_type: 'collection',
          action: 'insert',
          record_id: colId,
          payload: newCollection,
          status: 'pending',
        });
        await refreshPendingCount();
      }
    } else {
      await enqueueSyncItem({
        idempotency_key: idemKey,
        entity_type: 'collection',
        action: 'insert',
        record_id: colId,
        payload: newCollection,
        status: 'pending',
      });
      await refreshPendingCount();
    }
  };

  const updateLending = async (l: Lending) => {
    const nowStr = new Date().toISOString();
    const collected = Number(l.collected_amount || 0);
    const amount = Number(l.amount || 0);
    const newStatus: Lending['status'] =
      collected >= amount ? 'Fully Collected' : collected > 0 ? 'Partially Collected' : 'Uncollected';

    const updated: Lending = {
      ...l,
      amount,
      collected_amount: collected,
      status: newStatus,
      updated_at: nowStr,
    };

    setLendings((prev) => prev.map((item) => (item.id === l.id ? updated : item)));

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user && isValidUUID(l.id)) {
      try {
        const sanitized = sanitizeForSupabase('lendings', updated, user.id);
        await supabase.from('lendings').update(sanitized).eq('id', l.id);
      } catch (err) {
        console.debug('Lending update fallback:', err);
      }
    }
  };

  const deleteLending = async (id: string) => {
    setLendings((prev) => prev.filter((l) => l.id !== id));
    setLendingCollections((prev) => prev.filter((c) => c.lending_id !== id));

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        if (isValidUUID(id)) {
          await supabase.from('lendings').delete().eq('id', id);
        }
      } catch {
        await enqueueSyncItem({
          idempotency_key: generateIdempotencyKey('len_del', id),
          entity_type: 'lending',
          action: 'delete',
          record_id: id,
          payload: { id },
          status: 'pending',
        });
        await refreshPendingCount();
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

    const reimbId = generateUUID();
    const nowStr = new Date().toISOString();
    const idemKey = generateIdempotencyKey('reimb', reimbId);

    const newReimb: OfficeReimbursement = {
      id: reimbId,
      transaction_id: transactionId,
      reimbursement_date: getTodayString(),
      amount,
      payment_method: paymentMethod,
      account_id: accountId,
      notes,
      sync_status: navigator.onLine ? 'synced' : 'pending',
      idempotency_key: idemKey,
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

    if (accountId) {
      setAccounts((prev) =>
        prev.map((acc) =>
          acc.id === accountId ? { ...acc, balance: acc.balance + amount, updated_at: nowStr } : acc
        )
      );
    }

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        const sanitized = sanitizeForSupabase('office_reimbursements', newReimb, user.id);
        await supabase.from('office_reimbursements').insert(sanitized);

        if (isValidUUID(transactionId)) {
          await supabase
            .from('transactions')
            .update({
              reimbursed_amount: newReimbursedAmount,
              reimbursement_status: newStatus,
              updated_at: nowStr,
            })
            .eq('id', transactionId);
        }
      } catch {
        await enqueueSyncItem({
          idempotency_key: idemKey,
          entity_type: 'reimbursement',
          action: 'insert',
          record_id: reimbId,
          payload: newReimb,
          status: 'pending',
        });
        await refreshPendingCount();
      }
    } else {
      await enqueueSyncItem({
        idempotency_key: idemKey,
        entity_type: 'reimbursement',
        action: 'insert',
        record_id: reimbId,
        payload: newReimb,
        status: 'pending',
      });
      await refreshPendingCount();
    }
  };

  // =========================================================================
  // ACCOUNT & TRANSFER OPERATIONS
  // =========================================================================
  const addAccount = async (
    accData: Omit<Account, 'id' | 'created_at' | 'updated_at'>
  ): Promise<Account> => {
    const id = generateUUID();
    const nowStr = new Date().toISOString();

    const newAccount: Account = {
      ...accData,
      id,
      created_at: nowStr,
      updated_at: nowStr,
    };

    setAccounts((prev) => [...prev, newAccount]);

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        const sanitized = sanitizeForSupabase('accounts', newAccount, user.id);
        await supabase.from('accounts').insert(sanitized);
      } catch {
        // Fallback to local
      }
    }

    return newAccount;
  };

  const updateAccount = async (acc: Account) => {
    const nowStr = new Date().toISOString();
    const updated = { ...acc, updated_at: nowStr };

    setAccounts((prev) => prev.map((a) => (a.id === acc.id ? updated : a)));

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        if (isValidUUID(acc.id)) {
          const sanitized = sanitizeForSupabase('accounts', updated, user.id);
          await supabase.from('accounts').update(sanitized).eq('id', acc.id);
        }
      } catch {
        // Fallback to local
      }
    }
  };

  const deleteAccount = async (id: string) => {
    setAccounts((prev) => prev.filter((a) => a.id !== id));

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        if (isValidUUID(id)) {
          await supabase.from('accounts').delete().eq('id', id);
        }
      } catch {
        // Fallback to local
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

    const trId = generateUUID();
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
    if (navigator.onLine && supabase && user) {
      try {
        const sanitized = sanitizeForSupabase('account_transfers', transferRecord, user.id);
        await supabase.from('account_transfers').insert(sanitized);

        if (isValidUUID(fromId)) {
          await supabase.from('accounts').update({ balance: fromAcc.balance - amount, updated_at: nowStr }).eq('id', fromId);
        }
        if (isValidUUID(toId)) {
          await supabase.from('accounts').update({ balance: toAcc.balance + amount, updated_at: nowStr }).eq('id', toId);
        }
      } catch {
        // Fallback to local
      }
    }
  };

  // =========================================================================
  // CATEGORY OPERATIONS
  // =========================================================================
  const addCategory = async (
    catData: Omit<Category, 'id' | 'created_at'>
  ): Promise<Category> => {
    const id = generateUUID();
    const nowStr = new Date().toISOString();

    const newCat: Category = {
      ...catData,
      id,
      is_custom: true,
      created_at: nowStr,
    };

    setCategories((prev) => [...prev, newCat]);

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        const sanitized = sanitizeForSupabase('categories', newCat, user.id);
        await supabase.from('categories').insert(sanitized);
      } catch {
        // Fallback to local
      }
    }

    return newCat;
  };

  const updateCategory = async (cat: Category) => {
    setCategories((prev) => prev.map((c) => (c.id === cat.id ? cat : c)));

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        if (isValidUUID(cat.id)) {
          await supabase.from('categories').update({ name: cat.name, color: cat.color }).eq('id', cat.id);
        }
      } catch {
        // Fallback to local
      }
    }
  };

  const deleteCategory = async (id: string) => {
    setCategories((prev) => prev.filter((c) => c.id !== id));

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        if (isValidUUID(id)) {
          await supabase.from('categories').delete().eq('id', id);
        }
      } catch {
        // Fallback to local
      }
    }
  };

  // =========================================================================
  // SALARY ADVANCE & ADJUSTMENT OPERATIONS
  // =========================================================================
  const addSalaryAdvance = async (
    data: Omit<SalaryAdvance, 'id' | 'created_at' | 'updated_at'>
  ): Promise<SalaryAdvance> => {
    const id = generateUUID();
    const nowStr = new Date().toISOString();
    const newAdv: SalaryAdvance = {
      ...data,
      id,
      amount: Number(data.amount),
      created_at: nowStr,
      updated_at: nowStr,
      sync_status: 'synced',
    };
    setSalaryAdvances((prev) => [newAdv, ...prev]);

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        await supabase.from('salary_advances').insert({
          id: newAdv.id,
          user_id: user.id,
          amount: newAdv.amount,
          date: newAdv.date,
          purpose: newAdv.purpose,
          received_from: newAdv.received_from,
          payment_method: newAdv.payment_method,
          created_at: newAdv.created_at,
          updated_at: newAdv.updated_at,
        });
      } catch (err) {
        console.debug('Supabase salary_advances insert fallback to local:', err);
      }
    }

    return newAdv;
  };

  const updateSalaryAdvance = async (adv: SalaryAdvance): Promise<void> => {
    const nowStr = new Date().toISOString();
    const updated: SalaryAdvance = {
      ...adv,
      amount: Number(adv.amount),
      updated_at: nowStr,
    };
    setSalaryAdvances((prev) =>
      prev.map((item) => (item.id === adv.id ? updated : item))
    );

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user && isValidUUID(adv.id)) {
      try {
        await supabase
          .from('salary_advances')
          .update({
            amount: updated.amount,
            date: updated.date,
            purpose: updated.purpose,
            received_from: updated.received_from,
            payment_method: updated.payment_method,
            updated_at: nowStr,
          })
          .eq('id', adv.id);
      } catch (err) {
        console.debug('Supabase salary_advances update fallback to local:', err);
      }
    }
  };

  const deleteSalaryAdvance = async (id: string): Promise<void> => {
    setSalaryAdvances((prev) => prev.filter((item) => item.id !== id));

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user && isValidUUID(id)) {
      try {
        await supabase.from('salary_advances').delete().eq('id', id);
      } catch (err) {
        console.debug('Supabase salary_advances delete fallback to local:', err);
      }
    }
  };

  const recordSalaryAdjustment = async (
    adj: Omit<SalaryAdjustment, 'id' | 'created_at'>
  ): Promise<SalaryAdjustment> => {
    const id = generateUUID();
    const nowStr = new Date().toISOString();
    const newAdj: SalaryAdjustment = {
      ...adj,
      id,
      amount: Number(adj.amount),
      created_at: nowStr,
      sync_status: 'synced',
    };
    setSalaryAdjustments((prev) => [newAdj, ...prev]);

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user) {
      try {
        await supabase.from('salary_adjustments').insert({
          id: newAdj.id,
          user_id: user.id,
          salary_month: newAdj.salary_month,
          adjustment_date: newAdj.adjustment_date,
          amount: newAdj.amount,
          notes: newAdj.notes,
          created_at: newAdj.created_at,
        });
      } catch (err) {
        console.debug('Supabase salary_adjustments insert fallback to local:', err);
      }
    }

    return newAdj;
  };

  const deleteSalaryAdjustment = async (id: string): Promise<void> => {
    setSalaryAdjustments((prev) => prev.filter((item) => item.id !== id));

    const supabase = getSupabase();
    if (navigator.onLine && supabase && user && isValidUUID(id)) {
      try {
        await supabase.from('salary_adjustments').delete().eq('id', id);
      } catch (err) {
        console.debug('Supabase salary_adjustments delete fallback to local:', err);
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
      salary_advances: salaryAdvances,
      salary_adjustments: salaryAdjustments,
    };
    return JSON.stringify(backup, null, 2);
  };

  /**
   * Safe, non-destructive restoration that merges backup records
   * without overwriting or duplicating existing data.
   */
  const importJSON = (jsonStr: string): { success: boolean; message: string } => {
    try {
      const data = JSON.parse(jsonStr) as Partial<FinanceDatabaseState>;
      if (!data || typeof data !== 'object') {
        return { success: false, message: 'Invalid backup file: not a JSON object.' };
      }
      if (!data.transactions && !data.accounts && !data.categories) {
        return { success: false, message: 'Invalid backup format: missing financial stores.' };
      }

      let addedTxCount = 0;
      if (data.transactions && Array.isArray(data.transactions)) {
        setTransactions((prev) => {
          const existingIds = new Set(prev.map((t) => t.id));
          const newOnes = data.transactions!.filter((t) => t && t.id && !existingIds.has(t.id));
          addedTxCount = newOnes.length;
          return [...newOnes, ...prev];
        });
      }

      let addedBorrowingCount = 0;
      if (data.borrowings && Array.isArray(data.borrowings)) {
        setBorrowings((prev) => {
          const existingIds = new Set(prev.map((b) => b.id));
          const newOnes = data.borrowings!.filter((b) => b && b.id && !existingIds.has(b.id));
          addedBorrowingCount = newOnes.length;
          return [...newOnes, ...prev];
        });
      }

      let addedLendingCount = 0;
      if (data.lendings && Array.isArray(data.lendings)) {
        setLendings((prev) => {
          const existingIds = new Set(prev.map((l) => l.id));
          const newOnes = data.lendings!.filter((l) => l && l.id && !existingIds.has(l.id));
          addedLendingCount = newOnes.length;
          return [...newOnes, ...prev];
        });
      }

      if (data.borrowing_repayments && Array.isArray(data.borrowing_repayments)) {
        setBorrowingRepayments((prev) => {
          const existingIds = new Set(prev.map((r) => r.id));
          const newOnes = data.borrowing_repayments!.filter((r) => r && r.id && !existingIds.has(r.id));
          return [...newOnes, ...prev];
        });
      }

      if (data.lending_collections && Array.isArray(data.lending_collections)) {
        setLendingCollections((prev) => {
          const existingIds = new Set(prev.map((c) => c.id));
          const newOnes = data.lending_collections!.filter((c) => c && c.id && !existingIds.has(c.id));
          return [...newOnes, ...prev];
        });
      }

      if (data.office_reimbursements && Array.isArray(data.office_reimbursements)) {
        setOfficeReimbursements((prev) => {
          const existingIds = new Set(prev.map((o) => o.id));
          const newOnes = data.office_reimbursements!.filter((o) => o && o.id && !existingIds.has(o.id));
          return [...newOnes, ...prev];
        });
      }

      if (data.salary_advances && Array.isArray(data.salary_advances)) {
        setSalaryAdvances((prev) => {
          const existingIds = new Set(prev.map((s) => s.id));
          const newOnes = data.salary_advances!.filter((s) => s && s.id && !existingIds.has(s.id));
          return [...newOnes, ...prev];
        });
      }

      if (data.salary_adjustments && Array.isArray(data.salary_adjustments)) {
        setSalaryAdjustments((prev) => {
          const existingIds = new Set(prev.map((a) => a.id));
          const newOnes = data.salary_adjustments!.filter((a) => a && a.id && !existingIds.has(a.id));
          return [...newOnes, ...prev];
        });
      }

      if (data.accounts && Array.isArray(data.accounts)) {
        setAccounts((prev) => {
          const existingNames = new Set(prev.map((a) => a.name.toLowerCase()));
          const newOnes = data.accounts!.filter((a) => a && a.name && !existingNames.has(a.name.toLowerCase()));
          return [...prev, ...newOnes];
        });
      }

      if (data.categories && Array.isArray(data.categories)) {
        setCategories((prev) => {
          const existingKeys = new Set(prev.map((c) => `${c.name.toLowerCase()}-${c.type}`));
          const newOnes = data.categories!.filter((c) => c && c.name && !existingKeys.has(`${c.name.toLowerCase()}-${c.type}`));
          return [...prev, ...newOnes];
        });
      }

      return {
        success: true,
        message: `Safe merge successful: Added ${addedTxCount} new transactions, ${addedBorrowingCount} borrowings, ${addedLendingCount} lendings. All existing records preserved!`,
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
      for (const a of accounts) {
        await supabase.from('accounts').upsert(sanitizeForSupabase('accounts', a, user.id));
      }
      for (const c of categories) {
        await supabase.from('categories').upsert(sanitizeForSupabase('categories', c, user.id));
      }
      for (const t of transactions) {
        await supabase.from('transactions').upsert(sanitizeForSupabase('transactions', t, user.id));
      }
      for (const b of borrowings) {
        await supabase.from('borrowings').upsert(sanitizeForSupabase('borrowings', b, user.id));
      }
      for (const r of borrowingRepayments) {
        await supabase.from('borrowing_repayments').upsert(sanitizeForSupabase('borrowing_repayments', r, user.id));
      }
      for (const l of lendings) {
        await supabase.from('lendings').upsert(sanitizeForSupabase('lendings', l, user.id));
      }
      for (const col of lendingCollections) {
        await supabase.from('lending_collections').upsert(sanitizeForSupabase('lending_collections', col, user.id));
      }
      for (const off of officeReimbursements) {
        await supabase.from('office_reimbursements').upsert(sanitizeForSupabase('office_reimbursements', off, user.id));
      }
      for (const tr of transfers) {
        await supabase.from('account_transfers').upsert(sanitizeForSupabase('account_transfers', tr, user.id));
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
    setSalaryAdvances([]);
    setSalaryAdjustments([]);
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
        syncState,
        pendingSyncCount,
        syncError,
        salaryAdvances,
        salaryAdjustments,
        salaryAdvanceSummary,
        addSalaryAdvance,
        updateSalaryAdvance,
        deleteSalaryAdvance,
        recordSalaryAdjustment,
        deleteSalaryAdjustment,
        addTransaction,
        updateTransaction,
        deleteTransaction,
        addBorrowing,
        updateBorrowing,
        recordBorrowingRepayment,
        deleteBorrowing,
        addLending,
        updateLending,
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
        processPendingOfflineQueue,
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
