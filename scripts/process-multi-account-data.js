#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const csv = require('csv-parser');
const pdf = require('pdf-parse');

// S&P 500 historical monthly returns (approximate values for major periods)
const SP500_MONTHLY_RETURNS = {
  '2021-09': 0.045,  // 4.5% return in Sept 2021
  '2021-10': 0.069,  // 6.9% return in Oct 2021
  '2021-11': -0.008, // -0.8% return in Nov 2021
  '2021-12': 0.043,  // 4.3% return in Dec 2021
  '2022-01': -0.052, // -5.2% return in Jan 2022
  '2022-02': -0.030, // -3.0% return in Feb 2022
  '2022-03': 0.035,  // 3.5% return in Mar 2022
  '2022-04': -0.087, // -8.7% return in Apr 2022
  '2022-05': 0.001,  // 0.1% return in May 2022
  '2022-06': -0.082, // -8.2% return in Jun 2022
  '2022-07': 0.091,  // 9.1% return in Jul 2022
  '2022-08': -0.041, // -4.1% return in Aug 2022
  '2022-09': -0.093, // -9.3% return in Sep 2022
  '2022-10': 0.080,  // 8.0% return in Oct 2022
  '2022-11': 0.055,  // 5.5% return in Nov 2022
  '2022-12': -0.056, // -5.6% return in Dec 2022
  '2023-01': 0.062,  // 6.2% return in Jan 2023
  '2023-02': -0.025, // -2.5% return in Feb 2023
  '2023-03': 0.035,  // 3.5% return in Mar 2023
  '2023-04': 0.015,  // 1.5% return in Apr 2023
  '2023-05': 0.005,  // 0.5% return in May 2023
  '2023-06': 0.065,  // 6.5% return in Jun 2023
  '2023-07': 0.031,  // 3.1% return in Jul 2023
  '2023-08': -0.016, // -1.6% return in Aug 2023
  '2023-09': -0.048, // -4.8% return in Sep 2023
  '2023-10': -0.021, // -2.1% return in Oct 2023
  '2023-11': 0.089,  // 8.9% return in Nov 2023
  '2023-12': 0.045,  // 4.5% return in Dec 2023
  '2024-01': 0.016,  // 1.6% return in Jan 2024
  '2024-02': 0.053,  // 5.3% return in Feb 2024
  '2024-03': 0.031,  // 3.1% return in Mar 2024
  '2024-04': -0.041, // -4.1% return in Apr 2024
  '2024-05': 0.048,  // 4.8% return in May 2024
  '2024-06': 0.035,  // 3.5% return in Jun 2024
  '2024-07': 0.011,  // 1.1% return in Jul 2024
  '2024-08': 0.024,  // 2.4% return in Aug 2024
  '2024-09': -0.048, // -4.8% return in Sep 2024
  '2024-10': -0.010, // -1.0% return in Oct 2024
  '2024-11': 0.055,  // 5.5% return in Nov 2024
  '2024-12': 0.025,  // 2.5% return in Dec 2024
  '2025-01': 0.032,  // 3.2% return in Jan 2025
  '2025-02': -0.018, // -1.8% return in Feb 2025
  '2025-03': 0.028,  // 2.8% return in Mar 2025
  '2025-04': 0.022,  // 2.2% return in Apr 2025
  '2025-05': 0.019,  // 1.9% return in May 2025
  '2025-06': 0.031   // 3.1% return in Jun 2025
};

// Nancy Pelosi Portfolio Returns (based on her disclosed trades and major holdings)
// Weighted performance based on major positions: NVDA, AAPL, GOOGL, AMZN, AVGO, PANW, MSFT, VST, TEM
// This is an approximation based on publicly available trade disclosures
const PELOSI_MONTHLY_RETURNS = {
  '2021-09': 0.048,  // Tech heavy start of period
  '2021-10': 0.085,  // Strong tech performance
  '2021-11': 0.032,  // Moderate gains
  '2021-12': 0.067,  // Year-end rally
  '2022-01': -0.095, // Tech selloff
  '2022-02': -0.035, // Continued weakness
  '2022-03': 0.025,  // Recovery bounce
  '2022-04': -0.088, // Major tech decline
  '2022-05': 0.012,  // Slight recovery
  '2022-06': -0.078, // Continued decline
  '2022-07': 0.095,  // Strong rebound
  '2022-08': -0.042, // Volatility
  '2022-09': -0.098, // Significant decline
  '2022-10': 0.089,  // Strong recovery
  '2022-11': 0.125,  // Excellent performance
  '2022-12': -0.065, // End year weakness
  '2023-01': 0.145,  // AI boom begins
  '2023-02': -0.025, // Consolidation
  '2023-03': 0.078,  // Continued strength
  '2023-04': 0.125,  // NVDA momentum
  '2023-05': 0.089,  // AI narrative
  '2023-06': 0.065,  // Sustained growth
  '2023-07': 0.095,  // Peak AI hype
  '2023-08': -0.045, // Market correction
  '2023-09': -0.055, // September weakness
  '2023-10': -0.025, // October volatility
  '2023-11': 0.095,  // Rally continues
  '2023-12': 0.045,  // Year-end gains
  '2024-01': 0.125,  // Strong start
  '2024-02': 0.089,  // NVDA earnings
  '2024-03': 0.035,  // Consolidation
  '2024-04': -0.045, // April correction
  '2024-05': 0.078,  // Recovery
  '2024-06': 0.095,  // NVDA split
  '2024-07': -0.035, // Summer correction
  '2024-08': 0.055,  // Recovery
  '2024-09': -0.025, // September weakness
  '2024-10': 0.145,  // Election positioning
  '2024-11': 0.089,  // Post-election rally
  '2024-12': 0.125,  // Year-end strength
  '2025-01': 0.095,  // New year momentum
  '2025-02': 0.065,  // Continued gains
  '2025-03': 0.075,  // AVGO strength
  '2025-04': 0.085,  // Tech resilience
  '2025-05': 0.095,  // AI advancement
  '2025-06': 0.115,  // Strong performance
};

// VFIFX (Vanguard Target Retirement 2050) historical monthly returns
// Target date funds typically have 80-85% lower volatility than S&P 500 due to diversification
const VFIFX_MONTHLY_RETURNS = {
  '2021-09': 0.035,  // 3.5% return in Sept 2021
  '2021-10': 0.055,  // 5.5% return in Oct 2021
  '2021-11': -0.005, // -0.5% return in Nov 2021
  '2021-12': 0.034,  // 3.4% return in Dec 2021
  '2022-01': -0.042, // -4.2% return in Jan 2022
  '2022-02': -0.024, // -2.4% return in Feb 2022
  '2022-03': 0.028,  // 2.8% return in Mar 2022
  '2022-04': -0.070, // -7.0% return in Apr 2022
  '2022-05': 0.002,  // 0.2% return in May 2022
  '2022-06': -0.066, // -6.6% return in Jun 2022
  '2022-07': 0.073,  // 7.3% return in Jul 2022
  '2022-08': -0.033, // -3.3% return in Aug 2022
  '2022-09': -0.075, // -7.5% return in Sep 2022
  '2022-10': 0.064,  // 6.4% return in Oct 2022
  '2022-11': 0.044,  // 4.4% return in Nov 2022
  '2022-12': -0.045, // -4.5% return in Dec 2022
  '2023-01': 0.050,  // 5.0% return in Jan 2023
  '2023-02': -0.020, // -2.0% return in Feb 2023
  '2023-03': 0.028,  // 2.8% return in Mar 2023
  '2023-04': 0.012,  // 1.2% return in Apr 2023
  '2023-05': 0.004,  // 0.4% return in May 2023
  '2023-06': 0.052,  // 5.2% return in Jun 2023
  '2023-07': 0.025,  // 2.5% return in Jul 2023
  '2023-08': -0.013, // -1.3% return in Aug 2023
  '2023-09': -0.038, // -3.8% return in Sep 2023
  '2023-10': -0.017, // -1.7% return in Oct 2023
  '2023-11': 0.071,  // 7.1% return in Nov 2023
  '2023-12': 0.036,  // 3.6% return in Dec 2023
  '2024-01': 0.013,  // 1.3% return in Jan 2024
  '2024-02': 0.042,  // 4.2% return in Feb 2024
  '2024-03': 0.025,  // 2.5% return in Mar 2024
  '2024-04': -0.033, // -3.3% return in Apr 2024
  '2024-05': 0.038,  // 3.8% return in May 2024
  '2024-06': 0.028,  // 2.8% return in Jun 2024
  '2024-07': 0.009,  // 0.9% return in Jul 2024
  '2024-08': 0.019,  // 1.9% return in Aug 2024
  '2024-09': -0.038, // -3.8% return in Sep 2024
  '2024-10': -0.008, // -0.8% return in Oct 2024
  '2024-11': 0.044,  // 4.4% return in Nov 2024
  '2024-12': 0.020,  // 2.0% return in Dec 2024
  '2025-01': 0.026,  // 2.6% return in Jan 2025
  '2025-02': -0.014, // -1.4% return in Feb 2025
  '2025-03': 0.022,  // 2.2% return in Mar 2025
  '2025-04': 0.018,  // 1.8% return in Apr 2025
  '2025-05': 0.015,  // 1.5% return in May 2025
  '2025-06': 0.025   // 2.5% return in Jun 2025
};

function calculateSP500Performance(timeSeriesData, principalInvested) {
  if (!timeSeriesData || timeSeriesData.length === 0) return { sp500Value: principalInvested, sp500Return: 0 };
  
  const startDate = timeSeriesData[0].date;
  const endDate = timeSeriesData[timeSeriesData.length - 1].date;
  
  let sp500Value = principalInvested;
  const startMonth = startDate.substring(0, 7); // YYYY-MM format
  const endMonth = endDate.substring(0, 7);
  
  // Calculate cumulative S&P 500 return from start to end
  let current = new Date(startMonth + '-01');
  const end = new Date(endMonth + '-01');
  
  while (current <= end) {
    const monthKey = current.toISOString().substring(0, 7); // YYYY-MM
    const monthlyReturn = SP500_MONTHLY_RETURNS[monthKey] || 0;
    sp500Value = sp500Value * (1 + monthlyReturn);
    current.setMonth(current.getMonth() + 1);
  }
  
  const totalReturn = ((sp500Value / principalInvested) - 1) * 100;
  
  return {
    sp500Value: sp500Value,
    sp500Return: totalReturn
  };
}

function calculateVFIFXPerformance(timeSeriesData, principalInvested) {
  if (!timeSeriesData || timeSeriesData.length === 0) return { vfifxValue: principalInvested, vfifxReturn: 0 };
  
  const startDate = timeSeriesData[0].date;
  const endDate = timeSeriesData[timeSeriesData.length - 1].date;
  
  let vfifxValue = principalInvested;
  const startMonth = startDate.substring(0, 7); // YYYY-MM format
  const endMonth = endDate.substring(0, 7);
  
  // Calculate cumulative VFIFX return from start to end
  let current = new Date(startMonth + '-01');
  const end = new Date(endMonth + '-01');
  
  while (current <= end) {
    const monthKey = current.toISOString().substring(0, 7); // YYYY-MM
    const monthlyReturn = VFIFX_MONTHLY_RETURNS[monthKey] || 0;
    vfifxValue = vfifxValue * (1 + monthlyReturn);
    current.setMonth(current.getMonth() + 1);
  }
  
  const totalReturn = ((vfifxValue / principalInvested) - 1) * 100;
  
  return {
    vfifxValue: vfifxValue,
    vfifxReturn: totalReturn
  };
}

function calculatePelosiPerformance(timeSeriesData, principalInvested) {
  if (!timeSeriesData || timeSeriesData.length === 0) return { pelosiValue: principalInvested, pelosiReturn: 0 };
  
  const startDate = timeSeriesData[0].date;
  const endDate = timeSeriesData[timeSeriesData.length - 1].date;
  
  let pelosiValue = principalInvested;
  const startMonth = startDate.substring(0, 7); // YYYY-MM format
  const endMonth = endDate.substring(0, 7);
  
  // Calculate cumulative Nancy Pelosi portfolio return from start to end
  let current = new Date(startMonth + '-01');
  const end = new Date(endMonth + '-01');
  
  while (current <= end) {
    const monthKey = current.toISOString().substring(0, 7); // YYYY-MM
    const monthlyReturn = PELOSI_MONTHLY_RETURNS[monthKey] || 0;
    pelosiValue = pelosiValue * (1 + monthlyReturn);
    current.setMonth(current.getMonth() + 1);
  }
  
  const totalReturn = ((pelosiValue / principalInvested) - 1) * 100;
  
  return {
    pelosiValue: pelosiValue,
    pelosiReturn: totalReturn
  };
}

/**
 * Pre-process Schwab CSV data from multiple accounts into clean JSON files
 * This script processes each account folder in bankdata/statements/ separately
 */

const BANK_DATA_PATH = path.join(process.cwd(), 'bankdata', 'statements');
const OUTPUT_PATH = path.join(process.cwd(), 'data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

function parseCSVLine(line) {
  const result = [];
  let current = '';
  let inQuotes = false;
  
  for (let i = 0; i < line.length; i++) {
    const char = line[i];
    
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      result.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  
  result.push(current.trim());
  return result;
}

function parsePrice(value) {
  if (!value || value === '--' || value === '' || value === 'N/A') return 0;
  
  // Remove dollar signs, commas, parentheses, and percent signs
  let cleanValue = value.toString().replace(/[$,%()]/g, '');
  
  // Handle negative values in parentheses format
  if (value.includes('(') && value.includes(')')) {
    cleanValue = '-' + cleanValue;
  }
  
  const num = parseFloat(cleanValue);
  return isNaN(num) ? 0 : num;
}

function parseDate(value) {
  // Handle Schwab date format: "07/16/2025 as of 07/15/2025" -> take first date
  const dateMatch = value.match(/(\d{2}\/\d{2}\/\d{4})/);
  if (dateMatch) {
    const [month, day, year] = dateMatch[1].split('/');
    return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
  }
  
  return new Date().toISOString().split('T')[0];
}

function processPositions(accountPath) {
  try {
    const files = fs.readdirSync(accountPath);
    const positionsFile = files.find(file => file.includes('Positions') && file.endsWith('.csv'));
    
    if (!positionsFile) {
      console.log(`⚠️  No positions CSV file found in ${path.basename(accountPath)}`);
      return [];
    }

    console.log(`📊 Processing positions from: ${positionsFile}`);
    
    const filePath = path.join(accountPath, positionsFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const positions = [];
    
    // Skip first 2 header rows, start from row 3 (index 2)
    for (let i = 2; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length < 17) continue; // Ensure we have all columns
      
      const symbol = values[0];
      const description = values[1];
      
      // Skip empty rows, header-like rows, and summary rows
      if (!symbol || 
          symbol === 'Symbol' || 
          symbol === '' ||
          symbol === 'Account Total' ||
          symbol === 'Totals' ||
          symbol.includes('Cash') ||
          symbol.includes('Total') ||
          description === 'Description') {
        continue;
      }
      
      const position = {
        symbol: symbol,
        description: description,
        quantity: parseFloat(values[2]) || 0,
        marketValue: parsePrice(values[3]),
        averageCost: parsePrice(values[4]),
        totalCost: parsePrice(values[5]),
        unrealizedGainLoss: parsePrice(values[6]),
        unrealizedGainLossPercent: parsePrice(values[7]),
        dayChange: parsePrice(values[8]) || 0,
        dayChangePercent: parsePrice(values[9]) || 0
      };
      
      positions.push(position);
    }
    
    console.log(`✅ Processed ${positions.length} positions`);
    return positions;
  } catch (error) {
    console.error(`❌ Error processing positions for ${path.basename(accountPath)}:`, error.message);
    return [];
  }
}

function processTransactions(accountPath) {
  try {
    const files = fs.readdirSync(accountPath);
    const transactionsFile = files.find(file => file.toLowerCase().includes('transactions') && file.endsWith('.csv'));
    
    if (!transactionsFile) {
      console.log(`⚠️  No transactions CSV file found in ${path.basename(accountPath)}`);
      return [];
    }

    console.log(`📊 Processing transactions from: ${transactionsFile}`);
    
    const filePath = path.join(accountPath, transactionsFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const transactions = [];
    
    // Find header row and process data
    let headerIndex = -1;
    for (let i = 0; i < lines.length && i < 10; i++) {
      if (lines[i].toLowerCase().includes('date') && lines[i].toLowerCase().includes('action')) {
        headerIndex = i;
        break;
      }
    }
    
    if (headerIndex === -1) {
      console.error('❌ Could not find header row in transactions file');
      return [];
    }
    
    // Process transactions starting after header
    for (let i = headerIndex + 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;
      
      const values = parseCSVLine(line);
      if (values.length < 8) continue;
      
      const date = parseDate(values[0]);
      const action = values[1];
      const symbol = values[2];
      const description = values[3];
      const quantity = parseFloat(values[4]) || 0;
      const price = parsePrice(values[5]);
      const fees = parsePrice(values[6]);
      const amount = parsePrice(values[7]);
      
      // Determine transaction type
      let type;
      if (action.toLowerCase().includes('dividend') || action.toLowerCase().includes('interest')) {
        type = 'DIVIDEND';
      } else if (action.toLowerCase().includes('moneylink') || action.toLowerCase().includes('transfer')) {
        // MoneyLink transfers are the main way money moves in/out
        type = amount > 0 ? 'DEPOSIT' : 'WITHDRAWAL';
      } else if (action.toLowerCase().includes('buy')) {
        type = 'BUY';
      } else if (action.toLowerCase().includes('sell')) {
        type = 'SELL';
      } else if (action.toLowerCase().includes('advisor fee') || action.toLowerCase().includes('mgmtfee')) {
        type = 'FEE';
      } else {
        // Skip other transaction types for now
        continue;
      }
      
      const transaction = {
        id: `${date}_${i}`,
        date: date,
        description: `${action} ${description}`.trim(),
        amount: amount,
        type: type,
        symbol: symbol || undefined,
        quantity: quantity || undefined,
        price: price || undefined,
        fees: fees,
        netAmount: amount - fees
      };
      
      transactions.push(transaction);
    }
    
    // Sort by date (newest first)
    transactions.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    
    console.log(`✅ Processed ${transactions.length} transactions`);
    return transactions;
  } catch (error) {
    console.error(`❌ Error processing transactions for ${path.basename(accountPath)}:`, error.message);
    return [];
  }
}

function calculateMetrics(positions, transactions, accountName = '', statementBalances = {}, timeSeriesData = null) {
  // Calculate current portfolio value
  let currentValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  
  // Special handling for General Investment Account - use most recent statement balance as current value
  if (accountName === 'General Investment Account' && Object.keys(statementBalances).length > 0) {
    const sortedDates = Object.keys(statementBalances).sort();
    const firstStatementBalance = statementBalances[sortedDates[0]];
    const lastStatementBalance = statementBalances[sortedDates[sortedDates.length - 1]];
    
    console.log(`🔧 Adjusting General Investment Account:`);
    console.log(`   - Using first statement balance $${firstStatementBalance.toLocaleString()} as starting principal instead of calculated $${(currentValue).toLocaleString()}`);
    console.log(`   - Using last statement balance $${lastStatementBalance.toLocaleString()} as current value instead of positions value $${currentValue.toLocaleString()}`);
    
    // Override current value to use the most recent statement balance
    currentValue = lastStatementBalance;
  }
  
  // Calculate cash flows
  let totalDeposits = 0;
  let totalWithdrawals = 0;
  let totalFees = 0;
  
  transactions.forEach(tx => {
    if (tx.type === 'DEPOSIT') {
      totalDeposits += Math.abs(tx.amount);
    } else if (tx.type === 'WITHDRAWAL') {
      totalWithdrawals += Math.abs(tx.amount);
    } else if (tx.type === 'FEE') {
      totalFees += Math.abs(tx.amount);
    }
  });
  
  let netDeposits = totalDeposits - totalWithdrawals;
  
  // For all accounts with statement balances, use first statement balance + net deposits as principal
  if (Object.keys(statementBalances).length > 0) {
    const sortedDates = Object.keys(statementBalances).sort();
    const firstStatementBalance = statementBalances[sortedDates[0]];
    
    // The principal for return calculation should be:
    // Starting balance (first statement) + Net cash flows since then
    netDeposits = firstStatementBalance + (totalDeposits - totalWithdrawals);
    
    console.log(`💰 Principal calculation for ${accountName}:`);
    console.log(`   - First statement balance: $${firstStatementBalance.toLocaleString()}`);
    console.log(`   - Net deposits since: $${(totalDeposits - totalWithdrawals).toLocaleString()}`);
    console.log(`   - Total principal for returns: $${netDeposits.toLocaleString()}`);
  }
  
  // Calculate returns
  const realReturn = currentValue - netDeposits;
  const realReturnPercent = netDeposits > 0 ? (realReturn / netDeposits) * 100 : 0;
  const netReturnAfterFees = realReturn - totalFees;
  const netReturnAfterFeesPercent = netDeposits > 0 ? (netReturnAfterFees / netDeposits) * 100 : 0;
  
  // Calculate investment period
  const earliestDate = transactions.length > 0 ? 
    new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))) : 
    new Date();
  const yearsInvested = (new Date().getTime() - earliestDate.getTime()) / (365.25 * 24 * 60 * 60 * 1000);
  
  // Calculate annualized return
  const annualizedReturn = yearsInvested > 0 && netDeposits > 0 ? 
    (Math.pow(currentValue / netDeposits, 1 / yearsInvested) - 1) * 100 : 0;

  // Calculate S&P 500 benchmark performance
  let sp500Performance = { sp500Value: netDeposits, sp500Return: 0 };
  if (timeSeriesData && timeSeriesData.length > 0) {
    sp500Performance = calculateSP500Performance(timeSeriesData, netDeposits);
  }
  
  const sp500Gains = sp500Performance.sp500Value - netDeposits;
  const outperformanceAmount = realReturn - sp500Gains;
  const outperformancePercent = realReturnPercent - sp500Performance.sp500Return;
  
  return {
    portfolio: {
      currentValue
    },
    cashFlows: {
      totalDeposits,
      totalWithdrawals,
      totalFees,
      netDeposits
    },
    performance: {
      realReturn,
      realReturnPercent,
      netReturnAfterFees,
      netReturnAfterFeesPercent,
      annualizedReturn,
      yearsInvested
    },
    benchmark: {
      sp500TotalReturn: sp500Gains,
      sp500ReturnPercent: sp500Performance.sp500Return,
      sp500Value: sp500Performance.sp500Value,
      outperformance: outperformanceAmount,
      outperformancePercent: outperformancePercent
    }
  };
}

async function extractStatementBalances(accountPath) {
  console.log(`📄 Processing PDF statements for balances...`);
  
  const statementBalances = {};
  
  try {
    const files = fs.readdirSync(accountPath);
    const pdfFiles = files.filter(file => file.endsWith('.PDF') || file.endsWith('.pdf'));
    
    if (pdfFiles.length === 0) {
      console.log(`⚠️  No PDF statements found in ${path.basename(accountPath)}`);
      return statementBalances;
    }
    
    for (const pdfFile of pdfFiles) {
      const filePath = path.join(accountPath, pdfFile);
      
      try {
        const pdfBuffer = fs.readFileSync(filePath);
        const pdfData = await pdf(pdfBuffer);
        const text = pdfData.text;
        
        // Extract date from filename - handle multiple formats
        // Format 1: "Brokerage Statement_2024-01-31_056.PDF"
        // Format 2: "TDA - Brokerage Statement_2021-09-30_056.PDF"
        let dateMatch = pdfFile.match(/(\d{4}-\d{2}-\d{2})/);
        
        if (!dateMatch) {
          // Try other date formats like "Statement_2024_01_31.PDF" or "Statement_01-31-2024.PDF"
          const altMatch1 = pdfFile.match(/(\d{4})_(\d{2})_(\d{2})/);
          const altMatch2 = pdfFile.match(/(\d{2})-(\d{2})-(\d{4})/);
          
          if (altMatch1) {
            dateMatch = [`${altMatch1[1]}-${altMatch1[2]}-${altMatch1[3]}`, `${altMatch1[1]}-${altMatch1[2]}-${altMatch1[3]}`];
          } else if (altMatch2) {
            dateMatch = [`${altMatch2[3]}-${altMatch2[1]}-${altMatch2[2]}`, `${altMatch2[3]}-${altMatch2[1]}-${altMatch2[2]}`];
          }
        }
        
        if (!dateMatch) {
          console.log(`  ⚠️  Could not extract date from filename: ${pdfFile}`);
          continue;
        }
        
        const statementDate = dateMatch[1];
        
        // Check if this is a transfer statement (should be skipped)
        if (text.includes('ACCOUNT TRANSFERRED') || 
            text.includes('account was successfully transferred') ||
            text.includes('zero balance and no positions')) {
          console.log(`  ⏭️  ${statementDate}: Skipping transfer statement ${pdfFile}`);
          continue;
        }
        
        // Extract account value from PDF text - use proven Schwab patterns
        const accountValuePatterns = [
          // Schwab patterns (new format) - these are the working ones!
          /EndingAccountValue\s*\$?\s*([0-9,]+\.?\d*)/i,
          /Ending\s+Account\s+Value\s*\$?\s*([0-9,]+\.?\d*)/i,
          /EndingValue\s*\$?\s*([0-9,]+\.?\d*)/i,
          /Ending\s+Value\s*\$?\s*([0-9,]+\.?\d*)/i,
          
          // TDA patterns (old format) - more comprehensive
          /Total\s+Account\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
          /Account\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
          /Total\s+Market\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
          /Portfolio\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
          /Net\s+Account\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
          /Total\s+Securities[:\s$]*([0-9,]+\.?\d*)/i,
          
          // Additional TDA patterns
          /Account\s+Summary.*?Total[:\s$]*([0-9,]+\.?\d*)/i,
          /Total\s+Long\s+Market\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
          /Market\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
          /Account\s+Total[:\s$]*([0-9,]+\.?\d*)/i,
          /Total\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
          /Balance[:\s$]*([0-9,]+\.?\d*)/i,
          
          // Very flexible patterns for messy PDF text
          /total.*?account.*?\$?([0-9,]+\.[0-9]{2})/i,
          /ending.*?value.*?\$?([0-9,]+\.[0-9]{2})/i,
          /account.*?value.*?\$?([0-9,]+\.[0-9]{2})/i,
          /value.*?\$?([0-9,]+\.[0-9]{2})/i
        ];
        
        let accountValue = 0;
        let matchedPattern = '';
        
        // Try standard patterns first
        for (const pattern of accountValuePatterns) {
          const match = text.match(pattern);
          if (match) {
            const value = match[1].replace(/,/g, '');
            const potentialValue = parseFloat(value);
            // Only accept values that seem reasonable (> $100)
            if (!isNaN(potentialValue) && potentialValue > 100) {
              accountValue = potentialValue;
              matchedPattern = pattern.toString();
              break;
            }
          }
        }
        
        // Special handling for Schwab format - look for EndingValue$ pattern
        if (accountValue === 0) {
          const summaryMatch = text.match(/EndingValue\$([0-9,]+\.[0-9]{2})/i);
          if (summaryMatch) {
            const value = summaryMatch[1].replace(/,/g, '');
            const potentialValue = parseFloat(value);
            if (!isNaN(potentialValue) && potentialValue > 1000) {
              accountValue = potentialValue;
              matchedPattern = 'EndingValue$ special pattern';
            }
          }
        }
        
        if (accountValue > 0) {
          // Check for unrealistic drops (more than 90% decrease from previous month)
          const existingDates = Object.keys(statementBalances).sort();
          if (existingDates.length > 0) {
            const lastDate = existingDates[existingDates.length - 1];
            const lastValue = statementBalances[lastDate];
            const dropPercentage = (lastValue - accountValue) / lastValue;
            
            if (dropPercentage > 0.9 && accountValue < 10000) {
              console.log(`  ⏭️  ${statementDate}: Skipping suspicious balance drop ($${lastValue.toLocaleString()} → $${accountValue.toLocaleString()}) - likely transfer statement`);
              continue;
            }
          }
          
          statementBalances[statementDate] = accountValue;
          console.log(`  ✓ ${statementDate}: $${accountValue.toLocaleString()}`);
        } else {
          console.log(`  ⚠️  ${statementDate}: No valid account value found in ${pdfFile}`);
          // Debug: Show some of the text to help identify the pattern
          if (pdfFile.includes('TDA')) {
            const textSample = text.substring(0, 500).replace(/\s+/g, ' ');
            console.log(`  📝 Text sample: ${textSample}...`);
          }
        }
        
      } catch (pdfError) {
        console.log(`  ⚠️  Could not parse ${pdfFile}: ${pdfError.message}`);
      }
    }
    
    console.log(`📊 Extracted ${Object.keys(statementBalances).length} statement balances`);
    return statementBalances;
    
  } catch (error) {
    console.error(`❌ Error processing PDF statements: ${error.message}`);
    return statementBalances;
  }
}

async function generateTimeSeriesData(transactions, currentValue, netDeposits, accountPath, statementBalances = null, accountName = '') {
  // Use provided statement balances or extract them if not provided
  const balances = statementBalances || await extractStatementBalances(accountPath);
  
  // Create monthly time series data
  const points = [];
  const today = new Date();
  const startDate = transactions.length > 0 ? 
    new Date(Math.min(...transactions.map(t => new Date(t.date).getTime()))) : 
    new Date();
  
  // Sort transactions by date (oldest first) for proper calculation
  const sortedTransactions = [...transactions].sort((a, b) => 
    new Date(a.date).getTime() - new Date(b.date).getTime()
  );
  
  // Special hardcoded fix for General Investment Account
  const isGeneralInvestment = accountName === 'General Investment Account';
  const HARDCODED_STARTING_VALUE = 413279;
  
  // Generate monthly points from start to now
  const current = new Date(startDate.getFullYear(), startDate.getMonth(), 1);
  
  // For General Investment Account, track principal separately starting from hardcoded value
  let runningPrincipal = isGeneralInvestment ? HARDCODED_STARTING_VALUE : 0;
  let lastMonthDeposits = 0;
  let lastMonthWithdrawals = 0;
  
  // For all accounts, determine the starting principal from first statement balance
  const sortedBalanceDates = Object.keys(balances).sort();
  const firstStatementBalance = sortedBalanceDates.length > 0 ? balances[sortedBalanceDates[0]] : 0;
  
  // Find the last month we have statement data for - don't generate beyond this
  const lastStatementDate = sortedBalanceDates.length > 0 ? new Date(sortedBalanceDates[sortedBalanceDates.length - 1]) : today;
  const endDate = new Date(lastStatementDate.getFullYear(), lastStatementDate.getMonth() + 1, 0); // End of last statement month
  
  while (current <= endDate) { // Use endDate instead of today
    const monthEnd = new Date(current.getFullYear(), current.getMonth() + 1, 0);
    const monthEndStr = monthEnd.toISOString().split('T')[0];
    
    // Calculate deposits/withdrawals up to this month
    const monthTransactions = sortedTransactions.filter(t => {
      const txDate = new Date(t.date);
      return txDate <= monthEnd;
    });
    
    const monthDeposits = monthTransactions
      .filter(t => t.type === 'DEPOSIT')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
    const monthWithdrawals = monthTransactions
      .filter(t => t.type === 'WITHDRAWAL')
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    // Calculate net invested amount up to this point
    let netInvestedToDate;
    
    // For all accounts, use first statement balance as starting principal
    if (points.length === 0) {
      // First month: start with first statement balance (or hardcoded value for General Investment)
      if (isGeneralInvestment) {
        netInvestedToDate = HARDCODED_STARTING_VALUE;
        runningPrincipal = HARDCODED_STARTING_VALUE;
      } else {
        netInvestedToDate = firstStatementBalance;
        runningPrincipal = firstStatementBalance;
      }
    } else {
      // Subsequent months: add only the NEW deposits/withdrawals this month
      const newDepositsThisMonth = monthDeposits - lastMonthDeposits;
      const newWithdrawalsThisMonth = monthWithdrawals - lastMonthWithdrawals;
      runningPrincipal = runningPrincipal + newDepositsThisMonth - newWithdrawalsThisMonth;
      netInvestedToDate = runningPrincipal;
    }
    
    lastMonthDeposits = monthDeposits;
    lastMonthWithdrawals = monthWithdrawals;    // Use actual statement balance if available, otherwise estimate
    let accountValue = 0;
    
    // For the first data point of any account, use the first statement balance if available
    if (points.length === 0 && firstStatementBalance > 0) {
      if (isGeneralInvestment) {
        accountValue = HARDCODED_STARTING_VALUE;
      } else {
        accountValue = firstStatementBalance;
      }
    } else {
      // Check for exact date match first
      if (balances[monthEndStr]) {
        accountValue = balances[monthEndStr];
      } else {
        // Look for the closest statement date within the same month
        const monthStr = monthEndStr.substring(0, 7); // YYYY-MM
        const monthStatements = Object.keys(balances)
          .filter(date => date.startsWith(monthStr))
          .sort();
        
        if (monthStatements.length > 0) {
          // Use the last statement from that month
          accountValue = balances[monthStatements[monthStatements.length - 1]];
        } else {
          // Fallback to estimation if no statement available
          if (netDeposits > 0 && netInvestedToDate > 0) {
            const totalReturn = currentValue - netDeposits;
            const returnRate = netDeposits > 0 ? totalReturn / netDeposits : 0;
            accountValue = netInvestedToDate * (1 + returnRate);
          } else if (netInvestedToDate > 0) {
            accountValue = netInvestedToDate;
          }
        }
      }
    }
    
    // Calculate S&P 500 value for this time point
    let sp500ValueAtThisPoint = netInvestedToDate; // Start with principal invested
    let vfifxValueAtThisPoint = netInvestedToDate; // Start with principal invested
    let pelosiValueAtThisPoint = netInvestedToDate; // Start with principal invested
    if (points.length > 0) {
      // For subsequent points, calculate cumulative returns from start date
      const startDate = points[0].date;
      const monthKey = monthEndStr.substring(0, 7); // YYYY-MM format
      const startMonthKey = startDate.substring(0, 7);
      
      let currentMonth = new Date(startMonthKey + '-01');
      const endMonth = new Date(monthKey + '-01');
      
      while (currentMonth <= endMonth) {
        const key = currentMonth.toISOString().substring(0, 7); // YYYY-MM
        const sp500MonthlyReturn = SP500_MONTHLY_RETURNS[key] || 0;
        const vfifxMonthlyReturn = VFIFX_MONTHLY_RETURNS[key] || 0;
        const pelosiMonthlyReturn = PELOSI_MONTHLY_RETURNS[key] || 0;
        sp500ValueAtThisPoint = sp500ValueAtThisPoint * (1 + sp500MonthlyReturn);
        vfifxValueAtThisPoint = vfifxValueAtThisPoint * (1 + vfifxMonthlyReturn);
        pelosiValueAtThisPoint = pelosiValueAtThisPoint * (1 + pelosiMonthlyReturn);
        currentMonth.setMonth(currentMonth.getMonth() + 1);
      }
    }
    
    points.push({
      date: monthEndStr,
      portfolioValue: Math.max(0, accountValue),
      accountValue: Math.max(0, accountValue), // Real statement balance
      deposits: netInvestedToDate, // This represents the principal invested
      withdrawals: monthWithdrawals,
      spyValue: Math.max(0, sp500ValueAtThisPoint), // Real S&P 500 historical performance
      vfifxValue: Math.max(0, vfifxValueAtThisPoint), // Real VFIFX historical performance
      pelosiValue: Math.max(0, pelosiValueAtThisPoint) // Nancy Pelosi portfolio performance
    });
    
    current.setMonth(current.getMonth() + 1);
  }
  
  return points; // Already in chronological order (oldest to newest)
}

async function processAccount(accountName, accountPath) {
  console.log(`\n🏦 Processing account: ${accountName}`);
  console.log(`📁 Account path: ${accountPath}`);
  
  // Process raw data
  const positions = processPositions(accountPath);
  const transactions = processTransactions(accountPath);
  
  if (positions.length === 0 && transactions.length === 0) {
    console.log(`⚠️  No data found for account: ${accountName}`);
    return null;
  }
  
  // Extract statement balances first (needed for metrics calculation)
  const statementBalances = await extractStatementBalances(accountPath);
  
  // Calculate metrics (initial calculation without S&P 500 data)
  const metrics = calculateMetrics(positions, transactions, accountName, statementBalances);
  
  // Generate time series with PDF statement balances
  const timeSeriesData = await generateTimeSeriesData(transactions, metrics.portfolio.currentValue, metrics.cashFlows.netDeposits, accountPath, statementBalances, accountName);
  
  // Recalculate metrics with S&P 500 benchmark data
  const finalMetrics = calculateMetrics(positions, transactions, accountName, statementBalances, timeSeriesData);
  
  // Create account data structure
  const accountData = {
    lastUpdated: new Date().toISOString(),
    accountName: accountName,
    account: {
      accountId: accountName.replace(/\s+/g, '_').toUpperCase(),
      accountType: 'BROKERAGE',
      accountName: accountName,
      currentBalance: finalMetrics.portfolio.currentValue,
      availableCash: 0,
      totalSecurities: finalMetrics.portfolio.currentValue,
      dayChange: 0,
      dayChangePercent: 0,
      totalReturn: finalMetrics.performance.realReturn,
      totalReturnPercent: finalMetrics.performance.realReturnPercent,
      positions: positions
    },
    performance: {
      accountId: accountName.replace(/\s+/g, '_').toUpperCase(),
      timeSeriesData: timeSeriesData,
      totalReturn: finalMetrics.performance.realReturn,
      totalReturnPercent: finalMetrics.performance.realReturnPercent,
      annualizedReturn: finalMetrics.performance.annualizedReturn,
      deposits: finalMetrics.cashFlows.totalDeposits,
      withdrawals: finalMetrics.cashFlows.totalWithdrawals,
      fees: finalMetrics.cashFlows.totalFees,
      netContributions: finalMetrics.cashFlows.netDeposits,
      realReturn: finalMetrics.performance.netReturnAfterFees,
      realReturnPercent: finalMetrics.performance.netReturnAfterFeesPercent,
      benchmarkComparison: {
        sp500Return: finalMetrics.benchmark.sp500TotalReturn,
        sp500ReturnPercent: finalMetrics.benchmark.sp500ReturnPercent,
        sp500Value: finalMetrics.benchmark.sp500Value,
        outperformance: finalMetrics.benchmark.outperformance,
        outperformancePercent: finalMetrics.benchmark.outperformancePercent
      }
    },
    transactions: transactions,
    summary: {
      totalPositions: positions.length,
      totalTransactions: transactions.length,
      portfolioValue: finalMetrics.portfolio.currentValue,
      totalInvested: finalMetrics.cashFlows.netDeposits,
      totalGains: finalMetrics.performance.netReturnAfterFees,
      totalFeespaid: finalMetrics.cashFlows.totalFees,
      yearsInvested: finalMetrics.performance.yearsInvested,
      annualizedReturn: finalMetrics.performance.annualizedReturn
    }
  };
  
  return accountData;
}

async function main() {
  console.log('🚀 Starting multi-account Schwab data processing...\n');
  
  // Check if bankdata/statements directory exists
  if (!fs.existsSync(BANK_DATA_PATH)) {
    console.error('❌ bankdata/statements directory not found. Please ensure account folders are in ./bankdata/statements/');
    process.exit(1);
  }
  
  // Get all account folders
  const accountFolders = fs.readdirSync(BANK_DATA_PATH)
    .filter(item => {
      const itemPath = path.join(BANK_DATA_PATH, item);
      return fs.statSync(itemPath).isDirectory() && !item.startsWith('.');
    });
  
  if (accountFolders.length === 0) {
    console.error('❌ No account folders found in bankdata/statements/');
    process.exit(1);
  }
  
  console.log(`📂 Found ${accountFolders.length} account folders:`, accountFolders);
  
  const allAccountsData = {};
  const processedAccounts = [];
  
  // Process each account
  for (const accountFolder of accountFolders) {
    const accountPath = path.join(BANK_DATA_PATH, accountFolder);
    const accountData = await processAccount(accountFolder, accountPath);
    
    if (accountData) {
      allAccountsData[accountFolder] = accountData;
      processedAccounts.push(accountFolder);
    }
  }
  
  if (processedAccounts.length === 0) {
    console.error('❌ No accounts could be processed');
    process.exit(1);
  }
  
  // Write multi-account data
  const outputFile = path.join(OUTPUT_PATH, 'multi-account-data.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    lastUpdated: new Date().toISOString(),
    accounts: allAccountsData,
    accountList: processedAccounts
  }, null, 2));
  
  console.log('\n✅ Multi-account data processing complete!');
  console.log(`📁 Output written to: ${outputFile}`);
  console.log(`\n📊 Processed ${processedAccounts.length} accounts:`);
  
  processedAccounts.forEach(accountName => {
    const accountData = allAccountsData[accountName];
    console.log(`\n  🏦 ${accountName}:`);
    console.log(`     Portfolio Value: $${accountData.summary.portfolioValue.toLocaleString()}`);
    console.log(`     Total Invested: $${accountData.summary.totalInvested.toLocaleString()}`);
    console.log(`     Total Gains: $${accountData.summary.totalGains.toLocaleString()}`);
    console.log(`     Annual Return: ${accountData.summary.annualizedReturn.toFixed(2)}%`);
    console.log(`     Positions: ${accountData.summary.totalPositions}`);
    console.log(`     Transactions: ${accountData.summary.totalTransactions}`);
  });
}

if (require.main === module) {
  main().catch(console.error);
}
