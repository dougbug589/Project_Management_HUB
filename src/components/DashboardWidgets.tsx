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
}

type Notification = {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  createdAt: string
}

type User = {
  id: string
  name: string
  email: string
  role: string
}

type Milestone = {
  id: string
  title: string
  dueDate: string
  status: string
}

export function AdminDashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [users, setUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      const [projectsRes, usersRes] = await Promise.all([
        fetch("/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/users", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      
      const projectsData = await projectsRes.json()
      const usersData = await usersRes.json()
      
      if (projectsData.success) setProjects(projectsData.data)
      if (usersData.success) setUsers(usersData.data)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader />

  const activeProjects = projects.filter((p) => p.status === "IN_PROGRESS").length
  const completedProjects = projects.filter((p) => p.status === "COMPLETED").length
  const projectHealth = projects.length > 0 
    ? Math.round((completedProjects / projects.length) * 100) 
    : 0

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-white">Admin Dashboard</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Total Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{projects.length}</div>
            <p className="text-xs text-gray-400 mt-2">All projects</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Active Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{activeProjects}</div>
            <p className="text-xs text-gray-400 mt-2">In progress</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Completed Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-green-400">{completedProjects}</div>
            <p className="text-xs text-gray-400 mt-2">Finished</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Organization Users</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{users.length}</div>
            <p className="text-xs text-gray-400 mt-2">Total members</p>
          </CardContent>
        </Card>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Overall Project Health</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-gray-400">Completion Rate</span>
              <span className="text-2xl font-bold text-white">{projectHealth}%</span>
            </div>
            <div className="w-full bg-gray-700 rounded-full h-2.5">
              <div
                className="bg-gradient-to-r from-green-600 to-green-400 h-2.5 rounded-full transition-all"
                style={{ width: `${projectHealth}%` }}
              ></div>
            </div>
            <div className="grid grid-cols-2 gap-4 mt-4">
              <div>
                <p className="text-xs text-gray-400">On Track</p>
                <p className="text-lg font-bold text-green-400">{activeProjects}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400">Completed</p>
                <p className="text-lg font-bold text-blue-400">{completedProjects}</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

export function MemberDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [milestones, setMilestones] = useState<Milestone[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      const [tasksRes, milestonesRes, projectsRes] = await Promise.all([
        fetch("/api/tasks?mine=true", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/milestones", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/projects", {
          headers: { Authorization: `Bearer ${token}` },
        }),
      ])
      
      const tasksData = await tasksRes.json()
      const milestonesData = await milestonesRes.json()
      const projectsData = await projectsRes.json()
      
      if (tasksData.success) setTasks(tasksData.data)
      if (milestonesData.success) setMilestones(milestonesData.data)
      if (projectsData.success) setProjects(projectsData.data)
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader />

  const overdueTasks = tasks.filter((t) => {
    if (!t.dueDate || t.status === "DONE") return false
    return new Date(t.dueDate) < new Date()
  }).length

  const totalMilestones = milestones.length
  const completedMilestones = milestones.filter((m) => m.status === "COMPLETED").length
  const progressPercent = totalMilestones > 0 ? Math.round((completedMilestones / totalMilestones) * 100) : 0

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">My Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{tasks.length}</div>
            <p className="text-xs text-gray-400 mt-2">Total assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">
              {tasks.filter((t) => t.status === "IN_PROGRESS").length}
            </div>
            <p className="text-xs text-gray-400 mt-2">Currently working</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Overdue Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${overdueTasks > 0 ? "text-red-400" : "text-green-400"}`}>
              {overdueTasks}
            </div>
            <p className="text-xs text-gray-400 mt-2">Need attention</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">My Projects</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{projects.length}</div>
            <p className="text-xs text-gray-400 mt-2">Active projects</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Project Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {projects.slice(0, 3).map((project) => (
                <div key={project.id}>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm text-gray-300">{project.name}</span>
                    <span className="text-xs font-bold text-blue-400">50%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-blue-500 h-2 rounded-full" style={{ width: "50%" }}></div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Milestones Status</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-400">Total</span>
                <span className="font-bold text-white">{totalMilestones}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Completed</span>
                <span className="font-bold text-green-400">{completedMilestones}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">In Progress</span>
                <span className="font-bold text-blue-400">{totalMilestones - completedMilestones}</span>
              </div>
              <div className="mt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-400">Progress</span>
                  <span className="text-sm font-bold text-white">{progressPercent}%</span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full transition-all"
                    style={{ width: `${progressPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

export function NotificationsList() {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchNotifications()
  }, [])

  const fetchNotifications = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/notifications", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success) setNotifications(data.data)
    } catch (error) {
      console.error("Failed to fetch notifications:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader />

  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Notifications</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {notifications.slice(0, 5).map((notif) => (
            <div
              key={notif.id}
              className={`p-3 rounded-lg border ${
                notif.read ? "bg-gray-800 border-gray-700" : "bg-blue-900/20 border-blue-700"
              }`}
            >
              <div className="font-medium text-sm text-white">{notif.title}</div>
              <div className="text-sm text-gray-400">{notif.message}</div>
            </div>
          ))}
          {notifications.length === 0 && (
            <div className="text-sm text-gray-500">No notifications</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}
