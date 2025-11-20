'use client'

import { useState, useEffect } from 'react'

export default function FacilityManager() {
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<any>(null)
  const [facilities, setFacilities] = useState<any[]>([])
  const [targetUrl, setTargetUrl] = useState('')

  useEffect(() => {
    fetchFacilities()
  }, [])

  const fetchFacilities = async () => {
    const response = await fetch('/api/facilities')
    const data = await response.json()
    if (data.success) setFacilities(data.facilities)
  }

  const handleAddFacility = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    const formData = new FormData(e.currentTarget)
    
    const response = await fetch('/api/facilities', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: formData.get('name'),
        location: formData.get('location'),
        data: { type: formData.get('type'), notes: formData.get('notes') }
      })
    })
    
    if (response.ok) {
      e.currentTarget.reset()
      fetchFacilities()
    }
  }

  const handleSync = async () => {
    if (!targetUrl) return
    setLoading(true)
    
    try {
      const response = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ targetUrl })
      })
      const result = await response.json()
      setResult(result)
      if (result.success) fetchFacilities()
    } catch (error) {
      setResult({ success: false, error: 'Sync failed' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Add Facility</h2>
        <form onSubmit={handleAddFacility} className="grid grid-cols-2 gap-4">
          <input name="name" placeholder="Facility Name" required className="p-2 border rounded" />
          <input name="location" placeholder="Location" required className="p-2 border rounded" />
          <input name="type" placeholder="Type" className="p-2 border rounded" />
          <input name="notes" placeholder="Notes" className="p-2 border rounded" />
          <button type="submit" className="col-span-2 bg-green-600 text-white p-2 rounded hover:bg-green-700">
            Add Facility
          </button>
        </form>
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Sync Data</h2>
        <div className="flex gap-4 mb-4">
          <input 
            value={targetUrl} 
            onChange={(e) => setTargetUrl(e.target.value)}
            placeholder="Target System URL" 
            className="flex-1 p-2 border rounded" 
          />
          <button 
            onClick={handleSync} 
            disabled={loading || !targetUrl}
            className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 disabled:opacity-50"
          >
            {loading ? 'Syncing...' : 'Sync'}
          </button>
        </div>
        
        {result && (
          <div className={`p-3 rounded ${result.success ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
            {result.success ? `${result.message} (${result.count} records)` : `Error: ${result.error}`}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-xl font-bold mb-4">Local Facilities ({facilities.length})</h2>
        <div className="space-y-2 max-h-60 overflow-y-auto">
          {facilities.map((facility) => (
            <div key={facility.id} className="p-3 border rounded flex justify-between">
              <div>
                <strong>{facility.name}</strong> - {facility.location}
                <span className={`ml-2 px-2 py-1 text-xs rounded ${facility.synced ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}`}>
                  {facility.synced ? 'Synced' : 'Pending'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}