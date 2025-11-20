import { fetchFromDatabase } from './database'
import { addFacility } from './local-db'

export async function collectFacilityData() {
  try {
    const facilities = await fetchFromDatabase(
      'SELECT id, name, location, status, last_updated FROM facilities WHERE last_updated > ?',
      [new Date(Date.now() - 24 * 60 * 60 * 1000)] // Last 24 hours
    )
    
    for (const facility of facilities as any[]) {
      await addFacility(facility.name, facility.location, {
        originalId: facility.id,
        status: facility.status,
        lastUpdated: facility.last_updated
      })
    }
    
    return { collected: facilities.length }
  } catch (error) {
    console.error('Data collection failed:', error)
    throw error
  }
}

export async function collectFromAPI(apiUrl: string) {
  try {
    const response = await fetch(apiUrl)
    if (!response.ok) throw new Error(`API call failed: ${response.status}`)
    
    const data = await response.json()
    
    for (const item of data) {
      await addFacility(item.name, item.location, item)
    }
    
    return { collected: data.length }
  } catch (error) {
    console.error('API collection failed:', error)
    throw error
  }
}