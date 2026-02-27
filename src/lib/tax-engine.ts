import { Transaction, TaxMethod, Country, GainLoss, TaxSummary, TaxLot, PortfolioHolding } from './types';
import { v4 as uuidv4 } from 'uuid';

function daysBetween(d1: string, d2: string): number {
  return Math.floor((new Date(d2).getTime() - new Date(d1).getTime()) / (1000 * 60 * 60 * 24));
}

function applyCountryRules(gain: GainLoss, country: Country): GainLoss {
  const result = { ...gain };
  switch (country) {
    case 'france':
      result.taxable = true;
      result.taxRate = 0.30;
      result.taxAmount = Math.max(0, result.gain * 0.30);
      break;
    case 'germany':
      result.taxable = result.holdingDays < 365;
      result.taxRate = result.taxable ? 0.26375 : 0; // ~26.375% with solidarity surcharge
      result.taxAmount = result.taxable ? Math.max(0, result.gain * 0.26375) : 0;
      break;
    case 'luxembourg':
      result.taxable = result.holdingDays < 183;
      result.taxRate = result.taxable ? 0.20 : 0;
      result.taxAmount = result.taxable ? Math.max(0, result.gain * 0.20) : 0;
      break;
    case 'belgium':
      result.taxable = false; // normal management = tax free
      result.taxRate = 0;
      result.taxAmount = 0;
      break;
    case 'netherlands':
      // Box 3: fictional yield on net assets, not actual gains
      result.taxable = true;
      result.taxRate = 0.36; // 36% on fictional yield (~6.17% in 2024)
      const fictionalYield = result.proceeds * 0.0617;
      result.taxAmount = fictionalYield * 0.36;
      break;
    default:
      result.taxable = true;
      result.taxRate = undefined;
      result.taxAmount = undefined;
  }
  return result;
}

export function calculateTax(
  transactions: Transaction[],
  method: TaxMethod,
  country: Country,
  year?: number
): TaxSummary {
  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const lots: TaxLot[] = [];
  const gains: GainLoss[] = [];

  for (const tx of sorted) {
    if (tx.type === 'buy' || tx.type === 'staking_reward' || tx.type === 'transfer') {
      const costBasis = tx.type === 'staking_reward' ? tx.pricePerUnit : tx.pricePerUnit + (tx.fee / (tx.amount || 1));
      lots.push({
        id: uuidv4(),
        transactionId: tx.id,
        asset: tx.asset,
        amount: tx.amount,
        costBasis,
        date: tx.date,
        remaining: tx.amount,
      });
    } else if (tx.type === 'sell') {
      let remaining = tx.amount;
      const assetLots = lots.filter(l => l.asset === tx.asset && l.remaining > 0);

      if (method === 'lifo') assetLots.reverse();
      
      if (method === 'weighted_average') {
        const totalRemaining = assetLots.reduce((s, l) => s + l.remaining, 0);
        const weightedCost = totalRemaining > 0
          ? assetLots.reduce((s, l) => s + l.costBasis * l.remaining, 0) / totalRemaining
          : 0;

        const sellAmount = Math.min(remaining, totalRemaining);
        if (sellAmount > 0) {
          const proceeds = sellAmount * tx.pricePerUnit - tx.fee;
          const cost = sellAmount * weightedCost;
          const holdingDays = assetLots.length > 0 ? daysBetween(assetLots[0].date, tx.date) : 0;
          
          const gl: GainLoss = {
            asset: tx.asset,
            buyDate: assetLots[0]?.date || tx.date,
            sellDate: tx.date,
            amount: sellAmount,
            costBasis: cost,
            proceeds,
            gain: proceeds - cost,
            holdingDays,
            taxable: true,
          };
          gains.push(applyCountryRules(gl, country));

          // Deplete lots proportionally
          let toDeplete = sellAmount;
          for (const lot of assetLots) {
            if (toDeplete <= 0) break;
            const take = Math.min(lot.remaining, toDeplete);
            lot.remaining -= take;
            toDeplete -= take;
          }
        }
      } else {
        // FIFO or LIFO
        for (const lot of assetLots) {
          if (remaining <= 0) break;
          const take = Math.min(lot.remaining, remaining);
          const proceeds = take * tx.pricePerUnit - (tx.fee * (take / tx.amount));
          const cost = take * lot.costBasis;
          const holdingDays = daysBetween(lot.date, tx.date);

          const gl: GainLoss = {
            asset: tx.asset,
            buyDate: lot.date,
            sellDate: tx.date,
            amount: take,
            costBasis: cost,
            proceeds,
            gain: proceeds - cost,
            holdingDays,
            taxable: true,
          };
          gains.push(applyCountryRules(gl, country));

          lot.remaining -= take;
          remaining -= take;
        }

        if (remaining > 0) {
          // No matching lot - treat as zero cost basis
          const proceeds = remaining * tx.pricePerUnit - (tx.fee * (remaining / tx.amount));
          const gl: GainLoss = {
            asset: tx.asset,
            buyDate: tx.date,
            sellDate: tx.date,
            amount: remaining,
            costBasis: 0,
            proceeds,
            gain: proceeds,
            holdingDays: 0,
            taxable: true,
          };
          gains.push(applyCountryRules(gl, country));
        }
      }
    } else if (tx.type === 'swap') {
      // Treat swap as sell + buy (taxable event)
      let remaining = tx.amount;
      const assetLots = lots.filter(l => l.asset === tx.asset && l.remaining > 0);
      if (method === 'lifo') assetLots.reverse();

      for (const lot of assetLots) {
        if (remaining <= 0) break;
        const take = Math.min(lot.remaining, remaining);
        const proceeds = take * tx.pricePerUnit;
        const cost = take * lot.costBasis;
        const holdingDays = daysBetween(lot.date, tx.date);

        const gl: GainLoss = {
          asset: tx.asset,
          buyDate: lot.date,
          sellDate: tx.date,
          amount: take,
          costBasis: cost,
          proceeds,
          gain: proceeds - cost,
          holdingDays,
          taxable: true,
        };
        gains.push(applyCountryRules(gl, country));
        lot.remaining -= take;
        remaining -= take;
      }
    }
  }

  const targetYear = year || new Date().getFullYear();
  const yearGains = gains.filter(g => new Date(g.sellDate).getFullYear() === targetYear);
  const totalGains = yearGains.filter(g => g.gain > 0).reduce((s, g) => s + g.gain, 0);
  const totalLosses = yearGains.filter(g => g.gain < 0).reduce((s, g) => s + Math.abs(g.gain), 0);
  const taxableGains = yearGains.filter(g => g.taxable && g.gain > 0).reduce((s, g) => s + g.gain, 0);
  const estimatedTax = yearGains.reduce((s, g) => s + (g.taxAmount || 0), 0);

  return {
    year: targetYear,
    country,
    method,
    totalGains,
    totalLosses,
    netGainLoss: totalGains - totalLosses,
    taxableGains,
    estimatedTax,
    details: yearGains,
  };
}

export function calculatePortfolio(transactions: Transaction[]): PortfolioHolding[] {
  const holdings: Record<string, { amount: number; totalCost: number }> = {};

  const sorted = [...transactions].sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  for (const tx of sorted) {
    if (!holdings[tx.asset]) holdings[tx.asset] = { amount: 0, totalCost: 0 };
    const h = holdings[tx.asset];

    if (tx.type === 'buy' || tx.type === 'staking_reward' || tx.type === 'transfer') {
      h.totalCost += tx.amount * tx.pricePerUnit + tx.fee;
      h.amount += tx.amount;
    } else if (tx.type === 'sell') {
      const ratio = Math.min(tx.amount / h.amount, 1);
      h.totalCost *= (1 - ratio);
      h.amount -= tx.amount;
    } else if (tx.type === 'swap') {
      const ratio = Math.min(tx.amount / h.amount, 1);
      h.totalCost *= (1 - ratio);
      h.amount -= tx.amount;
    }

    if (h.amount < 0.00000001) {
      h.amount = 0;
      h.totalCost = 0;
    }
  }

  return Object.entries(holdings)
    .filter(([, h]) => h.amount > 0.00000001)
    .map(([asset, h]) => ({
      asset,
      amount: h.amount,
      avgCostBasis: h.amount > 0 ? h.totalCost / h.amount : 0,
    }));
}

export function getAvailableYears(transactions: Transaction[]): number[] {
  const years = new Set<number>();
  transactions.forEach(tx => {
    years.add(new Date(tx.date).getFullYear());
  });
  return Array.from(years).sort((a, b) => b - a);
}
