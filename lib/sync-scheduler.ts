import cron from 'node-cron'
import { syncLocalData } from './data-service'
import { collectAllData } from './data-collector'

const SYNC_URL = process.env.SERVER_URL
const SYNC_INTERVAL = process.env.SYNC_INTERVAL_MINUTES || '1'

let tasks: any[] = []

export function startSyncScheduler() {
  // Collect data every N minutes
  const collectTask = cron.schedule(`*/${SYNC_INTERVAL} * * * *`, async () => {
    console.log('Starting scheduled data collection...')
    try {
      const result = await collectAllData()
      console.log('Data collection completed:', result)
    } catch (error) {
      console.error('Data collection failed:', error)
    }
  })
  
  tasks = [collectTask]
  console.log(`Data collection scheduler started - collecting every ${SYNC_INTERVAL} minutes`)
}

export function stopSyncScheduler() {
  tasks.forEach(task => task.destroy())
  tasks = []
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