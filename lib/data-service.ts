import { getUnsyncedData, markAsSynced } from './local-db'

export async function postToSystem(targetUrl: string, data: any) {
  const response = await fetch(targetUrl, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data)
  })
  if (!response.ok) throw new Error(`Post failed: ${response.status}`)
  return response.json()
}

export async function syncLocalData(targetUrl: string) {
  try {
    const unsyncedData = await getUnsyncedData()
    
    if (unsyncedData.length === 0) {
      return { message: 'No data to sync', count: 0 }
    }
    
    const result = await postToSystem(targetUrl, unsyncedData)
    
    const ids = unsyncedData.map((item: any) => item.id)
    await markAsSynced(ids)
    
    return { message: 'Sync completed', count: unsyncedData.length, result }
  } catch (error) {
    console.error('Sync failed:', error)
    return { message: 'Sync failed', error: error.message }
  }
}