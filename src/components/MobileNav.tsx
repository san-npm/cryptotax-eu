'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { ChartIcon, UploadIcon, ListIcon, SettingsIcon } from './Icons';

const NAV = [
  { href: '/', label: 'Home', icon: ChartIcon },
  { href: '/import', label: 'Import', icon: UploadIcon },
  { href: '/transactions', label: 'Txns', icon: ListIcon },
  { href: '/tax', label: 'Tax', icon: ChartIcon },
  { href: '/settings', label: 'More', icon: SettingsIcon },
];

export default function MobileNav() {
  const pathname = usePathname();
  return (
    <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-gray-900/95 border-t border-gray-800 backdrop-blur-sm z-40">
      <div className="flex justify-around py-2">
        {NAV.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link key={href} href={href} className={`flex flex-col items-center gap-1 px-3 py-1 text-xs ${active ? 'text-indigo-400' : 'text-gray-500'}`}>
              <Icon className="w-5 h-5" />
              {label}
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
