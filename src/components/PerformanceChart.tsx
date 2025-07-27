'use client'

import { PerformanceData } from '@/types/financial'
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, Brush } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'

interface PerformanceChartProps {
  performanceData: PerformanceData
  showSP500: boolean
  setShowSP500: (show: boolean) => void
  showWithoutFees: boolean
  setShowWithoutFees: (show: boolean) => void
}

export default function PerformanceChart({ performanceData, showSP500, setShowSP500, showWithoutFees, setShowWithoutFees }: PerformanceChartProps) {
  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(value)
  }

  const formatCompactCurrency = (value: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      notation: 'compact',
      minimumFractionDigits: 0,
      maximumFractionDigits: 1,
    }).format(value)
  }

  const formatDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM yyyy')
    } catch {
      return dateString
    }
  }

  const formatFullDate = (dateString: string) => {
    try {
      return format(parseISO(dateString), 'MMM dd, yyyy')
    } catch {
      return dateString
    }
  }

  const chartData = performanceData.timeSeriesData.map(point => ({
    date: formatDate(point.date),
    fullDate: formatFullDate(point.date),
    rawDate: point.date,
    accountValue: point.accountValue,
    principalInvested: (point.deposits || 0) - (point.withdrawals || 0), // Running total of money you put in
    deposits: point.deposits || 0,
    withdrawals: point.withdrawals || 0,
    fees: point.fees || 0,
    gainsMade: point.accountValue - ((point.deposits || 0) - (point.withdrawals || 0)), // Money created by investments
    largeFees: (point as any).largeFees || [], // Large fees for this period
    spyValue: point.spyValue || 0, // S&P 500 benchmark value
  }))

  // Calculate cumulative principal invested over time and S&P 500 alternative
  // Principal = Initial Balance + Net Additional Contributions
  // Initial balance ($78,527) + Monthly contributions (~$31k) + Net Oct 2024 contribution ($70k) = ~$180k
  const initialBalance = performanceData.timeSeriesData[0]?.deposits || 0 // $78,527.13
  
  // First pass: calculate basic data with cumulative principal, fees, and S&P 500 alternative
  // Since individual monthly fees are mostly 0 in the data, we'll use the total fees
  // and distribute them proportionally across the timeline
  const totalFees = performanceData.fees || 0
  const totalMonths = chartData.length
  
  let cumulativeFees = 0
  const chartDataWithCumulative = chartData.map((point, index) => {
    const cumulativePrincipal = point.deposits - point.withdrawals
    
    // Distribute total fees proportionally across months
    // This gives a more realistic view of fee impact over time
    const monthlyFeeEstimate = totalFees / totalMonths
    cumulativeFees += monthlyFeeEstimate
    
    const accountValueWithoutFees = point.accountValue + cumulativeFees // Add back accumulated fees
    const isPositive = point.accountValue >= cumulativePrincipal
    
    // Debug logging for the last few data points
    if (index >= chartData.length - 3) {
      console.log(`Point ${index}:`, {
        date: point.date,
        accountValue: point.accountValue,
        accountValueWithoutFees,
        monthlyFeeEstimate: monthlyFeeEstimate,
        cumulativeFees,
        difference: accountValueWithoutFees - point.accountValue,
        totalFeesInData: totalFees
      })
    }
    
    // Calculate what your portfolio would be worth if you had invested the same amounts in S&P 500
    let sp500Alternative = 0
    
    if (index === 0) {
      // First month - just the initial deposit
      sp500Alternative = point.deposits
    } else {
      // For subsequent months, we need to look at the previously calculated result
      // We'll calculate this in a second pass to avoid the circular reference
      sp500Alternative = 0 // Placeholder, will be calculated below
    }
    
    return {
      ...point,
      cumulativePrincipal: Math.max(0, cumulativePrincipal),
      cumulativeFees,
      accountValueWithoutFees,
      gainsMade: point.accountValue - cumulativePrincipal,
      sp500Alternative: Math.max(0, sp500Alternative),
      sp500Gains: 0, // Will be calculated after sp500Alternative is set
      isPositive, // Track if account is above or below principal
      // Create separate values for winning and losing periods
      winningValue: isPositive ? point.accountValue : cumulativePrincipal,
      losingValue: !isPositive ? point.accountValue : cumulativePrincipal,
      baseValue: cumulativePrincipal
    }
  })
  
  // Second pass: calculate S&P 500 alternative values properly
  for (let i = 1; i < chartDataWithCumulative.length; i++) {
    const currentPoint = chartDataWithCumulative[i]
    const prevPoint = chartDataWithCumulative[i - 1]
    const currentOriginal = chartData[i]
    const prevOriginal = chartData[i - 1]
    
    const newDeposits = currentOriginal.deposits - prevOriginal.deposits
    const newWithdrawals = currentOriginal.withdrawals - prevOriginal.withdrawals
    
    // Calculate S&P 500 monthly return based on the spyValue growth
    const sp500MonthlyReturn = prevOriginal.spyValue > 0 
      ? (currentOriginal.spyValue - prevOriginal.spyValue) / prevOriginal.spyValue 
      : 0
    
    const sp500Alternative = (prevPoint.sp500Alternative + newDeposits - newWithdrawals) * (1 + sp500MonthlyReturn)
    
    currentPoint.sp500Alternative = Math.max(0, sp500Alternative)
    currentPoint.sp500Gains = currentPoint.sp500Alternative - currentPoint.cumulativePrincipal
  }

  // Custom tooltip component
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const accountValue = showWithoutFees ? data.accountValueWithoutFees : data.accountValue
      const cumulativePrincipal = data.cumulativePrincipal
      const gainsMade = accountValue - cumulativePrincipal
      const deposits = data.deposits
      const withdrawals = data.withdrawals
      const monthlyFeeEstimate = (performanceData.fees || 0) / performanceData.timeSeriesData.length
      const cumulativeFees = data.cumulativeFees
      const largeFees = data.largeFees || []
      const sp500Alternative = data.sp500Alternative || 0
      const sp500Gains = data.sp500Gains || 0

      return (
        <div className="bg-white dark:bg-gray-800 p-4 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg min-w-[280px]">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-3">
            {data.fullDate}
          </h4>
          
          <div className="space-y-2 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">
                Account Balance {showWithoutFees ? '(without fees)' : '(with fees)'}:
              </span>
              <span className="font-semibold text-black dark:text-white">
                {formatCurrency(accountValue)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Principal Invested:</span>
              <span className="font-semibold text-gray-400 dark:text-gray-500">
                {formatCurrency(cumulativePrincipal)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Investment Gains:</span>
              <span className={`font-semibold ${gainsMade >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                {gainsMade >= 0 ? '+' : ''}{formatCurrency(gainsMade)}
              </span>
            </div>

            <hr className="border-gray-200 dark:border-gray-600 my-2" />
            
            {showSP500 && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">S&P 500 Alternative:</span>
                  <span className="font-semibold text-purple-600 dark:text-purple-400">
                    {formatCurrency(sp500Alternative)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">S&P 500 Gains:</span>
                  <span className={`font-semibold ${sp500Gains >= 0 ? 'text-purple-600 dark:text-purple-400' : 'text-red-600 dark:text-red-400'}`}>
                    {sp500Gains >= 0 ? '+' : ''}{formatCurrency(sp500Gains)}
                  </span>
                </div>
                
                <div className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">vs S&P 500:</span>
                  <span className={`font-semibold ${(accountValue - sp500Alternative) >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                    {(accountValue - sp500Alternative) >= 0 ? '+' : ''}{formatCurrency(accountValue - sp500Alternative)}
                  </span>
                </div>
              </>
            )}

            <hr className="border-gray-200 dark:border-gray-600 my-2" />
            
            <div className="flex justify-between items-center text-xs">
              <span className="text-gray-500 dark:text-gray-400">Total Fees Paid:</span>
              <span className="text-red-600 dark:text-red-400">-{formatCurrency(cumulativeFees)}</span>
            </div>
            
            {withdrawals > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">This Period - Withdrawals:</span>
                <span className="text-red-600 dark:text-red-400">-{formatCurrency(withdrawals)}</span>
              </div>
            )}
            
            {monthlyFeeEstimate > 0 && (
              <div className="flex justify-between items-center text-xs">
                <span className="text-gray-500 dark:text-gray-400">Estimated Monthly Fees:</span>
                <span className="text-red-600 dark:text-red-400">-{formatCurrency(monthlyFeeEstimate)}</span>
              </div>
            )}

            {largeFees.length > 0 && (
              <>
                <hr className="border-red-200 dark:border-red-600 my-2" />
                <div className="text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                  ⚠️ Large Management Fees:
                </div>
                {largeFees.map((fee: any, index: number) => (
                  <div key={index} className="flex justify-between items-center text-xs">
                    <span className="text-red-500 dark:text-red-400">
                      {format(parseISO(fee.date), 'MMM dd')}:
                    </span>
                    <span className="font-semibold text-red-600 dark:text-red-400">
                      -{formatCurrency(fee.amount)}
                    </span>
                  </div>
                ))}
              </>
            )}
          </div>
        </div>
      )
    }
    return null
  }

  // Calculate the initial investment value for reference line
  const initialValue = chartDataWithCumulative[0]?.cumulativePrincipal || 0

  // Get all data points with large fees for reference lines
  const largeFeePoints = chartDataWithCumulative.filter(point => point.largeFees.length > 0)

  // Determine if we're winning or losing based on final values
  const finalData = chartDataWithCumulative[chartDataWithCumulative.length - 1]
  const isWinning = finalData?.accountValue > finalData?.cumulativePrincipal
  const fillColor = isWinning ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)' // Green if winning, red if losing

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
              Portfolio Growth vs Principal Investment vs S&P 500 Alternative
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              See how your managed portfolio compares to what you would have earned investing the same amounts directly in S&P 500
            </p>
          </div>
          <div className="flex items-center ml-4 space-x-6">
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
            
            <label className="flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={showWithoutFees}
                onChange={(e) => setShowWithoutFees(e.target.checked)}
                className="sr-only"
              />
              <div className={`relative w-11 h-6 rounded-full transition-colors ${
                showWithoutFees ? 'bg-orange-600' : 'bg-gray-300 dark:bg-gray-600'
              }`}>
                <div className={`absolute w-4 h-4 bg-white rounded-full top-1 transition-transform ${
                  showWithoutFees ? 'translate-x-6' : 'translate-x-1'
                }`}></div>
              </div>
              <span className="ml-3 text-sm font-medium text-gray-700 dark:text-gray-300">
                Remove MYRA Fees
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartDataWithCumulative} 
            margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
          >
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
              interval="preserveStartEnd"
            />
            <YAxis 
              tickFormatter={formatCompactCurrency}
              tick={{ fontSize: 12 }}
              className="text-gray-600 dark:text-gray-400"
              domain={['dataMin - 5000', 'dataMax + 5000']}
            />
            <Tooltip 
              content={<CustomTooltip />}
              cursor={{ strokeDasharray: '3 3', stroke: '#8884d8' }}
            />
            
            {/* Reference lines for large fees */}
            {largeFeePoints.map((point, index) => (
              <ReferenceLine 
                key={`fee-${index}`}
                x={point.date}
                stroke="#ef4444"
                strokeDasharray="2 2"
                strokeWidth={1}
                label={{ 
                  value: `$${Math.round(point.largeFees.reduce((sum: number, fee: any) => sum + fee.amount, 0) / 1000)}K fee`,
                  position: 'top',
                  style: { 
                    fontSize: '10px', 
                    fill: '#ef4444',
                    fontWeight: 'bold'
                  }
                }}
              />
            ))}
            
            {/* Vertical connecting lines between principal and account balance for each month */}
            {chartDataWithCumulative.map((point, index) => {
              const accountValue = showWithoutFees ? point.accountValueWithoutFees : point.accountValue
              const isWinning = accountValue > point.cumulativePrincipal
              const lineColor = isWinning ? '#10b981' : '#f43f5e' // Brighter green and red
              const yMin = Math.min(accountValue, point.cumulativePrincipal)
              const yMax = Math.max(accountValue, point.cumulativePrincipal)
              
              return (
                <ReferenceLine
                  key={`connector-${index}`}
                  segment={[
                    { x: point.date, y: yMin },
                    { x: point.date, y: yMax }
                  ]}
                  stroke={lineColor}
                  strokeWidth={2}
                  strokeOpacity={0.9}
                />
              )
            })}
            
            
            {/* Principal Investment Line (Money you put in) - Light Gray and Thin */}
            <Line 
              type="monotone" 
              dataKey="cumulativePrincipal" 
              stroke="#d1d5db" 
              strokeWidth={2}
              dot={{ fill: '#d1d5db', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5, stroke: '#d1d5db', strokeWidth: 2, fill: '#fff' }}
              name="Principal Invested"
            />
            
            {/* S&P 500 Alternative Line - Purple */}
            {showSP500 && (
              <Line 
                type="monotone" 
                dataKey="sp500Alternative" 
                stroke="#8b5cf6" 
                strokeWidth={2}
                dot={{ fill: '#8b5cf6', strokeWidth: 2, r: 3 }}
                activeDot={{ r: 5, stroke: '#8b5cf6', strokeWidth: 2, fill: '#fff' }}
                name="S&P 500 Alternative"
              />
            )}
            
            {/* Account Balance Line - Black/Orange depending on fees toggle */}
            <Line 
              type="monotone" 
              dataKey={showWithoutFees ? "accountValueWithoutFees" : "accountValue"}
              stroke={showWithoutFees ? "#ea580c" : "#000000"}
              strokeWidth={3}
              dot={{ fill: showWithoutFees ? '#ea580c' : '#000000', strokeWidth: 2, r: 4 }}
              activeDot={{ r: 6, stroke: showWithoutFees ? '#ea580c' : '#000000', strokeWidth: 2, fill: '#fff' }}
              name={showWithoutFees ? "Account Balance (without fees)" : "Account Balance (with fees)"}
            />
            
            {/* Brush component for time range selection */}
            <Brush
              dataKey="date"
              height={60}
              stroke="#8884d8"
              fill="rgba(136, 132, 216, 0.1)"
              startIndex={0} // Start from the beginning
              endIndex={chartDataWithCumulative.length - 1} // End at the last data point
            >
              {/* Mini chart in the brush showing account balance and S&P 500 alternative */}
              <ComposedChart>
                {showSP500 && (
                  <Line 
                    type="monotone" 
                    dataKey="sp500Alternative" 
                    stroke="#8b5cf6"
                    strokeWidth={1}
                    dot={false}
                  />
                )}
                <Line 
                  type="monotone" 
                  dataKey={showWithoutFees ? "accountValueWithoutFees" : "accountValue"}
                  stroke={showWithoutFees ? "#ea580c" : "#000000"}
                  strokeWidth={1}
                  dot={false}
                />
              </ComposedChart>
            </Brush>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <div className="mt-6 flex flex-wrap justify-center gap-6 text-sm">
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-gray-300 mr-2"></div>
          <span className="text-gray-600 dark:text-gray-400">Principal Invested</span>
        </div>
        {showSP500 && (
          <div className="flex items-center">
            <div className="w-4 h-0.5 bg-purple-500 mr-2"></div>
            <span className="text-gray-600 dark:text-gray-400">S&P 500 Alternative</span>
          </div>
        )}
        <div className="flex items-center">
          <div className={`w-4 h-0.5 mr-2 ${showWithoutFees ? 'bg-orange-600' : 'bg-black'}`}></div>
          <span className="text-gray-600 dark:text-gray-400">
            Account Balance {showWithoutFees ? '(without fees)' : '(with fees)'}
          </span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-green-500 mr-2"></div>
          <span className="text-gray-600 dark:text-gray-400">Monthly Gain</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-red-500 mr-2"></div>
          <span className="text-gray-600 dark:text-gray-400">Monthly Loss</span>
        </div>
        <div className="flex items-center">
          <div className="w-4 h-0.5 bg-red-500 mr-2 border-dashed border-t"></div>
          <span className="text-gray-600 dark:text-gray-400">Large Management Fees ($1K+)</span>
        </div>
        <div className="flex items-center text-xs text-gray-500 dark:text-gray-400">
          <span>💡 Vertical lines show monthly performance | Drag timeline below to zoom to specific periods</span>
        </div>
      </div>
    </div>
  )
}
