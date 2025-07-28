'use client'

import { useState, useEffect, useCallback } from 'react'
import { MultiAccountSchwabService } from '@/services/multiAccountSchwabService'
import { AccountData, Transaction, PerformanceData } from '@/types/financial'
import { useDashboardMetrics, useDebugDashboard } from '@/hooks/useDashboardMetrics'
import { ErrorBoundary } from './ErrorBoundary'
import { DashboardSummary } from './DashboardSummary'
import { ToggleSwitch } from './ToggleSwitch'
import { AccountLoadingState } from './LoadingSpinner'
import { AccountListError, AccountDataError } from './ErrorDisplay'
import { AccountTabs } from './AccountTabs'
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
  // State management
  const [accountList, setAccountList] = useState<string[]>([])
  const [activeAccount, setActiveAccount] = useState<string>('')
  const [accountsData, setAccountsData] = useState<Record<string, AccountTabData>>({})
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [schwabService] = useState(() => new MultiAccountSchwabService())
  
  // UI state
  const [showSP500, setShowSP500] = useState(false)
  const [showWithoutFees, setShowWithoutFees] = useState(false)
  const [showVFIFX, setShowVFIFX] = useState(false)

  // Get current account data
  const currentAccountData = accountsData[activeAccount]
  
  // Calculate all dashboard metrics using centralized logic (always call hooks)
  const dashboardMetrics = useDashboardMetrics(
    currentAccountData?.performanceData || null,
    currentAccountData?.accountData || null
  )
  
  // Debug logging for troubleshooting (can be removed in production)
  useDebugDashboard(activeAccount, dashboardMetrics, currentAccountData?.performanceData || null)

  // Derived state for better readability
  const isDataReady = !!(
    currentAccountData?.accountData && 
    currentAccountData?.performanceData && 
    dashboardMetrics && 
    !currentAccountData.loading && 
    !currentAccountData.error
  )

  // Data loading functions
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
      
      // Optional: Generate account health report in development
      if (process.env.NODE_ENV === 'development' && accounts.length > 0) {
        schwabService.getAccountHealthReport().then(report => {
          console.log('📊 Account Health Report:\n', report)
        }).catch(err => {
          console.warn('Could not generate health report:', err)
        })
      }
      
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

  // Effects for data loading
  useEffect(() => {
    loadAccountList()
  }, [loadAccountList])

  useEffect(() => {
    if (activeAccount) {
      loadAccountData(activeAccount)
    }
  }, [activeAccount, loadAccountData])

  // Helper functions
  const retryLoadAccount = () => {
    if (activeAccount) {
      loadAccountData(activeAccount)
    }
  }

  // Early returns for loading/error states
  const isInitialLoading = loading && accountList.length === 0
  const hasInitialError = error && accountList.length === 0
  const hasNoAccounts = accountList.length === 0

  if (isInitialLoading) {
    return <AccountLoadingState />
  }

  if (hasInitialError) {
    return <AccountListError error={error} onRetry={loadAccountList} />
  }

  if (hasNoAccounts) {
    return (
      <div className="rounded-lg bg-yellow-50 p-4">
        <p className="text-yellow-800">No investment accounts found.</p>
      </div>
    )
  }

  // Constants for consistent styling
  const CARD_STYLES = "bg-white p-4 sm:p-6 rounded-lg shadow"

  return (
    <ErrorBoundary>
      <div className="space-y-6">
        {/* Account Tabs */}
        <AccountTabs
          accountList={accountList}
          activeAccount={activeAccount}
          accountsData={accountsData}
          onTabClick={setActiveAccount}
        />      {/* Account Content */}
      {activeAccount && (
        <div className="space-y-6">
          {currentAccountData?.loading && (
            <AccountLoadingState accountName={activeAccount} />
          )}

          {currentAccountData?.error && (
            <AccountDataError 
              accountName={activeAccount}
              error={currentAccountData.error}
              onRetry={retryLoadAccount}
            />
          )}

          {isDataReady && (
            <>
              {/* Dashboard Header & Summary */}
              <div className={CARD_STYLES}>
                <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center mb-6 gap-4">
                  <h2 className="text-xl sm:text-2xl font-bold">{activeAccount} Dashboard</h2>
                  <div className="flex items-center justify-center sm:justify-end">
                    <ToggleSwitch
                      checked={showSP500}
                      onChange={setShowSP500}
                      label="Compare to S&P"
                      id="sp500-toggle"
                    />
                  </div>
                </div>
                
                {/* Clean, Simple Dashboard Summary */}
                <DashboardSummary 
                  metrics={dashboardMetrics!}
                  showSP500={showSP500}
                  showVFIFX={showVFIFX}
                  showWithoutFees={showWithoutFees}
                />
              </div>

              {/* Performance Chart */}
              <div className={CARD_STYLES}>
                <h3 className="text-lg font-semibold mb-4">Performance Over Time</h3>
                <PerformanceChart 
                  performanceData={currentAccountData.performanceData!}
                  showSP500={showSP500}
                  setShowSP500={setShowSP500}
                  showWithoutFees={showWithoutFees}
                  setShowWithoutFees={setShowWithoutFees}
                  showVFIFX={showVFIFX}
                  setShowVFIFX={setShowVFIFX}
                />
              </div>

              {/* Transaction History */}
              <div className={CARD_STYLES}>
                <h3 className="text-lg font-semibold mb-4">Transaction History</h3>
                <TransactionHistory transactions={currentAccountData.transactions} />
              </div>
            </>
          )}
        </div>
      )}
    </div>
    </ErrorBoundary>
  )
}
