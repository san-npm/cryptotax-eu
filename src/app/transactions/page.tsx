'use client';
import { useState, useMemo } from 'react';
import Link from 'next/link';
import { useTransactions } from '@/lib/hooks';
import { TransactionType } from '@/lib/types';
import { SearchIcon, PlusIcon, TrashIcon } from '@/components/Icons';

export default function TransactionsPage() {
  const { transactions, loading, remove, clearAll } = useTransactions();
  
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState<TransactionType | ''>('');
  const [sortField, setSortField] = useState<'date' | 'asset' | 'amount'>('date');
  const [sortDir, setSortDir] = useState<'asc' | 'desc'>('desc');
  const [confirmClear, setConfirmClear] = useState(false);

  const filtered = useMemo(() => {
    let result = [...transactions];
    if (search) {
      const s = search.toLowerCase();
      result = result.filter(t => t.asset.toLowerCase().includes(s) || t.exchange?.toLowerCase().includes(s) || t.notes?.toLowerCase().includes(s));
    }
    if (typeFilter) result = result.filter(t => t.type === typeFilter);
    result.sort((a, b) => {
      let cmp = 0;
      if (sortField === 'date') cmp = new Date(a.date).getTime() - new Date(b.date).getTime();
      else if (sortField === 'asset') cmp = a.asset.localeCompare(b.asset);
      else cmp = a.amount - b.amount;
      return sortDir === 'desc' ? -cmp : cmp;
    });
    return result;
  }, [transactions, search, typeFilter, sortField, sortDir]);

  const toggleSort = (field: typeof sortField) => {
    if (sortField === field) setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    else { setSortField(field); setSortDir('desc'); }
  };

  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">Transactions</h1>
          <p className="text-gray-400 mt-1">{transactions.length} total</p>
        </div>
        <div className="flex gap-2">
          <Link href="/transactions/add" className="btn-primary flex items-center gap-2"><PlusIcon className="w-4 h-4" />Add</Link>
          {transactions.length > 0 && (
            confirmClear ? (
              <div className="flex gap-2">
                <button onClick={() => { clearAll(); setConfirmClear(false); }} className="btn-danger text-sm">Confirm Delete All</button>
                <button onClick={() => setConfirmClear(false)} className="btn-secondary text-sm">Cancel</button>
              </div>
            ) : (
              <button onClick={() => setConfirmClear(true)} className="btn-danger flex items-center gap-2"><TrashIcon className="w-4 h-4" />Clear All</button>
            )
          )}
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <SearchIcon className="w-4 h-4 absolute left-3 top-3 text-gray-500" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by asset, exchange..." className="input pl-10" />
        </div>
        <select value={typeFilter} onChange={e => setTypeFilter(e.target.value as TransactionType | '')} className="select w-auto min-w-[140px]">
          <option value="">All Types</option>
          <option value="buy">Buy</option>
          <option value="sell">Sell</option>
          <option value="swap">Swap</option>
          <option value="transfer">Transfer</option>
          <option value="staking_reward">Staking</option>
        </select>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card text-center py-12">
          <p className="text-gray-400">No transactions found</p>
        </div>
      ) : (
        <div className="card p-0 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead><tr className="text-gray-500 border-b border-gray-800 bg-gray-900/50">
                <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-300" onClick={() => toggleSort('date')}>Date {sortField === 'date' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                <th className="text-left px-4 py-3 font-medium">Type</th>
                <th className="text-left px-4 py-3 font-medium cursor-pointer hover:text-gray-300" onClick={() => toggleSort('asset')}>Asset {sortField === 'asset' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                <th className="text-right px-4 py-3 font-medium cursor-pointer hover:text-gray-300" onClick={() => toggleSort('amount')}>Amount {sortField === 'amount' && (sortDir === 'desc' ? '↓' : '↑')}</th>
                <th className="text-right px-4 py-3 font-medium">Price (EUR)</th>
                <th className="text-right px-4 py-3 font-medium">Fee (EUR)</th>
                <th className="text-right px-4 py-3 font-medium">Total (EUR)</th>
                <th className="text-left px-4 py-3 font-medium">Exchange</th>
                <th className="px-4 py-3"></th>
              </tr></thead>
              <tbody>
                {filtered.map(tx => (
                  <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                    <td className="px-4 py-3 text-gray-300">{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                    <td className="px-4 py-3"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${tx.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : tx.type === 'sell' ? 'bg-red-500/20 text-red-400' : tx.type === 'swap' ? 'bg-purple-500/20 text-purple-400' : tx.type === 'staking_reward' ? 'bg-amber-500/20 text-amber-400' : 'bg-blue-500/20 text-blue-400'}`}>{tx.type.replace('_', ' ')}</span></td>
                    <td className="px-4 py-3 text-white font-medium">{tx.asset}</td>
                    <td className="px-4 py-3 text-right text-gray-300 font-mono">{tx.amount < 0.001 ? tx.amount.toExponential(2) : tx.amount.toFixed(6)}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{tx.pricePerUnit.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{tx.fee.toFixed(2)}</td>
                    <td className="px-4 py-3 text-right text-gray-300">{(tx.amount * tx.pricePerUnit).toFixed(2)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{tx.exchange || '—'}</td>
                    <td className="px-4 py-3"><button onClick={() => remove(tx.id)} className="text-gray-600 hover:text-red-400 transition-colors"><TrashIcon className="w-4 h-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
