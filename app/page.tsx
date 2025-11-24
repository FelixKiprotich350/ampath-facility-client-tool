'use client'

import { useState, useEffect } from 'react'
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

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
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-6 py-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">Facility Data Manager</h1>
          <p className="text-gray-600">Collect indicators and line list data from KenyaEMR</p>
        </div>
        
        <Tabs defaultValue="home" className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="home">Home</TabsTrigger>
            <TabsTrigger value="pending">Pending Data</TabsTrigger>
            <TabsTrigger value="history">History</TabsTrigger>
          </TabsList>
          
          <TabsContent value="home" className="space-y-6">
            <div className="grid md:grid-cols-2 gap-6">
              {summary ? (
                <>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        📊 Indicators
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-3xl font-bold text-blue-600">{summary.indicators.total}</p>
                          <p className="text-sm text-gray-500">Total records</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-500">{summary.indicators.unsynced}</p>
                          <p className="text-sm text-gray-500">Pending sync</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardHeader>
                      <CardTitle className="flex items-center gap-2">
                        📋 Line List
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="flex justify-between items-center">
                        <div>
                          <p className="text-3xl font-bold text-green-600">{summary.lineList.total}</p>
                          <p className="text-sm text-gray-500">Total records</p>
                        </div>
                        <div className="text-right">
                          <p className="text-2xl font-bold text-orange-500">{summary.lineList.unsynced}</p>
                          <p className="text-sm text-gray-500">Pending sync</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </>
              ) : (
                <Card className="col-span-2">
                  <CardContent className="text-center py-8">
                    <div className="animate-pulse">Loading data summary...</div>
                  </CardContent>
                </Card>
              )}
            </div>
            
            <Card>
              <CardHeader>
                <CardTitle>Actions</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">
                  <Button onClick={() => handleCollect('database')} disabled={loading}>
                    🔍 Collect Data
                  </Button>
                  <Button onClick={handleSync} disabled={loading} variant="secondary">
                    🔄 Sync Now
                  </Button>
                  <Button onClick={startCron} disabled={loading || schedulerRunning} variant="outline">
                    ⏰ {schedulerRunning ? 'Running' : 'Start Scheduler'}
                  </Button>
                  <Button onClick={loadSummary} disabled={loading} variant="ghost">
                    🔄 Refresh
                  </Button>
                </div>
              </CardContent>
            </Card>

            {status && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center space-x-2">
                    <div className="text-lg">{loading ? '⏳' : '💬'}</div>
                    <div className="text-gray-800">{status}</div>
                  </div>
                </CardContent>
              </Card>
            )}
          </TabsContent>
          
          <TabsContent value="pending" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Pending Data to Sync</CardTitle>
              </CardHeader>
              <CardContent>
                {summary ? (
                  <div className="space-y-4">
                    <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                      <span>Indicators pending sync</span>
                      <span className="font-bold text-orange-600">{summary.indicators.unsynced}</span>
                    </div>
                    <div className="flex justify-between items-center p-4 bg-orange-50 rounded-lg">
                      <span>Line list records pending sync</span>
                      <span className="font-bold text-orange-600">{summary.lineList.unsynced}</span>
                    </div>
                    <Button onClick={handleSync} disabled={loading} className="w-full">
                      Sync All Pending Data
                    </Button>
                  </div>
                ) : (
                  <div className="text-center py-8">Loading pending data...</div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="history" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Sync History</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8 text-gray-500">
                  Sync history will be displayed here
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}