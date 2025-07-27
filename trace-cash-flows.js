const fs = require('fs');
const path = require('path');

// Read the data file using relative path
const data = JSON.parse(fs.readFileSync(path.join(__dirname, 'data/schwab-data.json'), 'utf8'));

console.log('=== CASH FLOW ANALYSIS ===\n');

// Get all transactions and filter for deposits/withdrawals
const transactions = data.transactions;
let totalDeposits = 0;
let totalWithdrawals = 0;

console.log('DEPOSITS:');
transactions
  .filter(t => t.type === 'DEPOSIT')
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .forEach(t => {
    totalDeposits += t.amount;
    console.log(`${t.date}: +$${t.amount.toLocaleString()} - ${t.description}`);
  });

console.log(`\nTotal Deposits: $${totalDeposits.toLocaleString()}\n`);

console.log('WITHDRAWALS:');
transactions
  .filter(t => t.type === 'WITHDRAWAL')
  .sort((a, b) => new Date(a.date) - new Date(b.date))
  .forEach(t => {
    totalWithdrawals += Math.abs(t.amount);
    console.log(`${t.date}: -$${Math.abs(t.amount).toLocaleString()} - ${t.description}`);
  });

console.log(`\nTotal Withdrawals: $${totalWithdrawals.toLocaleString()}\n`);

console.log('=== SUMMARY ===');
console.log(`Total Deposits: $${totalDeposits.toLocaleString()}`);
console.log(`Total Withdrawals: $${totalWithdrawals.toLocaleString()}`);
console.log(`Net Invested: $${(totalDeposits - totalWithdrawals).toLocaleString()}`);

console.log('\nFrom processed data summary:');
console.log(`Deposits: $${data.performance.deposits.toLocaleString()}`);
console.log(`Withdrawals: $${data.performance.withdrawals.toLocaleString()}`);
console.log(`Net Contributions: $${data.performance.netContributions.toLocaleString()}`);

// Let's also trace the first few deposits to understand the initial $78k
console.log('\n=== INITIAL INVESTMENT ANALYSIS ===');
const firstTransaction = transactions[transactions.length - 1]; // Most recent is first, so last is oldest
console.log(`First transaction date: ${firstTransaction.date}`);
console.log(`First data point date: ${data.performance.timeSeriesData[0].date}`);
console.log(`First data point deposits: $${data.performance.timeSeriesData[0].deposits.toLocaleString()}`);

// Check for any transactions before the first data point
const firstDataDate = new Date(data.performance.timeSeriesData[0].date);
const earlyTransactions = transactions.filter(t => new Date(t.date) < firstDataDate);
console.log(`\nTransactions before first data point (${data.performance.timeSeriesData[0].date}):`);
earlyTransactions.forEach(t => {
  console.log(`${t.date}: ${t.type} $${t.amount} - ${t.description}`);
});
