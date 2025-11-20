import { startSyncScheduler } from './sync-scheduler.ts'

console.log('Starting cron scheduler...')
startSyncScheduler()

// Keep the process running
process.on('SIGINT', () => {
  console.log('Shutting down cron scheduler...')
  process.exit(0)
})