import { AccountData, Transaction, PerformanceData } from '@/types/financial'

/**
 * Client-side service that fetches multi-account Schwab data from API
 * Run `node scripts/process-multi-account-data.js` first to generate the data
 */
export class MultiAccountSchwabService {
  private async fetchMultiAccountData(account?: string) {
    try {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime()
      const url = account 
        ? `/api/schwab/multi-account?account=${encodeURIComponent(account)}&t=${timestamp}`
        : `/api/schwab/multi-account?t=${timestamp}`
      
      const response = await fetch(url)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error loading multi-account data:', error)
      throw new Error('Failed to load financial data. Please ensure multi-account data is processed correctly.')
    }
  }

  async getAccountList(): Promise<string[]> {
    const data = await this.fetchMultiAccountData()
    return data.accountList || []
  }

  async getAccountData(account: string): Promise<AccountData> {
    const data = await this.fetchMultiAccountData(account)
    return data.account
  }

  async getTransactions(account: string): Promise<Transaction[]> {
    const data = await this.fetchMultiAccountData(account)
    return data.transactions
  }

  async getPerformanceData(account: string): Promise<PerformanceData> {
    const data = await this.fetchMultiAccountData(account)
    return data.performance
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
