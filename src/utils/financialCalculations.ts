import { FINANCIAL_CONSTANTS } from '@/constants/financial';
import { PerformanceDataPoint } from '@/types/financial';

/**
 * Centralized financial calculation utilities
 * All financial logic should go through these functions for consistency
 */

export class FinancialCalculator {
  /**
   * Safe division that handles edge cases
   */
  private static safeDivide(numerator: number, denominator: number, defaultValue: number = 0): number {
    if (denominator === 0 || !isFinite(denominator) || !isFinite(numerator)) {
      return defaultValue;
    }
    const result = numerator / denominator;
    return isFinite(result) ? result : defaultValue;
  }

  /**
   * Safe power calculation that handles edge cases
   */
  private static safePower(base: number, exponent: number, defaultValue: number = 0): number {
    if (base <= 0 || !isFinite(base) || !isFinite(exponent)) {
      return defaultValue;
    }
    const result = Math.pow(base, exponent);
    return isFinite(result) ? result : defaultValue;
  }

  /**
   * Calculate annualized return using compound growth formula
   * Formula: (Final Value / Initial Value)^(1/years) - 1
   */
  static calculateAnnualizedReturn(
    finalValue: number, 
    initialValue: number, 
    years: number
  ): number {
    // Validate inputs
    if (initialValue <= FINANCIAL_CONSTANTS.MIN_PRINCIPAL_FOR_CALCULATION) {
      return 0;
    }
    
    if (years < FINANCIAL_CONSTANTS.MIN_YEARS_FOR_ANNUALIZED) {
      return 0;
    }

    // Additional safety checks
    if (finalValue < 0 || initialValue < 0 || years <= 0) {
      return 0;
    }
    
    const ratio = this.safeDivide(finalValue, initialValue, 1);
    const annualizedRatio = this.safePower(ratio, this.safeDivide(1, years, 0), 1);
    
    return (annualizedRatio - 1) * 100;
  }

  /**
   * Calculate time period in years from date strings
   */
  static calculateYearsBetweenDates(startDate: string, endDate: string): number {
    try {
      const start = new Date(startDate);
      const end = new Date(endDate);
      
      // Validate dates
      if (isNaN(start.getTime()) || isNaN(end.getTime())) {
        console.warn('Invalid dates provided, using default time period');
        return 1; // Default to 1 year
      }
      
      if (end <= start) {
        console.warn('End date is before start date, using default time period');
        return 1;
      }
      
      const years = this.safeDivide(
        end.getTime() - start.getTime(), 
        FINANCIAL_CONSTANTS.MS_PER_YEAR, 
        1
      );
      
      // Ensure minimum time period
      return Math.max(years, FINANCIAL_CONSTANTS.MIN_YEARS_FOR_ANNUALIZED);
    } catch (error) {
      console.error('Error calculating years between dates:', error);
      return 1;
    }
  }

  /**
   * Validate and sanitize financial input values
   */
  static validateFinancialValue(value: any, defaultValue: number = 0): number {
    if (typeof value !== 'number' || !isFinite(value)) {
      return defaultValue;
    }
    return value;
  }

  /**
   * Calculate principal invested from time series data
   */
  static calculatePrincipalInvested(timeSeriesData: PerformanceDataPoint[]): number {
    if (!timeSeriesData.length) return 0;
    
    const mostRecent = timeSeriesData[timeSeriesData.length - 1];
    if (!mostRecent) return 0;
    
    const deposits = this.validateFinancialValue(mostRecent.deposits, 0);
    const withdrawals = this.validateFinancialValue(mostRecent.withdrawals, 0);
    
    const principal = deposits - withdrawals;
    
    // Ensure principal is not negative (would indicate data error)
    return Math.max(principal, 0);
  }

  /**
   * Get current balance from time series data
   */
  static getCurrentBalance(timeSeriesData: PerformanceDataPoint[], fallbackBalance: number): number {
    if (!timeSeriesData.length) return this.validateFinancialValue(fallbackBalance, 0);
    
    const mostRecent = timeSeriesData[timeSeriesData.length - 1];
    if (!mostRecent) return this.validateFinancialValue(fallbackBalance, 0);
    
    const accountValue = this.validateFinancialValue(mostRecent.accountValue, fallbackBalance);
    
    // Account value should not be negative
    return Math.max(accountValue, 0);
  }

  /**
   * Calculate investment gains (with validation)
   */
  static calculateInvestmentGains(currentValue: number, principalInvested: number): number {
    const validCurrentValue = this.validateFinancialValue(currentValue, 0);
    const validPrincipal = this.validateFinancialValue(principalInvested, 0);
    
    return validCurrentValue - validPrincipal;
  }

  /**
   * Get S&P 500 value from time series data
   */
  static getSP500Value(timeSeriesData: PerformanceDataPoint[], fallbackPrincipal: number): number {
    if (!timeSeriesData.length) return this.validateFinancialValue(fallbackPrincipal, 0);
    
    const mostRecent = timeSeriesData[timeSeriesData.length - 1];
    if (!mostRecent) return this.validateFinancialValue(fallbackPrincipal, 0);
    
    const spyValue = this.validateFinancialValue(mostRecent.spyValue, fallbackPrincipal);
    
    // S&P value should not be negative
    return Math.max(spyValue, 0);
  }

  /**
   * Get VFIFX alternative value from time series data
   */
  static getVFIFXValue(timeSeriesData: PerformanceDataPoint[], fallbackPrincipal: number): number {
    if (!timeSeriesData.length) return this.validateFinancialValue(fallbackPrincipal, 0);
    
    const mostRecent = timeSeriesData[timeSeriesData.length - 1];
    if (!mostRecent) return this.validateFinancialValue(fallbackPrincipal, 0);
    
    // Check if vfifxValue exists in the data
    const vfifxValue = mostRecent.vfifxValue ?? fallbackPrincipal;
    const validatedValue = this.validateFinancialValue(vfifxValue, fallbackPrincipal);
    
    // VFIFX value should not be negative
    return Math.max(validatedValue, 0);
  }

  /**
   * Calculate time period from time series data
   */
  static calculateTimePeriodFromSeries(timeSeriesData: PerformanceDataPoint[]): number {
    if (!timeSeriesData.length) {
      console.warn('No time series data available, using default time period');
      return 1;
    }
    
    const firstPoint = timeSeriesData[0];
    const lastPoint = timeSeriesData[timeSeriesData.length - 1];
    
    if (!firstPoint || !lastPoint) {
      console.warn('Invalid time series data points, using default time period');
      return 1;
    }

    const startDate = firstPoint?.date || FINANCIAL_CONSTANTS.DEFAULT_START_DATE;
    const endDate = lastPoint?.date || FINANCIAL_CONSTANTS.DEFAULT_END_DATE;
    
    const timePeriod = this.calculateYearsBetweenDates(startDate, endDate);
    
    // Log for debugging purposes
    console.debug(`Time period calculation: ${startDate} to ${endDate} = ${timePeriod.toFixed(2)} years`);
    
    return timePeriod;
  }

  /**
   * Comprehensive validation for a data point
   */
  static validateDataPoint(dataPoint: any): boolean {
    if (!dataPoint || typeof dataPoint !== 'object') {
      return false;
    }
    
    // Check required fields exist and are valid
    const hasValidAccountValue = typeof dataPoint.accountValue === 'number' && isFinite(dataPoint.accountValue);
    const hasValidDeposits = typeof dataPoint.deposits === 'number' && isFinite(dataPoint.deposits);
    const hasValidDate = typeof dataPoint.date === 'string' && dataPoint.date.length > 0;
    
    return hasValidAccountValue && hasValidDeposits && hasValidDate;
  }
}

/**
 * Formatting utilities for financial data
 */
export class FinancialFormatter {
  /**
   * Format currency values consistently
   */
  static formatCurrency(value: number, showSign: boolean = false): string {
    const formatted = new Intl.NumberFormat(FINANCIAL_CONSTANTS.CURRENCY_LOCALE, {
      style: 'currency',
      currency: FINANCIAL_CONSTANTS.CURRENCY_CODE,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(Math.abs(value));

    if (showSign && value >= 0) {
      return `+${formatted}`;
    } else if (value < 0) {
      return `-${formatted}`;
    }
    
    return formatted;
  }

  /**
   * Format percentage values consistently
   */
  static formatPercentage(value: number, showSign: boolean = false): string {
    const formatted = value.toFixed(FINANCIAL_CONSTANTS.PERCENTAGE_DECIMAL_PLACES) + '%';
    
    if (showSign && value >= 0) {
      return `+${formatted}`;
    }
    
    return formatted;
  }

  /**
   * Format large numbers with K, M abbreviations
   */
  static formatLargeNumber(value: number): string {
    if (Math.abs(value) >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (Math.abs(value) >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toString();
  }
}
