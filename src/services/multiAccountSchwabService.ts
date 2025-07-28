import { AccountData, Transaction, PerformanceData } from '@/types/financial'
import { AccountDiscovery } from '@/utils/accountDiscovery'

/**
 * Enhanced client-side service that fetches multi-account Schwab data from API
 * Now includes account discovery and validation for seamless account addition
 * Run `node scripts/process-multi-account-data.js` first to generate the data
 */
export class MultiAccountSchwabService {
  private accountCache = new Map<string, any>();
  private accountListCache: string[] | null = null;
  private cacheTimestamp = 0;
  private readonly CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

  private async fetchMultiAccountData(account?: string) {
    try {
      // Check cache first
      const cacheKey = account || '__account_list__';
      const now = Date.now();
      
      if (this.accountCache.has(cacheKey) && (now - this.cacheTimestamp) < this.CACHE_DURATION) {
        return this.accountCache.get(cacheKey);
      }

      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime()
      const url = account 
        ? `/api/schwab/multi-account?account=${encodeURIComponent(account)}&t=${timestamp}`
        : `/api/schwab/multi-account?t=${timestamp}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(`Failed to fetch data: ${response.statusText}. ${errorData.message || ''}`)
      }

      const data = await response.json();
      
      // Validate response data structure
      if (!data || typeof data !== 'object') {
        throw new Error('Invalid response format from server');
      }

      // Cache the response
      this.accountCache.set(cacheKey, data);
      this.cacheTimestamp = now;

      return data;
    } catch (error) {
      console.error('Error loading multi-account data:', error)
      
      // Provide detailed error information
      if (error instanceof Error) {
        if (error.message.includes('404')) {
          throw new Error('Account data not found. Please ensure data processing is complete and the account exists.')
        } else if (error.message.includes('500')) {
          throw new Error('Server error loading financial data. Please check data integrity and try again.')
        } else {
          throw new Error(`Failed to load financial data: ${error.message}`)
        }
      }
      
      throw new Error('Failed to load financial data. Please ensure multi-account data is processed correctly.')
    }
  }

  /**
   * Get list of available accounts with validation
   */
  async getAccountList(): Promise<string[]> {
    try {
      const data = await this.fetchMultiAccountData()
      
      if (!data.accountList || !Array.isArray(data.accountList)) {
        console.warn('No account list found in response, returning empty array')
        return []
      }

      // Validate each account name
      const validatedAccounts = data.accountList.filter((account: any) => {
        if (typeof account !== 'string' || account.trim().length === 0) {
          console.warn(`Invalid account name found: ${account}`)
          return false
        }
        return true
      })

      // Cache the validated list
      this.accountListCache = validatedAccounts;
      
      if (validatedAccounts.length !== data.accountList.length) {
        console.warn(`Filtered out ${data.accountList.length - validatedAccounts.length} invalid account names`)
      }

      return validatedAccounts
    } catch (error) {
      console.error('Error fetching account list:', error)
      // Return cached list if available
      return this.accountListCache || []
    }
  }

  /**
   * Get account data with validation
   */
  async getAccountData(account: string): Promise<AccountData> {
    if (!account || typeof account !== 'string') {
      throw new Error('Account name is required and must be a string')
    }

    const data = await this.fetchMultiAccountData(account)
    
    if (!data.account) {
      throw new Error(`No account data found for: ${account}`)
    }

    // Validate account data structure
    const validation = AccountDiscovery.validateAccountData(data.account)
    if (!validation.isValid) {
      console.error(`Account data validation failed for ${account}:`, validation.issues)
      // Don't throw error, but log validation issues
      console.warn('Proceeding with potentially invalid account data')
    }

    return data.account
  }

  /**
   * Get transactions with validation
   */
  async getTransactions(account: string): Promise<Transaction[]> {
    if (!account || typeof account !== 'string') {
      throw new Error('Account name is required and must be a string')
    }

    const data = await this.fetchMultiAccountData(account)
    
    if (!data.transactions) {
      console.warn(`No transaction data found for: ${account}`)
      return []
    }

    if (!Array.isArray(data.transactions)) {
      console.error(`Transaction data is not an array for: ${account}`)
      return []
    }

    // Basic validation of transaction data
    const validTransactions = data.transactions.filter((transaction: any, index: number) => {
      if (!transaction || typeof transaction !== 'object') {
        console.warn(`Invalid transaction at index ${index} for ${account}`)
        return false
      }
      return true
    })

    if (validTransactions.length !== data.transactions.length) {
      console.warn(`Filtered out ${data.transactions.length - validTransactions.length} invalid transactions for ${account}`)
    }

    return validTransactions
  }

  /**
   * Get performance data with comprehensive validation
   */
  async getPerformanceData(account: string): Promise<PerformanceData> {
    if (!account || typeof account !== 'string') {
      throw new Error('Account name is required and must be a string')
    }

    const data = await this.fetchMultiAccountData(account)
    
    if (!data.performance) {
      throw new Error(`No performance data found for: ${account}`)
    }

    // Validate performance data structure
    const validation = AccountDiscovery.validatePerformanceData(data.performance)
    if (!validation.isValid) {
      console.error(`Performance data validation failed for ${account}:`, validation.issues)
      throw new Error(`Invalid performance data for ${account}: ${validation.issues.join(', ')}`)
    }

    if (validation.warnings.length > 0) {
      console.warn(`Performance data warnings for ${account}:`, validation.warnings)
    }

    return data.performance
  }

  /**
   * Validate a complete account setup
   */
  async validateAccount(account: string): Promise<boolean> {
    try {
      const [accountData, transactions, performanceData] = await Promise.all([
        this.getAccountData(account).catch(() => null),
        this.getTransactions(account).catch(() => []),
        this.getPerformanceData(account).catch(() => null)
      ])

      const validation = AccountDiscovery.validateCompleteAccount(
        account,
        accountData,
        performanceData,
        transactions,
        {
          strictValidation: false,
          allowUnknownAccountTypes: true,
          requireTransactionData: false,
          requirePerformanceData: true
        }
      )

      if (!validation.isValid) {
        console.error(`Account validation failed for ${account}:`, validation.issues)
        return false
      }

      if (validation.warnings.length > 0) {
        console.warn(`Account validation warnings for ${account}:`, validation.warnings)
      }

      return true
    } catch (error) {
      console.error(`Error validating account ${account}:`, error)
      return false
    }
  }

  /**
   * Get account health report
   */
  async getAccountHealthReport(): Promise<string> {
    try {
      const accountList = await this.getAccountList()
      const validationResults = []

      for (const account of accountList) {
        try {
          const [accountData, transactions, performanceData] = await Promise.all([
            this.getAccountData(account).catch(() => null),
            this.getTransactions(account).catch(() => []),
            this.getPerformanceData(account).catch(() => null)
          ])

          const validation = AccountDiscovery.validateCompleteAccount(
            account,
            accountData,
            performanceData,
            transactions
          )

          validationResults.push(validation)
        } catch (error) {
          validationResults.push({
            isValid: false,
            accountName: account,
            issues: [`Failed to load account data: ${error instanceof Error ? error.message : 'Unknown error'}`],
            warnings: [],
            suggestedFixes: ['Check data processing and file integrity']
          })
        }
      }

      return AccountDiscovery.generateDiscoveryReport(validationResults)
    } catch (error) {
      return `Error generating health report: ${error instanceof Error ? error.message : 'Unknown error'}`
    }
  }

  /**
   * Clear cache (useful when new accounts are added)
   */
  clearCache(): void {
    this.accountCache.clear()
    this.accountListCache = null
    this.cacheTimestamp = 0
  }

  // Get summary stats for quick access
  async getSummary(account: string) {
    const data = await this.fetchMultiAccountData(account)
    return data.summary
  }

  // Get all account summaries
  async getAllAccountSummaries(): Promise<Record<string, any>> {
    const accountList = await this.getAccountList()
    const summaries: Record<string, any> = {}
    
    for (const account of accountList) {
      try {
        const data = await this.fetchMultiAccountData(account)
        summaries[account] = {
          accountName: data.accountName,
          portfolioValue: data.summary.portfolioValue,
          totalInvested: data.summary.totalInvested,
          totalGains: data.summary.totalGains,
          annualizedReturn: data.summary.annualizedReturn,
          totalPositions: data.summary.totalPositions,
          totalTransactions: data.summary.totalTransactions
        }
      } catch (error) {
        console.error(`Error loading summary for account ${account}:`, error)
        summaries[account] = null
      }
    }
    
    return summaries
  }

  // Check if data needs refresh (older than 1 day)
  async isDataStale(): Promise<boolean> {
    try {
      const data = await this.fetchMultiAccountData()
      const lastUpdated = new Date(data.lastUpdated)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return lastUpdated < oneDayAgo
    } catch (error) {
      return true // Assume stale if we can't check
    }
  }
}
