"use client"

import { useEffect, useState } from "react"
import { Dropdown } from "@/components/ui/Dropdown"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { formatDate } from "@/lib/utils"
import { Target, FolderKanban, Calendar, Search } from "lucide-react"

export default function MilestonesPage() {
  const [milestones, setMilestones] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [selectedProjectId, setSelectedProjectId] = useState<string>("")
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjects()
  }, [])

  useEffect(() => {
    if (selectedProjectId) {
      fetchMilestones(selectedProjectId)
    } else {
      setMilestones([])
    }
  }, [selectedProjectId])

  const fetchMilestones = async (projectId: string) => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/milestones?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setMilestones(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch milestones:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setProjects(data.data || [])
        if (data.data && data.data.length > 0) {
          setSelectedProjectId(data.data[0].id)
        }
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Target className="w-10 h-10 text-purple-500" />
            Milestones
          </h1>
          <p className="text-gray-400">Track important project milestones</p>
          <div className="mt-4 max-w-xs">
            <Dropdown
              label="Select Project"
              value={selectedProjectId}
              options={projects.map((p: any) => ({ label: p.name, value: p.id }))}
              onChange={setSelectedProjectId}
              placeholder="Select a project..."
              disabled={projects.length === 0}
            />
          </div>
        </div>
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : milestones.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No milestones found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {milestones.map((milestone: any) => (
              <Card key={milestone.id} className="hover:border-purple-500 transition-colors">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="w-5 h-5 text-purple-500" />
                    <span>{milestone.title}</span>
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {milestone.description && (
                    <p className="text-sm text-gray-400 line-clamp-2">{milestone.description}</p>
                  )}
                  <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <FolderKanban className="w-3 h-3" /> Project
                    </p>
                    <p className="text-sm font-medium text-white">{milestone.project?.name || "N/A"}</p>
                  </div>
                  <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                    <p className="text-xs text-gray-500 flex items-center gap-1">
                      <Calendar className="w-3 h-3" /> Due Date
                    </p>
                    <p className="text-sm font-medium text-white">{formatDate(milestone.dueDate)}</p>
                  </div>
                  <span
                    className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                      milestone.status === "COMPLETED"
                        ? "bg-green-600"
                        : milestone.status === "IN_PROGRESS"
                        ? "bg-blue-600"
                        : "bg-gray-600"
                    }`}
                  >
                    {milestone.status}
                  </span>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
