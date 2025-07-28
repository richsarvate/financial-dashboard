'use client'

import { PerformanceData } from '@/types/financial'
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, Brush } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { BENCHMARK_CONFIGS, BENCHMARK_MONTHLY_RETURNS } from '@/config/benchmarks'
import { FinancialCalculator } from '@/utils/financialCalculations'

interface PerformanceChartProps {
  performanceData: PerformanceData
  activeBenchmarks: Set<string>
  showWithoutFees: boolean
  setShowWithoutFees: (show: boolean) => void
}

export default function PerformanceChart({ performanceData, activeBenchmarks, showWithoutFees, setShowWithoutFees }: PerformanceChartProps) {
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

  // Use the real statement balance from accountValue for each month
  const chartData = performanceData.timeSeriesData.map(point => ({
    date: formatDate(point.date),
    fullDate: formatFullDate(point.date),
    rawDate: point.date,
    accountValue: point.accountValue, // Always use the real statement balance
    principalInvested: (point as any).principalInvested || ((point.deposits || 0) - (point.withdrawals || 0)),
    deposits: point.deposits || 0,
    withdrawals: point.withdrawals || 0,
    fees: point.fees || 0,
    gainsMade: point.accountValue - ((point as any).principalInvested || ((point.deposits || 0) - (point.withdrawals || 0))),
    largeFees: (point as any).largeFees || [],
    spyValue: point.spyValue || 0,
    vfifxValue: (point as any).vfifxValue || 0,
  }))

  // Calculate cumulative principal invested over time and S&P 500 alternative
  // Principal = Initial Balance + Net Additional Contributions
  // Initial balance ($78,527) + Monthly contributions (~$31k) + Net Oct 2024 contribution ($70k) = ~$180k
  const initialBalance = performanceData.timeSeriesData[0]?.deposits || 0 // $78,527.13
  
  // Calculate progressive Pelosi values for each time point
  const startDate = performanceData.timeSeriesData[0]?.date || '2021-11-30';
  let pelosiProgressiveValue = initialBalance; // Start with initial investment
  
  // Only use the real statement balance for accountValue; do not estimate or override
  const chartDataWithCumulative = chartData.map((point, index) => {
    const cumulativePrincipal = point.principalInvested;
    const accountValueWithoutFees = point.accountValue; // No synthetic fee adjustment
    const isPositive = point.accountValue >= cumulativePrincipal;
    let sp500Alternative = point.spyValue || 0;
    let vfifxAlternative = point.vfifxValue || 0;
    
    // Calculate progressive Pelosi value for this specific date
    let pelosiAlternative = (point as any).pelosiValue || 0;
    if (pelosiAlternative === 0) {
      // Calculate Pelosi performance from start date to this point's date
      if (index === 0) {
        pelosiAlternative = cumulativePrincipal; // Start with principal
      } else {
        // Get the previous month's value and apply this month's return
        const currentMonth = point.rawDate.substring(0, 7); // YYYY-MM format
        const monthlyReturn = BENCHMARK_MONTHLY_RETURNS['PELOSI']?.[currentMonth] || 0;
        const prevPoint = chartData[index - 1];
        const prevPrincipal = (prevPoint as any).principalInvested || ((prevPoint.deposits || 0) - (prevPoint.withdrawals || 0));
        const principalChange = cumulativePrincipal - prevPrincipal;
        
        // Apply monthly return to previous value, then add any new principal
        pelosiProgressiveValue = pelosiProgressiveValue * (1 + monthlyReturn) + principalChange;
        pelosiAlternative = pelosiProgressiveValue;
      }
    }
    return {
      ...point,
      cumulativePrincipal: Math.max(0, cumulativePrincipal),
      cumulativeFees: 0,
      accountValueWithoutFees,
      gainsMade: point.accountValue - cumulativePrincipal,
      sp500Alternative: Math.max(0, sp500Alternative),
      sp500Gains: 0,
      vfifxAlternative: Math.max(0, vfifxAlternative),
      vfifxGains: 0,
      pelosiAlternative: Math.max(0, pelosiAlternative),
      pelosiGains: 0,
      isPositive,
      winningValue: isPositive ? point.accountValue : cumulativePrincipal,
      losingValue: !isPositive ? point.accountValue : cumulativePrincipal,
      baseValue: cumulativePrincipal
    };
  });
  
  // S&P 500 values are now properly calculated in the data generation
  // No need for second pass calculation since we use spyValue from data

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
            
            {/* Dynamic Benchmark Tooltips */}
            {Array.from(activeBenchmarks).map(benchmarkId => {
              const config = BENCHMARK_CONFIGS[benchmarkId];
              if (!config) return null;
              
              // Map benchmark IDs to their data keys
              const dataKeyMap: Record<string, string> = {
                'SP500': 'sp500Alternative',
                'VFIFX': 'vfifxAlternative',
                'PELOSI': 'pelosiAlternative'
              };
              
              const dataKey = dataKeyMap[benchmarkId];
              if (!dataKey) return null;
              
              const alternativeValue = payload?.[0]?.payload?.[dataKey] || 0;
              const gains = alternativeValue - cumulativePrincipal;
              const vsPortfolio = accountValue - alternativeValue;
              
              return (
                <div key={benchmarkId}>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{config.name} Alternative:</span>
                    <span className="font-semibold" style={{ color: config.color }}>
                      {formatCurrency(alternativeValue)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">{config.name} Gains:</span>
                    <span className={`font-semibold ${gains >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {gains >= 0 ? '+' : ''}{formatCurrency(gains)}
                    </span>
                  </div>
                  
                  <div className="flex justify-between items-center">
                    <span className="text-gray-600 dark:text-gray-400">vs {config.name}:</span>
                    <span className={`font-semibold ${vsPortfolio >= 0 ? 'text-emerald-600 dark:text-emerald-400' : 'text-red-600 dark:text-red-400'}`}>
                      {vsPortfolio >= 0 ? '+' : ''}{formatCurrency(vsPortfolio)}
                    </span>
                  </div>
                </div>
              );
            })}

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
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-4 sm:p-6 border border-gray-200 dark:border-gray-700">
      <div className="mb-6">
        <div className="flex flex-col lg:flex-row lg:justify-between lg:items-start mb-4 gap-4">
          <div>
            <h3 className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white mb-2">
              Portfolio Growth vs Principal Investment vs Benchmarks
            </h3>
            <p className="text-sm sm:text-base text-gray-600 dark:text-gray-400">
              See how your managed portfolio compares to investing the same amounts directly in various benchmarks
            </p>
          </div>
          <div className="flex items-center gap-4">
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
                Show without fees
              </span>
            </label>
          </div>
        </div>
      </div>

      <div className="h-64 sm:h-80 lg:h-96">
        <ResponsiveContainer width="100%" height="100%">
          <ComposedChart 
            data={chartDataWithCumulative} 
            margin={{ 
              top: 20, 
              right: 10, 
              left: 10, 
              bottom: 5 
            }}
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
            
            {/* Dynamic Benchmark Lines */}
            {Array.from(activeBenchmarks).map(benchmarkId => {
              const config = BENCHMARK_CONFIGS[benchmarkId];
              if (!config) return null;
              
              // Map benchmark IDs to their dataKey names
              const dataKeyMap: Record<string, string> = {
                'SP500': 'sp500Alternative',
                'VFIFX': 'vfifxAlternative',
                'PELOSI': 'pelosiAlternative'
              };
              
              const dataKey = dataKeyMap[benchmarkId];
              if (!dataKey) return null;
              
              return (
                <Line 
                  key={benchmarkId}
                  type="monotone" 
                  dataKey={dataKey} 
                  stroke={config.color} 
                  strokeWidth={2}
                  dot={{ fill: config.color, strokeWidth: 2, r: 3 }}
                  activeDot={{ r: 5, stroke: config.color, strokeWidth: 2, fill: '#fff' }}
                  name={`${config.name} Alternative`}
                />
              );
            })}
            
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
              {/* Mini chart in the brush showing account balance and active benchmarks */}
              <ComposedChart>
                {Array.from(activeBenchmarks).map(benchmarkId => {
                  const config = BENCHMARK_CONFIGS[benchmarkId];
                  if (!config) return null;
                  
                  const dataKeyMap: Record<string, string> = {
                    'SP500': 'sp500Alternative',
                    'VFIFX': 'vfifxAlternative',
                    'PELOSI': 'pelosiAlternative'
                  };
                  
                  const dataKey = dataKeyMap[benchmarkId];
                  if (!dataKey) return null;
                  
                  return (
                    <Line 
                      key={benchmarkId}
                      type="monotone" 
                      dataKey={dataKey} 
                      stroke={config.color}
                      strokeWidth={1}
                      dot={false}
                    />
                  );
                })}
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
        {/* Dynamic benchmark legends */}
        {Array.from(activeBenchmarks).map(benchmarkId => {
          const config = BENCHMARK_CONFIGS[benchmarkId];
          if (!config) return null;
          
          return (
            <div key={benchmarkId} className="flex items-center">
              <div className="w-4 h-0.5 mr-2" style={{ backgroundColor: config.color }}></div>
              <span className="text-gray-600 dark:text-gray-400">{config.name} Alternative</span>
            </div>
          );
        })}
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
