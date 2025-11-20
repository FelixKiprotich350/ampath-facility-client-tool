'use client'

import { useState } from 'react'

interface Facility {
  id: number
  name: string
  location: string | null
  synced: boolean
}

export default function Home() {
  const [status, setStatus] = useState('')
  const [facilities, setFacilities] = useState<Facility[]>([])

  const handleSync = async () => {
    setStatus('Syncing...')
    try {
      const response = await fetch('/api/sync', { method: 'POST', body: JSON.stringify({}), headers: { 'Content-Type': 'application/json' } })
      const result = await response.json()
      setStatus(`Sync completed: ${result.message}`)
    } catch {
      setStatus('Sync failed')
    }
  }

  const handleCollect = async (source: string) => {
    setStatus(`Collecting from ${source}...`)
    try {
      const response = await fetch('/api/collect', { 
        method: 'POST', 
        body: JSON.stringify({ source }), 
        headers: { 'Content-Type': 'application/json' } 
      })
      const result = await response.json()
      setStatus(`Collected ${result.collected} records`)
    } catch {
      setStatus('Collection failed')
    }
  }

  const loadFacilities = async () => {
    try {
      const response = await fetch('/api/facilities')
      const data = await response.json()
      setFacilities(data)
    } catch {
      setStatus('Failed to load facilities')
    }
  }

  const startCron = async () => {
    try {
      const response = await fetch('/api/cron/start', { method: 'POST' })
      const result = await response.json()
      setStatus(result.message)
    } catch {
      setStatus('Failed to start cron')
    }
  }

  return (
    <div className="p-8">
      <h1 className="text-2xl font-bold mb-6">Facility Client Tool</h1>
      
      <div className="space-y-4 mb-6">
        <button onClick={() => handleCollect('database')} className="bg-blue-500 text-white px-4 py-2 rounded mr-2">
          Collect from Database
        </button>
        <button onClick={handleSync} className="bg-green-500 text-white px-4 py-2 rounded mr-2">
          Sync to Server
        </button>
        <button onClick={loadFacilities} className="bg-gray-500 text-white px-4 py-2 rounded mr-2">
          Load Facilities
        </button>
        <button onClick={startCron} className="bg-purple-500 text-white px-4 py-2 rounded">
          Start Cron
        </button>
      </div>

      {status && <div className="mb-4 p-2 bg-gray-100 rounded">{status}</div>}

      <div>
        <h2 className="text-xl font-semibold mb-2">Facilities ({facilities.length})</h2>
        <div className="space-y-2">
          {facilities.map((facility) => (
            <div key={facility.id} className="p-2 border rounded">
              <strong>{facility.name}</strong> - {facility.location} 
              <span className={`ml-2 px-2 py-1 text-xs rounded ${facility.synced ? 'bg-green-100' : 'bg-yellow-100'}`}>
                {facility.synced ? 'Synced' : 'Pending'}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}