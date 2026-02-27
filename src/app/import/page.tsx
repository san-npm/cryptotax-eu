'use client';
import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { parseCSV, finalizeTransactions } from '@/lib/csv-parser';
import { useTransactions, useTransactionLimit, useSettings } from '@/lib/hooks';
import { Transaction, CSVImportPreview } from '@/lib/types';
import { UploadIcon } from '@/components/Icons';
import UpgradeModal from '@/components/UpgradeModal';

export default function ImportPage() {
  const router = useRouter();
  const { addMany } = useTransactions();
  const { count, isAtLimit, refresh: refreshCount } = useTransactionLimit();
  const { settings } = useSettings();
  const [preview, setPreview] = useState<CSVImportPreview | null>(null);
  const [importing, setImporting] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = e.target?.result as string;
      const result = parseCSV(text);
      setPreview(result);
    };
    reader.readAsText(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith('.csv')) handleFile(file);
  };

  const handleImport = async () => {
    if (!preview) return;
    if (isAtLimit(settings.isPro)) { setShowUpgrade(true); return; }

    setImporting(true);
    const txs = finalizeTransactions(preview.transactions);
    const limit = settings.isPro ? Infinity : 25 - count;
    const toImport = txs.slice(0, limit);
    await addMany(toImport as Transaction[]);
    await refreshCount();

    if (txs.length > limit) {
      setShowUpgrade(true);
    } else {
      router.push('/transactions');
    }
    setImporting(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-white">Import Transactions</h1>
        <p className="text-gray-400 mt-1">Upload a CSV file from your exchange</p>
      </div>

      {/* Supported exchanges */}
      <div className="flex flex-wrap gap-2">
        {['Binance', 'Kraken', 'Coinbase', 'KuCoin', 'Generic CSV'].map(ex => (
          <span key={ex} className="px-3 py-1 bg-gray-800/50 border border-gray-700 rounded-lg text-xs text-gray-400">{ex}</span>
        ))}
      </div>

      {/* Drop zone */}
      {!preview && (
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
          onDragLeave={() => setDragOver(false)}
          onDrop={handleDrop}
          onClick={() => fileRef.current?.click()}
          className={`card border-dashed cursor-pointer text-center py-16 transition-colors ${dragOver ? 'border-indigo-500 bg-indigo-500/5' : 'hover:border-gray-600'}`}
        >
          <UploadIcon className="w-12 h-12 text-gray-600 mx-auto mb-4" />
          <p className="text-gray-300 font-medium">Drop your CSV file here</p>
          <p className="text-gray-500 text-sm mt-1">or click to browse</p>
          <input ref={fileRef} type="file" accept=".csv" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); }} />
        </div>
      )}

      {/* Preview */}
      {preview && (
        <div className="space-y-4">
          <div className="card">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h2 className="text-lg font-semibold text-white">Preview</h2>
                <p className="text-sm text-gray-400">Detected exchange: <span className="text-indigo-400">{preview.exchange}</span></p>
              </div>
              <span className="text-sm text-gray-400">{preview.transactions.length} transactions found</span>
            </div>

            {preview.errors.length > 0 && (
              <div className="mb-4 p-3 bg-red-500/10 border border-red-800/50 rounded-xl">
                {preview.errors.map((e, i) => <p key={i} className="text-sm text-red-400">{e}</p>)}
              </div>
            )}
            {preview.warnings.length > 0 && (
              <div className="mb-4 p-3 bg-amber-500/10 border border-amber-800/50 rounded-xl">
                {preview.warnings.map((w, i) => <p key={i} className="text-sm text-amber-400">{w}</p>)}
              </div>
            )}

            <div className="overflow-x-auto max-h-96 overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="sticky top-0 bg-gray-900"><tr className="text-gray-500 border-b border-gray-800">
                  <th className="text-left py-2 font-medium">Date</th>
                  <th className="text-left py-2 font-medium">Type</th>
                  <th className="text-left py-2 font-medium">Asset</th>
                  <th className="text-right py-2 font-medium">Amount</th>
                  <th className="text-right py-2 font-medium">Price</th>
                  <th className="text-right py-2 font-medium">Fee</th>
                </tr></thead>
                <tbody>
                  {preview.transactions.slice(0, 50).map((tx, i) => (
                    <tr key={i} className="border-b border-gray-800/50">
                      <td className="py-2 text-gray-300">{tx.date ? new Date(tx.date).toLocaleDateString('en-GB') : '—'}</td>
                      <td className="py-2"><span className={`px-2 py-0.5 rounded-md text-xs font-medium ${tx.type === 'buy' ? 'bg-emerald-500/20 text-emerald-400' : tx.type === 'sell' ? 'bg-red-500/20 text-red-400' : 'bg-blue-500/20 text-blue-400'}`}>{tx.type}</span></td>
                      <td className="py-2 text-white font-medium">{tx.asset}</td>
                      <td className="py-2 text-right text-gray-300">{tx.amount?.toFixed(6)}</td>
                      <td className="py-2 text-right text-gray-300">{tx.pricePerUnit?.toFixed(2) || '—'}</td>
                      <td className="py-2 text-right text-gray-300">{tx.fee?.toFixed(2) || '0.00'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {preview.transactions.length > 50 && <p className="text-sm text-gray-500 mt-2 text-center">Showing first 50 of {preview.transactions.length}</p>}
            </div>
          </div>

          <div className="flex gap-3">
            <button onClick={handleImport} disabled={importing || preview.transactions.length === 0} className="btn-primary flex items-center gap-2">
              {importing ? 'Importing...' : `Import ${preview.transactions.length} Transactions`}
            </button>
            <button onClick={() => setPreview(null)} className="btn-secondary">Cancel</button>
          </div>
        </div>
      )}

      {showUpgrade && <UpgradeModal onClose={() => setShowUpgrade(false)} />}
    </div>
  );
}
