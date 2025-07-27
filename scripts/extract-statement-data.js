#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const pdf = require('pdf-parse');

/**
 * Extract account balance data from Schwab PDF statements
 * This script reads all PDF statements and extracts key financial data
 */

const STATEMENTS_PATH = path.join(process.cwd(), 'bankdata', 'statements');
const OUTPUT_PATH = path.join(process.cwd(), 'data');

// Ensure output directory exists
if (!fs.existsSync(OUTPUT_PATH)) {
  fs.mkdirSync(OUTPUT_PATH, { recursive: true });
}

function parseStatementDate(filename) {
  // Extract date from filename: "Brokerage Statement_2025-01-31_402.PDF"
  const dateMatch = filename.match(/(\d{4}-\d{2}-\d{2})/);
  if (dateMatch) {
    return dateMatch[1];
  }
  return null;
}

function extractAccountBalance(text) {
  // Common patterns for account balance in Schwab statements
  const patterns = [
    // Schwab patterns (new format)
    /EndingAccountValue\s*\$?\s*([0-9,]+\.?\d*)/i,
    /Ending\s+Account\s+Value\s*\$?\s*([0-9,]+\.?\d*)/i,
    /EndingValue\s*\$?\s*([0-9,]+\.?\d*)/i,
    /Ending\s+Value\s*\$?\s*([0-9,]+\.?\d*)/i,
    
    // TDA patterns (old format)
    /Total\s+Account\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
    /Account\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
    /Total\s+Market\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
    /Portfolio\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
    /Net\s+Account\s+Value[:\s$]*([0-9,]+\.?\d*)/i,
    /Total\s+Securities[:\s$]*([0-9,]+\.?\d*)/i,
    
    // More flexible patterns for messy PDF text
    /ending.*?value.*?\$?([0-9,]+\.[0-9]{2})/i,
    /account.*?value.*?\$?([0-9,]+\.[0-9]{2})/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1].replace(/,/g, '');
      const numValue = parseFloat(value);
      if (!isNaN(numValue) && numValue > 1000) { // Sanity check
        return numValue;
      }
    }
  }

  // Special handling for Schwab format - look for the ending value in the summary section
  const summaryMatch = text.match(/EndingValue\$([0-9,]+\.[0-9]{2})/i);
  if (summaryMatch) {
    const value = summaryMatch[1].replace(/,/g, '');
    const numValue = parseFloat(value);
    if (!isNaN(numValue) && numValue > 1000) {
      return numValue;
    }
  }

  return null;
}

function extractCashBalance(text) {
  // Patterns for available cash
  const patterns = [
    /Cash\s+&\s+Cash\s+Investments[:\s$]*([0-9,]+\.?\d*)/i,
    /Available\s+Cash[:\s$]*([0-9,]+\.?\d*)/i,
    /Cash\s+Balance[:\s$]*([0-9,]+\.?\d*)/i,
    /Money\s+Market[:\s$]*([0-9,]+\.?\d*)/i
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      const value = match[1].replace(/,/g, '');
      const numValue = parseFloat(value);
      if (!isNaN(numValue)) {
        return numValue;
      }
    }
  }

  return 0;
}

async function extractStatementData(pdfPath) {
  try {
    console.log(`Processing: ${path.basename(pdfPath)}`);
    
    const dataBuffer = fs.readFileSync(pdfPath);
    const pdfData = await pdf(dataBuffer);
    const text = pdfData.text;

    // Extract key data
    let accountBalance = extractAccountBalance(text);
    
    // If we couldn't extract with patterns, try manual extraction from the debug text
    if (!accountBalance) {
      // Look for patterns we saw in the debug output
      const manualPatterns = [
        /EndingValue\$([0-9,]+\.[0-9]{2})/,
        /EndingAccountValue\$([0-9,]+\.[0-9]{2})/,
        /BeginningValue\s*\$([0-9,]+\.[0-9]{2})/
      ];
      
      for (const pattern of manualPatterns) {
        const match = text.match(pattern);
        if (match) {
          const value = match[1].replace(/,/g, '');
          const numValue = parseFloat(value);
          if (!isNaN(numValue) && numValue > 1000) {
            accountBalance = numValue;
            break;
          }
        }
      }
    }
    
    const cashBalance = extractCashBalance(text);

    if (!accountBalance) {
      console.warn(`  ⚠️  Could not extract account balance from ${path.basename(pdfPath)}`);
      // Log some text for debugging
      const debugText = text.substring(0, 1000).replace(/\s+/g, ' ');
      console.log(`  Debug text: ${debugText}`);
      return null;
    }

    return {
      accountBalance,
      cashBalance,
      securitiesValue: accountBalance - cashBalance
    };

  } catch (error) {
    console.error(`  ❌ Error processing ${path.basename(pdfPath)}:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🔍 Starting PDF statement extraction...\n');

  if (!fs.existsSync(STATEMENTS_PATH)) {
    console.error('❌ Statements directory not found:', STATEMENTS_PATH);
    process.exit(1);
  }

  const files = fs.readdirSync(STATEMENTS_PATH)
    .filter(file => file.toLowerCase().endsWith('.pdf'))
    .sort(); // Process in chronological order

  const statements = [];

  for (const file of files) {
    const filePath = path.join(STATEMENTS_PATH, file);
    const date = parseStatementDate(file);
    
    if (!date) {
      console.warn(`⚠️  Could not parse date from filename: ${file}`);
      continue;
    }

    const data = await extractStatementData(filePath);
    
    if (data) {
      statements.push({
        date,
        filename: file,
        accountBalance: data.accountBalance,
        cashBalance: data.cashBalance,
        securitiesValue: data.securitiesValue
      });
      
      console.log(`  ✅ ${date}: $${data.accountBalance.toLocaleString()}`);
    }
  }

  // Sort by date
  statements.sort((a, b) => new Date(a.date) - new Date(b.date));

  // Save extracted data
  const outputFile = path.join(OUTPUT_PATH, 'statement-balances.json');
  fs.writeFileSync(outputFile, JSON.stringify({
    lastUpdated: new Date().toISOString(),
    totalStatements: statements.length,
    dateRange: {
      earliest: statements[0]?.date,
      latest: statements[statements.length - 1]?.date
    },
    statements
  }, null, 2));

  console.log(`\n✅ Extraction complete!`);
  console.log(`📄 Processed ${statements.length} statements`);
  console.log(`💾 Data saved to: ${outputFile}`);
  console.log(`📅 Date range: ${statements[0]?.date} to ${statements[statements.length - 1]?.date}`);

  // Show summary
  if (statements.length > 0) {
    const earliest = statements[0];
    const latest = statements[statements.length - 1];
    const totalGrowth = latest.accountBalance - earliest.accountBalance;
    
    console.log(`\n📊 Portfolio Growth Summary:`);
    console.log(`   Starting Balance (${earliest.date}): $${earliest.accountBalance.toLocaleString()}`);
    console.log(`   Current Balance (${latest.date}): $${latest.accountBalance.toLocaleString()}`);
    console.log(`   Total Growth: $${totalGrowth.toLocaleString()}`);
  }
}

main().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
});
