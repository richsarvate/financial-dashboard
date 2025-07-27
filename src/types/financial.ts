export interface AccountData {
  accountId: string
  accountType: 'BROKERAGE' | 'IRA' | 'ROTH_IRA' | '401K'
  accountName: string
  currentBalance: number
  availableCash: number
  totalSecurities: number
  dayChange: number
  dayChangePercent: number
  totalReturn: number
  totalReturnPercent: number
  positions: Position[]
}

export interface Position {
  symbol: string
  description: string
  quantity: number
  marketValue: number
  averageCost: number
  totalCost: number
  unrealizedGainLoss: number
  unrealizedGainLossPercent: number
  dayChange: number
  dayChangePercent: number
}

export interface Transaction {
  id: string
  date: string
  type: 'BUY' | 'SELL' | 'DIVIDEND' | 'DEPOSIT' | 'WITHDRAWAL' | 'FEE'
  symbol?: string
  description: string
  quantity?: number
  price?: number
  amount: number
  fees: number
  netAmount: number
}

export interface PerformanceData {
  accountId: string
  timeSeriesData: PerformanceDataPoint[]
  totalReturn: number
  totalReturnPercent: number
  annualizedReturn: number
  deposits: number
  withdrawals: number
  fees: number
  netContributions: number
  realReturn: number // After deposits/withdrawals
  realReturnPercent: number
  benchmarkComparison: BenchmarkComparison
}

export interface PerformanceDataPoint {
  date: string
  accountValue: number
  deposits: number
  withdrawals: number
  fees: number
  netReturn: number // Account value - contributions + withdrawals
  spyValue?: number // S&P 500 benchmark value
}

export interface BenchmarkComparison {
  sp500Return: number
  sp500ReturnPercent: number
  outperformance: number
  outperformancePercent: number
  beta: number // Correlation with S&P 500
  sharpeRatio: number
  maxDrawdown: number
}

export interface ApiResponse<T> {
  data: T
  success: boolean
  error?: string
}

export interface SchwabApiCredentials {
  clientId: string
  clientSecret: string
  refreshToken: string
  accessToken?: string
  tokenExpiry?: number
}
