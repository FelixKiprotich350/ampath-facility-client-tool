'use client'

import { useState, useEffect } from 'react'

interface DataSummary {
  indicators: { total: number; unsynced: number }
  lineList: { total: number; unsynced: number }
}

export default function Home() {
  const [status, setStatus] = useState('')
  const [summary, setSummary] = useState<DataSummary | null>(null)
  const [loading, setLoading] = useState(false)
  const [schedulerRunning, setSchedulerRunning] = useState(false)

  useEffect(() => {
    loadSummary()
    const interval = setInterval(loadSummary, 30000)
    return () => clearInterval(interval)
  }, [])

  const loadSummary = async () => {
    try {
      const response = await fetch('/api/status')
      const data = await response.json()
      setSummary(data)
    } catch {
      setStatus('Failed to load data summary')
    }
  }

  const handleSync = async () => {
    setLoading(true)
    setStatus('🔄 Syncing data to server...')
    try {
      const response = await fetch('/api/sync', { method: 'POST' })
      const result = await response.json()
      if (result.success) {
        setStatus(`✅ Sync completed: ${result.count} records synced`)
        loadSummary()
      } else {
        setStatus('❌ Sync failed')
      }
    } catch {
      setStatus('❌ Sync failed')
    } finally {
      setLoading(false)
    }
  }

  const handleCollect = async (source: string) => {
    setLoading(true)
    setStatus(`🔍 Collecting from ${source}...`)
    try {
      const response = await fetch('/api/collect', { 
        method: 'POST', 
        body: JSON.stringify({ source }), 
        headers: { 'Content-Type': 'application/json' } 
      })
      const result = await response.json()
      if (result.indicators !== undefined) {
        setStatus(`✅ Collected ${result.indicators} indicators, ${result.lineList} line list records`)
      } else {
        setStatus(`✅ Collected ${result.collected} ${result.type} records`)
      }
      loadSummary()
    } catch {
      setStatus('❌ Collection failed')
    } finally {
      setLoading(false)
    }
  }

  const startCron = async () => {
    try {
      const response = await fetch('/api/cron/start', { method: 'POST' })
      const result = await response.json()
      setStatus(`⏰ ${result.message}`)
      setSchedulerRunning(true)
    } catch {
      setStatus('❌ Failed to start scheduler')
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Facility Data Manager</h1>
          <p className="text-gray-600">Collect indicators and line list data from KenyaEMR</p>
        </div>
        
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          {summary ? (
            <>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-blue-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">📊 Indicators</h3>
                    <p className="text-3xl font-bold text-blue-600">{summary.indicators.total}</p>
                    <p className="text-sm text-gray-500">Total records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-500">{summary.indicators.unsynced}</p>
                    <p className="text-sm text-gray-500">Pending sync</p>
                  </div>
                </div>
              </div>
              <div className="bg-white rounded-xl shadow-lg p-6 border-l-4 border-green-500">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-800">📋 Line List</h3>
                    <p className="text-3xl font-bold text-green-600">{summary.lineList.total}</p>
                    <p className="text-sm text-gray-500">Total records</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-orange-500">{summary.lineList.unsynced}</p>
                    <p className="text-sm text-gray-500">Pending sync</p>
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="col-span-2 bg-white rounded-xl shadow-lg p-6 text-center">
              <div className="animate-pulse">Loading data summary...</div>
            </div>
          )}
        </div>
        
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-800 mb-4">Actions</h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
            <button 
              onClick={() => handleCollect('database')} 
              disabled={loading}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>🔍</span>
              <span>Collect Data</span>
            </button>
            <button 
              onClick={handleSync} 
              disabled={loading}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>🔄</span>
              <span>Sync Now</span>
            </button>
            <button 
              onClick={startCron} 
              disabled={loading || schedulerRunning}
              className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>⏰</span>
              <span>{schedulerRunning ? 'Running' : 'Start Scheduler'}</span>
            </button>
            <button 
              onClick={loadSummary} 
              disabled={loading}
              className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <span>🔄</span>
              <span>Refresh</span>
            </button>
          </div>
        </div>

        {status && (
          <div className="bg-white rounded-xl shadow-lg p-4 border-l-4 border-blue-500">
            <div className="flex items-center space-x-2">
              <div className="text-lg">{loading ? '⏳' : '💬'}</div>
              <div className="text-gray-800">{status}</div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}