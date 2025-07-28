'use client';

import React from 'react';
import { FinancialFormatter } from '@/utils/financialCalculations';
import { UI_CONSTANTS } from '@/constants/financial';

interface CompactBenchmarkCardProps {
  title: string;
  shortName: string;
  color: string;
  annualReturn: number;
  currentBalance: number;
  investmentGains: number;
  isOutperforming: boolean;
  outperformanceAmount: number;
}

/**
 * Compact benchmark card for displaying multiple benchmarks in a single row
 * Shows only essential metrics: return, balance, and outperformance
 */
export const CompactBenchmarkCard: React.FC<CompactBenchmarkCardProps> = ({
  title,
  shortName,
  color,
  annualReturn,
  currentBalance,
  investmentGains,
  isOutperforming,
  outperformanceAmount,
}) => {
  return (
    <div 
      className="p-3 rounded-lg border-2 min-w-0 flex-1"
      style={{ 
        backgroundColor: color + '08',
        borderColor: color + '40'
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <h4 className="text-sm font-bold text-gray-900 truncate" title={title}>
          {shortName}
        </h4>
        <div 
          className="text-xs px-2 py-1 rounded-full font-medium"
          style={{ 
            backgroundColor: color + '20',
            color: color
          }}
        >
          ALT
        </div>
      </div>
      
      {/* Key Metrics */}
      <div className="space-y-2">
        {/* Annual Return */}
        <div>
          <p className="text-xs text-gray-600">Return</p>
          <p className="text-lg font-bold" style={{ color: color }}>
            {FinancialFormatter.formatPercentage(annualReturn)}
          </p>
        </div>
        
        {/* Balance */}
        <div>
          <p className="text-xs text-gray-600">Balance</p>
          <p className="text-sm font-semibold text-gray-900">
            {FinancialFormatter.formatCurrency(currentBalance)}
          </p>
        </div>
        
        {/* Outperformance */}
        <div>
          <p className="text-xs text-gray-600">
            {isOutperforming ? 'Beats by' : 'Trails by'}
          </p>
          <p className={`text-sm font-semibold ${
            isOutperforming ? UI_CONSTANTS.COLORS.SUCCESS : UI_CONSTANTS.COLORS.ERROR
          }`}>
            {FinancialFormatter.formatCurrency(Math.abs(outperformanceAmount))}
          </p>
        </div>
      </div>
    </div>
  );
};
