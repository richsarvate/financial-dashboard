import { useMemo } from 'react';
import { PerformanceData, AccountData } from '@/types/financial';
import { DynamicBenchmarkMetrics } from '@/types/benchmarks';
import { FinancialCalculator } from '@/utils/financialCalculations';
import { BENCHMARK_CONFIGS, calculateBenchmarkPerformance } from '@/config/benchmarks';

export interface ScalableDashboardMetrics {
  // Core portfolio metrics (unchanged)
  currentBalance: number;
  principalInvested: number;
  timePeriodYears: number;
  actualInvestmentGains: number;
  actualAnnualReturn: number;
  totalFees: number;
  
  // Portfolio without fees metrics (unchanged)
  portfolioWithoutFeesValue: number;
  portfolioWithoutFeesGains: number;
  portfolioWithoutFeesReturn: number;
  
  // Dynamic benchmarks - this scales to any number
  benchmarks: DynamicBenchmarkMetrics;
  
  // Best/worst performing benchmarks for quick insights
  bestPerformingBenchmark: { id: string; outperformance: number } | null;
  worstPerformingBenchmark: { id: string; underperformance: number } | null;
}

export function useScalableDashboardMetrics(
  performanceData: PerformanceData | null,
  accountData: AccountData | null,
  activeBenchmarks: Set<string>
): ScalableDashboardMetrics | null {
  return useMemo(() => {
    if (!performanceData || !accountData) {
      return null;
    }

    const timeSeriesData = performanceData.timeSeriesData || [];
    
    // Core calculations (unchanged)
    const currentBalance = FinancialCalculator.getCurrentBalance(
      timeSeriesData, 
      accountData.currentBalance
    );
    
    const principalInvested = FinancialCalculator.calculatePrincipalInvested(timeSeriesData);
    const timePeriodYears = FinancialCalculator.calculateTimePeriodFromSeries(timeSeriesData);
    
    const actualInvestmentGains = FinancialCalculator.calculateInvestmentGains(
      currentBalance, 
      principalInvested
    );
    const actualAnnualReturn = FinancialCalculator.calculateAnnualizedReturn(
      currentBalance,
      principalInvested,
      timePeriodYears
    );
    
    const totalFees = performanceData.fees || 0;
    
    const portfolioWithoutFeesValue = currentBalance + totalFees;
    const portfolioWithoutFeesGains = FinancialCalculator.calculateInvestmentGains(
      portfolioWithoutFeesValue,
      principalInvested
    );
    const portfolioWithoutFeesReturn = FinancialCalculator.calculateAnnualizedReturn(
      portfolioWithoutFeesValue,
      principalInvested,
      timePeriodYears
    );
    
    // Dynamic benchmark calculations
    const benchmarks: DynamicBenchmarkMetrics = {};
    const benchmarkPerformances: Array<{ id: string; outperformance: number }> = [];
    
    activeBenchmarks.forEach((benchmarkId) => {
      if (BENCHMARK_CONFIGS[benchmarkId]) {
        const benchmarkResult = calculateBenchmarkPerformance(
          benchmarkId,
          timeSeriesData,
          principalInvested
        );
        
        const benchmarkGains = FinancialCalculator.calculateInvestmentGains(
          benchmarkResult.value,
          principalInvested
        );
        
        benchmarks[benchmarkId] = {
          value: benchmarkResult.value,
          gains: benchmarkGains,
          return: benchmarkResult.return
        };
        
        // Track performance vs this benchmark
        const outperformance = actualInvestmentGains - benchmarkGains;
        benchmarkPerformances.push({ id: benchmarkId, outperformance });
      }
    });
    
    // Find best and worst performing benchmarks
    let bestPerformingBenchmark = null;
    let worstPerformingBenchmark = null;
    
    if (benchmarkPerformances.length > 0) {
      benchmarkPerformances.sort((a, b) => b.outperformance - a.outperformance);
      bestPerformingBenchmark = benchmarkPerformances[0];
      
      // For worst performing, convert outperformance to underperformance
      const worstBenchmark = benchmarkPerformances[benchmarkPerformances.length - 1];
      worstPerformingBenchmark = {
        id: worstBenchmark.id,
        underperformance: -worstBenchmark.outperformance // Negative outperformance = positive underperformance
      };
    }
    
    return {
      currentBalance,
      principalInvested,
      timePeriodYears,
      actualInvestmentGains,
      actualAnnualReturn,
      totalFees,
      portfolioWithoutFeesValue,
      portfolioWithoutFeesGains,
      portfolioWithoutFeesReturn,
      benchmarks,
      bestPerformingBenchmark,
      worstPerformingBenchmark,
    };
  }, [performanceData, accountData, activeBenchmarks]);
}
