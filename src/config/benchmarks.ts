import { BenchmarkConfig } from '@/types/benchmarks';

// Centralized benchmark configuration
export const BENCHMARK_CONFIGS: Record<string, BenchmarkConfig> = {
  'SP500': {
    id: 'SP500',
    name: 'S&P 500 Index',
    shortName: 'SPY',
    description: 'Large-cap US stocks',
    color: '#8b5cf6',
    category: 'INDEX',
    provider: 'SPDR'
  },
  'VFIFX': {
    id: 'VFIFX',
    name: 'Target Retirement 2050',
    shortName: 'VFIFX',
    description: 'Age-based allocation',
    color: '#dc2626',
    category: 'TARGET_DATE',
    provider: 'VANGUARD'
  },
  'PELOSI': {
    id: 'PELOSI',
    name: 'Nancy Pelosi Portfolio',
    shortName: 'PELOSI',
    description: 'Congressional trading tracker',
    color: '#1e40af',
    category: 'POLITICAL',
    provider: 'CAPITOLTRADES'
  },
  'QQQ': {
    id: 'QQQ',
    name: 'NASDAQ 100',
    shortName: 'QQQ',
    description: 'Tech-heavy growth stocks',
    color: '#059669',
    category: 'ETF',
    provider: 'INVESCO'
  },
  'VTI': {
    id: 'VTI',
    name: 'Total Stock Market',
    shortName: 'VTI',
    description: 'Broad US market exposure',
    color: '#0891b2',
    category: 'ETF',
    provider: 'VANGUARD'
  }
};

export const BENCHMARK_MONTHLY_RETURNS: Record<string, Record<string, number>> = {
  'SP500': {
    '2021-09': -0.048,
    '2021-10': 0.069,
    '2021-11': -0.008,
    '2021-12': 0.043,
    '2022-01': -0.054,
    '2022-02': -0.030,
    '2022-03': 0.036,
    '2022-04': -0.087,
    '2022-05': 0.005,
    '2022-06': -0.081,
    '2022-07': 0.092,
    '2022-08': -0.041,
    '2022-09': -0.094,
    '2022-10': 0.080,
    '2022-11': 0.055,
    '2022-12': -0.058,
    '2023-01': 0.062,
    '2023-02': -0.025,
    '2023-03': 0.035,
    '2023-04': 0.014,
    '2023-05': 0.005,
    '2023-06': 0.065,
    '2023-07': 0.032,
    '2023-08': -0.017,
    '2023-09': -0.049,
    '2023-10': -0.021,
    '2023-11': 0.089,
    '2023-12': 0.045,
    '2024-01': 0.016,
    '2024-02': 0.053,
    '2024-03': 0.031,
    '2024-04': -0.041,
    '2024-05': 0.049,
    '2024-06': 0.035,
    '2024-07': 0.011,
    '2024-08': 0.023,
    '2024-09': -0.005,
    '2024-10': -0.010,
    '2024-11': 0.055,
    '2024-12': 0.025,
    '2025-01': 0.035,
    '2025-02': 0.025,
    '2025-03': 0.045,
    '2025-04': 0.055,
    '2025-05': 0.035,
    '2025-06': 0.045,
  },
  'PELOSI': {
    '2021-09': 0.048,
    '2021-10': 0.085,
    '2021-11': 0.032,
    '2021-12': 0.067,
    '2022-01': -0.095,
    '2022-02': -0.035,
    '2022-03': 0.025,
    '2022-04': -0.088,
    '2022-05': 0.012,
    '2022-06': -0.078,
    '2022-07': 0.095,
    '2022-08': -0.042,
    '2022-09': -0.098,
    '2022-10': 0.089,
    '2022-11': 0.125,
    '2022-12': -0.065,
    '2023-01': 0.145,
    '2023-02': -0.025,
    '2023-03': 0.078,
    '2023-04': 0.125,
    '2023-05': 0.089,
    '2023-06': 0.065,
    '2023-07': 0.095,
    '2023-08': -0.045,
    '2023-09': -0.055,
    '2023-10': -0.025,
    '2023-11': 0.095,
    '2023-12': 0.045,
    '2024-01': 0.125,
    '2024-02': 0.089,
    '2024-03': 0.035,
    '2024-04': -0.045,
    '2024-05': 0.078,
    '2024-06': 0.095,
    '2024-07': -0.035,
    '2024-08': 0.055,
    '2024-09': -0.025,
    '2024-10': 0.145,
    '2024-11': 0.089,
    '2024-12': 0.125,
    '2025-01': 0.095,
    '2025-02': 0.065,
    '2025-03': 0.075,
    '2025-04': 0.085,
    '2025-05': 0.095,
    '2025-06': 0.115,
  },
};

/**
 * Dynamic benchmark calculation function
 */
export function calculateBenchmarkPerformance(
  benchmarkId: string,
  timeSeriesData: any[],
  principalInvested: number
) {
  if (!timeSeriesData?.length || !BENCHMARK_MONTHLY_RETURNS[benchmarkId]) {
    return { value: principalInvested, return: 0 };
  }

  const startDate = timeSeriesData[0].date;
  const endDate = timeSeriesData[timeSeriesData.length - 1].date;
  
  let benchmarkValue = principalInvested;
  const startMonth = startDate.substring(0, 7);
  const endMonth = endDate.substring(0, 7);
  
  let current = new Date(startMonth + '-01');
  const end = new Date(endMonth + '-01');
  
  while (current <= end) {
    const monthKey = current.toISOString().substring(0, 7);
    const monthlyReturn = BENCHMARK_MONTHLY_RETURNS[benchmarkId][monthKey] || 0;
    benchmarkValue = benchmarkValue * (1 + monthlyReturn);
    current.setMonth(current.getMonth() + 1);
  }
  
  const totalReturn = ((benchmarkValue / principalInvested) - 1) * 100;
  
  return {
    value: Math.max(0, benchmarkValue),
    return: totalReturn
  };
}
