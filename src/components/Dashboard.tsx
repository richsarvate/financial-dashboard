'use client'

import { useState, useEffect, useCallback } from 'react'
import { SchwabDataService } from '@/services/schwabDataService'
import { AccountData, Transaction, PerformanceData } from '@/types/financial'
import PerformanceChart from './PerformanceChart'
import TransactionHistory from './TransactionHistory'

export default function Dashboard() {
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schwabService] = useState(() => new SchwabDataService())
  const [showSP500, setShowSP500] = useState(false)
  const [showWithoutFees, setShowWithoutFees] = useState(false)

  const loadData = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading real Schwab data...')
      
      // Load account data
      const account = await schwabService.getAccountData()
      setAccountData(account)
      
      // Load transactions
      const txns = await schwabService.getTransactions()
      setTransactions(txns)
      
      // Load performance data
      const perfData = await schwabService.getPerformanceData()
      setPerformanceData(perfData)
      
      console.log('Data loaded successfully:', {
        accountValue: account.currentBalance.toLocaleString(),
        transactionCount: txns.length,
        totalReturn: perfData.totalReturn.toLocaleString(),
        annualizedReturn: perfData.annualizedReturn.toFixed(2) + '%'
      })
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load data')
      console.error('Failed to load dashboard data:', err)
    } finally {
      setLoading(false)
    }
  }, [schwabService])

  useEffect(() => {
    loadData()
  }, [loadData])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading your investment data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <p className="mt-2 text-xs">
                Make sure you&apos;ve run: <code>node scripts/process-schwab-data.js</code>
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadData}
                className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
              >
                Retry
              </button>
            </div>
          </div>
        </div>
      </div>
    )
  }

  if (!accountData || !performanceData) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4">
        <p className="text-yellow-800">No investment data available.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-lg shadow">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">Investment Dashboard</h2>
          <div className="flex items-center">
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showSP500}
                onChange={(e) => setShowSP500(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-11 h-6 rounded-full transition-colors ${
                showSP500 ? 'bg-purple-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                  showSP500 ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Compare to S&P
              </span>
            </label>
          </div>
        </div>
        
        {/* Calculate values for all three scenarios */}
        {(() => {
          const currentBalance = accountData.currentBalance;
          const principalInvested = performanceData.timeSeriesData[performanceData.timeSeriesData.length - 1]?.deposits - 
                                  performanceData.timeSeriesData[performanceData.timeSeriesData.length - 1]?.withdrawals || 0;
          const years = 3.7; // Investment period from Nov 2021 to July 2025
          
          // Scenario 1: Actual Portfolio (always shows real account with fees)
          const totalFees = performanceData.fees || 0;
          const actualPortfolioValue = currentBalance; // Always the real account balance
          const actualInvestmentGains = actualPortfolioValue - principalInvested;
          const actualAnnualReturn = ((actualPortfolioValue / principalInvested) ** (1/years) - 1) * 100;
          
          // Scenario 2: Portfolio without fees (for comparison when toggle is ON)
          const portfolioWithoutFeesValue = currentBalance + performanceData.fees;
          const portfolioWithoutFeesGains = portfolioWithoutFeesValue - principalInvested;
          const portfolioWithoutFeesReturn = ((portfolioWithoutFeesValue / principalInvested) ** (1/years) - 1) * 100;
          
          // Scenario 3: S&P 500 Alternative (calculated the same way as in the chart)
          // This takes your actual deposit/withdrawal pattern and applies S&P 500 returns
          let sp500Alternative = 0;
          let prevSp500Alt = performanceData.timeSeriesData[0]?.deposits || 0; // Start with initial deposit
          
          // Calculate S&P 500 alternative by applying S&P returns to your actual cash flows
          for (let i = 1; i < performanceData.timeSeriesData.length; i++) {
            const currentPoint = performanceData.timeSeriesData[i];
            const prevPoint = performanceData.timeSeriesData[i - 1];
            
            const newDeposits = (currentPoint.deposits || 0) - (prevPoint.deposits || 0);
            const newWithdrawals = (currentPoint.withdrawals || 0) - (prevPoint.withdrawals || 0);
            
            // Calculate S&P 500 monthly return
            const sp500MonthlyReturn = prevPoint.spyValue && prevPoint.spyValue > 0 
              ? ((currentPoint.spyValue || 0) - prevPoint.spyValue) / prevPoint.spyValue 
              : 0;
            
            sp500Alternative = (prevSp500Alt + newDeposits - newWithdrawals) * (1 + sp500MonthlyReturn);
            prevSp500Alt = sp500Alternative;
          }
          
          const sp500Value = Math.max(0, sp500Alternative);
          const sp500Gains = sp500Value - principalInvested;
          const sp500Return = ((sp500Value / principalInvested) ** (1/years) - 1) * 100;

          return (
            <div className={`grid grid-cols-1 gap-6 ${
              // Calculate number of columns based on both toggles
              (showSP500 && showWithoutFees) ? 'md:grid-cols-3' : // S&P on, fees on = 3 cols (actual without fees, with fees, S&P)
              (showSP500 || showWithoutFees) ? 'md:grid-cols-2' : // Either S&P on OR fees on = 2 cols
              'md:grid-cols-1' // Both S&P off AND fees off = 1 col (just actual with fees)
            }`}>
              {/* Actual Portfolio Column */}
              <div className="bg-gray-50 p-6 rounded-lg border-4 border-gray-800">
                <div className="flex items-center gap-2 mb-4">
                  <h3 className="text-lg font-bold text-gray-900">
                    Your Actual Portfolio
                  </h3>
                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-medium">
                    ACTUAL
                  </span>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Annual Return</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {actualAnnualReturn.toFixed(2)}%
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Current Account Balance</p>
                    <p className="text-xl font-bold text-gray-900">
                      ${actualPortfolioValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-gray-500">This is your real account value</p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Investment Gains</p>
                    <p className={`text-xl font-bold ${actualInvestmentGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {actualInvestmentGains >= 0 ? '+' : ''}${actualInvestmentGains.toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Portfolio Without Fees Column - Only show when toggle is ON for comparison */}
              {showWithoutFees && (
                <div className="bg-orange-50 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-orange-900 mb-4">Your Portfolio (without MYRA Fees)</h3>
                
                <div className="space-y-4">
                  <div>
                    <p className="text-sm text-orange-700">Annual Return</p>
                    <p className="text-2xl font-bold text-orange-600">
                      {portfolioWithoutFeesReturn.toFixed(2)}%
                    </p>
                    <p className="text-xs text-orange-600">
                      (+{(portfolioWithoutFeesReturn - actualAnnualReturn).toFixed(2)}% more than actual)
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-orange-700">Account Balance (without fees)</p>
                    <p className="text-xl font-bold text-orange-900">
                      ${portfolioWithoutFeesValue.toLocaleString()}
                    </p>
                    <p className="text-xs text-orange-600">
                      (+${performanceData.fees.toLocaleString()} more than actual)
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-orange-700">Investment Gains</p>
                    <p className={`text-xl font-bold ${portfolioWithoutFeesGains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                      {portfolioWithoutFeesGains >= 0 ? '+' : ''}${portfolioWithoutFeesGains.toLocaleString()}
                    </p>
                    <p className="text-xs text-orange-600">
                      (+${performanceData.fees.toLocaleString()} more than actual)
                    </p>
                  </div>
                </div>
              </div>
              )}              {/* S&P 500 Column - Only show when toggle is on */}
              {showSP500 && (
                <div className="bg-purple-50 p-6 rounded-lg">
                  <h3 className="text-lg font-bold text-purple-900 mb-4">S&P 500 Alternative</h3>
                  
                  <div className="space-y-4">
                    <div>
                      <p className="text-sm text-purple-700">Annual Return</p>
                      <p className="text-2xl font-bold text-purple-600">
                        {sp500Return.toFixed(2)}%
                      </p>
                      <p className="text-xs text-purple-600">
                        ({sp500Return > actualAnnualReturn ? '+' : ''}{(sp500Return - actualAnnualReturn).toFixed(2)}% vs your portfolio)
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-purple-700">Ending Portfolio Value</p>
                      <p className="text-xl font-bold text-purple-900">
                        ${sp500Value.toLocaleString()}
                      </p>
                      <p className="text-xs text-purple-600">
                        ({sp500Value > actualPortfolioValue ? '+' : ''}${(sp500Value - actualPortfolioValue).toLocaleString()} vs your portfolio)
                      </p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-purple-700">Investment Gains</p>
                      <p className={`text-xl font-bold ${sp500Gains >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {sp500Gains >= 0 ? '+' : ''}${sp500Gains.toLocaleString()}
                      </p>
                      <p className="text-xs text-purple-600">
                        ({sp500Gains > actualInvestmentGains ? '+' : ''}${(sp500Gains - actualInvestmentGains).toLocaleString()} vs your portfolio)
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          );
        })()}
        
        {/* Principal Invested - shown below all scenarios */}
        <div className="mt-6 pt-4 border-t border-gray-200">
          <div className="text-center">
            <p className="text-sm text-gray-600">Principal Invested</p>
            <p className="text-xl font-bold text-gray-900">
              ${(performanceData.timeSeriesData[performanceData.timeSeriesData.length - 1]?.deposits - 
                 performanceData.timeSeriesData[performanceData.timeSeriesData.length - 1]?.withdrawals || 0).toLocaleString()}
            </p>
          </div>
        </div>
      </div>
      
      {/* Performance Chart */}
      {performanceData && (
        <div className="col-span-2">
          <PerformanceChart 
            performanceData={performanceData} 
            showSP500={showSP500}
            setShowSP500={setShowSP500}
            showWithoutFees={showWithoutFees}
            setShowWithoutFees={setShowWithoutFees}
          />
        </div>
      )}
      
      {/* Transaction History Component */}
      <TransactionHistory transactions={transactions} />
    </div>
  )
}
