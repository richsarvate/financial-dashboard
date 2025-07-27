import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET() {
  try {
    const dataPath = path.join(process.cwd(), 'data', 'schwab-data.json')
    
    if (!fs.existsSync(dataPath)) {
      return NextResponse.json(
        { error: 'Processed data not found. Please run: node scripts/process-schwab-data.js' },
        { status: 404 }
      )
    }

    const content = fs.readFileSync(dataPath, 'utf-8')
    const data = JSON.parse(content)

    return NextResponse.json(data)
  } catch (error) {
    console.error('Error loading Schwab data:', error)
    return NextResponse.json(
      { error: 'Failed to load financial data' },
      { status: 500 }
    )
  }
}
