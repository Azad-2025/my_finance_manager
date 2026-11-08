/**
 * IndexedDB Offline Engine for My Finance Manager
 * Provides durable structured offline storage, client UUID generation,
 * idempotency tracking, and sequential sync queue processing.
 */

const DB_NAME = 'MyFinanceManagerDB';
const DB_VERSION = 1;

export interface OfflineQueueItem {
  queue_id?: number;
  idempotency_key: string;
  entity_type:
    | 'transaction'
    | 'borrowing'
    | 'lending'
    | 'repayment'
    | 'collection'
    | 'reimbursement'
    | 'account'
    | 'category'
    | 'transfer';
  action: 'insert' | 'update' | 'delete';
  record_id: string;
  payload: any;
  status: 'pending' | 'syncing' | 'synced' | 'failed';
  error_message?: string;
  attempts: number;
  created_at: string;
  updated_at: string;
}

export function generateUUID(): string {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === 'x' ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

export function generateIdempotencyKey(entity: string, id: string): string {
  return `idem-${entity}-${id}-${Date.now()}`;
}

let dbPromise: Promise<IDBDatabase> | null = null;

export function openFinanceDB(): Promise<IDBDatabase> {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      reject(new Error('IndexedDB is not supported in this environment'));
      return;
    }

    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;

      // 1. Transactions store
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('sync_status', 'sync_status', { unique: false });
        txStore.createIndex('date', 'date', { unique: false });
        txStore.createIndex('type', 'type', { unique: false });
      }

      // 2. Offline sync queue
      if (!db.objectStoreNames.contains('sync_queue')) {
        const queueStore = db.createObjectStore('sync_queue', {
          keyPath: 'queue_id',
          autoIncrement: true,
        });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('record_id', 'record_id', { unique: false });
        queueStore.createIndex('idempotency_key', 'idempotency_key', { unique: false });
      }

      // 3. Cached state snapshot store
      if (!db.objectStoreNames.contains('cached_state')) {
        db.createObjectStore('cached_state', { keyPath: 'key' });
      }
    };

    request.onsuccess = () => {
      resolve(request.result);
    };

    request.onerror = () => {
      dbPromise = null;
      reject(request.error || new Error('Failed to open IndexedDB'));
    };

    request.onblocked = () => {
      console.warn('IndexedDB blocked by another open tab or version update.');
    };
  });

  return dbPromise;
}

// ---------------------------------------------------------------------------
// Queue Operations
// ---------------------------------------------------------------------------

export async function enqueueSyncItem(
  item: Omit<OfflineQueueItem, 'queue_id' | 'attempts' | 'created_at' | 'updated_at'>
): Promise<number> {
  try {
    const db = await openFinanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const now = new Date().toISOString();

      const record: OfflineQueueItem = {
        ...item,
        attempts: 0,
        created_at: now,
        updated_at: now,
      };

      const req = store.add(record);
      req.onsuccess = () => resolve(req.result as number);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('IndexedDB enqueue failed, operating with memory/localStorage fallback:', err);
    return 0;
  }
}

export async function getPendingSyncQueue(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openFinanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const index = store.index('status');
      const req = index.getAll(IDBKeyRange.only('pending'));

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to get pending queue from IndexedDB:', err);
    return [];
  }
}

export async function getAllSyncQueue(): Promise<OfflineQueueItem[]> {
  try {
    const db = await openFinanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readonly');
      const store = tx.objectStore('sync_queue');
      const req = store.getAll();

      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return [];
  }
}

export async function updateQueueItemStatus(
  queueId: number,
  status: 'pending' | 'syncing' | 'synced' | 'failed',
  errorMessage?: string
): Promise<void> {
  try {
    const db = await openFinanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const getReq = store.get(queueId);

      getReq.onsuccess = () => {
        const item: OfflineQueueItem = getReq.result;
        if (!item) {
          resolve();
          return;
        }
        item.status = status;
        item.attempts = (item.attempts || 0) + 1;
        item.updated_at = new Date().toISOString();
        if (errorMessage) item.error_message = errorMessage;

        const putReq = store.put(item);
        putReq.onsuccess = () => resolve();
        putReq.onerror = () => reject(putReq.error);
      };
      getReq.onerror = () => reject(getReq.error);
    });
  } catch (err) {
    console.warn('Failed to update queue item in IndexedDB:', err);
  }
}

export async function removeQueueItem(queueId: number): Promise<void> {
  try {
    const db = await openFinanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('sync_queue', 'readwrite');
      const store = tx.objectStore('sync_queue');
      const req = store.delete(queueId);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to remove queue item from IndexedDB:', err);
  }
}

// ---------------------------------------------------------------------------
// Snapshot & Transactions Cache
// ---------------------------------------------------------------------------

export async function cacheStateSnapshot(stateKey: string, payload: any): Promise<void> {
  try {
    const db = await openFinanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_state', 'readwrite');
      const store = tx.objectStore('cached_state');
      const req = store.put({ key: stateKey, data: payload, updated_at: new Date().toISOString() });
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('Failed to cache state snapshot in IndexedDB:', err);
  }
}

export async function getCachedStateSnapshot<T>(stateKey: string): Promise<T | null> {
  try {
    const db = await openFinanceDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction('cached_state', 'readonly');
      const store = tx.objectStore('cached_state');
      const req = store.get(stateKey);
      req.onsuccess = () => resolve(req.result ? req.result.data : null);
      req.onerror = () => reject(req.error);
    });
  } catch {
    return null;
  }
}
