'use client';

import React, { useState, useMemo } from 'react';
import { Transaction } from '@/types/financial';
import { FinancialFormatter } from '@/utils/financialCalculations';

interface FeeTransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  transactions: Transaction[];
  accountName: string;
  totalFees: number;
}

export const FeeTransactionModal: React.FC<FeeTransactionModalProps> = ({
  isOpen,
  onClose,
  transactions,
  accountName,
  totalFees
}) => {
  const [activeTab, setActiveTab] = useState<'advisor' | 'trading'>('advisor');

  // Categorize fee transactions
  const feeCategories = useMemo(() => {
    const advisorFees: Transaction[] = [];
    const tradingFees: Transaction[] = [];
    
    transactions.forEach(tx => {
      if (tx.type === 'FEE') {
        advisorFees.push(tx);
      } else if (tx.fees > 0) {
        tradingFees.push({
          ...tx,
          amount: tx.fees, // Use the fee amount for display
          description: `Trading Fee (${tx.symbol || 'Unknown'})`
        });
      }
    });

    return {
      advisor: advisorFees.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
      trading: tradingFees.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()),
    };
  }, [transactions]);

  // Calculate totals
  const advisorTotal = feeCategories.advisor.reduce((sum, tx) => sum + tx.amount, 0);
  const tradingTotal = feeCategories.trading.reduce((sum, tx) => sum + tx.amount, 0);

  if (!isOpen) return null;

  // Get active tab data
  const activeTransactions = feeCategories[activeTab];

  // Group transactions by month for better organization
  const groupedByMonth = activeTransactions.reduce((groups, tx) => {
    const monthKey = new Date(tx.date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long' 
    });
    if (!groups[monthKey]) groups[monthKey] = [];
    groups[monthKey].push(tx);
    return groups;
  }, {} as Record<string, Transaction[]>);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  };

  const getFeeAmount = (tx: Transaction) => {
    return tx.amount;
  };

  const getFeeDescription = (tx: Transaction) => {
    if (tx.type === 'FEE') {
      return tx.description || 'Account Fee';
    }
    return tx.description || `Trading Fee (${tx.symbol || 'Unknown'})`;
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 rounded-lg max-w-2xl w-full max-h-[80vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white">
              Fee Breakdown
            </h2>
            <div className="mt-2 space-y-1">
              <p className="text-sm text-gray-600 dark:text-gray-400">
                {accountName} • Total: {FinancialFormatter.formatCurrency(totalFees)}
              </p>
              <div className="flex gap-4 text-sm">
                <span className="text-blue-600 font-medium">
                  Advisor: {FinancialFormatter.formatCurrency(advisorTotal)}
                </span>
                <span className="text-orange-600 font-medium">
                  Trading: {FinancialFormatter.formatCurrency(tradingTotal)}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 text-2xl font-bold"
          >
            ×
          </button>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-gray-200 dark:border-gray-700">
          <button
            onClick={() => setActiveTab('advisor')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'advisor'
                ? 'text-blue-600 border-b-2 border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Advisor Fees ({feeCategories.advisor.length})
          </button>
          <button
            onClick={() => setActiveTab('trading')}
            className={`flex-1 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'trading'
                ? 'text-orange-600 border-b-2 border-orange-600 bg-orange-50 dark:bg-orange-900/20'
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white'
            }`}
          >
            Trading Fees ({feeCategories.trading.length})
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[60vh]">
          {activeTransactions.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-400 text-4xl mb-2">💰</div>
              <p className="text-gray-600 dark:text-gray-400">
                No {activeTab} fee transactions found
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedByMonth).map(([month, monthTransactions]) => (
                <div key={month}>
                  {/* Month Header */}
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                      {month}
                    </h3>
                    <div className={`text-sm font-medium ${activeTab === 'advisor' ? 'text-blue-600' : 'text-orange-600'}`}>
                      {FinancialFormatter.formatCurrency(
                        monthTransactions.reduce((sum, tx) => sum + getFeeAmount(tx), 0)
                      )}
                    </div>
                  </div>

                  {/* Transactions for this month */}
                  <div className="space-y-2">
                    {monthTransactions.map((tx, index) => {
                      const isAdvisorFee = tx.type === 'FEE';
                      const bgColor = isAdvisorFee ? 'bg-blue-50 dark:bg-blue-900/20' : 'bg-orange-50 dark:bg-orange-900/20';
                      const borderColor = isAdvisorFee ? 'border-blue-200 dark:border-blue-800' : 'border-orange-200 dark:border-orange-800';
                      const textColor = isAdvisorFee ? 'text-blue-600' : 'text-orange-600';
                      
                      return (
                        <div
                          key={`${tx.date}-${index}`}
                          className={`flex items-center justify-between p-3 ${bgColor} border ${borderColor} rounded-lg`}
                        >
                          <div className="flex-1">
                            <div className="flex items-center gap-3">
                              <div className={`${textColor} font-bold`}>
                                {isAdvisorFee ? '🏛️' : '💸'}
                              </div>
                              <div>
                                <p className="font-medium text-gray-900 dark:text-white">
                                  {getFeeDescription(tx)}
                                </p>
                                <p className="text-sm text-gray-600 dark:text-gray-400">
                                  {formatDate(tx.date)}
                                  {tx.symbol && tx.type !== 'FEE' && (
                                    <> • {tx.type} {tx.quantity ? `${tx.quantity} shares` : ''}</>
                                  )}
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className={`font-bold ${textColor}`}>
                              -{FinancialFormatter.formatCurrency(getFeeAmount(tx))}
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-between items-center p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {activeTransactions.length} {activeTab} fee transaction{activeTransactions.length !== 1 ? 's' : ''}
          </div>
          <button
            onClick={onClose}
            className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
