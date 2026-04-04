export interface MarketData {
  price: number;
  change: number;
  rsi: number;
  sd: number; // Standard Deviation level (e.g. 2.5)
  probability: number;
  volumePOC: boolean;
  rvi: number;
  trend: 'up' | 'down' | 'neutral';
}

export interface CurrencyStrength {
  symbol: string;
  strength: number; // 0 to 10
}

export interface EconomicEvent {
  time: string;
  impact: 1 | 2 | 3; // Bulls
  event: string;
  currency: string;
}
