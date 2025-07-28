import React from 'react';
import { PortfolioCard } from './PortfolioCard';
import { DashboardMetrics } from '@/hooks/useDashboardMetrics';
import { BENCHMARK_CONFIGS } from '@/config/benchmarks';
import { UI_CONSTANTS } from '@/constants/financial';

interface DashboardSummaryProps {
  metrics: DashboardMetrics;
  activeBenchmarks: Set<string>;
  showWithoutFees: boolean;
}

/**
 * Dashboard summary component that displays portfolio metrics
 * Uses the centralized DashboardMetrics for consistent calculations
 */
export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  metrics,
  activeBenchmarks,
  showWithoutFees,
}) => {
  const getGridClasses = () => {
    const activeToggleCount = activeBenchmarks.size + (showWithoutFees ? 1 : 0);
    
    if (activeToggleCount >= 2) return `grid-cols-1 gap-6 sm:gap-8 ${UI_CONSTANTS.THREE_COLUMNS}`;
    if (activeToggleCount === 1) return `grid-cols-1 gap-6 sm:gap-8 ${UI_CONSTANTS.TWO_COLUMNS}`;
    return `grid-cols-1 gap-6 sm:gap-8 ${UI_CONSTANTS.SINGLE_COLUMN}`;
  };

  return (
    <div className={`grid ${getGridClasses()}`}>
      {/* Actual Portfolio Card */}
      <PortfolioCard
        title="Your Actual Portfolio"
        badge="ACTUAL"
        badgeColor="bg-gray-600"
        backgroundColor="bg-gray-50"
        borderColor="border-gray-800"
        annualReturn={metrics.actualAnnualReturn}
        currentBalance={metrics.currentBalance}
        principalInvested={metrics.principalInvested}
        investmentGains={metrics.actualInvestmentGains}
        additionalMetric={{
          label: 'Total Fees Paid',
          value: metrics.totalFees,
          color: UI_CONSTANTS.COLORS.ERROR,
        }}
      />

      {/* Portfolio Without Fees Card */}
      {showWithoutFees && (
        <PortfolioCard
          title="Portfolio Without Fees"
          badge="NO FEES"
          badgeColor="bg-green-600"
          backgroundColor="bg-green-50"
          borderColor="border-green-500"
          annualReturn={metrics.portfolioWithoutFeesReturn}
          currentBalance={metrics.portfolioWithoutFeesValue}
          principalInvested={metrics.principalInvested}
          investmentGains={metrics.portfolioWithoutFeesGains}
          additionalMetric={{
            label: 'Fees Saved',
            value: metrics.totalFees,
            color: 'text-green-600',
            isPositive: true,
          }}
        />
      )}

      {/* Dynamic Benchmark Cards */}
      {Array.from(activeBenchmarks).map(benchmarkId => {
        const config = BENCHMARK_CONFIGS[benchmarkId];
        if (!config) return null;
        
        // Map benchmark metrics dynamically
        const benchmarkMetrics = benchmarkId === 'SP500' ? {
          value: metrics.sp500Value,
          gains: metrics.sp500Gains,
          return: metrics.sp500Return
        } : benchmarkId === 'VFIFX' ? {
          value: metrics.vfifxValue,
          gains: metrics.vfifxGains,
          return: metrics.vfifxReturn
        } : benchmarkId === 'PELOSI' ? {
          value: metrics.pelosiValue,
          gains: metrics.pelosiGains,
          return: metrics.pelosiReturn
        } : {
          value: metrics.principalInvested,
          gains: 0,
          return: 0
        };
        
        const isOutperforming = metrics.actualInvestmentGains > benchmarkMetrics.gains;
        
        return (
          <PortfolioCard
            key={benchmarkId}
            title={`${config.name} Alternative`}
            badge={config.category}
            badgeColor={`bg-[${config.color}]`}
            backgroundColor={config.color + '10'} // Light version
            borderColor={`border-[${config.color}]`}
            annualReturn={benchmarkMetrics.return}
            currentBalance={benchmarkMetrics.value}
            principalInvested={metrics.principalInvested}
            investmentGains={benchmarkMetrics.gains}
            additionalMetric={{
              label: isOutperforming ? 'Outperformed by' : 'Underperformed by',
              value: Math.abs(metrics.actualInvestmentGains - benchmarkMetrics.gains),
              color: isOutperforming ? UI_CONSTANTS.COLORS.SUCCESS : UI_CONSTANTS.COLORS.ERROR,
            }}
          />
        );
      })}
    </div>
  );
};
