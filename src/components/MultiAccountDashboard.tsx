'use client'

import { useState, useEffect, useCallback } from 'react'
import { MultiAccountSchwabService } from '@/services/multiAccountSchwabService'
import { AccountData, Transaction, PerformanceData } from '@/types/financial'
import PerformanceChart from './PerformanceChart'
import TransactionHistory from './TransactionHistory'

interface AccountTabData {
  accountData: AccountData | null
  transactions: Transaction[]
  performanceData: PerformanceData | null
  loading: boolean
  error: string | null
}

export default function MultiAccountDashboard() {
  const [accountList, setAccountList] = useState<string[]>([])
  const [activeAccount, setActiveAccount] = useState<string>('')
  const [accountsData, setAccountsData] = useState<Record<string, AccountTabData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schwabService] = useState(() => new MultiAccountSchwabService())
  const [showSP500, setShowSP500] = useState(false)
  const [showWithoutFees, setShowWithoutFees] = useState(false)
  const [showVFIFX, setShowVFIFX] = useState(false)

  const loadAccountList = useCallback(async () => {
    try {
      setLoading(true)
      setError(null)
      
      console.log('Loading account list...')
      
      const accounts = await schwabService.getAccountList()
      setAccountList(accounts)
      
      if (accounts.length > 0 && !activeAccount) {
        setActiveAccount(accounts[0])
      }
      
      console.log('Account list loaded:', accounts)
      
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load account list')
      console.error('Failed to load account list:', err)
    } finally {
      setLoading(false)
    }
  }, [schwabService, activeAccount])

  const loadAccountData = useCallback(async (accountName: string) => {
    if (!accountName) return

    try {
      // Set loading state for this account
      setAccountsData(prev => ({
        ...prev,
        [accountName]: {
          ...prev[accountName],
          loading: true,
          error: null
        }
      }))
      
      console.log(`Loading data for account: ${accountName}`)
      
      // Load account data
      const account = await schwabService.getAccountData(accountName)
      
      // Load transactions
      const txns = await schwabService.getTransactions(accountName)
      
      // Load performance data
      const perfData = await schwabService.getPerformanceData(accountName)
      
      setAccountsData(prev => ({
        ...prev,
        [accountName]: {
          accountData: account,
          transactions: txns,
          performanceData: perfData,
          loading: false,
          error: null
        }
      }))
      
      console.log(`Data loaded successfully for ${accountName}:`, {
        accountValue: account.currentBalance.toLocaleString(),
        transactionCount: txns.length,
        totalReturn: perfData.totalReturn.toLocaleString(),
        annualizedReturn: perfData.annualizedReturn.toFixed(2) + '%'
      })
      
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to load data'
      setAccountsData(prev => ({
        ...prev,
        [accountName]: {
          ...prev[accountName],
          loading: false,
          error: errorMessage
        }
      }))
      console.error(`Failed to load data for ${accountName}:`, err)
    }
  }, [schwabService])

  useEffect(() => {
    loadAccountList()
  }, [loadAccountList])

  useEffect(() => {
    if (activeAccount) {
      loadAccountData(activeAccount)
    }
  }, [activeAccount, loadAccountData])

  const handleTabClick = (accountName: string) => {
    setActiveAccount(accountName)
  }

  const retryLoadAccount = () => {
    if (activeAccount) {
      loadAccountData(activeAccount)
    }
  }

  if (loading && accountList.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
        <span className="ml-3 text-gray-600">Loading your investment accounts...</span>
      </div>
    )
  }

  if (error && accountList.length === 0) {
    return (
      <div className="rounded-lg bg-red-50 p-4">
        <div className="flex">
          <div className="ml-3">
            <h3 className="text-sm font-medium text-red-800">Error loading accounts</h3>
            <div className="mt-2 text-sm text-red-700">
              <p>{error}</p>
              <p className="mt-2 text-xs">
                Make sure you&apos;ve run: <code>node scripts/process-multi-account-data.js</code>
              </p>
            </div>
            <div className="mt-4">
              <button
                onClick={loadAccountList}
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

  if (accountList.length === 0) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4">
        <p className="text-yellow-800">No investment accounts found.</p>
      </div>
    )
  }

  const currentAccountData = accountsData[activeAccount]

  return (
    <div className="space-y-6">
      {/* Account Tabs */}
      <div className="bg-white rounded-lg shadow">
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6" aria-label="Tabs">
            {accountList.map((accountName) => (
              <button
                key={accountName}
                onClick={() => handleTabClick(accountName)}
                className={`py-4 px-1 border-b-2 font-medium text-sm whitespace-nowrap ${
                  activeAccount === accountName
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <div className="flex items-center space-x-2">
                  <span>{accountName}</span>
                  {accountsData[accountName]?.loading && (
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                  )}
                </div>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Account Content */}
      {activeAccount && (
        <div className="space-y-6">
          {currentAccountData?.loading && (
            <div className="flex items-center justify-center h-64">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
              <span className="ml-3 text-gray-600">Loading {activeAccount} data...</span>
            </div>
          )}

          {currentAccountData?.error && (
            <div className="rounded-lg bg-red-50 p-4">
              <div className="flex">
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">Error loading {activeAccount}</h3>
                  <div className="mt-2 text-sm text-red-700">
                    <p>{currentAccountData.error}</p>
                  </div>
                  <div className="mt-4">
                    <button
                      onClick={retryLoadAccount}
                      className="bg-red-600 text-white px-4 py-2 rounded text-sm hover:bg-red-700"
                    >
                      Retry
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {currentAccountData?.accountData && currentAccountData?.performanceData && !currentAccountData.loading && !currentAccountData.error && (
            <>
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold">{activeAccount} Dashboard</h2>
                  <div className="flex items-center justify-center sm:justify-end">
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
                
                {/* Account Summary */}
                {(() => {
                  // Use the most recent time series data for current balance (more accurate than positions parsing)
                  const timeSeriesData = currentAccountData.performanceData.timeSeriesData || [];
                  const mostRecentData = timeSeriesData[timeSeriesData.length - 1];
                  const currentBalance = mostRecentData ? mostRecentData.accountValue : currentAccountData.accountData.currentBalance;
                  
                  // CALCULATE the correct principal for each account from its own time series data
                  // This ensures each account shows the correct principal that matches its chart
                  let principalInvested = 0;
                  if (mostRecentData) {
                    principalInvested = mostRecentData.deposits - (mostRecentData.withdrawals || 0);
                  } else {
                    // Fallback to netContributions if time series not available
                    principalInvested = currentAccountData.performanceData.netContributions || 0;
                  }
                  
                  // Debug logging to see what principal we're using for each account
                  console.log(`${activeAccount} principal calculation:`, {
                    deposits: mostRecentData?.deposits,
                    withdrawals: mostRecentData?.withdrawals || 0,
                    calculatedPrincipal: principalInvested,
                    netContributions: currentAccountData.performanceData.netContributions
                  });
                  
                  // Calculate correct time period from time series data
                  const firstDataPoint = timeSeriesData[0];
                  const lastDataPoint = timeSeriesData[timeSeriesData.length - 1];
                  const startDate = new Date(firstDataPoint?.date || '2021-12-31');
                  const endDate = new Date(lastDataPoint?.date || '2025-06-30');
                  const years = (endDate.getTime() - startDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
                  
                  // Scenario 1: Actual Portfolio (always shows real account with fees)
                  const totalFees = currentAccountData.performanceData.fees || 0;
                  const actualPortfolioValue = currentBalance;
                  const actualInvestmentGains = actualPortfolioValue - principalInvested;
                  
                  // Calculate CORRECT annualized return based on actual performance
                  // Formula: (Final Value / Principal)^(1/years) - 1
                  const actualAnnualReturn = principalInvested > 0 && years > 0 ? 
                    (Math.pow(actualPortfolioValue / principalInvested, 1/years) - 1) * 100 : 0;
                  
                  // Scenario 2: Portfolio without fees (for comparison when toggle is ON)
                  const portfolioWithoutFeesValue = currentBalance + totalFees;
                  const portfolioWithoutFeesGains = portfolioWithoutFeesValue - principalInvested;
                  const portfolioWithoutFeesReturn = principalInvested > 0 && years > 0 ? 
                    ((portfolioWithoutFeesValue / principalInvested) ** (1/years) - 1) * 100 : 0;
                  
                  // Scenario 3: S&P 500 Alternative (using EXACT same data as chart)
                  // MUST use time series data to match chart exactly - NO EXCEPTIONS
                  const sp500Value = mostRecentData?.spyValue || principalInvested;
                  const sp500Gains = sp500Value - principalInvested;
                  const sp500Return = principalInvested > 0 && years > 0 ? 
                    (Math.pow(sp500Value / principalInvested, 1/years) - 1) * 100 : 0;

                  return (
                    <div className={`grid grid-cols-1 gap-4 sm:gap-6 ${
                      (showSP500 && showWithoutFees) ? 'lg:grid-cols-3' : 
                      (showSP500 || showWithoutFees) ? 'md:grid-cols-2' : 
                      'md:grid-cols-1'
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
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Principal Invested</p>
                            <p className="text-base text-gray-700">
                              ${principalInvested.toLocaleString()}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Investment Gains</p>
                            <p className={`text-base font-medium ${
                              actualInvestmentGains >= 0 ? 'text-green-600' : 'text-red-600'
                            }`}>
                              ${actualInvestmentGains.toLocaleString()}
                            </p>
                          </div>
                          
                          <div>
                            <p className="text-sm text-gray-600">Total Fees Paid</p>
                            <p className="text-base text-red-600">
                              -${totalFees.toLocaleString()}
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Portfolio Without Fees Column */}
                      {showWithoutFees && (
                        <div className="bg-green-50 p-4 sm:p-6 rounded-lg border-4 border-green-500">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                            <h3 className="text-base sm:text-lg font-bold text-green-900">
                              Portfolio Without Fees
                            </h3>
                            <span className="bg-green-600 text-white text-xs px-2 py-1 rounded-full font-medium w-fit">
                              NO FEES
                            </span>
                          </div>
                          
                          <div className="space-y-3 sm:space-y-4">
                            <div>
                              <p className="text-sm text-green-600">Annual Return</p>
                              <p className="text-xl sm:text-2xl font-bold text-green-600">
                                {portfolioWithoutFeesReturn.toFixed(2)}%
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-green-600">Hypothetical Balance</p>
                              <p className="text-lg sm:text-xl font-bold text-green-900">
                                ${portfolioWithoutFeesValue.toLocaleString()}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-green-600">Principal Invested</p>
                              <p className="text-base text-green-700">
                                ${principalInvested.toLocaleString()}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-green-600">Investment Gains</p>
                              <p className="text-base font-medium text-green-600">
                                ${portfolioWithoutFeesGains.toLocaleString()}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-green-600">Fees Saved</p>
                              <p className="text-base text-green-600">
                                +${totalFees.toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* S&P 500 Alternative Column */}
                      {showSP500 && (
                        <div className="bg-purple-50 p-4 sm:p-6 rounded-lg border-4 border-purple-500">
                          <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-4">
                            <h3 className="text-base sm:text-lg font-bold text-purple-900">
                              S&P 500 Alternative
                            </h3>
                            <span className="bg-purple-600 text-white text-xs px-2 py-1 rounded-full font-medium w-fit">
                              BENCHMARK
                            </span>
                          </div>
                          
                          <div className="space-y-3 sm:space-y-4">
                            <div>
                              <p className="text-sm text-purple-600">Annual Return</p>
                              <p className="text-xl sm:text-2xl font-bold text-purple-600">
                                {sp500Return.toFixed(2)}%
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-purple-600">Hypothetical Balance</p>
                              <p className="text-lg sm:text-xl font-bold text-purple-900">
                                ${sp500Value.toLocaleString()}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-purple-600">Principal Invested</p>
                              <p className="text-base text-purple-700">
                                ${principalInvested.toLocaleString()}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-purple-600">Investment Gains</p>
                              <p className="text-base font-medium text-purple-600">
                                ${sp500Gains.toLocaleString()}
                              </p>
                            </div>
                            
                            <div>
                              <p className="text-sm text-purple-600">
                                {actualInvestmentGains > sp500Gains ? 'Outperformed by' : 'Underperformed by'}
                              </p>
                              <p className={`text-base font-medium ${
                                actualInvestmentGains > sp500Gains ? 'text-green-600' : 'text-red-600'
                              }`}>
                                ${Math.abs(actualInvestmentGains - sp500Gains).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>
                  );
                })()}
              </div>

              {/* Performance Chart */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
                <PerformanceChart 
                  performanceData={currentAccountData.performanceData}
                  showSP500={showSP500}
                  setShowSP500={setShowSP500}
                  showWithoutFees={showWithoutFees}
                  setShowWithoutFees={setShowWithoutFees}
                  showVFIFX={showVFIFX}
                  setShowVFIFX={setShowVFIFX}
                />
              </div>

              {/* Transaction History */}
              <div className="bg-white p-4 sm:p-6 rounded-lg shadow">
                <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                <TransactionHistory transactions={currentAccountData.transactions} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}
