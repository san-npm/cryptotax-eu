'use client';
import { useState, useEffect, useCallback } from 'react';
import { Transaction, AppSettings } from './types';
import * as db from './db';

export function useTransactions() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = useCallback(async () => {
    setLoading(true);
    const txs = await db.getAllTransactions();
    setTransactions(txs);
    setLoading(false);
  }, []);

  useEffect(() => { refresh(); }, [refresh]);

  const add = async (tx: Transaction) => { await db.addTransaction(tx); await refresh(); };
  const addMany = async (txs: Transaction[]) => { await db.addTransactions(txs); await refresh(); };
  const remove = async (id: string) => { await db.deleteTransaction(id); await refresh(); };
  const clearAll = async () => { await db.clearAllTransactions(); await refresh(); };

  return { transactions, loading, add, addMany, remove, clearAll, refresh };
}

export function useSettings() {
  const [settings, setSettings] = useState<AppSettings>({
    country: 'generic', taxMethod: 'fifo', baseCurrency: 'EUR', isPro: false,
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    db.getSettings().then(s => { setSettings(s); setLoading(false); });
  }, []);

  const update = async (s: Partial<AppSettings>) => {
    const newSettings = { ...settings, ...s };
    await db.saveSettings(newSettings);
    setSettings(newSettings);
  };

  return { settings, loading, update };
}

export function useTransactionLimit() {
  const [count, setCount] = useState(0);
  useEffect(() => { db.getTransactionCount().then(setCount); }, []);
  const refresh = async () => setCount(await db.getTransactionCount());
  return { count, refresh, isAtLimit: (isPro: boolean) => !isPro && count >= 25 };
}
