import { openDB, DBSchema, IDBPDatabase } from 'idb';
import { Transaction, AppSettings } from './types';

interface CryptoTaxDB extends DBSchema {
  transactions: {
    key: string;
    value: Transaction;
    indexes: { 'by-date': string; 'by-asset': string; 'by-type': string };
  };
  settings: {
    key: string;
    value: AppSettings;
  };
}

let dbPromise: Promise<IDBPDatabase<CryptoTaxDB>> | null = null;

function getDB() {
  if (!dbPromise) {
    dbPromise = openDB<CryptoTaxDB>('cryptotax-eu', 1, {
      upgrade(db) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('by-date', 'date');
        txStore.createIndex('by-asset', 'asset');
        txStore.createIndex('by-type', 'type');
        db.createObjectStore('settings', { keyPath: 'country' });
      },
    });
  }
  return dbPromise;
}

export async function getAllTransactions(): Promise<Transaction[]> {
  const db = await getDB();
  const txs = await db.getAll('transactions');
  return txs.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
}

export async function addTransaction(tx: Transaction): Promise<void> {
  const db = await getDB();
  await db.put('transactions', tx);
}

export async function addTransactions(txs: Transaction[]): Promise<void> {
  const db = await getDB();
  const t = db.transaction('transactions', 'readwrite');
  for (const tx of txs) {
    await t.store.put(tx);
  }
  await t.done;
}

export async function deleteTransaction(id: string): Promise<void> {
  const db = await getDB();
  await db.delete('transactions', id);
}

export async function clearAllTransactions(): Promise<void> {
  const db = await getDB();
  await db.clear('transactions');
}

export async function getSettings(): Promise<AppSettings> {
  const db = await getDB();
  const s = await db.get('settings', 'default');
  return s || { country: 'generic', taxMethod: 'fifo', baseCurrency: 'EUR', isPro: false };
}

export async function saveSettings(settings: AppSettings): Promise<void> {
  const db = await getDB();
  await db.put('settings', { ...settings, country: 'default' as AppSettings['country'] });
}

export async function getTransactionCount(): Promise<number> {
  const db = await getDB();
  return db.count('transactions');
}
