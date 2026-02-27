'use client';
import { useState, useMemo, useEffect } from 'react';
import { useTransactions, useSettings } from '@/lib/hooks';
import { calculateTax, getAvailableYears } from '@/lib/tax-engine';
import { generateTaxReport } from '@/lib/pdf-report';
import { Country, TaxMethod } from '@/lib/types';
import { DownloadIcon } from '@/components/Icons';
import UpgradeModal from '@/components/UpgradeModal';

const COUNTRIES: { value: Country; label: string }[] = [
  { value: 'france', label: 'France' }, { value: 'germany', label: 'Germany' },
  { value: 'luxembourg', label: 'Luxembourg' }, { value: 'belgium', label: 'Belgium' },
  { value: 'netherlands', label: 'Netherlands' }, { value: 'generic', label: 'EU (Generic)' },
];
const METHODS: { value: TaxMethod; label: string }[] = [
  { value: 'fifo', label: 'FIFO' }, { value: 'lifo', label: 'LIFO' }, { value: 'weighted_average', label: 'Weighted Average' },
];

export default function TaxPage() {
  const { transactions, loading } = useTransactions();
  const { settings } = useSettings();
  const [country, setCountry] = useState<Country>(settings.country);
  const [method, setMethod] = useState<TaxMethod>(settings.taxMethod);
  const [year, setYear] = useState<number>(new Date().getFullYear());
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); setCountry(settings.country); setMethod(settings.taxMethod); }, [settings]);

  const years = useMemo(() => {
    const y = getAvailableYears(transactions);
    return y.length > 0 ? y : [new Date().getFullYear()];
  }, [transactions]);

  useEffect(() => { if (years.length > 0 && !years.includes(year)) setYear(years[0]); }, [years, year]);

  const summary = useMemo(() => {
    if (transactions.length === 0) return null;
    return calculateTax(transactions, method, country, year);
  }, [transactions, method, country, year]);

  const handleDownload = () => {
    if (!settings.isPro) { setShowUpgrade(true); return; }
    if (summary) generateTaxReport(summary);
  };

  if (!mounted || loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div><h1 className="text-3xl font-bold text-white">Tax Report</h1><p className="text-gray-400 mt-1">Capital gains and tax calculations</p></div>
        <button onClick={handleDownload} className="btn-primary flex items-center gap-2"><DownloadIcon className="w-4 h-4" />Download PDF</button>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3">
        <select value={year} onChange={e => setYear(Number(e.target.value))} className="select w-auto">
          {years.map(y => <option key={y} value={y}>{y}</option>)}
        </select>
        <select value={country} onChange={e => setCountry(e.target.value as Country)} className="select w-auto">
          {COUNTRIES.map(c => <option key={c.value} value={c.value}>{c.label}</option>)}
        </select>
        <select value={method} onChange={e => setMethod(e.target.value as TaxMethod)} className="select w-auto">
          {METHODS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
        </select>
      </div>

      {!summary || summary.details.length === 0 ? (
        <div className="card text-center py-12"><p className="text-gray-400">No taxable events found for {year}</p></div>
      ) : (
        <>
          {/* Summary cards */}
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="card"><p className="text-xs text-gray-500">Total Gains</p><p className="text-xl font-bold text-emerald-400 mt-1">+{summary.totalGains.toFixed(2)}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Total Losses</p><p className="text-xl font-bold text-red-400 mt-1">-{summary.totalLosses.toFixed(2)}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Net Gain/Loss</p><p className={`text-xl font-bold mt-1 ${summary.netGainLoss >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{summary.netGainLoss >= 0 ? '+' : ''}{summary.netGainLoss.toFixed(2)}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Taxable Gains</p><p className="text-xl font-bold text-white mt-1">{summary.taxableGains.toFixed(2)}</p></div>
            <div className="card"><p className="text-xs text-gray-500">Est. Tax</p><p className="text-xl font-bold text-amber-400 mt-1">{summary.estimatedTax.toFixed(2)}</p></div>
          </div>

          {/* Country note */}
          <div className="card bg-indigo-500/5 border-indigo-500/20">
            <h3 className="text-sm font-medium text-indigo-400 mb-2">Tax Rules: {COUNTRIES.find(c => c.value === country)?.label}</h3>
            {country === 'france' && <p className="text-sm text-gray-400">Flat tax (PFU) of 30% on all crypto capital gains. Must be reported on Form 2086.</p>}
            {country === 'germany' && <p className="text-sm text-gray-400">Crypto held for more than 1 year is tax-free. Short-term gains taxed as income (~26.375% with solidarity surcharge). EUR 600 annual exemption.</p>}
            {country === 'luxembourg' && <p className="text-sm text-gray-400">Crypto held for more than 6 months is tax-free for individuals. Short-term gains taxed at marginal income rate.</p>}
            {country === 'belgium' && <p className="text-sm text-gray-400">Generally tax-free under normal management of private wealth. Speculative or professional trading may be taxable.</p>}
            {country === 'netherlands' && <p className="text-sm text-gray-400">Box 3 wealth tax: tax on fictional yield (~6.17%) at 36% rate, not on actual gains. Based on net asset value.</p>}
            {country === 'generic' && <p className="text-sm text-gray-400">Showing raw capital gains and losses. Consult your local tax authority.</p>}
          </div>

          {/* Detail table */}
          <div className="card p-0 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead><tr className="text-gray-500 border-b border-gray-800 bg-gray-900/50">
                  <th className="text-left px-4 py-3 font-medium">Asset</th>
                  <th className="text-left px-4 py-3 font-medium">Buy Date</th>
                  <th className="text-left px-4 py-3 font-medium">Sell Date</th>
                  <th className="text-right px-4 py-3 font-medium">Amount</th>
                  <th className="text-right px-4 py-3 font-medium">Cost Basis</th>
                  <th className="text-right px-4 py-3 font-medium">Proceeds</th>
                  <th className="text-right px-4 py-3 font-medium">Gain/Loss</th>
                  <th className="text-right px-4 py-3 font-medium">Holding</th>
                  <th className="text-center px-4 py-3 font-medium">Taxable</th>
                </tr></thead>
                <tbody>
                  {summary.details.map((d, i) => (
                    <tr key={i} className="border-b border-gray-800/50 hover:bg-gray-800/20">
                      <td className="px-4 py-3 text-white font-medium">{d.asset}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(d.buyDate).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-3 text-gray-400">{new Date(d.sellDate).toLocaleDateString('en-GB')}</td>
                      <td className="px-4 py-3 text-right text-gray-300 font-mono">{d.amount.toFixed(6)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{d.costBasis.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-300">{d.proceeds.toFixed(2)}</td>
                      <td className={`px-4 py-3 text-right font-medium ${d.gain >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>{d.gain >= 0 ? '+' : ''}{d.gain.toFixed(2)}</td>
                      <td className="px-4 py-3 text-right text-gray-400">{d.holdingDays}d</td>
                      <td className="px-4 py-3 text-center">{d.taxable ? <span className="text-amber-400 text-xs font-medium">Yes</span> : <span className="text-emerald-400 text-xs font-medium">No</span>}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
