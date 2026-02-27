'use client';
import { useState, useEffect, useMemo } from 'react';
import { useTransactions } from '@/lib/hooks';
import { calculatePortfolio } from '@/lib/tax-engine';
import { getCurrentPrices } from '@/lib/prices';
import { PortfolioHolding } from '@/lib/types';

export default function PortfolioPage() {
  const { transactions, loading } = useTransactions();
  const [prices, setPrices] = useState<Record<string, number>>({});
  const [loadingPrices, setLoadingPrices] = useState(false);
  const [mounted, setMounted] = useState(false);

  const holdings = useMemo(() => calculatePortfolio(transactions), [transactions]);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (holdings.length > 0) {
      setLoadingPrices(true);
      getCurrentPrices(holdings.map(h => h.asset))
        .then(setPrices)
        .finally(() => setLoadingPrices(false));
    }
  }, [holdings]);

  const enriched: PortfolioHolding[] = holdings.map(h => ({
    ...h,
    currentPrice: prices[h.asset],
    value: prices[h.asset] ? h.amount * prices[h.asset] : undefined,
    unrealizedGain: prices[h.asset] ? (prices[h.asset] - h.avgCostBasis) * h.amount : undefined,
  }));

  const totalValue = enriched.reduce((s, h) => s + (h.value || 0), 0);
  const totalCost = enriched.reduce((s, h) => s + h.avgCostBasis * h.amount, 0);
  const totalUnrealized = totalValue - totalCost;

  if (!mounted || loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold text-white">Portfolio</h1><p className="text-gray-400 mt-1">Current holdings overview</p></div>

      {holdings.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-400">No holdings found. Add some buy transactions first.</p></div>
      ) : (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="card"><p className="text-sm text-gray-400">Total Value</p><p className="text-2xl font-bold text-white mt-1">{totalValue > 0 ? `${totalValue.toFixed(2)} EUR` : 'N/A'}</p></div>
            <div className="card"><p className="text-sm text-gray-400">Total Cost Basis</p><p className="text-2xl font-bold text-gray-300 mt-1">{totalCost.toFixed(2)} EUR</p></div>
            <div className="card"><p className="text-sm text-gray-400">Unrealized P&L</p><p className={`text-2xl font-bold mt-1 ${totalUnrealized >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{totalValue > 0 ? `${totalUnrealized >= 0 ? '+' : ''}${totalUnrealized.toFixed(2)} EUR` : 'N/A'}</p></div>
          </div>

          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-500 border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium">Asset</th>
                  <th className="text-right px-4 py-3 font-medium">Holdings</th>
                  <th className="text-right px-4 py-3 font-medium">Avg Cost</th>
                  <th className="text-right px-4 py-3 font-medium">Current Price</th>
                  <th className="text-right px-4 py-3 font-medium">Value (EUR)</th>
                  <th className="text-right px-4 py-3 font-medium">P&L</th>
                </tr></thead>
                <tbody>
                  {enriched.sort((a, b) => (b.value || 0) - (a.value || 0)).map(h => (
                    <tr key={h.asset} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="px-4 py-3 text-white font-medium">{h.asset}</td>
                      <td className="px-4 py-3 text-right text-gray-300 font-mono">{h.amount < 0.001 ? h.amount.toExponential(2) : h.amount.toFixed(6)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{h.avgCostBasis.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{h.currentPrice ? h.currentPrice.toFixed(2) : <span className="text-gray-600">N/A</span>}{loadingPrices && <span className="ml-1 text-gray-600">...</span>}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{h.value ? h.value.toFixed(2) : '—'}</td>
                      <td className={`px-4 py-3 text-right font-medium ${(h.unrealizedGain || 0) >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{h.unrealizedGain !== undefined ? `${h.unrealizedGain >= 0 ? '+' : ''}${h.unrealizedGain.toFixed(2)}` : '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          <p className="text-xs text-gray-600">Prices from CoinGecko. May not include all assets.</p>
        </>
      )}
    </div>
  );
}
