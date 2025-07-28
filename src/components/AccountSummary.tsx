'use client'

import React, { useState } from 'react'
import { AccountData, PerformanceData, Transaction } from '@/types/financial'
import { FeeTransactionModal } from './FeeTransactionModal'

interface AccountSummaryProps {
  accountData: AccountData
  performanceData: PerformanceData
  transactions?: Transaction[]
}

export default function AccountSummary({ accountData, performanceData, transactions = [] }: AccountSummaryProps) {
  const [showFeeModal, setShowFeeModal] = useState(false);

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatPercent = (percent: number) => {
    return `${percent >= 0 ? '+' : ''}${percent.toFixed(2)}%`
  }

  const getChangeClass = (value: number) => {
    if (value > 0) return 'text-green-600'
    if (value < 0) return 'text-red-600'
    return 'text-gray-600'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Account Summary
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          {accountData.accountName} ({accountData.accountId})
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Current Balance */}
        <div className="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-700 dark:text-blue-300 mb-1">
            Current Balance
          </h3>
          <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
            {formatCurrency(accountData.currentBalance)}
          </p>
          <p className={`text-sm ${getChangeClass(accountData.dayChange)}`}>
            {formatCurrency(accountData.dayChange)} ({formatPercent(accountData.dayChangePercent)}) today
          </p>
        </div>

        {/* Real Return */}
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-green-700 dark:text-green-300 mb-1">
            Real Return
          </h3>
          <p className="text-2xl font-bold text-green-900 dark:text-green-100">
            {formatCurrency(performanceData.realReturn)}
          </p>
          <p className={`text-sm ${getChangeClass(performanceData.realReturnPercent)}`}>
            {formatPercent(performanceData.realReturnPercent)} after deposits/withdrawals
          </p>
        </div>

        {/* vs S&P 500 */}
        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-purple-700 dark:text-purple-300 mb-1">
            vs S&P 500
          </h3>
          <p className={`text-2xl font-bold ${getChangeClass(performanceData.benchmarkComparison.outperformance)}`}>
            {formatCurrency(performanceData.benchmarkComparison.outperformance)}
          </p>
          <p className={`text-sm ${getChangeClass(performanceData.benchmarkComparison.outperformancePercent)}`}>
            {formatPercent(performanceData.benchmarkComparison.outperformancePercent)} outperformance
          </p>
        </div>

        {/* Annual Return */}
        <div className="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-4">
          <h3 className="text-sm font-medium text-orange-700 dark:text-orange-300 mb-1">
            Annualized Return
          </h3>
          <p className={`text-2xl font-bold ${getChangeClass(performanceData.annualizedReturn)}`}>
            {formatPercent(performanceData.annualizedReturn)}
          </p>
          <p className="text-sm text-gray-600 dark:text-gray-400">
            Over {Math.floor(performanceData.timeSeriesData.length / 12)} years
          </p>
        </div>
      </div>

      {/* Additional Metrics */}
      <div className="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Deposits:</span>
            <span className="ml-2 font-medium">{formatCurrency(performanceData.deposits)}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Withdrawals:</span>
            <span className="ml-2 font-medium">{formatCurrency(performanceData.withdrawals)}</span>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Total Fees:</span>
            <button
              onClick={() => setShowFeeModal(true)}
              className="ml-2 font-medium text-red-600 hover:text-red-700 hover:underline cursor-pointer transition-colors"
              title="Click to view fee transactions"
            >
              {formatCurrency(performanceData.fees)}
            </button>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Available Cash:</span>
            <span className="ml-2 font-medium">{formatCurrency(accountData.availableCash)}</span>
          </div>
        </div>
      </div>

      {/* Fee Transaction Modal */}
      <FeeTransactionModal
        isOpen={showFeeModal}
        onClose={() => setShowFeeModal(false)}
        transactions={transactions}
        accountName={accountData.accountName || 'Account'}
        totalFees={performanceData.fees}
      />
    </div>
  )
}
