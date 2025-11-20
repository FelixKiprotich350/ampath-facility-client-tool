import { NextRequest, NextResponse } from 'next/server'
import { syncLocalData } from '@/lib/data-service'

export async function POST(request: NextRequest) {
  try {
    const { targetUrl } = await request.json()
    const url = targetUrl || process.env.SYNC_API_URL
    
    if (!url) {
      return NextResponse.json({ error: 'Target URL required' }, { status: 400 })
    }
    
    const result = await syncLocalData(url)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}