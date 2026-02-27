# CryptoTax.eu

A client-side crypto tax calculator focused on EU jurisdictions. Built with Next.js 14, TypeScript, and Tailwind CSS.

## Features

- **CSV Import** — Auto-detect and parse CSVs from Binance, Kraken, Coinbase, KuCoin
- **Manual Entry** — Add buy, sell, swap, transfer, and staking reward transactions
- **Tax Calculations** — FIFO, LIFO, and Weighted Average cost basis methods
- **EU Tax Rules** — Country-specific calculations for France, Germany, Luxembourg, Belgium, Netherlands
- **Portfolio Overview** — Current holdings with live prices from CoinGecko
- **PDF Reports** — Downloadable tax reports with transaction details
- **Dark Mode** — Professional fintech UI with indigo/purple accents
- **PWA** — Installable, works offline
- **Privacy-First** — All data stored locally in IndexedDB, nothing sent to servers

## Country Tax Rules

| Country | Rule |
|---------|------|
| France | 30% flat tax (PFU) on all crypto gains |
| Germany | Tax-free after 1 year holding; otherwise income tax (~26.375%) |
| Luxembourg | Tax-free after 6 months holding for individuals |
| Belgium | Generally tax-free (normal management of private wealth) |
| Netherlands | Box 3 wealth tax on fictional yield (~36% on ~6.17%) |

## Monetization

- **Free**: Up to 25 transactions, 1 tax year
- **Pro** ($29.99/year): Unlimited transactions, all tax years, PDF reports, all countries

## Tech Stack

- Next.js 14 (App Router) with static export
- TypeScript
- Tailwind CSS
- IndexedDB (via `idb`)
- PapaParse (CSV parsing)
- jsPDF + jspdf-autotable (PDF generation)
- CoinGecko API (price data)

## Getting Started

```bash
npm install
npm run dev
```

## Build & Deploy

```bash
npm run build
```

Static export in `out/` — deploy to Vercel, Netlify, or any static host.

## License

MIT
