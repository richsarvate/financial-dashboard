import { useMemo } from 'react';
import { PerformanceData, AccountData } from '@/types/financial';
import { FinancialCalculator } from '@/utils/financialCalculations';

export interface DashboardMetrics {
  // Data sources
  currentBalance: number;
  principalInvested: number;
  timePeriodYears: number;
  
  // Actual portfolio metrics
  actualInvestmentGains: number;
  actualAnnualReturn: number;
  totalFees: number;
  
  // Portfolio without fees metrics
  portfolioWithoutFeesValue: number;
  portfolioWithoutFeesGains: number;
  portfolioWithoutFeesReturn: number;
  
  // S&P 500 benchmark metrics
  sp500Value: number;
  sp500Gains: number;
  sp500Return: number;
  
  // VFIFX benchmark metrics
  vfifxValue: number;
  vfifxGains: number;
  vfifxReturn: number;
  
  // Nancy Pelosi benchmark metrics
  pelosiValue: number;
  pelosiGains: number;
  pelosiReturn: number;
  
  // QQQ (NASDAQ 100) benchmark metrics
  qqqValue: number;
  qqqGains: number;
  qqqReturn: number;
  
  // VTI (Total Stock Market) benchmark metrics
  vtiValue: number;
  vtiGains: number;
  vtiReturn: number;
  
  // Comparison metrics
  outperformanceAmount: number;
  isOutperforming: boolean;
}

/**
 * Custom hook to calculate all dashboard metrics consistently
 * Centralizes all financial calculations and ensures data consistency
 */
export function useDashboardMetrics(
  performanceData: PerformanceData | null,
  accountData: AccountData | null
): DashboardMetrics | null {
  return useMemo(() => {
    if (!performanceData || !accountData) {
      return null;
    }

    const timeSeriesData = performanceData.timeSeriesData || [];
    
    // Core data extraction
    const currentBalance = FinancialCalculator.getCurrentBalance(
      timeSeriesData, 
      accountData.currentBalance
    );
    
    const principalInvested = FinancialCalculator.calculatePrincipalInvested(timeSeriesData);
    
    const timePeriodYears = FinancialCalculator.calculateTimePeriodFromSeries(timeSeriesData);
    
    const totalFees = performanceData.fees || 0;
    
    // Actual portfolio calculations
    const actualInvestmentGains = FinancialCalculator.calculateInvestmentGains(
      currentBalance, 
      principalInvested
    );
    
    const actualAnnualReturn = FinancialCalculator.calculateAnnualizedReturn(
      currentBalance,
      principalInvested,
      timePeriodYears
    );
    
    // Portfolio without fees calculations
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
    
    // S&P 500 benchmark calculations
    const sp500Value = FinancialCalculator.getSP500Value(timeSeriesData, principalInvested);
    const sp500Gains = FinancialCalculator.calculateInvestmentGains(sp500Value, principalInvested);
    const sp500Return = FinancialCalculator.calculateAnnualizedReturn(
      sp500Value,
      principalInvested,
      timePeriodYears
    );
    
    // VFIFX benchmark calculations
    const vfifxValue = FinancialCalculator.getVFIFXValue(timeSeriesData, principalInvested);
    const vfifxGains = FinancialCalculator.calculateInvestmentGains(vfifxValue, principalInvested);
    const vfifxReturn = FinancialCalculator.calculateAnnualizedReturn(
      vfifxValue,
      principalInvested,
      timePeriodYears
    );
    
    // Nancy Pelosi benchmark calculations
    const pelosiValue = FinancialCalculator.getPelosiValue(timeSeriesData, principalInvested);
    const pelosiGains = FinancialCalculator.calculateInvestmentGains(pelosiValue, principalInvested);
    const pelosiReturn = FinancialCalculator.calculateAnnualizedReturn(
      pelosiValue,
      principalInvested,
      timePeriodYears
    );

    // QQQ (NASDAQ 100) benchmark calculations
    const qqqValue = FinancialCalculator.getQQQValue(timeSeriesData, principalInvested);
    const qqqGains = FinancialCalculator.calculateInvestmentGains(qqqValue, principalInvested);
    const qqqReturn = FinancialCalculator.calculateAnnualizedReturn(
      qqqValue,
      principalInvested,
      timePeriodYears
    );

    // VTI (Total Stock Market) benchmark calculations
    const vtiValue = FinancialCalculator.getVTIValue(timeSeriesData, principalInvested);
    const vtiGains = FinancialCalculator.calculateInvestmentGains(vtiValue, principalInvested);
    const vtiReturn = FinancialCalculator.calculateAnnualizedReturn(
      vtiValue,
      principalInvested,
      timePeriodYears
    );
    
    // Comparison calculations
    const outperformanceAmount = Math.abs(actualInvestmentGains - sp500Gains);
    const isOutperforming = actualInvestmentGains > sp500Gains;
    
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
      sp500Value,
      sp500Gains,
      sp500Return,
      vfifxValue,
      vfifxGains,
      vfifxReturn,
      pelosiValue,
      pelosiGains,
      pelosiReturn,
      qqqValue,
      qqqGains,
      qqqReturn,
      vtiValue,
      vtiGains,
      vtiReturn,
      outperformanceAmount,
      isOutperforming,
    };
  }, [performanceData, accountData]);
}

/**
 * Debug hook to log calculation details for troubleshooting
 */
export function useDebugDashboard(
  accountName: string,
  metrics: DashboardMetrics | null,
  performanceData: PerformanceData | null
) {
  useMemo(() => {
    if (!metrics || !performanceData) return;
    
    const timeSeriesData = performanceData.timeSeriesData || [];
    const mostRecentData = timeSeriesData[timeSeriesData.length - 1];
    
    console.log(`${accountName} Dashboard Calculations:`, {
      // Raw data
      mostRecentDeposits: mostRecentData?.deposits,
      mostRecentWithdrawals: mostRecentData?.withdrawals || 0,
      mostRecentAccountValue: mostRecentData?.accountValue,
      mostRecentSpyValue: mostRecentData?.spyValue,
      
      // Calculated metrics
      principalInvested: metrics.principalInvested,
      currentBalance: metrics.currentBalance,
      actualAnnualReturn: metrics.actualAnnualReturn.toFixed(2) + '%',
      sp500Return: metrics.sp500Return.toFixed(2) + '%',
      timePeriodYears: metrics.timePeriodYears.toFixed(2),
      
      // Data consistency check
      netContributions: performanceData.netContributions,
      principalMatches: Math.abs(metrics.principalInvested - performanceData.netContributions) < 1,
    });
  }, [accountName, metrics, performanceData]);
}
