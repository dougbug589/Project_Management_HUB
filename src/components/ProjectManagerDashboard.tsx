"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Loader } from "./ui/Loader"

type Project = {
  id: string
  name: string
  status: string
}

type Task = {
  id: string
  title: string
  status: string
  priority: string
  dueDate?: string
  projectId: string
}

type Milestone = {
  id: string
  title: string
  dueDate: string
  status: string
  projectId: string
}

type TeamMember = {
  id: string
  name: string
  role: string
  taskCount: number
}

export function ProjectManagerDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      const [projectsRes, tasksRes, milestonesRes, teamRes] = await Promise.all([
        fetch("/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/milestones", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/teams", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      
      const projectsData = await projectsRes.json()
      const tasksData = await tasksRes.json()
      const milestonesData = await milestonesRes.json()
      const teamData = await teamRes.json()
      
      if (projectsData.success) setProjects(projectsData.data)
      if (tasksData.success) setTasks(tasksData.data)
      if (milestonesData.success) setMilestones(milestonesData.data)
      if (teamData.success) setTeamMembers(teamData.data)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader />

  // Calculate project progress for each project
  const projectProgress = projects.map((project) => {
    const projectTasks = tasks.filter((t) => t.projectId === project.id)
    const completedTasks = projectTasks.filter((t) => t.status === "DONE").length
    const progress = projectTasks.length > 0 ? Math.round((completedTasks / projectTasks.length) * 100) : 0
    return { ...project, progress, totalTasks: projectTasks.length, completedTasks }
  })

  // Calculate overdue tasks
  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === "DONE") return false
    return new Date(t.dueDate) < new Date()
  })

  // Milestone status
  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter((m) => m.status === "COMPLETED").length
  const inProgressMilestones = totalMilestones - completedMilestones

  // Team workload
  const avgTasksPerMember = teamMembers.length > 0 
    ? Math.round(tasks.length / teamMembers.length)
    : 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Project Manager Dashboard</h2>
      
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {projects.filter((p) => p.status === "IN_PROGRESS").length}
            </div>
            <p className="text-xs text-gray-400 mt-2">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${overdueTasks.length > 0 ? "text-red-400" : "text-green-400"}`}>
              {overdueTasks.length}
            </div>
            <p className="text-xs text-gray-400 mt-2">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Milestones On Track</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{inProgressMilestones}</div>
            <p className="text-xs text-gray-400 mt-2">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Avg Tasks/Member</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-orange-400">{avgTasksPerMember}</div>
            <p className="text-xs text-gray-400 mt-2">Team workload</p>
          </CardContent>
        </Card>
      </div>

      {/* Project Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Project Progress Overview</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {projectProgress.slice(0, 5).map((project) => (
              <div key={project.id}>
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <span className="text-sm font-medium text-white">{project.name}</span>
                    <span className="text-xs text-gray-400 ml-2">({project.completedTasks}/{project.totalTasks})</span>
                  </div>
                  <span className="text-sm font-bold text-blue-400">{project.progress}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2.5">
                  <div
                    className="bg-gradient-to-r from-blue-600 to-blue-400 h-2.5 rounded-full transition-all"
                    style={{ width: `${project.progress}%` }}
                  ></div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Milestones Status */}
        <Card>
          <CardHeader>
            <CardTitle>Milestones Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="text-center">
                  <div className="text-2xl font-bold text-white">{totalMilestones}</div>
                  <p className="text-xs text-gray-400">Total</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-green-400">{completedMilestones}</div>
                  <p className="text-xs text-gray-400">Completed</p>
                </div>
                <div className="text-center">
                  <div className="text-2xl font-bold text-blue-400">{inProgressMilestones}</div>
                  <p className="text-xs text-gray-400">In Progress</p>
                </div>
              </div>
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-400">Completion Rate</span>
                  <span className="text-sm font-bold text-white">
                    {totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{ width: `${totalMilestones > 0 ? (completedMilestones / totalMilestones) * 100 : 0}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Team Workload */}
        <Card>
          <CardHeader>
            <CardTitle>Team Workload</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {teamMembers.slice(0, 5).map((member) => (
                <div key={member.id} className="flex items-center justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white">{member.name}</p>
                    <p className="text-xs text-gray-400">{member.role}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="bg-gray-700 rounded px-2 py-1">
                      <span className="text-sm font-bold text-blue-400">{member.taskCount}</span>
                    </div>
                    <span className="text-xs text-gray-400">tasks</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Overdue Tasks Alert */}
      {overdueTasks.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle className="text-red-400">⚠️ Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {overdueTasks.slice(0, 5).map((task) => (
                <div key={task.id} className="p-2 bg-red-900/20 border border-red-700 rounded text-sm">
                  <p className="text-red-400 font-medium">{task.title}</p>
                  <p className="text-xs text-gray-400">Priority: {task.priority}</p>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
