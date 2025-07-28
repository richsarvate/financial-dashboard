'use client'

import { PerformanceData } from '@/types/financial'
import { ComposedChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine, Area, Brush } from 'recharts'
import { format, parseISO } from 'date-fns'
import { useState } from 'react'
import { BENCHMARK_CONFIGS, calculateBenchmarkPerformance } from '@/config/benchmarks'
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
  
  // Only use the real statement balance for accountValue; do not estimate or override
  const chartDataWithCumulative = chartData.map((point, index) => {
    const cumulativePrincipal = point.principalInvested;
    const accountValueWithoutFees = point.accountValue; // No synthetic fee adjustment
    const isPositive = point.accountValue >= cumulativePrincipal;
    let sp500Alternative = point.spyValue || 0;
    let vfifxAlternative = point.vfifxValue || 0;
    
    // Calculate all benchmark alternatives using centralized logic
    const calculateBenchmarkValue = (benchmarkId: string) => {
      if (index === 0) {
        return cumulativePrincipal; // Start with principal
      } else {
        const timeSeriesSlice = performanceData.timeSeriesData.slice(0, index + 1);
        const principalInvested = FinancialCalculator.calculatePrincipalInvested(timeSeriesSlice);
        const benchmarkResult = calculateBenchmarkPerformance(benchmarkId, timeSeriesSlice, principalInvested);
        return Math.max(benchmarkResult.value, 0);
      }
    };
    
    const pelosiAlternative = calculateBenchmarkValue('PELOSI');
    const qqqAlternative = calculateBenchmarkValue('QQQ');
    const vtiAlternative = calculateBenchmarkValue('VTI');
    
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
      pelosiAlternative,
      pelosiGains: 0,
      qqqAlternative,
      qqqGains: 0,
      vtiAlternative, 
      vtiGains: 0,
      isPositive,
      winningValue: isPositive ? point.accountValue : cumulativePrincipal,
      losingValue: !isPositive ? point.accountValue : cumulativePrincipal,
      baseValue: cumulativePrincipal
    };
  });
  
  // S&P 500 values are now properly calculated in the data generation
  // No need for second pass calculation since we use spyValue from data

  // Custom tooltip component - simplified to show just values
  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload
      const accountValue = showWithoutFees ? data.accountValueWithoutFees : data.accountValue

      return (
        <div className="bg-white dark:bg-gray-800 p-3 border border-gray-200 dark:border-gray-600 rounded-lg shadow-lg">
          <h4 className="text-sm font-semibold text-gray-900 dark:text-white mb-2">
            {data.fullDate}
          </h4>
          
          <div className="space-y-1 text-sm">
            <div className="flex justify-between items-center">
              <span className="text-gray-600 dark:text-gray-400">Portfolio:</span>
              <span className="font-semibold text-black dark:text-white">
                {formatCurrency(accountValue)}
              </span>
            </div>
            
            {/* Show active benchmark values */}
            {Array.from(activeBenchmarks).map(benchmarkId => {
              const config = BENCHMARK_CONFIGS[benchmarkId];
              if (!config) return null;
              
              // Map benchmark IDs to their data keys
              const dataKeyMap: Record<string, string> = {
                'SP500': 'sp500Alternative',
                'VFIFX': 'vfifxAlternative',
                'PELOSI': 'pelosiAlternative',
                'QQQ': 'qqqAlternative',
                'VTI': 'vtiAlternative'
              };
              
              const dataKey = dataKeyMap[benchmarkId];
              if (!dataKey) return null;
              
              const alternativeValue = data[dataKey] || 0;
              
              return (
                <div key={benchmarkId} className="flex justify-between items-center">
                  <span className="text-gray-600 dark:text-gray-400">{config.name}:</span>
                  <span className="font-semibold" style={{ color: config.color }}>
                    {formatCurrency(alternativeValue)}
                  </span>
                </div>
              );
            })}
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
                'PELOSI': 'pelosiAlternative',
                'QQQ': 'qqqAlternative',
                'VTI': 'vtiAlternative'
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
                    'PELOSI': 'pelosiAlternative',
                    'QQQ': 'qqqAlternative',
                    'VTI': 'vtiAlternative'
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
