'use client';
import { useSettings } from '@/lib/hooks';
import { Country, TaxMethod, Currency } from '@/lib/types';

export default function SettingsPage() {
  const { settings, loading, update } = useSettings();
  if (loading) return <div className="flex items-center justify-center h-64"><div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div><h1 className="text-3xl font-bold text-white">Settings</h1><p className="text-gray-400 mt-1">Configure your tax preferences</p></div>
      <div className="card space-y-6">
        <div>
          <label className="label">Country</label>
          <select value={settings.country} onChange={e => update({ country: e.target.value as Country })} className="select">
            <option value="france">France</option><option value="germany">Germany</option>
            <option value="luxembourg">Luxembourg</option><option value="belgium">Belgium</option>
            <option value="netherlands">Netherlands</option><option value="generic">EU (Generic)</option>
          </select>
          <p className="text-xs text-gray-500 mt-1">Determines which tax rules are applied</p>
        </div>
        <div>
          <label className="label">Tax Calculation Method</label>
          <select value={settings.taxMethod} onChange={e => update({ taxMethod: e.target.value as TaxMethod })} className="select">
            <option value="fifo">FIFO (First In, First Out)</option>
            <option value="lifo">LIFO (Last In, First Out)</option>
            <option value="weighted_average">Weighted Average</option>
          </select>
        </div>
        <div>
          <label className="label">Base Currency</label>
          <select value={settings.baseCurrency} onChange={e => update({ baseCurrency: e.target.value as Currency })} className="select">
            <option value="EUR">EUR</option><option value="USD">USD</option><option value="GBP">GBP</option>
          </select>
        </div>
        <div className="pt-4 border-t border-gray-800">
          <h3 className="text-white font-medium mb-2">Plan</h3>
          <div className={`p-4 rounded-xl border ${settings.isPro ? 'bg-indigo-500/10 border-indigo-500/30' : 'bg-gray-800/50 border-gray-700'}`}>
            <p className="font-medium text-white">{settings.isPro ? 'Pro' : 'Free'}</p>
            <p className="text-sm text-gray-400 mt-1">{settings.isPro ? 'Unlimited transactions, all features' : '25 transactions, 1 tax year'}</p>
            {!settings.isPro && <button className="btn-primary mt-3 text-sm">Upgrade to Pro — $29.99/year</button>}
          </div>
        </div>
      </div>
      <div className="card">
        <h3 className="text-white font-medium mb-2">About</h3>
        <p className="text-sm text-gray-400">CryptoTax.eu v1.0.0</p>
        <p className="text-sm text-gray-400 mt-1">All data is stored locally in your browser. No data is sent to any server.</p>
        <p className="text-xs text-gray-500 mt-3">This tool is for informational purposes only and does not constitute tax advice.</p>
      </div>
    </div>
  );
}
