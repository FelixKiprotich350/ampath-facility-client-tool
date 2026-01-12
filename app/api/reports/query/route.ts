import { NextRequest, NextResponse } from 'next/server'
import { executeReportQuery } from '@/lib/queryreports'

export async function POST(request: NextRequest) {
  try {
    const { reportType, startDate, endDate } = await request.json()
    
    if (!reportType || !startDate || !endDate) {
      return NextResponse.json(
        { error: 'reportType, startDate, and endDate are required' },
        { status: 400 }
      )
    }
    
    const data = await executeReportQuery(reportType, startDate, endDate)
    
    return NextResponse.json({
      success: true,
      data,
      recordCount: Array.isArray(data) ? data.length : 0
    })
  } catch (error: any) {
    console.error('Error executing report query:', error)
    return NextResponse.json(
      { error: 'Failed to execute report query', details: error.message },
      { status: 500 }
    )
  }
}