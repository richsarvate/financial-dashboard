#!/usr/bin/env node

const fs = require('fs');
const path = require('path');

/**
 * Pre-process Schwab CSV data into clean JSON files
 * This script runs once to convert messy CSV data into properly typed JSON
 */

const BANK_DATA_PATH = path.join(process.cwd(), 'bankdata');
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

function processPositions() {
  try {
    const files = fs.readdirSync(BANK_DATA_PATH);
    const positionsFile = files.find(file => file.includes('Positions') && file.endsWith('.csv'));
    
    if (!positionsFile) {
      console.log('⚠️  No positions CSV file found');
      return [];
    }

    console.log(`📊 Processing positions from: ${positionsFile}`);
    
    const filePath = path.join(BANK_DATA_PATH, positionsFile);
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
          symbol.includes('Total')) {
        continue;
      }
      
      const position = {
        symbol: symbol,
        description: description,
        quantity: parseFloat(values[2]) || 0,
        marketValue: parsePrice(values[6]), // "Mkt Val" column
        averageCost: parsePrice(values[3]), // "Price" column  
        totalCost: parsePrice(values[9]), // "Cost Basis" column
        unrealizedGainLoss: parsePrice(values[10]), // "Gain $" column
        unrealizedGainLossPercent: parseFloat(values[11]?.replace('%', '')) || 0, // "Gain %" column
        dayChange: parsePrice(values[7]), // "Day Chng $" column
        dayChangePercent: parseFloat(values[8]?.replace('%', '')) || 0 // "Day Chng %" column
      };
      
      positions.push(position);
    }
    
    console.log(`✅ Processed ${positions.length} positions`);
    return positions;
    
  } catch (error) {
    console.error('❌ Error processing positions:', error.message);
    return [];
  }
}

function processTransactions() {
  try {
    const files = fs.readdirSync(BANK_DATA_PATH);
    const transactionsFile = files.find(file => file.includes('Transactions') && file.endsWith('.csv'));
    
    if (!transactionsFile) {
      console.log('⚠️  No transactions CSV file found');
      return [];
    }

    console.log(`💳 Processing transactions from: ${transactionsFile}`);
    
    const filePath = path.join(BANK_DATA_PATH, transactionsFile);
    const content = fs.readFileSync(filePath, 'utf-8');
    const lines = content.split('\n');
    
    const transactions = [];
    
    for (let i = 1; i < lines.length; i++) {
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
    console.error('❌ Error processing transactions:', error.message);
    return [];
  }
}

function calculateMetrics(positions, transactions) {
  console.log('📈 Calculating performance metrics...');
  
  // Calculate current portfolio value
  const currentValue = positions.reduce((sum, pos) => sum + pos.marketValue, 0);
  const totalCost = positions.reduce((sum, pos) => sum + pos.totalCost, 0);
  const unrealizedGains = positions.reduce((sum, pos) => sum + pos.unrealizedGainLoss, 0);
  
  // Calculate cash flows
  const deposits = transactions
    .filter(t => t.type === 'DEPOSIT')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const withdrawals = transactions
    .filter(t => t.type === 'WITHDRAWAL')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  // Calculate management fees (advisor fees)
  const fees = transactions
    .filter(t => t.type === 'FEE')
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
    
  const dividends = transactions
    .filter(t => t.type === 'DIVIDEND')
    .reduce((sum, t) => sum + t.amount, 0);
  
  const netDeposits = deposits - withdrawals;
  
  console.log(`💰 Cash Flow Summary:`);
  console.log(`   Deposits: $${deposits.toLocaleString()}`);
  console.log(`   Withdrawals: $${withdrawals.toLocaleString()}`);
  console.log(`   Net Deposits: $${netDeposits.toLocaleString()}`);
  console.log(`   Management Fees: $${fees.toLocaleString()}`);
  console.log(`   Current Value: $${currentValue.toLocaleString()}`);
  console.log(`   Dividends: $${dividends.toLocaleString()}`);
  
  // Calculate real returns accounting for fees
  const realReturn = currentValue - netDeposits;
  const realReturnPercent = netDeposits > 0 ? (realReturn / netDeposits) * 100 : 0;
  
  // Calculate net return after fees (fees reduce the total return)
  const netReturnAfterFees = realReturn; // Fees are already reflected in account value
  const netReturnAfterFeesPercent = realReturnPercent;
  
  // Time-weighted return calculation
  const sortedTransactions = transactions.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());
  const firstTransactionDate = sortedTransactions.length > 0 ? new Date(sortedTransactions[0].date) : new Date();
  const yearsInvested = (Date.now() - firstTransactionDate.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  const annualizedReturn = yearsInvested > 0 ? 
    (Math.pow(1 + (netReturnAfterFeesPercent / 100), 1 / yearsInvested) - 1) * 100 : 0;
  
  // S&P 500 benchmark (rough calculation)
  const sp500AnnualReturn = 10.0; // Historical average
  const sp500TotalReturn = netDeposits * (Math.pow(1 + (sp500AnnualReturn / 100), yearsInvested) - 1);
  const sp500ReturnPercent = netDeposits > 0 ? (sp500TotalReturn / netDeposits) * 100 : 0;
  
  const outperformance = netReturnAfterFeesPercent - sp500ReturnPercent;
  
  return {
    portfolio: {
      currentValue,
      totalCost,
      unrealizedGains,
      unrealizedGainsPercent: totalCost > 0 ? (unrealizedGains / totalCost) * 100 : 0
    },
    cashFlows: {
      totalDeposits: deposits,
      totalWithdrawals: withdrawals,
      totalFees: fees,
      totalDividends: dividends,
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
      sp500TotalReturn,
      sp500ReturnPercent,
      outperformance,
      outperformancePercent: outperformance
    }
  };
}

function loadStatementBalances() {
  const statementBalancesPath = path.join(OUTPUT_PATH, 'statement-balances.json');
  
  if (!fs.existsSync(statementBalancesPath)) {
    console.warn('⚠️  Statement balances not found. Run extract-statement-data.js first for more accurate data.');
    return null;
  }
  
  try {
    const data = JSON.parse(fs.readFileSync(statementBalancesPath, 'utf8'));
    console.log(`✅ Loaded ${data.statements.length} statement balances`);
    return data.statements;
  } catch (error) {
    console.error('❌ Error loading statement balances:', error.message);
    return null;
  }
}

function calculateCumulativeDeposits(transactions, targetDate) {
  // Get the initial account balance from the first statement
  const statementBalances = loadStatementBalances();
  const initialBalance = statementBalances && statementBalances.length > 0 ? statementBalances[0].accountBalance : 0;
  const initialDate = statementBalances && statementBalances.length > 0 ? new Date(statementBalances[0].date) : new Date();
  
  // Start with the initial balance as the base principal
  let cumulativeDeposits = initialBalance;
  
  for (const transaction of transactions) {
    const transactionDate = new Date(transaction.date);
    const target = new Date(targetDate);
    
    // Only count transactions after the initial statement date and up to target date
    if (transactionDate > initialDate && transactionDate <= target) {
      if (transaction.type === 'DEPOSIT') {
        cumulativeDeposits += transaction.amount;
      } else if (transaction.type === 'WITHDRAWAL') {
        cumulativeDeposits += transaction.amount; // amount is already negative
      }
    }
  }
  
  return cumulativeDeposits;
}

function generateTimeSeriesData(transactions, currentValue, netDeposits) {
  const points = [];
  const now = new Date();
  const statementBalances = loadStatementBalances();
  
  // Get all fee transactions for annotations
  const feeTransactions = transactions.filter(t => t.type === 'FEE');
  
  if (statementBalances) {
    console.log('📊 Using actual statement balances for time series data');
    
    // Convert statement balances to monthly data points
    for (const statement of statementBalances) {
      const statementDate = new Date(statement.date);
      
      // Calculate cumulative deposits up to this statement date
      const depositsAtTime = calculateCumulativeDeposits(transactions, statement.date);
      
      // Find any large fees (>$1000) in the month around this statement
      const monthStart = new Date(statementDate.getFullYear(), statementDate.getMonth(), 1);
      const monthEnd = new Date(statementDate.getFullYear(), statementDate.getMonth() + 1, 0);
      
      const largeFees = feeTransactions.filter(fee => {
        const feeDate = new Date(fee.date);
        return feeDate >= monthStart && feeDate <= monthEnd && Math.abs(fee.amount) >= 1000;
      });
      
      // Simple S&P 500 approximation (7% annual growth from starting point)
      const monthsFromStart = Math.max(0, (statementDate - new Date(statementBalances[0].date)) / (1000 * 60 * 60 * 24 * 30.44));
      const sp500Value = statementBalances[0].accountBalance * Math.pow(1.07, monthsFromStart / 12);
      
      points.push({
        date: statement.date,
        accountValue: statement.accountBalance,
        deposits: Math.max(0, depositsAtTime), // Cumulative deposits
        withdrawals: Math.min(0, depositsAtTime), // Cumulative withdrawals (negative)
        fees: 0, // Monthly fees would need calculation if needed
        netReturn: statement.accountBalance - depositsAtTime,
        spyValue: sp500Value,
        largeFees: largeFees.map(fee => ({
          amount: Math.abs(fee.amount),
          date: fee.date,
          description: fee.description
        }))
      });
    }
    
    // If we don't have a statement for the current month, add current data point
    const lastStatementDate = new Date(statementBalances[statementBalances.length - 1].date);
    const monthsSinceLastStatement = (now - lastStatementDate) / (1000 * 60 * 60 * 24 * 30.44);
    
    if (monthsSinceLastStatement > 0.5) { // If more than 2 weeks since last statement
      const currentDeposits = calculateCumulativeDeposits(transactions, now.toISOString().split('T')[0]);
      const monthsFromStart = (now - new Date(statementBalances[0].date)) / (1000 * 60 * 60 * 24 * 30.44);
      const currentSp500Value = statementBalances[0].accountBalance * Math.pow(1.07, monthsFromStart / 12);
      
      // Find any large fees in the current month
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const currentLargeFees = feeTransactions.filter(fee => {
        const feeDate = new Date(fee.date);
        return feeDate >= currentMonthStart && feeDate <= now && Math.abs(fee.amount) >= 1000;
      });
      
      points.push({
        date: now.toISOString().split('T')[0],
        accountValue: currentValue,
        deposits: Math.max(0, currentDeposits),
        withdrawals: Math.min(0, currentDeposits),
        fees: 0,
        netReturn: currentValue - currentDeposits,
        spyValue: currentSp500Value,
        largeFees: currentLargeFees.map(fee => ({
          amount: Math.abs(fee.amount),
          date: fee.date,
          description: fee.description
        }))
      });
    }
    
    return points;
  } else {
    // Fallback to estimation if statement data not available
    console.log('📊 Using estimated values for time series data (run extract-statement-data.js for accuracy)');
    
    // Generate monthly data points for last 24 months
    for (let i = 0; i < 24; i++) {
      const date = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const progress = (23 - i) / 23;
      
      // Rough estimation of portfolio growth over time
      const estimatedValue = netDeposits * (1 + progress * 0.15);
      const sp500Value = netDeposits * (1 + progress * 0.10);
      const depositsAtTime = netDeposits * (progress * 0.8 + 0.2);
      const accountValueAtTime = i === 0 ? currentValue : estimatedValue;
      
      points.push({
        date: date.toISOString().split('T')[0],
        accountValue: accountValueAtTime,
        deposits: depositsAtTime,
        withdrawals: 0,
        fees: 0,
        netReturn: accountValueAtTime - depositsAtTime,
        spyValue: sp500Value
      });
    }
    
    return points.reverse(); // Oldest first
  }
}

async function main() {
  console.log('🚀 Starting Schwab data processing...\n');
  
  // Check if bankdata directory exists
  if (!fs.existsSync(BANK_DATA_PATH)) {
    console.error('❌ bankdata directory not found. Please ensure CSV files are in ./bankdata/');
    process.exit(1);
  }
  
  // Process raw data
  const positions = processPositions();
  const transactions = processTransactions();
  
  if (positions.length === 0 && transactions.length === 0) {
    console.error('❌ No data found to process');
    process.exit(1);
  }
  
  // Calculate metrics
  const metrics = calculateMetrics(positions, transactions);
  
  // Generate time series
  const timeSeriesData = generateTimeSeriesData(transactions, metrics.portfolio.currentValue, metrics.cashFlows.netDeposits);
  
  // Create final data structure
  const processedData = {
    lastUpdated: new Date().toISOString(),
    account: {
      accountId: 'SCHWAB_REAL_ACCOUNT',
      accountType: 'BROKERAGE',
      accountName: 'Charles Schwab Brokerage',
      currentBalance: metrics.portfolio.currentValue,
      availableCash: 0, // Would need to be extracted from positions
      totalSecurities: metrics.portfolio.currentValue,
      dayChange: 0, // Would need historical data
      dayChangePercent: 0,
      totalReturn: metrics.performance.realReturn,
      totalReturnPercent: metrics.performance.realReturnPercent,
      positions: positions
    },
    performance: {
      accountId: 'SCHWAB_REAL_ACCOUNT',
      timeSeriesData: timeSeriesData,
      totalReturn: metrics.performance.realReturn,
      totalReturnPercent: metrics.performance.realReturnPercent,
      annualizedReturn: metrics.performance.annualizedReturn,
      deposits: metrics.cashFlows.totalDeposits,
      withdrawals: metrics.cashFlows.totalWithdrawals,
      fees: metrics.cashFlows.totalFees,
      netContributions: metrics.cashFlows.netDeposits,
      realReturn: metrics.performance.netReturnAfterFees,
      realReturnPercent: metrics.performance.netReturnAfterFeesPercent,
      benchmarkComparison: {
        sp500Return: metrics.benchmark.sp500TotalReturn,
        sp500ReturnPercent: metrics.benchmark.sp500ReturnPercent,
        outperformance: metrics.benchmark.outperformance,
        outperformancePercent: metrics.benchmark.outperformancePercent
      }
    },
    transactions: transactions,
    summary: {
      totalPositions: positions.length,
      totalTransactions: transactions.length,
      portfolioValue: metrics.portfolio.currentValue,
      totalInvested: metrics.cashFlows.netDeposits,
      totalGains: metrics.performance.netReturnAfterFees,
      totalFeespaid: metrics.cashFlows.totalFees,
      yearsInvested: metrics.performance.yearsInvested,
      annualizedReturn: metrics.performance.annualizedReturn
    }
  };
  
  // Write processed data
  const outputFile = path.join(OUTPUT_PATH, 'schwab-data.json');
  fs.writeFileSync(outputFile, JSON.stringify(processedData, null, 2));
  
  console.log('\n✅ Data processing complete!');
  console.log(`📁 Output written to: ${outputFile}`);
  console.log('\n📊 Summary:');
  console.log(`   Portfolio Value: $${processedData.summary.portfolioValue.toLocaleString()}`);
  console.log(`   Total Invested: $${processedData.summary.totalInvested.toLocaleString()}`);
  console.log(`   Total Gains: $${processedData.summary.totalGains.toLocaleString()}`);
  console.log(`   Annual Return: ${processedData.summary.annualizedReturn.toFixed(2)}%`);
  console.log(`   Years Invested: ${processedData.summary.yearsInvested.toFixed(1)}`);
  console.log(`   Total Fees: $${processedData.summary.totalFeespaid.toLocaleString()}`);
  console.log(`   Positions: ${processedData.summary.totalPositions}`);
  console.log(`   Transactions: ${processedData.summary.totalTransactions}`);
}

if (require.main === module) {
  main().catch(console.error);
}
