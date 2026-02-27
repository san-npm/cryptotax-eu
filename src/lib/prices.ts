const COINGECKO_BASE = 'https://api.coingecko.com/api/v3';

const COIN_IDS: Record<string, string> = {
  BTC: 'bitcoin', ETH: 'ethereum', USDT: 'tether', USDC: 'usd-coin',
  BNB: 'binancecoin', XRP: 'ripple', ADA: 'cardano', SOL: 'solana',
  DOT: 'polkadot', DOGE: 'dogecoin', AVAX: 'avalanche-2', MATIC: 'matic-network',
  LINK: 'chainlink', UNI: 'uniswap', ATOM: 'cosmos', LTC: 'litecoin',
  DAI: 'dai', SHIB: 'shiba-inu', TRX: 'tron', NEAR: 'near',
};

export async function getHistoricalPrice(asset: string, date: string): Promise<number | null> {
  const coinId = COIN_IDS[asset.toUpperCase()];
  if (!coinId) return null;

  const d = new Date(date);
  const dateStr = `${d.getDate().toString().padStart(2, '0')}-${(d.getMonth() + 1).toString().padStart(2, '0')}-${d.getFullYear()}`;

  try {
    const res = await fetch(`${COINGECKO_BASE}/coins/${coinId}/history?date=${dateStr}&localization=false`);
    if (!res.ok) return null;
    const data = await res.json();
    return data?.market_data?.current_price?.eur || null;
  } catch {
    return null;
  }
}

export async function getCurrentPrices(assets: string[]): Promise<Record<string, number>> {
  const ids = assets.map(a => COIN_IDS[a.toUpperCase()]).filter(Boolean);
  if (ids.length === 0) return {};

  try {
    const res = await fetch(`${COINGECKO_BASE}/simple/price?ids=${ids.join(',')}&vs_currencies=eur`);
    if (!res.ok) return {};
    const data = await res.json();
    const result: Record<string, number> = {};
    for (const [asset, coinId] of Object.entries(COIN_IDS)) {
      if (data[coinId]?.eur) result[asset] = data[coinId].eur;
    }
    return result;
  } catch {
    return {};
  }
}

export const EXCHANGE_RATES: Record<string, number> = {
  EUR: 1, USD: 0.92, GBP: 1.16,
};

export function convertToEUR(amount: number, currency: string): number {
  return amount * (EXCHANGE_RATES[currency] || 1);
}
