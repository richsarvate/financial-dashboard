import { AccountData, Transaction, PerformanceData } from '@/types/financial'

/**
 * Client-side service that fetches pre-processed Schwab data from API
 * Run `node scripts/process-schwab-data.js` first to generate the data
 */
export class SchwabDataService {
  private async fetchProcessedData() {
    try {
      // Add cache-busting timestamp to ensure fresh data
      const timestamp = new Date().getTime()
      const response = await fetch(`/api/schwab/multi-account?t=${timestamp}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch data: ${response.statusText}`)
      }

      return await response.json()
    } catch (error) {
      console.error('Error loading processed data:', error)
      throw new Error('Failed to load financial data. Please ensure data is processed correctly.')
    }
  }

  async getAccountData(): Promise<AccountData> {
    const data = await this.fetchProcessedData()
    return data.account
  }

  async getTransactions(): Promise<Transaction[]> {
    const data = await this.fetchProcessedData()
    return data.transactions
  }

  async getPerformanceData(): Promise<PerformanceData> {
    const data = await this.fetchProcessedData()
    return data.performance
  }

  // Get summary stats for quick access
  async getSummary() {
    const data = await this.fetchProcessedData()
    return data.summary
  }

  // Check if data needs refresh (older than 1 day)
  async isDataStale(): Promise<boolean> {
    try {
      const data = await this.fetchProcessedData()
      const lastUpdated = new Date(data.lastUpdated)
      const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000)
      return lastUpdated < oneDayAgo
    } catch {
      return true
    }
  }
}
