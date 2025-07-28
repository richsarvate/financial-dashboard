'use client'

import { useState, useEffect, useCallback } from 'react'
import { SchwabDataService } from '@/services/schwabDataService'
import { AccountData, Transaction, PerformanceData } from '@/types/financial'
import { BENCHMARK_CONFIGS } from '@/config/benchmarks'
import PerformanceChart from './PerformanceChart'
import TransactionHistory from './TransactionHistory'

export default function Dashboard() {
  const [accountData, setAccountData] = useState<AccountData | null>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [performanceData, setPerformanceData] = useState<PerformanceData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schwabService] = useState(() => new SchwabDataService())
  
  // Dynamic benchmark state - replaces individual showSP500, showVFIFX etc.
  const [activeBenchmarks, setActiveBenchmarks] = useState<Set<string>>(new Set())
  const [showWithoutFees, setShowWithoutFees] = useState(false)

  // Helper functions for benchmark management
  const toggleBenchmark = useCallback((benchmarkId: string) => {
    setActiveBenchmarks(prev => {
      const newSet = new Set(prev)
      if (newSet.has(benchmarkId)) {
        newSet.delete(benchmarkId)
      } else {
        newSet.add(benchmarkId)
      }
      return newSet
    })
  }, [])

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
      <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
        <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
          <h2 className="text-xl sm:text-2xl font-bold">Investment Dashboard</h2>
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
          return (
            <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${
              // Calculate number of columns based on fees toggle
              showWithoutFees ? 'md:grid-cols-2' : 'md:grid-cols-1'
            }`}>
              {/* Actual Portfolio Column */}
              <div className="bg-gray-50 p-4 sm:p-6 rounded-lg border-4 border-gray-800">
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                  <h3 className="text-base sm:text-lg font-bold text-gray-900">
                    Your Actual Portfolio
                  </h3>
                  <span className="bg-gray-600 text-white text-xs px-2 py-1 rounded-full font-medium w-fit">
                    ACTUAL
                  </span>
                </div>
                
                <div className="space-y-3 sm:space-y-4">
                  <div>
                    <p className="text-sm text-gray-600">Annual Return</p>
                    <p className="text-xl sm:text-2xl font-bold text-blue-600">
                      {actualAnnualReturn.toFixed(2)}%
                    </p>
                  </div>
                  
                  <div>
                    <p className="text-sm text-gray-600">Current Account Balance</p>
                    <p className="text-lg sm:text-xl font-bold text-gray-900">
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
            activeBenchmarks={activeBenchmarks}
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
