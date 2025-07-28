export interface BenchmarkConfig {
  id: string;
  name: string;
  shortName: string;
  description: string;
  color: string;
  category: 'INDEX' | 'TARGET_DATE' | 'ETF' | 'MUTUAL_FUND' | 'SECTOR' | 'POLITICAL';
  provider: 'VANGUARD' | 'FIDELITY' | 'BLACKROCK' | 'SPDR' | 'INVESCO' | 'CAPITOLTRADES' | 'OTHER';
}

export interface BenchmarkData {
  [benchmarkId: string]: number; // Maps to the benchmark value for each time point
}

export interface BenchmarkMetrics {
  value: number;
  gains: number;
  return: number;
}

export interface DynamicBenchmarkMetrics {
  [benchmarkId: string]: BenchmarkMetrics;
}
