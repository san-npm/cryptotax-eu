'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartIcon, UploadIcon, ListIcon, WalletIcon, SettingsIcon, PlusIcon } from './Icons';

const NAV = [
  { href: '/', label: 'Dashboard', icon: ChartIcon },
  { href: '/import', label: 'Import CSV', icon: UploadIcon },
  { href: '/transactions', label: 'Transactions', icon: ListIcon },
  { href: '/transactions/add', label: 'Add Transaction', icon: PlusIcon },
  { href: '/tax', label: 'Tax Report', icon: ChartIcon },
  { href: '/portfolio', label: 'Portfolio', icon: WalletIcon },
  { href: '/settings', label: 'Settings', icon: SettingsIcon },
];

export default function Sidebar() {
  const pathname = usePathname();
  return (
    <aside className="hidden lg:flex flex-col w-64 bg-gray-900/50 border-r border-gray-800 min-h-screen p-4">
      <Link href="/" className="flex items-center gap-2 mb-8 px-3">
        <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
          <svg className="w-5 h-5 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M12 2L2 7l10 5 10-5-10-5z"/><path d="M2 17l10 5 10-5"/><path d="M2 12l10 5 10-5"/></svg>
        </div>
        <span className="text-lg font-bold text-white">CryptoTax.eu</span>
      </Link>
      <nav className="flex-1 space-y-1">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors ${active ? 'bg-indigo-600/20 text-indigo-400' : 'text-gray-400 hover:text-white hover:bg-gray-800/50'}`}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </nav>
      <div className="mt-auto p-3 bg-gray-800/50 rounded-xl">
        <p className="text-xs text-gray-500">Free Tier</p>
        <p className="text-xs text-gray-400 mt-1">25 transactions max</p>
      </div>
    </aside>
  );
}
