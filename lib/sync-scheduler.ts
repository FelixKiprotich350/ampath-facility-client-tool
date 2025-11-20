import cron from 'node-cron'
import { syncLocalData } from './data-service'
import { collectFacilityData } from './data-collector'

const SYNC_URL = process.env.SYNC_API_URL || 'https://your-server.com/api/sync'
const SYNC_INTERVAL = process.env.SYNC_INTERVAL_MINUTES || '30'

let tasks: any[] = []

export function startSyncScheduler() {
  // Sync every N minutes
  const syncTask = cron.schedule(`*/${SYNC_INTERVAL} * * * *`, async () => {
    console.log('Starting scheduled sync...')
    try {
      const result = await syncLocalData(SYNC_URL)
      console.log('Sync completed:', result)
    } catch (error) {
      console.error('Scheduled sync failed:', error)
    }
  })
  
  // Collect data every hour
  const collectTask = cron.schedule('0 * * * *', async () => {
    console.log('Starting data collection...')
    try {
      const dbResult = await collectFacilityData()
      console.log('Data collection completed:', dbResult)
    } catch (error) {
      console.error('Data collection failed:', error)
    }
  })
  
  tasks = [syncTask, collectTask]
  console.log(`Sync scheduler started - syncing every ${SYNC_INTERVAL} minutes`)
}

export function stopSyncScheduler() {
  tasks.forEach(task => task.destroy())
  tasks = []
}