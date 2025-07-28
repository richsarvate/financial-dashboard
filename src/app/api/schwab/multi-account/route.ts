import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

/**
 * Enhanced multi-account API with validation and error handling
 */
export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const account = url.searchParams.get('account')
    
    const dataPath = path.join(process.cwd(), 'data', 'multi-account-data.json')
    
    // Enhanced file existence check with better error messages
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { 
          error: 'Multi-account data not found', 
          message: 'Please run: node scripts/process-multi-account-data.js',
          instructions: 'Make sure you have account folders in ./bankdata/statements/',
          availableAccounts: []
        },
        { status: 404 }
      )
    }

    // Enhanced file reading with validation
    let data;
    try {
      const content = fs.readFileSync(dataPath, 'utf-8')
      data = JSON.parse(content)
    } catch (parseError) {
      console.error('Error parsing multi-account data:', parseError)
      return NextResponse.json(
        { 
          error: 'Invalid data format', 
          message: 'Multi-account data file is corrupted. Please regenerate it.',
          instructions: 'Run: node scripts/process-multi-account-data.js'
        },
        { status: 500 }
      )
    }

    // Validate data structure
    if (!data || typeof data !== 'object') {
      return NextResponse.json(
        { 
          error: 'Invalid data structure', 
          message: 'Multi-account data is not in expected format'
        },
        { status: 500 }
      )
    }

    // If no specific account requested, return list of available accounts
    if (!account) {
      const accountList = data.accountList || []
      const availableAccounts = data.accounts ? Object.keys(data.accounts) : []
      
      // Validate that accountList matches available accounts
      const missingAccounts = availableAccounts.filter((acc: string) => !accountList.includes(acc))
      const extraAccounts = accountList.filter((acc: string) => !availableAccounts.includes(acc))
      
      return NextResponse.json({
        accountList: availableAccounts, // Use actual available accounts
        lastUpdated: data.lastUpdated,
        totalAccounts: availableAccounts.length,
        ...(missingAccounts.length > 0 && { 
          warnings: [`Accounts in data but not in list: ${missingAccounts.join(', ')}` ]
        }),
        ...(extraAccounts.length > 0 && { 
          warnings: [`Accounts in list but not in data: ${extraAccounts.join(', ')}` ]
        })
      })
    }

    // Validate account parameter
    if (typeof account !== 'string' || account.trim().length === 0) {
      return NextResponse.json(
        { error: 'Invalid account parameter' },
        { status: 400 }
      )
    }

    // Check if accounts data exists
    if (!data.accounts || typeof data.accounts !== 'object') {
      return NextResponse.json(
        { 
          error: 'No account data available', 
          message: 'Multi-account data file is missing account information',
          availableAccounts: []
        },
        { status: 404 }
      )
    }

    // Return specific account data with validation
    if (data.accounts[account]) {
      const accountData = data.accounts[account]
      
      // Basic validation of account data structure
      const requiredFields = ['account', 'transactions', 'performance']
      const missingFields = requiredFields.filter(field => !(field in accountData))
      
      if (missingFields.length > 0) {
        return NextResponse.json(
          { 
            error: 'Incomplete account data', 
            missingFields,
            message: `Account ${account} is missing required data fields`
          },
          { status: 500 }
        )
      }

      return NextResponse.json({
        ...accountData,
        accountName: account,
        dataIntegrity: {
          hasAccount: !!accountData.account,
          hasTransactions: Array.isArray(accountData.transactions),
          hasPerformance: !!accountData.performance,
          transactionCount: Array.isArray(accountData.transactions) ? accountData.transactions.length : 0,
          performanceDataPoints: accountData.performance?.timeSeriesData?.length || 0
        }
      })
    } else {
      const availableAccounts = Object.keys(data.accounts)
      return NextResponse.json(
        { 
          error: `Account '${account}' not found`,
          availableAccounts,
          suggestions: availableAccounts.filter((acc: string) => 
            acc.toLowerCase().includes(account.toLowerCase()) ||
            account.toLowerCase().includes(acc.toLowerCase())
          )
        },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error in multi-account API:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error', 
        message: 'Failed to load financial data',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}
