"use client"

import { useEffect, useState } from "react"
import { useParams } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Loader } from "@/components/ui/Loader"

type Project = {
  id: string
  name: string
  description: string | null
  status: string
  startDate: string | null
  endDate: string | null
}

type Task = {
  id: string
  title: string
  status: string
  priority: string
}

type Milestone = {
  id: string
  title: string
  status: string
  dueDate: string | null
}

export default function ClientProjectView() {
  const params = useParams()
  const projectId = params.id as string
  const [project, setProject] = useState<Project | null>(null)
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchProjectData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId])

  const fetchProjectData = async () => {
    try {
      const token = localStorage.getItem("clientToken")
      const headers = { Authorization: `Bearer ${token}` }

      const [projectRes, tasksRes, milestonesRes] = await Promise.all([
        fetch(`/api/projects/${projectId}`, { headers }),
        fetch(`/api/tasks?projectId=${projectId}`, { headers }),
        fetch(`/api/milestones?projectId=${projectId}`, { headers }),
      ])

      const [projectData, tasksData, milestonesData] = await Promise.all([
        projectRes.json(),
        tasksRes.json(),
        milestonesRes.json(),
      ])

      if (projectData.success) setProject(projectData.data)
      if (tasksData.success) setTasks(tasksData.data)
      if (milestonesData.success) setMilestones(milestonesData.data)
    } catch (error) {
      console.error("Failed to fetch project data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <Loader size={40} />
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-gray-400">Project not found</div>
      </div>
    )
  }

  const completedTasks = tasks.filter((t) => t.status === "DONE").length
  const completedMilestones = milestones.filter((m) => m.status === "COMPLETED").length

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-gray-800 border-b border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-6">
          <h1 className="text-3xl font-bold text-white">{project.name}</h1>
          <p className="text-gray-400 mt-1">Client Portal - Read Only View</p>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 py-8">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Project Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div>
                  <span className="text-sm text-gray-400">Status: </span>
                  <span className="font-medium">{project.status}</span>
                </div>
                {project.description && (
                  <div>
                    <span className="text-sm text-gray-400">Description: </span>
                    <p className="mt-1">{project.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4 pt-3">
                  {project.startDate && (
                    <div>
                      <span className="text-sm text-gray-400">Start Date</span>
                      <div className="font-medium">
                        {new Date(project.startDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                  {project.endDate && (
                    <div>
                      <span className="text-sm text-gray-400">End Date</span>
                      <div className="font-medium">
                        {new Date(project.endDate).toLocaleDateString()}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle>Tasks Progress</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Tasks</span>
                    <span className="text-2xl font-bold">{tasks.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Completed</span>
                    <span className="text-2xl font-bold text-green-600">{completedTasks}</span>
                  </div>
                  <div className="mt-4">
                    <div className="w-full bg-gray-700 rounded-full h-3">
                      <div
                        className="bg-green-600 h-3 rounded-full"
                        style={{
                          width: `${tasks.length > 0 ? (completedTasks / tasks.length) * 100 : 0}%`,
                        }}
                      />
                    </div>
                    <div className="text-sm text-gray-400 mt-1 text-center">
                      {tasks.length > 0
                        ? `${Math.round((completedTasks / tasks.length) * 100)}% Complete`
                        : "No tasks"}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Milestones</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Total Milestones</span>
                    <span className="text-2xl font-bold">{milestones.length}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-gray-400">Completed</span>
                    <span className="text-2xl font-bold text-blue-600">
                      {completedMilestones}
                    </span>
                  </div>
                  <div className="mt-4 space-y-2">
                    {milestones.slice(0, 3).map((m) => (
                      <div
                        key={m.id}
                        className="flex items-center justify-between text-sm p-2 rounded bg-gray-700 border border-gray-600"
                      >
                        <span className="font-medium text-white">{m.title}</span>
                        <span
                          className={`px-2 py-1 rounded text-xs ${
                            m.status === "COMPLETED"
                              ? "bg-green-900/50 text-green-300 border border-green-700"
                              : "bg-yellow-900/50 text-yellow-300 border border-yellow-700"
                          }`}
                        >
                          {m.status}
                        </span>
                      </div>
                    ))}
                    {milestones.length === 0 && (
                      <div className="text-sm text-gray-400">No milestones yet</div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  )
}
