"use client"

import { useState, useEffect, useCallback } from "react"
import AppLayout from "@/components/AppLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

interface ActivityLog {
  id: string
  action: string
  description: string
  userId: string
  userName: string
  timestamp: string
  entityType?: string
  entityId?: string
}

export default function ActivityLogsPage() {
  const [logs, setLogs] = useState<ActivityLog[]>([])
  const [loading, setLoading] = useState(true)
  const [filters, setFilters] = useState({
    action: "",
    userId: "",
    startDate: "",
    endDate: "",
  })


  const loadActivityLogs = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (filters.action) params.append("action", filters.action)
      if (filters.userId) params.append("userId", filters.userId)
      if (filters.startDate) params.append("startDate", filters.startDate)
      if (filters.endDate) params.append("endDate", filters.endDate)

      const response = await fetch(`/api/activity-logs?${params.toString()}`)
      const data = await response.json()
      if (data.success) {
        setLogs(data.data || [])
      }
    } catch (error) {
      console.error("Failed to load activity logs:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLoadActivityLogs = useCallback(async () => {
    await loadActivityLogs()
  }, [loadActivityLogs])

  useEffect(() => {
    handleLoadActivityLogs()
  }, [handleLoadActivityLogs])

  const handleFilterChange = (key: string, value: string) => {
    setFilters((prev) => ({ ...prev, [key]: value }))
  }

  const handleApplyFilters = () => {
    loadActivityLogs()
  }

  const handleClearFilters = () => {
    setFilters({
      action: "",
      userId: "",
      startDate: "",
      endDate: "",
    })
  }

  const getActionColor = (action: string) => {
    const colors: Record<string, string> = {
      CREATE: "bg-green-100 text-green-800",
      UPDATE: "bg-blue-100 text-blue-800",
      DELETE: "bg-red-100 text-red-800",
      ASSIGN: "bg-purple-100 text-purple-800",
      COMMENT: "bg-yellow-100 text-yellow-800",
      COMPLETE: "bg-emerald-100 text-emerald-800",
    }
    return colors[action] || "bg-gray-100 text-gray-800"
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold">Activity Audit Log</h1>
        </div>

        {/* Filters */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-semibold mb-4">Filters</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">Action</label>
              <input
                type="text"
                placeholder="CREATE, UPDATE, DELETE..."
                value={filters.action}
                onChange={(e) => handleFilterChange("action", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">User ID</label>
              <input
                type="text"
                placeholder="User ID"
                value={filters.userId}
                onChange={(e) => handleFilterChange("userId", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange("startDate", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange("endDate", e.target.value)}
                className="w-full border rounded px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div className="flex gap-3 mt-4">
            <Button onClick={handleApplyFilters} className="bg-blue-600 hover:bg-blue-700 text-white">
              Apply Filters
            </Button>
            <Button onClick={handleClearFilters} className="bg-gray-300 hover:bg-gray-400 text-gray-800">
              Clear
            </Button>
          </div>
        </Card>

        {/* Activity Logs Table */}
        <Card className="p-6 bg-white overflow-x-auto">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-gray-500">Loading activity logs...</div>
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-8">
              <div className="text-gray-500">No activity logs found</div>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left font-semibold py-3 px-4">Timestamp</th>
                  <th className="text-left font-semibold py-3 px-4">Action</th>
                  <th className="text-left font-semibold py-3 px-4">User</th>
                  <th className="text-left font-semibold py-3 px-4">Description</th>
                  <th className="text-left font-semibold py-3 px-4">Entity Type</th>
                </tr>
              </thead>
              <tbody>
                {logs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-3 px-4 text-gray-600">
                      {new Date(log.timestamp).toLocaleString()}
                    </td>
                    <td className="py-3 px-4">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-semibold ${getActionColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="py-3 px-4">{log.userName}</td>
                    <td className="py-3 px-4 text-gray-700">{log.description}</td>
                    <td className="py-3 px-4 text-gray-600">{log.entityType || "-"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
