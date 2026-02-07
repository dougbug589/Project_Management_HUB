"use client"

import { useState } from "react"
import { Button } from "./ui/Button"

export function ReportsExport({ projectId }: { projectId: string }) {
  const [reportType, setReportType] = useState("TASK_COMPLETION")
  const [format, setFormat] = useState("CSV")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const handleExport = async () => {
    setLoading(true)
    setError("")
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ projectId, reportType, format }),
      })
      const data = await res.json()
      if (data.success) {
        // Download the content
        const blob = new Blob([data.data.content], { type: "text/plain" })
        const url = URL.createObjectURL(blob)
        const a = document.createElement("a")
        a.href = url
        a.download = `report-${reportType}-${Date.now()}.${format.toLowerCase()}`
        document.body.appendChild(a)
        a.click()
        document.body.removeChild(a)
        URL.revokeObjectURL(url)
      } else {
        setError(data.message || "Export failed")
      }
    } catch (_err) {
      void _err
      setError("Failed to export report")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
      <h3 className="text-lg font-medium mb-4 text-white">Export Reports</h3>
      <div className="space-y-4">
        <div>
          <label className="block text-sm font-medium mb-2">Report Type</label>
          <select
            value={reportType}
            onChange={(e) => setReportType(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="TASK_COMPLETION">Task Completion</option>
            <option value="TIME_UTILIZATION">Time Utilization</option>
            <option value="PROJECT_PROGRESS">Project Progress</option>
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Format</label>
          <select
            value={format}
            onChange={(e) => setFormat(e.target.value)}
            className="w-full px-3 py-2 border rounded-lg"
          >
            <option value="CSV">CSV</option>
            <option value="PDF">PDF (JSON)</option>
          </select>
        </div>
        {error && <div className="text-sm text-red-600">{error}</div>}
        <Button onClick={handleExport} disabled={loading} className="w-full">
          {loading ? "Exporting..." : "Export Report"}
        </Button>
      </div>
    </div>
  )
}
