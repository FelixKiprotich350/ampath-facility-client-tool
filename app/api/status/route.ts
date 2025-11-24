import { NextResponse } from 'next/server'
import { getDataSummary } from '@/lib/local-db'

export async function GET() {
  try {
    const summary = await getDataSummary()
    return NextResponse.json(summary)
  } catch (error) {
    return NextResponse.json({ error: 'Failed to get status' }, { status: 500 })
  }
}