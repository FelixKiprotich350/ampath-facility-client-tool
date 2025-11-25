'use client'

import { useState, useEffect } from 'react'
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'

interface IndicatorType {
  id: number
  name: string
  description: string | null
  query: string
  source: string
  apiUrl: string | null
  active: boolean
}

export function IndicatorTypesPage() {
  const [indicatorTypes, setIndicatorTypes] = useState<IndicatorType[]>([])
  const [loading, setLoading] = useState(false)
  const [showForm, setShowForm] = useState(false)

  useEffect(() => {
    loadIndicatorTypes()
  }, [])

  const loadIndicatorTypes = async () => {
    try {
      const response = await fetch('/api/indicator-types')
      const data = await response.json()
      setIndicatorTypes(data)
    } catch (error) {
      console.error('Failed to load indicator types:', error)
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setLoading(true)
    
    const formData = new FormData(e.currentTarget)
    const data = {
      name: formData.get('name'),
      description: formData.get('description'),
      query: formData.get('query'),
      source: formData.get('source'),
      apiUrl: formData.get('apiUrl')
    }

    try {
      const response = await fetch('/api/indicator-types', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      })

      if (response.ok) {
        setShowForm(false)
        loadIndicatorTypes()
        e.currentTarget.reset()
      }
    } catch (error) {
      console.error('Failed to create indicator type:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="flex items-center gap-2">
              <span className="text-xl">📊</span> Indicator Types
            </span>
            <Button onClick={() => setShowForm(!showForm)}>
              {showForm ? '❌ Cancel' : '➕ Add Indicator Type'}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {showForm && (
            <form onSubmit={handleSubmit} className="space-y-4 mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input name="name" required className="w-full px-3 py-2 border border-gray-300 rounded-md" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Source</label>
                  <select name="source" required className="w-full px-3 py-2 border border-gray-300 rounded-md">
                    <option value="database">Database Query</option>
                    <option value="api">API Endpoint</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <input name="description" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Query/API URL</label>
                <textarea name="query" required className="w-full px-3 py-2 border border-gray-300 rounded-md h-24" 
                  placeholder="SQL query for database source or API URL for API source" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API URL (if source is API)</label>
                <input name="apiUrl" className="w-full px-3 py-2 border border-gray-300 rounded-md" />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? '⏳ Creating...' : '💾 Create Indicator Type'}
              </Button>
            </form>
          )}

          <div className="space-y-4">
            {Array.isArray(indicatorTypes) && indicatorTypes.map((type) => (
              <div key={type.id} className="p-4 border rounded-lg">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{type.name}</h3>
                    {type.description && <p className="text-sm text-gray-600 mt-1">{type.description}</p>}
                    <div className="mt-2 space-y-1">
                      <p className="text-xs text-gray-500">
                        <span className="font-medium">Source:</span> {type.source}
                      </p>
                      {type.source === 'api' && type.apiUrl && (
                        <p className="text-xs text-gray-500">
                          <span className="font-medium">API URL:</span> {type.apiUrl}
                        </p>
                      )}
                      <p className="text-xs text-gray-500 font-mono bg-gray-100 p-2 rounded">
                        {type.query}
                      </p>
                    </div>
                  </div>
                  <span className={`px-2 py-1 text-xs rounded-full ${
                    type.active ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {type.active ? '✅ Active' : '❌ Inactive'}
                  </span>
                </div>
              </div>
            ))}
            {(!Array.isArray(indicatorTypes) || indicatorTypes.length === 0) && (
              <div className="text-center py-8 text-gray-500">
                No indicator types configured yet
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  )
}