"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { BarChart3, FileText, Download, Clock, CheckCircle, AlertCircle, RefreshCw, FileBarChart } from "lucide-react"

interface Report {
  id: string
  type: string
  format: string
  status: string
  fileUrl?: string
  createdAt: string
}

interface Project {
  id: string
  name: string
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selectedProject, setSelectedProject] = useState("")
  const [reportType, setReportType] = useState("TASK_COMPLETION")
  const [format, setFormat] = useState("CSV")
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadData = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("Not logged in")
          setLoading(false)
          return
        }

        // Load projects
        const projectsRes = await fetch("/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (projectsRes.ok) {
          const projectsData = await projectsRes.json()
          setProjects(projectsData.data || [])
          if (projectsData.data?.length > 0) {
            setSelectedProject(projectsData.data[0].id)
          }
        }

        setLoading(false)
      } catch (err) {
        void err
        setError("Failed to load data")
        setLoading(false)
      }
    }
    loadData()
  }, [])

  useEffect(() => {
    if (selectedProject) {
      loadReports()
    }
  }, [selectedProject])

  const loadReports = async () => {
    if (!selectedProject) return
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch(`/api/reports?projectId=${selectedProject}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setReports(data.data || [])
      }
    } catch (err) {
      void err
    }
  }

  const handleGenerateReport = async () => {
    if (!selectedProject) {
      setError("Please select a project")
      return
    }

    try {
      setGenerating(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Not logged in")
        return
      }

      const res = await fetch("/api/reports/export", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId: selectedProject,
          reportType,
          format,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        if (data.data?.content) {
          // Download the content as a file
          const mimeType = format === "CSV" ? "text/csv" : format === "JSON" ? "application/json" : "application/pdf"
          const blob = new Blob([data.data.content], { type: mimeType })
          const url = URL.createObjectURL(blob)
          const a = document.createElement("a")
          a.href = url
          a.download = `report-${reportType.toLowerCase()}-${Date.now()}.${format.toLowerCase()}`
          document.body.appendChild(a)
          a.click()
          document.body.removeChild(a)
          URL.revokeObjectURL(url)
        }
        loadReports()
      } else {
        const data = await res.json()
        setError(data.message || "Failed to generate report")
      }
    } catch (err) {
      void err
      setError("Failed to generate report")
    } finally {
      setGenerating(false)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "COMPLETED":
        return <CheckCircle className="w-4 h-4 text-green-500" />
      case "PENDING":
        return <Clock className="w-4 h-4 text-yellow-500" />
      case "FAILED":
        return <AlertCircle className="w-4 h-4 text-red-500" />
      default:
        return <RefreshCw className="w-4 h-4 text-gray-500" />
    }
  }

  const getReportTypeLabel = (type: string) => {
    switch (type) {
      case "TASK_COMPLETION":
        return "Task Completion"
      case "TIME_UTILIZATION":
        return "Time Utilization"
      case "TEAM_PERFORMANCE":
        return "Team Performance"
      default:
        return type
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-gray-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-5xl mx-auto space-y-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <BarChart3 className="w-10 h-10 text-blue-500" />
            Reports
          </h1>
          <p className="text-gray-400">Generate and download project reports</p>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
            {error}
          </div>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileBarChart className="w-5 h-5" /> Generate Report
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Project
                </label>
                <select
                  value={selectedProject}
                  onChange={(e) => setSelectedProject(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select project...</option>
                  {projects.map((project) => (
                    <option key={project.id} value={project.id}>
                      {project.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Report Type
                </label>
                <select
                  value={reportType}
                  onChange={(e) => setReportType(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="TASK_COMPLETION">Task Completion</option>
                  <option value="TIME_UTILIZATION">Time Utilization</option>
                  <option value="TEAM_PERFORMANCE">Team Performance</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Format
                </label>
                <select
                  value={format}
                  onChange={(e) => setFormat(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="CSV">CSV</option>
                  <option value="PDF">PDF</option>
                  <option value="JSON">JSON</option>
                </select>
              </div>
            </div>

            <Button
              variant="primary"
              onClick={handleGenerateReport}
              disabled={generating || !selectedProject}
              className="flex items-center gap-2"
            >
              {generating ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  Generating...
                </>
              ) : (
                <>
                  <Download className="w-4 h-4" />
                  Generate Report
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" /> Report History
            </CardTitle>
          </CardHeader>
          <CardContent>
            {reports.length === 0 ? (
              <p className="text-gray-500 text-center py-8">No reports generated yet.</p>
            ) : (
              <div className="space-y-3">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-4">
                      <FileText className="w-8 h-8 text-blue-500" />
                      <div>
                        <h4 className="font-medium text-white">
                          {getReportTypeLabel(report.type)}
                        </h4>
                        <div className="flex items-center gap-3 text-sm text-gray-400">
                          <span className="flex items-center gap-1">
                            {getStatusIcon(report.status)}
                            {report.status}
                          </span>
                          <span>•</span>
                          <span>{report.format}</span>
                          <span>•</span>
                          <span>{new Date(report.createdAt).toLocaleString()}</span>
                        </div>
                      </div>
                    </div>
                    {report.fileUrl && report.status === "COMPLETED" && (
                      <a
                        href={report.fileUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Download
                      </a>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
