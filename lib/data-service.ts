import { getUnsyncedIndicators, getUnsyncedLineList, markIndicatorsAsSynced, markLineListAsSynced } from './local-db'

export async function syncLocalData(targetUrl: string) {
  try {
    const [indicators, lineList] = await Promise.all([
      getUnsyncedIndicators(),
      getUnsyncedLineList()
    ])
    
    let syncedCount = 0
    
    if (indicators.length > 0) {
      const response = await fetch(`${targetUrl}/indicators`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FACILITY_KEY}`
        },
        body: JSON.stringify({ data: indicators })
      })
      
      if (response.ok) {
        await markIndicatorsAsSynced(indicators.map(i => i.id))
        syncedCount += indicators.length
      }
    }
    
    if (lineList.length > 0) {
      const response = await fetch(`${targetUrl}/linelist`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${process.env.FACILITY_KEY}`
        },
        body: JSON.stringify({ data: lineList })
      })
      
      if (response.ok) {
        await markLineListAsSynced(lineList.map(l => l.id))
        syncedCount += lineList.length
      }
    }
    
    return {
      success: true,
      message: 'Sync completed',
      count: syncedCount,
      details: {
        indicators: indicators.length,
        lineList: lineList.length
      }
    }
  } catch (error) {
    console.error('Sync failed:', error)
    return {
      success: false,
      error: 'Sync failed'
    }
  }
}