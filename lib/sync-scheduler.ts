import cron from 'node-cron'
import { syncLocalData } from './data-service'

const SYNC_URL = process.env.AMPATH_SERVER_URL
const SYNC_INTERVAL = process.env.SYNC_INTERVAL_MINUTES || '5'

let syncTask: any = null

export function startSyncScheduler() {
  syncTask = cron.schedule(`*/${SYNC_INTERVAL} * * * *`, async () => {
    console.log('Starting scheduled report sync...')
    try {
      const result = await syncLocalData(SYNC_URL)
      console.log('Report sync completed:', result)
    } catch (error) {
      console.error('Report sync failed:', error)
    }
  })
  
  console.log(`Report sync scheduler started - syncing every ${SYNC_INTERVAL} minutes`)
}

export function stopSyncScheduler() {
  if (syncTask) {
    syncTask.destroy()
    syncTask = null
  }
}

export async function manualSync() {
  try {
    const result = await syncLocalData(SYNC_URL)
    return result
  } catch (error) {
    console.error('Manual sync failed:', error)
    throw error
  }
}