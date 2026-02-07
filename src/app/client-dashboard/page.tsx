"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

interface ClientProject {
  id: string
  name: string
  description: string
  status: string
  startDate: string
  endDate: string
  progress: number
  manager: {
    name: string
    email: string
  }
  tasks: Array<{
    id: string
    title: string
    status: string
    priority: string
  }>
  milestones: Array<{
    id: string
    title: string
    status: string
    dueDate: string
  }>
  reports: Array<{
    id: string
    type: string
    format: string
    status: string
    fileUrl?: string | null
    createdAt: string
  }>
}

export default function ClientDashboardPage() {
  const router = useRouter()
  const [projects, setProjects] = useState<ClientProject[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedProjectId, setSelectedProjectId] = useState<string | null>(null)
  const [clientName, setClientName] = useState("Client")

  useEffect(() => {
    // Check authentication
    const clientToken = localStorage.getItem("clientToken")
    const clientId = localStorage.getItem("clientId")

    if (!clientToken || !clientId) {
      router.push("/client-login")
      return
    }

    loadProjects()
  }, [router])

  const loadProjects = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/client-dashboard", {
        headers: {
          Authorization: `Bearer ${localStorage.getItem("clientToken")}`,
        },
      })

      const data = await response.json()
      if (data.success) {
        setProjects(data.data.projects || [])
        setClientName(data.data.clientName || "Client")
      }
    } catch (error) {
      console.error("Failed to load projects:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem("clientToken")
    localStorage.removeItem("clientId")
    router.push("/client-login")
  }

  const selectedProject = projects.find((p) => p.id === selectedProjectId)

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PLANNING: "bg-blue-900/50 text-blue-300 border border-blue-700",
      IN_PROGRESS: "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
      COMPLETED: "bg-green-900/50 text-green-300 border border-green-700",
      ON_HOLD: "bg-red-900/50 text-red-300 border border-red-700",
      ARCHIVED: "bg-gray-700/50 text-gray-300 border border-gray-600",
      TODO: "bg-gray-700/50 text-gray-300 border border-gray-600",
      DONE: "bg-green-900/50 text-green-300 border border-green-700",
    }
    return colors[status] || "bg-gray-700/50 text-gray-300 border border-gray-600"
  }

  const getPriorityColor = (priority: string) => {
    const colors: Record<string, string> = {
      LOW: "bg-blue-900/50 text-blue-300 border border-blue-700",
      MEDIUM: "bg-yellow-900/50 text-yellow-300 border border-yellow-700",
      HIGH: "bg-orange-900/50 text-orange-300 border border-orange-700",
      CRITICAL: "bg-red-900/50 text-red-300 border border-red-700",
    }
    return colors[priority] || "bg-gray-700/50 text-gray-300 border border-gray-600"
  }

  return (
    <div className="min-h-screen bg-gray-900">
      {/* Header */}
      <div className="bg-gray-800 shadow-lg border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6 sm:px-6 lg:px-8 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-white">My Projects</h1>
            <p className="text-gray-400 text-sm mt-1">Welcome, {clientName}</p>
          </div>
          <Button
            onClick={handleLogout}
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Logout
          </Button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8 sm:px-6 lg:px-8">
        {loading ? (
          <div className="text-center py-12 text-gray-400">Loading your projects...</div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Projects List */}
            <div className="lg:col-span-1">
              <Card className="p-4 bg-gray-800 border border-gray-700 sticky top-4">
                <h2 className="font-semibold text-lg mb-4 text-white">Projects</h2>
                {projects.length === 0 ? (
                  <div className="text-center py-8 text-gray-400 text-sm">
                    No projects assigned
                  </div>
                ) : (
                  <div className="space-y-2">
                    {projects.map((project) => (
                      <button
                        key={project.id}
                        onClick={() => setSelectedProjectId(project.id)}
                        className={`w-full text-left p-3 rounded border-2 transition ${
                          selectedProjectId === project.id
                            ? "border-blue-500 bg-blue-900/30"
                            : "border-gray-600 hover:border-gray-500 bg-gray-700"
                        }`}
                      >
                        <h3 className="font-semibold text-sm truncate text-white">{project.name}</h3>
                        <p className="text-xs text-gray-400 mt-1">
                          {project.tasks.length} tasks
                        </p>
                      </button>
                    ))}
                  </div>
                )}
              </Card>
            </div>

            {/* Project Detail */}
            <div className="lg:col-span-3">
              {selectedProject ? (
                <div className="space-y-6">
                  {/* Project Header */}
                  <Card className="p-6 bg-gray-800 border border-gray-700">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h2 className="text-3xl font-bold text-white">{selectedProject.name}</h2>
                        <p className="text-gray-400 mt-2">{selectedProject.description}</p>
                      </div>
                      <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(selectedProject.status)}`}>
                        {selectedProject.status}
                      </span>
                    </div>

                    {/* Project Metadata */}
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-gray-700">
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Start Date</p>
                        <p className="text-sm font-semibold mt-1 text-gray-200">
                          {new Date(selectedProject.startDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">End Date</p>
                        <p className="text-sm font-semibold mt-1 text-gray-200">
                          {new Date(selectedProject.endDate).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Progress</p>
                        <p className="text-sm font-semibold mt-1 text-gray-200">{selectedProject.progress}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-gray-500 uppercase">Manager</p>
                        <p className="text-sm font-semibold mt-1 text-gray-200">{selectedProject.manager.name}</p>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="mt-6">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-semibold text-gray-400">Project Progress</p>
                        <p className="text-sm font-semibold text-white">{selectedProject.progress}%</p>
                      </div>
                      <div className="w-full bg-gray-700 rounded-full h-3">
                        <div
                          className="bg-blue-600 h-3 rounded-full transition-all"
                          style={{ width: `${selectedProject.progress}%` }}
                        ></div>
                      </div>
                    </div>
                  </Card>

                  {/* Milestones */}
                  <Card className="p-6 bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-white">Milestones</h3>
                    {selectedProject.milestones.length === 0 ? (
                      <p className="text-gray-400 text-sm">No milestones defined</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedProject.milestones.map((milestone) => (
                          <div
                            key={milestone.id}
                            className="flex items-start justify-between p-3 bg-gray-700 rounded border border-gray-600"
                          >
                            <div>
                              <h4 className="font-semibold text-white">{milestone.title}</h4>
                              <p className="text-sm text-gray-400 mt-1">
                                Due: {new Date(milestone.dueDate).toLocaleDateString()}
                              </p>
                            </div>
                            <span className={`px-3 py-1 rounded text-xs font-semibold whitespace-nowrap ${getStatusColor(milestone.status)}`}>
                              {milestone.status}
                            </span>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Reports */}
                  <Card className="p-6 bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-white">Reports</h3>
                    {selectedProject.reports.length === 0 ? (
                      <p className="text-gray-400 text-sm">No reports available</p>
                    ) : (
                      <div className="space-y-3">
                        {selectedProject.reports.map((report) => (
                          <div
                            key={report.id}
                            className="flex items-center justify-between p-3 bg-gray-700 rounded border border-gray-600"
                          >
                            <div>
                              <h4 className="font-semibold text-white">
                                {report.type.replace(/_/g, " ")}
                              </h4>
                              <p className="text-sm text-gray-400 mt-1">
                                {report.format} · {new Date(report.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                            <div className="flex items-center gap-3">
                              <span className="px-3 py-1 rounded text-xs font-semibold bg-gray-800 text-gray-300 border border-gray-600">
                                {report.status}
                              </span>
                              {report.fileUrl && (
                                <a
                                  href={report.fileUrl}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="text-xs text-blue-300 hover:text-blue-200"
                                >
                                  Download
                                </a>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </Card>

                  {/* Tasks */}
                  <Card className="p-6 bg-gray-800 border border-gray-700">
                    <h3 className="text-lg font-semibold mb-4 text-white">Tasks ({selectedProject.tasks.length})</h3>
                    {selectedProject.tasks.length === 0 ? (
                      <p className="text-gray-400 text-sm">No tasks assigned</p>
                    ) : (
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                          <thead>
                            <tr className="border-b border-gray-600">
                              <th className="text-left py-2 px-3 font-semibold text-gray-300">Task</th>
                              <th className="text-left py-2 px-3 font-semibold text-gray-300">Status</th>
                              <th className="text-left py-2 px-3 font-semibold text-gray-300">Priority</th>
                            </tr>
                          </thead>
                          <tbody>
                            {selectedProject.tasks.map((task) => (
                              <tr key={task.id} className="border-b border-gray-700 hover:bg-gray-700/50">
                                <td className="py-3 px-3 font-medium text-white">
                                  {task.title}
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-3 py-1 rounded text-xs font-semibold ${getStatusColor(task.status)}`}>
                                    {task.status}
                                  </span>
                                </td>
                                <td className="py-3 px-3">
                                  <span className={`px-3 py-1 rounded text-xs font-semibold ${getPriorityColor(task.priority)}`}>
                                    {task.priority}
                                  </span>
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    )}
                  </Card>
                </div>
              ) : (
                <Card className="p-12 bg-gray-800 border border-gray-700 flex items-center justify-center">
                  <div className="text-center text-gray-400">
                    {projects.length === 0 ? (
                      <p>No projects assigned to you</p>
                    ) : (
                      <p>Select a project to view details</p>
                    )}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
