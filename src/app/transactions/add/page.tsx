'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { v4 as uuidv4 } from 'uuid';
import { useTransactions, useTransactionLimit, useSettings } from '@/lib/hooks';
import { TransactionType, Currency } from '@/lib/types';
import UpgradeModal from '@/components/UpgradeModal';

export default function AddTransactionPage() {
  const router = useRouter();
  const { add } = useTransactions();
  const { isAtLimit, refresh } = useTransactionLimit();
  const { settings } = useSettings();
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [form, setForm] = useState({
    date: new Date().toISOString().split('T')[0],
    type: 'buy' as TransactionType,
    asset: '', amount: '', pricePerUnit: '', fee: '0',
    exchange: '', notes: '', currency: 'EUR' as Currency,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAtLimit(settings.isPro)) { setShowUpgrade(true); return; }
    await add({
      id: uuidv4(), date: new Date(form.date).toISOString(), type: form.type,
      asset: form.asset.toUpperCase(), amount: parseFloat(form.amount) || 0,
      pricePerUnit: parseFloat(form.pricePerUnit) || 0, fee: parseFloat(form.fee) || 0,
      exchange: form.exchange || undefined, notes: form.notes || undefined, currency: form.currency,
    });
    await refresh();
    router.push('/transactions');
  };
  const set = (k: string, v: string) => setForm(f => ({ ...f, [k]: v }));

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold text-white">Add Transaction</h1><p className="text-gray-400 mt-1">Manually enter a transaction</p></div>
      <form onSubmit={handleSubmit} className="card space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Date</label><input type="date" value={form.date} onChange={e => set('date', e.target.value)} className="input" required /></div>
          <div><label className="label">Type</label><select value={form.type} onChange={e => set('type', e.target.value)} className="select"><option value="buy">Buy</option><option value="sell">Sell</option><option value="swap">Swap</option><option value="transfer">Transfer</option><option value="staking_reward">Staking Reward</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Asset</label><input value={form.asset} onChange={e => set('asset', e.target.value)} placeholder="BTC, ETH, SOL..." className="input" required /></div>
          <div><label className="label">Amount</label><input type="number" step="any" value={form.amount} onChange={e => set('amount', e.target.value)} placeholder="0.00" className="input" required /></div>
        </div>
        <div className="grid grid-cols-3 gap-4">
          <div><label className="label">Price per Unit</label><input type="number" step="any" value={form.pricePerUnit} onChange={e => set('pricePerUnit', e.target.value)} placeholder="0.00" className="input" required /></div>
          <div><label className="label">Fee</label><input type="number" step="any" value={form.fee} onChange={e => set('fee', e.target.value)} placeholder="0.00" className="input" /></div>
          <div><label className="label">Currency</label><select value={form.currency} onChange={e => set('currency', e.target.value)} className="select"><option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option></select></div>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div><label className="label">Exchange</label><input value={form.exchange} onChange={e => set('exchange', e.target.value)} placeholder="Optional" className="input" /></div>
          <div><label className="label">Notes</label><input value={form.notes} onChange={e => set('notes', e.target.value)} placeholder="Optional" className="input" /></div>
        </div>
        {form.amount && form.pricePerUnit && <div className="p-3 bg-gray-800/50 rounded-xl"><p className="text-sm text-gray-400">Total: <span className="text-white font-medium">{(parseFloat(form.amount) * parseFloat(form.pricePerUnit)).toFixed(2)} {form.currency}</span></p></div>}
        <div className="flex gap-3"><button type="submit" className="btn-primary">Add Transaction</button><button type="button" onClick={() => router.back()} className="btn-secondary">Cancel</button></div>
      </form>
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
