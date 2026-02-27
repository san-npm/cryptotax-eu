import Papa from 'papaparse';
import { v4 as uuidv4 } from 'uuid';
import { Transaction, TransactionType, CSVImportPreview } from './types';

type ExchangeDetector = {
  name: string;
  detect: (headers: string[]) => boolean;
  parse: (row: Record<string, string>) => Partial<Transaction> | null;
};

const normalizeHeader = (h: string) => h.trim().toLowerCase().replace(/[^a-z0-9]/g, '');

const exchanges: ExchangeDetector[] = [
  {
    name: 'Binance',
    detect: (h) => {
      const norm = h.map(normalizeHeader);
      return norm.includes('operation') || (norm.includes('coin') && norm.includes('change'));
    },
    parse: (row) => {
      const date = row['UTC_Time'] || row['Date(UTC)'] || row['Date'];
      const op = (row['Operation'] || row['Type'] || '').toLowerCase();
      const asset = row['Coin'] || row['Asset'] || '';
      const amount = Math.abs(parseFloat(row['Change'] || row['Amount'] || '0'));
      let type: TransactionType = 'buy';
      if (op.includes('sell') || op.includes('withdraw')) type = 'sell';
      else if (op.includes('swap')) type = 'swap';
      else if (op.includes('staking') || op.includes('interest')) type = 'staking_reward';
      else if (op.includes('transfer') || op.includes('deposit')) type = 'transfer';
      return { date, type, asset: asset.toUpperCase(), amount, fee: 0, exchange: 'Binance', currency: 'EUR' as const };
    },
  },
  {
    name: 'Kraken',
    detect: (h) => {
      const norm = h.map(normalizeHeader);
      return norm.includes('txid') || norm.includes('refid') || (norm.includes('pair') && norm.includes('vol'));
    },
    parse: (row) => {
      const date = row['time'] || row['closetm'] || '';
      const pairType = (row['type'] || '').toLowerCase();
      const asset = (row['pair'] || row['asset'] || '').replace(/EUR|USD|GBP/i, '').toUpperCase();
      const amount = Math.abs(parseFloat(row['vol'] || row['amount'] || '0'));
      const price = parseFloat(row['price'] || row['cost'] || '0');
      const fee = parseFloat(row['fee'] || '0');
      let type: TransactionType = pairType === 'sell' ? 'sell' : 'buy';
      if (pairType.includes('staking')) type = 'staking_reward';
      return { date, type, asset, amount, pricePerUnit: price, fee, exchange: 'Kraken', currency: 'EUR' as const };
    },
  },
  {
    name: 'Coinbase',
    detect: (h) => {
      const norm = h.map(normalizeHeader);
      return norm.includes('timestamp') && (norm.includes('transactiontype') || norm.includes('assetname'));
    },
    parse: (row) => {
      const date = row['Timestamp'] || row['Date'] || '';
      const txType = (row['Transaction Type'] || row['Type'] || '').toLowerCase();
      const asset = (row['Asset'] || row['Asset Name'] || '').toUpperCase();
      const amount = Math.abs(parseFloat(row['Quantity Transacted'] || row['Amount'] || '0'));
      const price = parseFloat(row['Spot Price at Transaction'] || row['Price'] || '0');
      const fee = parseFloat(row['Fees and/or Spread'] || row['Fee'] || '0');
      let type: TransactionType = 'buy';
      if (txType.includes('sell')) type = 'sell';
      else if (txType.includes('swap') || txType.includes('convert')) type = 'swap';
      else if (txType.includes('reward') || txType.includes('staking')) type = 'staking_reward';
      else if (txType.includes('send') || txType.includes('receive')) type = 'transfer';
      return { date, type, asset, amount, pricePerUnit: price, fee, exchange: 'Coinbase', currency: 'EUR' as const };
    },
  },
  {
    name: 'KuCoin',
    detect: (h) => {
      const norm = h.map(normalizeHeader);
      return norm.includes('oid') || (norm.includes('symbol') && norm.includes('dealfunds'));
    },
    parse: (row) => {
      const date = row['tradeCreatedAt'] || row['Time'] || row['Created Date'] || '';
      const side = (row['side'] || row['Direction'] || row['Type'] || '').toLowerCase();
      const symbol = row['symbol'] || row['Symbol'] || '';
      const asset = symbol.split('-')[0]?.toUpperCase() || '';
      const amount = Math.abs(parseFloat(row['size'] || row['Amount'] || '0'));
      const price = parseFloat(row['price'] || row['Price'] || '0');
      const fee = parseFloat(row['fee'] || row['Fee'] || '0');
      const type: TransactionType = side === 'sell' ? 'sell' : 'buy';
      return { date, type, asset, amount, pricePerUnit: price, fee, exchange: 'KuCoin', currency: 'EUR' as const };
    },
  },
];

export function parseCSV(csvText: string): CSVImportPreview {
  const result = Papa.parse<Record<string, string>>(csvText, {
    header: true,
    skipEmptyLines: true,
    dynamicTyping: false,
  });

  if (result.errors.length > 0 && result.data.length === 0) {
    return { exchange: 'Unknown', transactions: [], errors: result.errors.map(e => e.message), warnings: [] };
  }

  const headers = result.meta.fields || [];
  const errors: string[] = [];
  const warnings: string[] = [];

  let detector = exchanges.find(e => e.detect(headers));
  if (!detector) {
    warnings.push('Could not auto-detect exchange. Attempting generic parse.');
    detector = {
      name: 'Generic',
      detect: () => true,
      parse: (row) => {
        const vals = Object.values(row);
        const keys = Object.keys(row).map(k => k.toLowerCase());
        const dateIdx = keys.findIndex(k => k.includes('date') || k.includes('time'));
        const typeIdx = keys.findIndex(k => k.includes('type') || k.includes('side'));
        const assetIdx = keys.findIndex(k => k.includes('asset') || k.includes('coin') || k.includes('symbol'));
        const amountIdx = keys.findIndex(k => k.includes('amount') || k.includes('quantity') || k.includes('vol'));
        const priceIdx = keys.findIndex(k => k.includes('price') || k.includes('cost'));
        const feeIdx = keys.findIndex(k => k.includes('fee'));
        return {
          date: dateIdx >= 0 ? vals[dateIdx] : '',
          type: (typeIdx >= 0 ? vals[typeIdx]?.toLowerCase() : 'buy') as TransactionType,
          asset: assetIdx >= 0 ? (vals[assetIdx] || '').toUpperCase() : '',
          amount: amountIdx >= 0 ? Math.abs(parseFloat(vals[amountIdx] || '0')) : 0,
          pricePerUnit: priceIdx >= 0 ? parseFloat(vals[priceIdx] || '0') : 0,
          fee: feeIdx >= 0 ? parseFloat(vals[feeIdx] || '0') : 0,
          exchange: 'Generic',
          currency: 'EUR' as const,
        };
      },
    };
  }

  const transactions: Partial<Transaction>[] = [];
  result.data.forEach((row, i) => {
    try {
      const tx = detector!.parse(row);
      if (tx && tx.asset && tx.amount && tx.amount > 0) {
        transactions.push({ ...tx, id: uuidv4() });
      } else if (tx?.amount === 0 || !tx?.asset) {
        warnings.push(`Row ${i + 2}: Skipped (zero amount or missing asset)`);
      }
    } catch {
      errors.push(`Row ${i + 2}: Failed to parse`);
    }
  });

  return { exchange: detector.name, transactions, errors, warnings };
}

export function finalizeTransactions(previews: Partial<Transaction>[]): Transaction[] {
  return previews.filter(t => t.asset && t.amount && t.date).map(t => ({
    id: t.id || uuidv4(),
    date: new Date(t.date!).toISOString(),
    type: t.type || 'buy',
    asset: t.asset!.toUpperCase(),
    amount: t.amount!,
    pricePerUnit: t.pricePerUnit || 0,
    fee: t.fee || 0,
    exchange: t.exchange,
    notes: t.notes,
    currency: t.currency || 'EUR',
    originalPrice: t.originalPrice,
  }));
}
