export type TransactionType = 'buy' | 'sell' | 'swap' | 'transfer' | 'staking_reward';
export type TaxMethod = 'fifo' | 'lifo' | 'weighted_average';
export type Country = 'france' | 'germany' | 'luxembourg' | 'belgium' | 'netherlands' | 'generic';
export type Currency = 'EUR' | 'USD' | 'GBP';

export interface Transaction {
  id: string;
  date: string;
  type: TransactionType;
  asset: string;
  amount: number;
  pricePerUnit: number;
  fee: number;
  exchange?: string;
  notes?: string;
  currency: Currency;
  originalPrice?: number;
}

export interface TaxLot {
  id: string;
  transactionId: string;
  asset: string;
  amount: number;
  costBasis: number;
  date: string;
  remaining: number;
}

export interface GainLoss {
  asset: string;
  buyDate: string;
  sellDate: string;
  amount: number;
  costBasis: number;
  proceeds: number;
  gain: number;
  holdingDays: number;
  taxable: boolean;
  taxRate?: number;
  taxAmount?: number;
}

export interface TaxSummary {
  year: number;
  country: Country;
  method: TaxMethod;
  totalGains: number;
  totalLosses: number;
  netGainLoss: number;
  taxableGains: number;
  estimatedTax: number;
  details: GainLoss[];
}

export interface PortfolioHolding {
  asset: string;
  amount: number;
  avgCostBasis: number;
  currentPrice?: number;
  value?: number;
  unrealizedGain?: number;
}

export interface AppSettings {
  country: Country;
  taxMethod: TaxMethod;
  baseCurrency: Currency;
  isPro: boolean;
}

export interface CSVImportPreview {
  exchange: string;
  transactions: Partial<Transaction>[];
  errors: string[];
  warnings: string[];
}
