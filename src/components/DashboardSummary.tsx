import React from 'react';
import { PortfolioCard } from './PortfolioCard';
import { DashboardMetrics } from '@/hooks/useDashboardMetrics';
import { UI_CONSTANTS } from '@/constants/financial';

interface DashboardSummaryProps {
  metrics: DashboardMetrics;
  showSP500: boolean;
  showWithoutFees: boolean;
}

/**
 * Dashboard summary component that displays portfolio metrics
 * Uses the centralized DashboardMetrics for consistent calculations
 */
export const DashboardSummary: React.FC<DashboardSummaryProps> = ({
  metrics,
  showSP500,
  showWithoutFees,
}) => {
  const getGridClasses = () => {
    if (showSP500 && showWithoutFees) return `grid-cols-1 gap-4 sm:gap-6 ${UI_CONSTANTS.THREE_COLUMNS}`;
    if (showSP500 || showWithoutFees) return `grid-cols-1 gap-4 sm:gap-6 ${UI_CONSTANTS.TWO_COLUMNS}`;
    return `grid-cols-1 gap-4 sm:gap-6 ${UI_CONSTANTS.SINGLE_COLUMN}`;
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

      {/* S&P 500 Alternative Card */}
      {showSP500 && (
        <PortfolioCard
          title="S&P 500 Alternative"
          badge="BENCHMARK"
          badgeColor="bg-purple-600"
          backgroundColor="bg-purple-50"
          borderColor="border-purple-500"
          annualReturn={metrics.sp500Return}
          currentBalance={metrics.sp500Value}
          principalInvested={metrics.principalInvested}
          investmentGains={metrics.sp500Gains}
          additionalMetric={{
            label: metrics.isOutperforming ? 'Outperformed by' : 'Underperformed by',
            value: metrics.outperformanceAmount,
            color: metrics.isOutperforming ? UI_CONSTANTS.COLORS.SUCCESS : UI_CONSTANTS.COLORS.ERROR,
          }}
        />
      )}
    </div>
  );
};
