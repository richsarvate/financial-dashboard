'use client'

import { Transaction } from '@/types/financial'
import { useState } from 'react'

interface TransactionHistoryProps {
  transactions: Transaction[]
}

export default function TransactionHistory({ transactions }: TransactionHistoryProps) {
  const [filter, setFilter] = useState<string>('ALL')
  const [currentPage, setCurrentPage] = useState(1)
  const itemsPerPage = 10

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount)
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    })
  }

  const getTransactionIcon = (type: Transaction['type']) => {
    switch (type) {
      case 'BUY':
        return '📈'
      case 'SELL':
        return '📉'
      case 'DIVIDEND':
        return '💰'
      case 'DEPOSIT':
        return '⬆️'
      case 'WITHDRAWAL':
        return '⬇️'
      case 'FEE':
        return '💸'
      default:
        return '📄'
    }
  }

  const getAmountClass = (type: Transaction['type'], amount: number) => {
    if (type === 'DEPOSIT' || type === 'DIVIDEND' || (type === 'SELL' && amount > 0)) {
      return 'text-green-600'
    }
    if (type === 'WITHDRAWAL' || type === 'FEE' || type === 'BUY') {
      return 'text-red-600'
    }
    return amount >= 0 ? 'text-green-600' : 'text-red-600'
  }

  const filteredTransactions = transactions
    .filter(transaction => {
      if (filter === 'ALL') return true
      return transaction.type === filter
    })
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()) // Sort by date descending (most recent first)

  const totalPages = Math.ceil(filteredTransactions.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const displayedTransactions = filteredTransactions.slice(startIndex, startIndex + itemsPerPage)

  const transactionTypes = ['ALL', 'BUY', 'SELL', 'DIVIDEND', 'DEPOSIT', 'WITHDRAWAL', 'FEE']

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Recent Transactions
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Complete record of all account activity (most recent first)
        </p>
      </div>

      {/* Filter Tabs */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {transactionTypes.map((type) => (
            <button
              key={type}
              onClick={() => {
                setFilter(type)
                setCurrentPage(1)
              }}
              className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                filter === type
                  ? 'bg-blue-500 text-white'
                  : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Transaction List */}
      <div className="space-y-2">
        {displayedTransactions.length === 0 ? (
          <div className="text-center py-8 text-gray-500 dark:text-gray-400">
            No transactions found for the selected filter.
          </div>
        ) : (
          displayedTransactions.map((transaction) => (
            <div
              key={transaction.id}
              className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
            >
              <div className="flex items-center space-x-4">
                <div className="text-2xl">{getTransactionIcon(transaction.type)}</div>
                <div>
                  <div className="font-medium text-gray-900 dark:text-white">
                    {transaction.description}
                  </div>
                  <div className="text-sm text-gray-500 dark:text-gray-400">
                    {formatDate(transaction.date)}
                    {transaction.symbol && ` • ${transaction.symbol}`}
                    {transaction.quantity && ` • ${transaction.quantity} shares`}
                    {transaction.price && ` @ ${formatCurrency(transaction.price)}`}
                  </div>
                </div>
              </div>
              <div className="text-right">
                <div className={`font-bold ${getAmountClass(transaction.type, transaction.netAmount)}`}>
                  {transaction.netAmount >= 0 ? '+' : ''}{formatCurrency(transaction.netAmount)}
                </div>
                {transaction.fees > 0 && (
                  <div className="text-sm text-red-500">
                    Fee: {formatCurrency(transaction.fees)}
                  </div>
                )}
              </div>
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="mt-6 flex items-center justify-between">
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Showing {startIndex + 1}-{Math.min(startIndex + itemsPerPage, filteredTransactions.length)} of {filteredTransactions.length} transactions
          </div>
          <div className="flex space-x-2">
            <button
              onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="px-3 py-1 text-sm font-medium text-gray-700 dark:text-gray-300">
              Page {currentPage} of {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1 rounded border border-gray-300 dark:border-gray-600 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
