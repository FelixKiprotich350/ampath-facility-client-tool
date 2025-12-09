import { startDownloadScheduler, stopDownloadScheduler } from './download-scheduler'
import { startSyncScheduler, stopSyncScheduler } from './sync-scheduler'

export function startAllSchedulers() {
  console.log('Starting all schedulers...')
  startDownloadScheduler()
  // startSyncScheduler()
}

export function stopAllSchedulers() {
  console.log('Stopping all schedulers...')
  stopDownloadScheduler()
  stopSyncScheduler()
}
