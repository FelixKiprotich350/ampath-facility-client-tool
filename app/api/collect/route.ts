import { NextRequest, NextResponse } from 'next/server'
import { collectFacilityData, collectFromAPI } from '@/lib/data-collector'

export async function POST(request: NextRequest) {
  try {
    const { source, apiUrl } = await request.json()
    
    let result
    if (source === 'database') {
      result = await collectFacilityData()
    } else if (source === 'api' && apiUrl) {
      result = await collectFromAPI(apiUrl)
    } else {
      return NextResponse.json({ error: 'Invalid source or missing apiUrl' }, { status: 400 })
    }
    
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Collection failed' }, { status: 500 })
  }
}