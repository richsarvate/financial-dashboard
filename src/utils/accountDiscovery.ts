import { ACCOUNT_TYPES } from '@/constants/financial';

/**
 * Account Discovery and Validation Utilities
 * Ensures new bank accounts can be added seamlessly without breaking the system
 */

export interface AccountValidationResult {
  isValid: boolean;
  accountName: string;
  issues: string[];
  warnings: string[];
  suggestedFixes: string[];
}

export interface AccountDiscoveryOptions {
  strictValidation: boolean;
  allowUnknownAccountTypes: boolean;
  requireTransactionData: boolean;
  requirePerformanceData: boolean;
}

export class AccountDiscovery {
  private static readonly DEFAULT_OPTIONS: AccountDiscoveryOptions = {
    strictValidation: false,
    allowUnknownAccountTypes: true,
    requireTransactionData: false,
    requirePerformanceData: false,
  };

  /**
   * Validate account name format and type
   */
  static validateAccountName(accountName: string): AccountValidationResult {
    const result: AccountValidationResult = {
      isValid: true,
      accountName,
      issues: [],
      warnings: [],
      suggestedFixes: [],
    };

    // Basic name validation
    if (!accountName || typeof accountName !== 'string') {
      result.isValid = false;
      result.issues.push('Account name is required and must be a string');
      return result;
    }

    if (accountName.trim().length === 0) {
      result.isValid = false;
      result.issues.push('Account name cannot be empty');
      return result;
    }

    if (accountName.length > 100) {
      result.isValid = false;
      result.issues.push('Account name is too long (max 100 characters)');
    }

    // Check for problematic characters
    const problematicChars = /[<>:"/\\|?*]/g;
    if (problematicChars.test(accountName)) {
      result.warnings.push('Account name contains characters that may cause file system issues');
      result.suggestedFixes.push('Consider using only letters, numbers, spaces, and basic punctuation');
    }

    // Check if it matches known account types
    const knownTypes = Object.values(ACCOUNT_TYPES);
    const isKnownType = knownTypes.some(type => 
      accountName.toLowerCase().includes(type.toLowerCase()) ||
      type.toLowerCase().includes(accountName.toLowerCase())
    );

    if (!isKnownType) {
      result.warnings.push('Account name does not match known account types');
      result.suggestedFixes.push(`Consider using one of: ${knownTypes.join(', ')}`);
    }

    return result;
  }

  /**
   * Validate account data structure
   */
  static validateAccountData(accountData: any): AccountValidationResult {
    const result: AccountValidationResult = {
      isValid: true,
      accountName: accountData?.accountName || 'Unknown',
      issues: [],
      warnings: [],
      suggestedFixes: [],
    };

    // Check required fields
    const requiredFields = ['currentBalance', 'accountName', 'accountType'];
    for (const field of requiredFields) {
      if (!(field in accountData) || accountData[field] === null || accountData[field] === undefined) {
        result.isValid = false;
        result.issues.push(`Missing required field: ${field}`);
      }
    }

    // Validate numeric fields
    const numericFields = ['currentBalance'];
    for (const field of numericFields) {
      if (accountData[field] !== undefined && typeof accountData[field] !== 'number') {
        result.issues.push(`Field ${field} must be a number`);
      }
      if (accountData[field] !== undefined && !isFinite(accountData[field])) {
        result.issues.push(`Field ${field} must be a finite number`);
      }
    }

    // Validate balance ranges
    if (accountData.currentBalance !== undefined) {
      if (accountData.currentBalance < 0) {
        result.warnings.push('Account balance is negative - this may indicate data processing issues');
      }
      if (accountData.currentBalance > 1e12) {
        result.warnings.push('Account balance is extremely high - please verify data accuracy');
      }
    }

    return result;
  }

  /**
   * Validate performance data structure
   */
  static validatePerformanceData(performanceData: any): AccountValidationResult {
    const result: AccountValidationResult = {
      isValid: true,
      accountName: performanceData?.accountId || 'Unknown',
      issues: [],
      warnings: [],
      suggestedFixes: [],
    };

    // Check required fields
    const requiredFields = ['timeSeriesData', 'totalReturn', 'annualizedReturn'];
    for (const field of requiredFields) {
      if (!(field in performanceData) || performanceData[field] === null || performanceData[field] === undefined) {
        result.isValid = false;
        result.issues.push(`Missing required field: ${field}`);
      }
    }

    // Validate time series data
    if (performanceData.timeSeriesData) {
      if (!Array.isArray(performanceData.timeSeriesData)) {
        result.isValid = false;
        result.issues.push('timeSeriesData must be an array');
      } else {
        if (performanceData.timeSeriesData.length === 0) {
          result.warnings.push('No time series data points found');
        } else {
          // Validate first and last data points
          const firstPoint = performanceData.timeSeriesData[0];
          const lastPoint = performanceData.timeSeriesData[performanceData.timeSeriesData.length - 1];
          
          if (!this.validateDataPoint(firstPoint)) {
            result.issues.push('First data point is invalid');
          }
          if (!this.validateDataPoint(lastPoint)) {
            result.issues.push('Last data point is invalid');
          }

          // Check for reasonable time range
          if (firstPoint?.date && lastPoint?.date) {
            const timeDiff = new Date(lastPoint.date).getTime() - new Date(firstPoint.date).getTime();
            const daysDiff = timeDiff / (1000 * 60 * 60 * 24);
            
            if (daysDiff < 30) {
              result.warnings.push('Time series data covers less than 30 days - calculations may be unreliable');
            }
            if (daysDiff > 365 * 10) {
              result.warnings.push('Time series data covers more than 10 years - please verify date accuracy');
            }
          }
        }
      }
    }

    return result;
  }

  /**
   * Validate individual data point
   */
  private static validateDataPoint(dataPoint: any): boolean {
    if (!dataPoint || typeof dataPoint !== 'object') {
      return false;
    }

    // Check required fields
    const requiredFields = ['date', 'accountValue', 'deposits'];
    for (const field of requiredFields) {
      if (!(field in dataPoint) || dataPoint[field] === null || dataPoint[field] === undefined) {
        return false;
      }
    }

    // Validate date format
    if (typeof dataPoint.date !== 'string' || isNaN(new Date(dataPoint.date).getTime())) {
      return false;
    }

    // Validate numeric fields
    const numericFields = ['accountValue', 'deposits', 'withdrawals', 'fees'];
    for (const field of numericFields) {
      if (dataPoint[field] !== undefined && (typeof dataPoint[field] !== 'number' || !isFinite(dataPoint[field]))) {
        return false;
      }
    }

    return true;
  }

  /**
   * Comprehensive account validation
   */
  static validateCompleteAccount(
    accountName: string,
    accountData: any,
    performanceData: any,
    transactions: any[],
    options: Partial<AccountDiscoveryOptions> = {}
  ): AccountValidationResult {
    const opts = { ...this.DEFAULT_OPTIONS, ...options };
    
    const result: AccountValidationResult = {
      isValid: true,
      accountName,
      issues: [],
      warnings: [],
      suggestedFixes: [],
    };

    // Validate account name
    const nameValidation = this.validateAccountName(accountName);
    result.issues.push(...nameValidation.issues);
    result.warnings.push(...nameValidation.warnings);
    result.suggestedFixes.push(...nameValidation.suggestedFixes);

    // Validate account data
    const accountValidation = this.validateAccountData(accountData);
    result.issues.push(...accountValidation.issues);
    result.warnings.push(...accountValidation.warnings);
    result.suggestedFixes.push(...accountValidation.suggestedFixes);

    // Validate performance data
    if (opts.requirePerformanceData || performanceData) {
      const performanceValidation = this.validatePerformanceData(performanceData);
      result.issues.push(...performanceValidation.issues);
      result.warnings.push(...performanceValidation.warnings);
      result.suggestedFixes.push(...performanceValidation.suggestedFixes);
    }

    // Validate transactions
    if (opts.requireTransactionData || transactions) {
      if (!Array.isArray(transactions)) {
        result.issues.push('Transactions must be an array');
      } else if (transactions.length === 0) {
        result.warnings.push('No transaction data found');
      }
    }

    // Set overall validity
    result.isValid = result.issues.length === 0;

    return result;
  }

  /**
   * Generate account discovery report
   */
  static generateDiscoveryReport(validationResults: AccountValidationResult[]): string {
    let report = '📊 Account Discovery Report\n';
    report += '='.repeat(50) + '\n\n';

    const validAccounts = validationResults.filter(r => r.isValid);
    const invalidAccounts = validationResults.filter(r => !r.isValid);
    const accountsWithWarnings = validationResults.filter(r => r.warnings.length > 0);

    report += `✅ Valid Accounts: ${validAccounts.length}\n`;
    report += `❌ Invalid Accounts: ${invalidAccounts.length}\n`;
    report += `⚠️  Accounts with Warnings: ${accountsWithWarnings.length}\n\n`;

    if (invalidAccounts.length > 0) {
      report += '❌ Invalid Accounts:\n';
      report += '-'.repeat(20) + '\n';
      for (const account of invalidAccounts) {
        report += `Account: ${account.accountName}\n`;
        report += `Issues: ${account.issues.join(', ')}\n`;
        if (account.suggestedFixes.length > 0) {
          report += `Fixes: ${account.suggestedFixes.join(', ')}\n`;
        }
        report += '\n';
      }
    }

    if (accountsWithWarnings.length > 0) {
      report += '⚠️  Accounts with Warnings:\n';
      report += '-'.repeat(25) + '\n';
      for (const account of accountsWithWarnings) {
        report += `Account: ${account.accountName}\n`;
        report += `Warnings: ${account.warnings.join(', ')}\n`;
        report += '\n';
      }
    }

    return report;
  }
}
