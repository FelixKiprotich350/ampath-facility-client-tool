import { NextResponse } from 'next/server'
import { startSyncScheduler } from '@/lib/sync-scheduler'

let schedulerStarted = false

export async function POST() {
  if (!schedulerStarted) {
    startSyncScheduler()
    schedulerStarted = true
    return NextResponse.json({ message: 'Cron scheduler started' })
  }
  return NextResponse.json({ message: 'Cron scheduler already running' })
}