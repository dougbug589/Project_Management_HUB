"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tabs } from "@/components/ui/Tabs"
import { formatDate } from "@/lib/utils"
import { AdminDashboard, MemberDashboard, NotificationsList } from "@/components/DashboardWidgets"
import { ProjectManagerDashboard } from "@/components/ProjectManagerDashboard"
import { TeamLeadDashboard } from "@/components/TeamLeadDashboard"
import { TimerWidget } from "@/components/TimerWidget"
import { isAdminRole, canViewReports } from "@/lib/rbac-ui"
import { LayoutDashboard, BarChart3, FolderKanban, Bell, Plus, FolderOpen, Rocket, CheckCircle, Users } from "lucide-react"

interface Project {
  id: string
  name: string
  description?: string
  status: string
  createdAt: string
  _count: {
    tasks: number
    teams: number
  }
}

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [activeTab, setActiveTab] = useState("overview")

  useEffect(() => {
    // Get user from localStorage
    const userData = localStorage.getItem("user")
    if (userData) {
      setUser(JSON.parse(userData))
    }

    // Fetch projects
    fetchProjects()
  }, [])

  const fetchProjects = async () => {
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setProjects(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <LayoutDashboard className="w-10 h-10 text-blue-500" />
            Dashboard
          </h1>
          <p className="text-gray-400">Welcome back! Here's your project overview</p>
        </div>
        <div className="mb-6">
          <Tabs
            tabs={[
              { id: "overview", label: "Overview", icon: <BarChart3 className="w-4 h-4" /> },
              { id: "projects", label: "Projects", icon: <FolderKanban className="w-4 h-4" /> },
              { id: "notifications", label: "Notifications", icon: <Bell className="w-4 h-4" /> },
            ]}
            value={activeTab}
            onChange={setActiveTab}
          />
        </div>

        {activeTab === "overview" && (
          <div className="space-y-8">
            {isAdminRole(user?.role) ? (
              <AdminDashboard />
            ) : user?.role === "PROJECT_MANAGER" ? (
              <ProjectManagerDashboard />
            ) : user?.role === "TEAM_LEAD" ? (
              <TeamLeadDashboard />
            ) : (
              <MemberDashboard />
            )}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div>
                <TimerWidget />
              </div>
              <div>
                <NotificationsList />
              </div>
            </div>
          </div>
        )}

        {activeTab === "projects" && (
          <div>
            <div className="flex justify-between items-center mb-8">
              <h2 className="text-4xl font-bold text-white">
                Your Projects
              </h2>
              <Link href="/projects/create">
                <Button variant="primary" size="lg" className="flex items-center gap-2">
                  <Plus className="w-5 h-5" /> Create Project
                </Button>
              </Link>
            </div>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-64 bg-gray-800 rounded-xl animate-pulse"></div>
                ))}
              </div>
            ) : projects.length === 0 ? (
              <Card className="text-center py-16">
                <CardContent>
                  <FolderOpen className="w-16 h-16 mx-auto mb-4 text-gray-600" />
                  <p className="text-xl text-gray-400 mb-6">No projects yet</p>
                  <Link href="/projects/create">
                    <Button variant="primary" size="lg" className="flex items-center gap-2">
                      <Rocket className="w-5 h-5" /> Create Your First Project
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {projects.map((project, index) => (
                  <Link key={project.id} href={`/projects/${project.id}`}>
                    <Card 
                      className="h-full group hover:border-blue-500 transition-colors"
                    >
                      <CardHeader>
                        <CardTitle className="text-xl">
                          {project.name}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {project.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex justify-between items-center text-sm font-medium">
                          <span className="flex items-center gap-1 text-blue-400">
                            <CheckCircle className="w-4 h-4" /> {project._count.tasks} tasks
                          </span>
                          <span className="flex items-center gap-1 text-purple-400">
                            <Users className="w-4 h-4" /> {project._count.teams} teams
                          </span>
                        </div>
                        <div className="flex justify-between items-center pt-2 border-t border-gray-700">
                          <span className="text-xs text-gray-400">
                            {formatDate(project.createdAt)}
                          </span>
                          <span
                            className={`px-3 py-1 rounded-full text-xs font-semibold ${
                              project.status === "ACTIVE"
                                ? "bg-green-600 text-white"
                                : "bg-gray-600 text-white"
                            }`}
                          >
                            {project.status}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}

        {activeTab === "notifications" && (
          <div className="max-w-2xl mx-auto">
            <NotificationsList />
          </div>
        )}
      </main>
    </div>
  )
}
