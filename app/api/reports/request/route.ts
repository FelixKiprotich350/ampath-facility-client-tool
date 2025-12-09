import { NextRequest, NextResponse } from 'next/server'
import { addReportToQueue } from '@/lib/report-queue'

export async function POST(request: NextRequest) {
  try {
    const { kenyaEmrReportUuid, reportPeriod } = await request.json()
    
    if (!kenyaEmrReportUuid || !reportPeriod) {
      return NextResponse.json(
        { error: 'kenyaEmrReportUuid and reportPeriod are required' },
        { status: 400 }
      )
    }
    
    const queueItem = await addReportToQueue(kenyaEmrReportUuid, reportPeriod)
    
    return NextResponse.json({
      message: 'Report download scheduled',
      queueItem
    })
  } catch (error: any) {
    console.error('Error scheduling report:', error)
    return NextResponse.json(
      { error: 'Failed to schedule report download' },
      { status: 500 }
    )
  }
}
