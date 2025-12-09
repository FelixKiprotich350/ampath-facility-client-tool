import { startDownloadScheduler, stopDownloadScheduler, getDownloadSchedulerStatus } from './download-scheduler' 

export function startAllSchedulers() {
  console.log('Starting all schedulers...')
  startDownloadScheduler()
  // startSyncScheduler()
}

export function stopAllSchedulers() {
  console.log('Stopping all schedulers...')
  stopDownloadScheduler() 
}

export function getSchedulerStatus() {
  return getDownloadSchedulerStatus()
}
