import axios from 'axios'
import { AccountData, Transaction, PerformanceData, ApiResponse, SchwabApiCredentials, PerformanceDataPoint, BenchmarkComparison } from '@/types/financial'

export class SchwabService {
  private baseUrl = 'https://api.schwabapi.com/v1'
  private credentials: SchwabApiCredentials | null = null

  constructor() {
    this.loadCredentials()
  }

  private loadCredentials() {
    // In a real app, these would come from secure environment variables
    // For demo purposes, we'll use mock data
    this.credentials = {
      clientId: process.env.NEXT_PUBLIC_SCHWAB_CLIENT_ID || 'demo_client_id',
      clientSecret: process.env.SCHWAB_CLIENT_SECRET || 'demo_client_secret',
      refreshToken: process.env.SCHWAB_REFRESH_TOKEN || 'demo_refresh_token',
    }
  }

  private async refreshAccessToken(): Promise<string> {
    if (!this.credentials) {
      throw new Error('Schwab credentials not configured')
    }

    try {
      // In a real implementation, this would make an actual API call to Schwab
      // For demo purposes, return a mock token
      const mockToken = 'demo_access_token_' + Date.now()
      this.credentials.accessToken = mockToken
      this.credentials.tokenExpiry = Date.now() + 3600000 // 1 hour
      return mockToken
    } catch (error) {
      throw new Error('Failed to refresh access token')
    }
  }

  private async makeApiCall<T>(endpoint: string): Promise<T> {
    try {
      if (!this.credentials?.accessToken || (this.credentials.tokenExpiry && this.credentials.tokenExpiry < Date.now())) {
        await this.refreshAccessToken()
      }

      // For demo purposes, return mock data instead of making real API calls
      return this.getMockData(endpoint) as T
    } catch (error) {
      console.error(`API call failed for ${endpoint}:`, error)
      throw error
    }
  }

  private getMockData(endpoint: string): any {
    // Mock data for demonstration
    if (endpoint.includes('/accounts')) {
      return [{
        accountId: 'DEMO123456789',
        accountType: 'BROKERAGE' as const,
        accountName: 'Individual Brokerage Account',
        currentBalance: 125000.50,
        availableCash: 5000.00,
        totalSecurities: 120000.50,
        dayChange: 1250.75,
        dayChangePercent: 1.01,
        totalReturn: 25000.50,
        totalReturnPercent: 25.0,
        positions: [
          {
            symbol: 'AAPL',
            description: 'Apple Inc.',
            quantity: 100,
            marketValue: 18500.00,
            averageCost: 150.00,
            totalCost: 15000.00,
            unrealizedGainLoss: 3500.00,
            unrealizedGainLossPercent: 23.33,
            dayChange: 185.00,
            dayChangePercent: 1.01
          },
          {
            symbol: 'MSFT',
            description: 'Microsoft Corporation',
            quantity: 50,
            marketValue: 17500.00,
            averageCost: 300.00,
            totalCost: 15000.00,
            unrealizedGainLoss: 2500.00,
            unrealizedGainLossPercent: 16.67,
            dayChange: 175.00,
            dayChangePercent: 1.01
          }
        ]
      }]
    }

    if (endpoint.includes('/transactions')) {
      return this.generateMockTransactions()
    }

    if (endpoint.includes('/performance')) {
      return this.generateMockPerformanceData()
    }

    return null
  }

  private generateMockTransactions(): Transaction[] {
    const transactions: Transaction[] = []
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 2) // 2 years of data

    // Generate mock transactions
    for (let i = 0; i < 50; i++) {
      const date = new Date(startDate.getTime() + (i * 14 * 24 * 60 * 60 * 1000)) // Every 2 weeks
      
      if (i % 10 === 0) {
        // Monthly deposit
        transactions.push({
          id: `dep_${i}`,
          date: date.toISOString().split('T')[0],
          type: 'DEPOSIT',
          description: 'Monthly Investment Deposit',
          amount: 2000,
          fees: 0,
          netAmount: 2000
        })
      } else if (i % 15 === 0) {
        // Fee
        transactions.push({
          id: `fee_${i}`,
          date: date.toISOString().split('T')[0],
          type: 'FEE',
          description: 'Management Fee',
          amount: -25,
          fees: 25,
          netAmount: -25
        })
      } else {
        // Stock purchase
        const symbols = ['AAPL', 'MSFT', 'GOOGL', 'AMZN', 'TSLA', 'NVDA']
        const symbol = symbols[i % symbols.length]
        const quantity = Math.floor(Math.random() * 10) + 1
        const price = 100 + Math.random() * 200
        
        transactions.push({
          id: `buy_${i}`,
          date: date.toISOString().split('T')[0],
          type: 'BUY',
          symbol,
          description: `Buy ${symbol}`,
          quantity,
          price,
          amount: quantity * price,
          fees: 0,
          netAmount: quantity * price
        })
      }
    }

    return transactions.reverse() // Most recent first
  }

  private generateMockPerformanceData(): PerformanceData {
    const dataPoints: PerformanceDataPoint[] = []
    const startDate = new Date()
    startDate.setFullYear(startDate.getFullYear() - 2)
    
    let accountValue = 100000
    let totalDeposits = 0
    let totalWithdrawals = 0
    let totalFees = 0

    // Generate monthly data points
    for (let i = 0; i < 24; i++) {
      const date = new Date(startDate)
      date.setMonth(date.getMonth() + i)
      
      // Simulate monthly deposit
      const deposit = i < 20 ? 2000 : 0 // Stop deposits in last 4 months
      totalDeposits += deposit
      
      // Simulate occasional withdrawal
      const withdrawal = i === 12 ? 5000 : 0 // One withdrawal mid-period
      totalWithdrawals += withdrawal
      
      // Simulate monthly fee
      const fee = 25
      totalFees += fee
      
      // Simulate market growth with volatility
      const marketGrowth = (Math.random() - 0.4) * 0.02 // -4% to +2% monthly
      accountValue = accountValue * (1 + marketGrowth) + deposit - withdrawal - fee
      
      // Calculate net return (account value minus contributions)
      const netReturn = accountValue - (totalDeposits - totalWithdrawals)
      
      // S&P 500 benchmark (assuming 8% annual growth with volatility)
      const spyGrowth = 0.08 / 12 + (Math.random() - 0.5) * 0.03 // 8% annual ± volatility
      const spyValue = 100000 * Math.pow(1 + 0.08 / 12, i) // Compound monthly
      
      dataPoints.push({
        date: date.toISOString().split('T')[0],
        accountValue: Math.round(accountValue * 100) / 100,
        deposits: deposit,
        withdrawals: withdrawal,
        fees: fee,
        netReturn: Math.round(netReturn * 100) / 100,
        spyValue: Math.round(spyValue * 100) / 100
      })
    }

    const totalReturn = accountValue - 100000
    const totalReturnPercent = (totalReturn / 100000) * 100
    const realReturn = accountValue - (totalDeposits - totalWithdrawals) - 100000
    const realReturnPercent = (realReturn / (100000 + totalDeposits - totalWithdrawals)) * 100
    const annualizedReturn = Math.pow(accountValue / 100000, 1/2) - 1 // 2 years of data

    // Calculate S&P 500 comparison
    const finalSpyValue = dataPoints[dataPoints.length - 1].spyValue || 100000
    const sp500Return = finalSpyValue - 100000
    const sp500ReturnPercent = (sp500Return / 100000) * 100
    const outperformance = realReturn - sp500Return
    const outperformancePercent = realReturnPercent - sp500ReturnPercent

    const benchmarkComparison: BenchmarkComparison = {
      sp500Return,
      sp500ReturnPercent,
      outperformance,
      outperformancePercent,
      beta: 0.85, // Mock beta
      sharpeRatio: 1.2, // Mock Sharpe ratio
      maxDrawdown: -0.15 // Mock max drawdown
    }

    return {
      accountId: 'DEMO123456789',
      timeSeriesData: dataPoints,
      totalReturn,
      totalReturnPercent,
      annualizedReturn: annualizedReturn * 100,
      deposits: totalDeposits,
      withdrawals: totalWithdrawals,
      fees: totalFees,
      netContributions: totalDeposits - totalWithdrawals,
      realReturn,
      realReturnPercent,
      benchmarkComparison
    }
  }

  async getAccounts(): Promise<AccountData[]> {
    return this.makeApiCall<AccountData[]>('/accounts')
  }

  async getTransactions(accountId: string): Promise<Transaction[]> {
    return this.makeApiCall<Transaction[]>(`/accounts/${accountId}/transactions`)
  }

  async calculatePerformance(accountId: string): Promise<PerformanceData> {
    return this.makeApiCall<PerformanceData>(`/accounts/${accountId}/performance`)
  }
}
