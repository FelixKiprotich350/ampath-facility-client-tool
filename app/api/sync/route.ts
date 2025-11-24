import { NextRequest, NextResponse } from 'next/server'
import { manualSync } from '@/lib/sync-scheduler'

export async function POST() {
  try {
    const result = await manualSync()
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json({ error: 'Sync failed' }, { status: 500 })
  }
}