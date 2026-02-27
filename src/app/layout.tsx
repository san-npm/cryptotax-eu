import type { Metadata, Viewport } from 'next';
import { Inter } from 'next/font/google';
import './globals.css';
import Sidebar from '@/components/Sidebar';
import MobileNav from '@/components/MobileNav';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'CryptoTax.eu — EU Crypto Tax Calculator',
  description: 'Calculate your cryptocurrency taxes for EU jurisdictions. Support for France, Germany, Luxembourg, Belgium, Netherlands and more.',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className="dark">
      <body className={`${inter.className} bg-gray-950 text-gray-100 min-h-screen`}>
        <div className="flex min-h-screen">
          <Sidebar />
          <main className="flex-1 p-4 lg:p-8 pb-20 lg:pb-8 overflow-auto">
            {children}
          </main>
        </div>
        <MobileNav />
      </body>
    </html>
  );
}
