/**
 * Nancy Pelosi Historical Trading Data
 * Based on disclosed congressional trades from CapitalTrades.com
 * Simplified model tracking major positions and their timing
 */

export interface PelosiTrade {
  date: string;        // Trade execution date (YYYY-MM-DD)
  symbol: string;      // Stock symbol
  action: 'BUY' | 'SELL';
  amountMin: number;   // Minimum disclosed amount ($)
  amountMax: number;   // Maximum disclosed amount ($)
  price?: number;      // Price per share if disclosed
}

/**
 * Historical trades based on congressional disclosures
 * Focusing on major positions that drive portfolio performance
 */
export const PELOSI_HISTORICAL_TRADES: PelosiTrade[] = [
  // 2021 - Initial major tech positions
  { date: '2021-10-15', symbol: 'NVDA', action: 'BUY', amountMin: 1000000, amountMax: 5000000 },
  { date: '2021-11-20', symbol: 'AAPL', action: 'BUY', amountMin: 5000000, amountMax: 25000000 },
  { date: '2021-12-10', symbol: 'GOOGL', action: 'BUY', amountMin: 1000000, amountMax: 5000000 },
  
  // 2022 - Building positions during tech decline
  { date: '2022-03-15', symbol: 'AMZN', action: 'BUY', amountMin: 1000000, amountMax: 5000000 },
  { date: '2022-06-20', symbol: 'NVDA', action: 'BUY', amountMin: 500000, amountMax: 1000000 },
  { date: '2022-09-10', symbol: 'AAPL', action: 'BUY', amountMin: 1000000, amountMax: 5000000 },
  
  // 2023 - Major AI/Tech rally year
  { date: '2023-01-15', symbol: 'NVDA', action: 'BUY', amountMin: 1000000, amountMax: 5000000 },
  { date: '2023-04-20', symbol: 'GOOGL', action: 'BUY', amountMin: 500000, amountMax: 1000000 },
  { date: '2023-07-10', symbol: 'MSFT', action: 'BUY', amountMin: 1000000, amountMax: 5000000 },
  
  // 2024 - Diversification and new positions
  { date: '2024-06-24', symbol: 'AVGO', action: 'BUY', amountMin: 1000000, amountMax: 5000000, price: 80.00 },
  { date: '2024-07-26', symbol: 'NVDA', action: 'BUY', amountMin: 1000000, amountMax: 5000000 },
  { date: '2024-07-26', symbol: 'MSFT', action: 'SELL', amountMin: 1000000, amountMax: 5000000 },
  { date: '2024-12-19', symbol: 'PANW', action: 'BUY', amountMin: 1000000, amountMax: 5000000, price: 100.00 },
  
  // 2025 - Recent trades
  { date: '2025-01-13', symbol: 'NVDA', action: 'BUY', amountMin: 250000, amountMax: 500000 },
  { date: '2025-01-13', symbol: 'GOOGL', action: 'BUY', amountMin: 250000, amountMax: 500000 },
  { date: '2025-01-13', symbol: 'AMZN', action: 'BUY', amountMin: 250000, amountMax: 500000 },
  { date: '2025-01-13', symbol: 'TEM', action: 'BUY', amountMin: 50000, amountMax: 100000 },
  { date: '2025-01-13', symbol: 'VST', action: 'BUY', amountMin: 500000, amountMax: 1000000 },
  { date: '2025-01-30', symbol: 'AAPL', action: 'SELL', amountMin: 5000000, amountMax: 25000000, price: 250.42 },
  { date: '2025-01-30', symbol: 'NVDA', action: 'SELL', amountMin: 1000000, amountMax: 5000000, price: 134.29 },
  { date: '2025-06-19', symbol: 'AVGO', action: 'BUY', amountMin: 1000000, amountMax: 5000000, price: 80.00 },
];

/**
 * NOTE: All Pelosi portfolio calculations are now centralized in src/config/benchmarks.ts
 * using the calculateBenchmarkPerformance('PELOSI', ...) function.
 * 
 * This file now only contains the historical trade data for reference purposes.
 * The actual portfolio performance calculations use the BENCHMARK_MONTHLY_RETURNS
 * configuration in benchmarks.ts to ensure consistency between dashboard and chart.
 */
