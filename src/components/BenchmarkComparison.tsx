'use client'

import { PerformanceData } from '@/types/financial'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts'

interface BenchmarkComparisonProps {
  performanceData: PerformanceData
}

export default function BenchmarkComparison({ performanceData }: BenchmarkComparisonProps) {
  const formatPercent = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(2)}%`
  }

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
    }).format(value)
  }

  const { benchmarkComparison } = performanceData

  const comparisonData = [
    {
      name: 'Your Portfolio',
      return: performanceData.realReturnPercent,
      amount: performanceData.realReturn,
    },
    {
      name: 'S&P 500',
      return: benchmarkComparison.sp500ReturnPercent,
      amount: benchmarkComparison.sp500Return,
    },
  ]

  const getPerformanceColor = (value: number) => {
    return value >= 0 ? '#10b981' : '#ef4444'
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
          Benchmark Comparison
        </h3>
        <p className="text-gray-600 dark:text-gray-400">
          Your portfolio performance vs S&P 500
        </p>
      </div>

      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart data={comparisonData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="name" 
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <YAxis 
              tickFormatter={(value) => `${value}%`}
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
            />
            <Tooltip 
              formatter={(value: number, name) => [
                `${formatPercent(value)} (${formatCurrency(comparisonData.find(d => d.name === name)?.amount || 0)})`,
                'Return'
              ]}
              contentStyle={{
                backgroundColor: 'rgba(255, 255, 255, 0.95)',
                border: '1px solid #ccc',
                borderRadius: '8px',
              }}
            />
            <Bar 
              dataKey="return" 
              fill="#10b981"
              radius={[4, 4, 0, 0]}
            >
              {
                comparisonData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={getPerformanceColor(entry.return)}
                  />
                ))
              }
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Outperformance
          </h4>
          <p className={`text-lg font-bold ${
            benchmarkComparison.outperformancePercent >= 0 ? 'text-green-600' : 'text-red-600'
          }`}>
            {formatPercent(benchmarkComparison.outperformancePercent)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatCurrency(benchmarkComparison.outperformance)}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Beta
          </h4>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {benchmarkComparison.beta.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {benchmarkComparison.beta < 1 ? 'Less volatile' : 'More volatile'}
          </p>
        </div>

        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
          <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            Sharpe Ratio
          </h4>
          <p className="text-lg font-bold text-gray-900 dark:text-white">
            {benchmarkComparison.sharpeRatio.toFixed(2)}
          </p>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            Risk-adjusted return
          </p>
        </div>
      </div>

      {/* Additional Info */}
      <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
        <div className="flex justify-between items-center text-sm">
          <span className="text-gray-500 dark:text-gray-400">Max Drawdown:</span>
          <span className="font-medium text-red-600">
            {formatPercent(benchmarkComparison.maxDrawdown * 100)}
          </span>
        </div>
      </div>
    </div>
  )
}
