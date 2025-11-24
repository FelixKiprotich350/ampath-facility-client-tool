import { fetchFromKenyaEMRDatabase } from './database'
import { addIndicator, addLineList } from './local-db'

export async function collectIndicators() {
  try {
    const indicators = await fetchFromKenyaEMRDatabase(
      `SELECT 
        f.uuid as facility_id,
        i.indicator_id,
        i.name,
        i.value,
        i.period,
        i.created_date
      FROM indicators i 
      JOIN facilities f ON i.facility_id = f.id 
      WHERE i.created_date > ?`,
      [new Date(Date.now() - 24 * 60 * 60 * 1000)]
    ) as any[]
    
    for (const indicator of indicators) {
      await addIndicator(
        indicator.facility_id,
        indicator.indicator_id,
        indicator.name,
        indicator.value,
        indicator.period,
        { createdDate: indicator.created_date }
      )
    }
    
    return { collected: indicators.length, type: 'indicators' }
  } catch (error) {
    console.error('Indicator collection failed:', error)
    throw error
  }
}

export async function collectLineList() {
  try {
    const lineList = await fetchFromKenyaEMRDatabase(
      `SELECT 
        f.uuid as facility_id,
        p.patient_id,
        p.gender,
        p.birthdate,
        p.date_created,
        e.encounter_datetime,
        e.encounter_type
      FROM patient p
      JOIN encounter e ON p.patient_id = e.patient_id
      JOIN location f ON e.location_id = f.location_id
      WHERE e.encounter_datetime > ?`,
      [new Date(Date.now() - 24 * 60 * 60 * 1000)]
    ) as any[]
    
    for (const record of lineList) {
      await addLineList(
        record.facility_id,
        record.patient_id,
        {
          gender: record.gender,
          birthdate: record.birthdate,
          dateCreated: record.date_created,
          encounterDatetime: record.encounter_datetime,
          encounterType: record.encounter_type
        }
      )
    }
    
    return { collected: lineList.length, type: 'lineList' }
  } catch (error) {
    console.error('Line list collection failed:', error)
    throw error
  }
}

export async function collectFromAPI(apiUrl: string, dataType: 'indicators' | 'lineList' = 'indicators') {
  try {
    const response = await fetch(apiUrl, {
      headers: {
        'Authorization': `Bearer ${process.env.FACILITY_KEY}`,
        'Content-Type': 'application/json'
      }
    })
    
    if (!response.ok) throw new Error(`API call failed: ${response.status}`)
    
    const data = await response.json()
    
    if (dataType === 'indicators') {
      for (const item of data) {
        await addIndicator(
          item.facilityId,
          item.indicatorId,
          item.name,
          item.value,
          item.period,
          item
        )
      }
    } else {
      for (const item of data) {
        await addLineList(
          item.facilityId,
          item.patientId,
          item
        )
      }
    }
    
    return { collected: data.length, type: dataType }
  } catch (error) {
    console.error('API collection failed:', error)
    throw error
  }
}

export async function collectAllData() {
  const results = await Promise.allSettled([
    collectIndicators(),
    collectLineList()
  ])
  
  const summary = {
    indicators: 0,
    lineList: 0,
    errors: [] as string[]
  }
  
  results.forEach((result, index) => {
    if (result.status === 'fulfilled') {
      if (result.value.type === 'indicators') {
        summary.indicators = result.value.collected
      } else {
        summary.lineList = result.value.collected
      }
    } else {
      summary.errors.push(`${index === 0 ? 'Indicators' : 'Line List'}: ${result.reason}`)
    }
  })
  
  return summary
}