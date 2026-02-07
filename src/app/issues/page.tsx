"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input, Select, Textarea } from "@/components/ui/Form"
import { formatDate } from "@/lib/utils"
import { Bug, Plus, X, FileText, Filter, Search, FolderKanban, User, Calendar } from "lucide-react"

export default function IssuesPage() {
  const [issues, setIssues] = useState<any[]>([])
  const [projects, setProjects] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [filterStatus, setFilterStatus] = useState("")
  const [filterProject, setFilterProject] = useState("")
  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: "",
    severity: "MEDIUM",
    priority: "MEDIUM",
    status: "OPEN",
  })

  useEffect(() => {
    fetchIssues()
    fetchProjects()
  }, [filterStatus, filterProject])

  const fetchIssues = async () => {
    try {
      const token = localStorage.getItem("token")
      let url = "/api/issues?"
      if (filterStatus) url += `status=${filterStatus}&`
      if (filterProject) url += `projectId=${filterProject}&`
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setIssues(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch issues:", error)
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
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const handleCreate = async () => {
    if (!form.title || !form.projectId) {
      alert("Title and project are required")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/issues", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setIsCreating(false)
        setForm({
          title: "",
          description: "",
          projectId: "",
          severity: "MEDIUM",
          priority: "MEDIUM",
          status: "OPEN",
        })
        fetchIssues()
      } else {
        alert("Failed to create issue")
      }
    } catch (error) {
      console.error("Create issue error:", error)
      alert("Failed to create issue")
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Bug className="w-10 h-10 text-red-500" />
              Issues
            </h1>
            <p className="text-gray-400">Track and resolve project issues</p>
          </div>
          <Button 
            variant={isCreating ? "secondary" : "primary"} 
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2"
          >
            {isCreating ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Report Issue</>}
          </Button>
        </div>
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" /> Report New Issue
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Title"
                value={form.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })}
                required
              />
              <Textarea
                label="Description"
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
              <Select
                label="Project"
                value={form.projectId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, projectId: e.target.value })}
                required
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </Select>
              <div className="grid grid-cols-2 gap-4">
                <Select
                  label="Severity"
                  value={form.severity}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, severity: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="CRITICAL">Critical</option>
                </Select>
                <Select
                  label="Priority"
                  value={form.priority}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, priority: e.target.value })}
                >
                  <option value="LOW">Low</option>
                  <option value="MEDIUM">Medium</option>
                  <option value="HIGH">High</option>
                  <option value="URGENT">Urgent</option>
                </Select>
              </div>
              <Button variant="primary" onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Report Issue
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" /> Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="flex gap-4">
            <Select
              label="Status"
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="OPEN">Open</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="RESOLVED">Resolved</option>
              <option value="CLOSED">Closed</option>
            </Select>
            <Select
              label="Project"
              value={filterProject}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterProject(e.target.value)}
            >
              <option value="">All Projects</option>
              {projects.map((p) => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : issues.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No issues found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {issues.map((issue: any) => (
              <Link key={issue.id} href={`/issues/${issue.id}`}>
                <Card className="hover:border-blue-500 transition-colors cursor-pointer">
                  <CardContent className="py-4">
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-white">{issue.title}</h3>
                        {issue.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{issue.description}</p>
                        )}
                        <div className="flex gap-4 mt-2 text-sm text-gray-500">
                          <span className="flex items-center gap-1">
                            <FolderKanban className="w-4 h-4" /> {issue.project?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <User className="w-4 h-4" /> {issue.reporter?.name}
                          </span>
                          <span className="flex items-center gap-1">
                            <Calendar className="w-4 h-4" /> {formatDate(issue.createdAt)}
                          </span>
                        </div>
                      </div>
                      <div className="flex flex-col gap-2 ml-4">
                        <span
                          className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                            issue.severity === "CRITICAL"
                              ? "bg-red-600"
                              : issue.severity === "HIGH"
                              ? "bg-orange-600"
                              : issue.severity === "MEDIUM"
                              ? "bg-yellow-600"
                              : "bg-gray-600"
                          }`}
                        >
                          {issue.severity}
                        </span>
                        <span
                          className={`px-3 py-1 rounded text-xs font-medium ${
                            issue.status === "RESOLVED"
                              ? "bg-green-600 text-white"
                              : issue.status === "IN_PROGRESS"
                              ? "bg-blue-600 text-white"
                              : "bg-gray-600 text-white"
                          }`}
                        >
                          {issue.status}
                        </span>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
