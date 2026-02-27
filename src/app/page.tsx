'use client';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useTransactions, useSettings } from '@/lib/hooks';
import { calculateTax, calculatePortfolio, getAvailableYears } from '@/lib/tax-engine';
import { ChartIcon, UploadIcon, PlusIcon, WalletIcon } from '@/components/Icons';

export default function Dashboard() {
  const { transactions, loading } = useTransactions();
  const { settings } = useSettings();
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  if (!mounted || loading) {
    return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;
  }

  const years = getAvailableYears(transactions);
  const currentYear = years[0] || new Date().getFullYear();
  const summary = transactions.length > 0 ? calculateTax(transactions, settings.taxMethod, settings.country, currentYear) : null;
  const portfolio = calculatePortfolio(transactions);

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Dashboard</h1>
        <p className="text-gray-400 mt-1">Your crypto tax overview</p>
      </div>

      {transactions.length === 0 ? (
        <div className="card text-center py-16">
          <div className="w-16 h-16 mx-auto mb-4 bg-indigo-600/20 rounded-2xl flex items-center justify-center">
            <ChartIcon className="w-8 h-8 text-indigo-400" />
          </div>
          <h2 className="text-xl font-semibold text-white mb-2">No transactions yet</h2>
          <p className="text-gray-400 mb-6 max-w-sm mx-auto">Import your transactions from an exchange or add them manually to get started.</p>
          <div className="flex gap-3 justify-center">
            <Link href="/import" className="btn-primary flex items-center gap-2"><UploadIcon className="w-4 h-4" />Import CSV</Link>
            <Link href="/transactions/add" className="btn-secondary flex items-center gap-2"><PlusIcon className="w-4 h-4" />Add Manually</Link>
          </div>
        </div>
      ) : (
        <>
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="card">
              <p className="text-sm text-gray-400">Total Transactions</p>
              <p className="text-2xl font-bold text-white mt-1">{transactions.length}</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-400">Net Gain/Loss ({currentYear})</p>
              <p className={`text-2xl font-bold mt-1 ${(summary?.netGainLoss || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
                {(summary?.netGainLoss || 0) >= 0 ? '+' : ''}{(summary?.netGainLoss || 0).toFixed(2)} EUR
              </p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-400">Estimated Tax ({currentYear})</p>
              <p className="text-2xl font-bold text-amber-400 mt-1">{(summary?.estimatedTax || 0).toFixed(2)} EUR</p>
            </div>
            <div className="card">
              <p className="text-sm text-gray-400">Assets Held</p>
              <p className="text-2xl font-bold text-white mt-1">{portfolio.length}</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Link href="/tax" className="card hover:border-indigo-500/50 transition-colors group">
              <ChartIcon className="w-6 h-6 text-indigo-400 mb-3" />
              <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">Tax Report</h3>
              <p className="text-sm text-gray-400 mt-1">View detailed gains/losses and generate PDF</p>
            </Link>
            <Link href="/portfolio" className="card hover:border-indigo-500/50 transition-colors group">
              <WalletIcon className="w-6 h-6 text-indigo-400 mb-3" />
              <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">Portfolio</h3>
              <p className="text-sm text-gray-400 mt-1">Current holdings and unrealized gains</p>
            </Link>
            <Link href="/import" className="card hover:border-indigo-500/50 transition-colors group">
              <UploadIcon className="w-6 h-6 text-indigo-400 mb-3" />
              <h3 className="font-semibold text-white group-hover:text-indigo-400 transition-colors">Import More</h3>
              <p className="text-sm text-gray-400 mt-1">Add transactions from exchanges</p>
            </Link>
          </div>

          {/* Recent Transactions */}
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-white">Recent Transactions</h2>
              <Link href="/transactions" className="text-sm text-indigo-400 hover:text-indigo-300">View all</Link>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 font-medium">Date</th>
                  <th className="text-left py-2 font-medium">Type</th>
                  <th className="text-left py-2 font-medium">Asset</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                  <th className="text-right py-2 font-medium">Price (EUR)</th>
                </tr></thead>
                <tbody>
                  {transactions.slice(-5).reverse().map(tx => (
                    <tr key={tx.id} className="border-b border-gray-800/50 hover:bg-gray-800/30">
                      <td className="py-2.5 text-gray-300">{new Date(tx.date).toLocaleDateString('en-GB')}</td>
                      <td className="py-2.5"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${tx.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : tx.type === 'sell' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{tx.type}</span></td>
                      <td className="py-2.5 text-white font-medium">{tx.asset}</td>
                      <td className="py-2.5 text-right text-gray-300">{tx.amount.toFixed(6)}</td>
                      <td className="py-2.5 text-right text-gray-300">{tx.pricePerUnit.toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
