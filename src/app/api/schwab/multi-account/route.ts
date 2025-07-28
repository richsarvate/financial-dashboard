import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

// Force dynamic rendering to avoid static generation issues
export const dynamic = 'force-dynamic'

export async function GET(request: Request) {
  try {
    const url = new URL(request.url)
    const account = url.searchParams.get('account')
    
    const dataPath = path.join(process.cwd(), 'data', 'multi-account-data.json')
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: 'Multi-account data not found. Please run: node scripts/process-multi-account-data.js' },
        { status: 404 }
      )
    }

    const content = fs.readFileSync(dataPath, 'utf-8')
    const data = JSON.parse(content)

    // If no specific account requested, return list of available accounts
    if (!account) {
      return NextResponse.json({
        accountList: data.accountList || [],
        lastUpdated: data.lastUpdated
      })
    }

    // Return specific account data
    if (data.accounts && data.accounts[account]) {
      return NextResponse.json(data.accounts[account])
    } else {
      return NextResponse.json(
        { error: `Account '${account}' not found` },
        { status: 404 }
      )
    }
  } catch (error) {
    console.error('Error loading multi-account data:', error)
    return NextResponse.json(
      { error: 'Failed to load financial data' },
      { status: 500 }
    )
  }
}
