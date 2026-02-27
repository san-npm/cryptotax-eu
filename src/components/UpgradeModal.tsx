'use client';
import { LockIcon, XIcon } from './Icons';

export default function UpgradeModal({ onClose }: { onClose: () => void }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-gray-900 border border-gray-700 rounded-2xl p-8 max-w-md w-full mx-4 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <XIcon />
        </button>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-indigo-500/20 rounded-xl">
            <LockIcon className="w-6 h-6 text-indigo-400" />
          </div>
          <h2 className="text-xl font-bold text-white">Upgrade to Pro</h2>
        </div>
        <p className="text-gray-400 mb-6">
          You have reached the free tier limit of 25 transactions. Upgrade to Pro for unlimited access.
        </p>
        <ul className="space-y-3 mb-8">
          {['Unlimited transactions', 'All tax years', 'PDF tax reports', 'All EU countries', 'Priority support'].map(f => (
            <li key={f} className="flex items-center gap-2 text-gray-300">
              <svg className="w-4 h-4 text-indigo-400 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3"><polyline points="20 6 9 17 4 12"/></svg>
              {f}
            </li>
          ))}
        </ul>
        <div className="text-center mb-4">
          <span className="text-3xl font-bold text-white">$29.99</span>
          <span className="text-gray-400">/year</span>
        </div>
        <button className="w-full py-3 bg-indigo-600 hover:bg-indigo-500 text-white font-semibold rounded-xl transition-colors">
          Upgrade Now
        </button>
        <p className="text-xs text-gray-500 text-center mt-3">Cancel anytime. 7-day money-back guarantee.</p>
      </div>
    </div>
  );
}
