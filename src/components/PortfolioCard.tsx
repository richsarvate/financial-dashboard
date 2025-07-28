import React from 'react';
import { FinancialFormatter } from '@/utils/financialCalculations';
import { UI_CONSTANTS } from '@/constants/financial';

interface PortfolioCardProps {
  title: string;
  badge: string;
  badgeColor: string;
  backgroundColor: string;
  borderColor: string;
  annualReturn: number;
  currentBalance: number;
  principalInvested: number;
  investmentGains: number;
  additionalMetric?: {
    label: string;
    value: number;
    color?: string;
    isPositive?: boolean;
  };
}

/**
 * Reusable portfolio card component for dashboard metrics
 */
export const PortfolioCard: React.FC<PortfolioCardProps> = ({
  title,
  badge,
  badgeColor,
  backgroundColor,
  borderColor,
  annualReturn,
  currentBalance,
  principalInvested,
  investmentGains,
  additionalMetric,
}) => {
  return (
    <div className={`${backgroundColor} p-4 sm:p-6 rounded-lg border-4 ${borderColor}`}>
      <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
        <h3 className="text-base sm:text-lg font-bold text-gray-900">
          {title}
        </h3>
        <span className={`${badgeColor} text-white text-xs px-2 py-1 rounded-full font-medium w-fit`}>
          {badge}
        </span>
      </div>
      
      <div className="space-y-3 sm:space-y-4">
        <MetricRow
          label="Annual Return"
          value={FinancialFormatter.formatPercentage(annualReturn)}
          valueClass="text-xl sm:text-2xl font-bold text-blue-600"
        />
        
        <MetricRow
          label={badge === 'ACTUAL' ? 'Current Account Balance' : 'Hypothetical Balance'}
          value={FinancialFormatter.formatCurrency(currentBalance)}
          valueClass="text-lg sm:text-xl font-bold text-gray-900"
        />
        
        <MetricRow
          label="Principal Invested"
          value={FinancialFormatter.formatCurrency(principalInvested)}
          valueClass="text-base text-gray-700"
        />
        
        <MetricRow
          label="Investment Gains"
          value={FinancialFormatter.formatCurrency(investmentGains)}
          valueClass={`text-base font-medium ${
            investmentGains >= 0 ? UI_CONSTANTS.COLORS.SUCCESS : UI_CONSTANTS.COLORS.ERROR
          }`}
        />
        
        {additionalMetric && (
          <AdditionalMetricRow {...additionalMetric} />
        )}
      </div>
    </div>
  );
};

interface MetricRowProps {
  label: string;
  value: string;
  valueClass: string;
}

const MetricRow: React.FC<MetricRowProps> = ({ label, value, valueClass }) => (
  <div>
    <p className="text-sm text-gray-600">{label}</p>
    <p className={valueClass}>{value}</p>
  </div>
);

interface AdditionalMetricRowProps {
  label: string;
  value: number;
  color?: string;
  isPositive?: boolean;
}

const AdditionalMetricRow: React.FC<AdditionalMetricRowProps> = ({
  label,
  value,
  color,
  isPositive,
}) => {
  const formatValue = () => {
    if (label.includes('Fee')) {
      return `-${FinancialFormatter.formatCurrency(Math.abs(value))}`;
    } else if (label.includes('Saved') || isPositive) {
      return `+${FinancialFormatter.formatCurrency(Math.abs(value))}`;
    }
    return FinancialFormatter.formatCurrency(value);
  };

  return (
    <MetricRow
      label={label}
      value={formatValue()}
      valueClass={`text-base ${color || UI_CONSTANTS.COLORS.ERROR}`}
    />
  );
};
