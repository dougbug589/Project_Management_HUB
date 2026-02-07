"use client"

import { useEffect, useState } from "react"
import Link from "next/link"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input, Select, Textarea } from "@/components/ui/Form"
import { MultiSelect } from "@/components/ui/MultiSelect"
import { formatDate } from "@/lib/utils"
import { CheckSquare, Plus, X, FileText, FolderKanban, User, Calendar, Filter } from "lucide-react"

interface Task {
  id: string
  title: string
  description?: string
  status: string
  priority: string
  dueDate?: string | null
  project: {
    name: string
  }
  assignees: {
    user: {
      name: string
    }
  }[]
}

function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [filterPriority, setFilterPriority] = useState("")
  const [isCreating, setIsCreating] = useState(false)
  const [projects, setProjects] = useState<{ id: string; name: string }[]>([])
  const [users, setUsers] = useState<{ id: string; name: string }[]>([])
  const [form, setForm] = useState({
    title: "",
    description: "",
    projectId: "",
    status: "TODO",
    priority: "MEDIUM",
    dueDate: "",
    assigneeIds: [] as string[],
  })

  useEffect(() => {
    fetchTasks()
    fetchProjects()
    fetchUsers()
  }, [filterStatus, filterPriority])
  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setUsers(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }

  const fetchTasks = async () => {
    try {
      const token = localStorage.getItem("token")
      let url = "/api/tasks?"
      if (filterStatus) url += `status=${filterStatus}&`
      if (filterPriority) url += `priority=${filterPriority}&`
      
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTasks(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
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
      const body = { ...form, assigneeIds: form.assigneeIds }
      const res = await fetch("/api/tasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(body),
      })

      if (res.ok) {
        setIsCreating(false)
        setForm({
          title: "",
          description: "",
          projectId: "",
          status: "TODO",
          priority: "MEDIUM",
          dueDate: "",
          assigneeIds: [],
        })
        fetchTasks()
      } else {
        const data = await res.json()
        alert(data.message || "Failed to create task")
      }
    } catch (error) {
      console.error("Create task error:", error)
      alert("Failed to create task")
    }

  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <CheckSquare className="w-10 h-10 text-blue-500" />
              Tasks
            </h1>
            <p className="text-gray-400">Manage your task workflow</p>
          </div>
          <Button 
            variant={isCreating ? "secondary" : "primary"} 
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2"
          >
            {isCreating ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> Create Task</>}
          </Button>
        </div>
        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Create New Task
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
              <Input
                label="Title"
                value={form.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })}
                placeholder="Enter task title"
                required
              />
              <Textarea
                label="Description"
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe the task..."
                rows={3}
              />
              <Select
                label="Project"
                value={form.projectId}
                onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, projectId: e.target.value })}
                required
              >
                <option value="">Select project</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </Select>
              <MultiSelect
                label="Assignees"
                values={form.assigneeIds}
                options={users.map((u) => ({ label: u.name, value: u.id }))}
                placeholder="Select team members"
                onChange={(assigneeIds) => setForm({ ...form, assigneeIds })}
              />
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="TODO">To Do</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="IN_REVIEW">In Review</option>
                  <option value="DONE">Done</option>
                  <option value="BLOCKED">Blocked</option>
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
              <Input
                label="Due Date"
                type="date"
                value={form.dueDate}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, dueDate: e.target.value })}
              />
              <Button variant="primary" size="lg" onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Task
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Select
              label="Status"
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="TODO">To Do</option>
              <option value="IN_PROGRESS">In Progress</option>
              <option value="IN_REVIEW">In Review</option>
              <option value="DONE">Done</option>
              <option value="BLOCKED">Blocked</option>
            </Select>
            <Select
              label="Priority"
              value={filterPriority}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterPriority(e.target.value)}
            >
              <option value="">All Priorities</option>
              <option value="LOW">Low</option>
              <option value="MEDIUM">Medium</option>
              <option value="HIGH">High</option>
              <option value="URGENT">Urgent</option>
            </Select>
          </CardContent>
        </Card>

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : tasks.length === 0 ? (
          <Card className="text-center py-16">
            <CardContent>
              <CheckSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-xl text-gray-400 mb-2">No tasks found</p>
              <p className="text-sm text-gray-500">Create your first task to get started!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {tasks.map((task) => (
              <Link key={task.id} href={`/tasks/${task.id}`}>
                <Card className="group hover:border-blue-500 transition-colors">
                  <CardContent className="py-5">
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1 space-y-2">
                        <h3 className="text-xl font-bold text-white group-hover:text-blue-400 transition-colors">
                          {task.title}
                        </h3>
                        {task.description && (
                          <p className="text-sm text-gray-400 line-clamp-2">{task.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span className="flex items-center gap-1 text-blue-400 font-medium">
                            <FolderKanban className="w-4 h-4" /> {task.project.name}
                          </span>
                          {task.assignees.length > 0 && (
                            <span className="flex items-center gap-1 text-purple-400">
                              <User className="w-4 h-4" /> {task.assignees.map((a) => a.user.name).join(", ")}
                            </span>
                          )}
                          {task.dueDate && (
                            <span className="flex items-center gap-1 text-gray-400">
                              <Calendar className="w-4 h-4" /> {formatDate(task.dueDate)}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="flex flex-col gap-2">
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            task.priority === "URGENT"
                              ? "bg-red-600 text-white"
                              : task.priority === "HIGH"
                              ? "bg-orange-600 text-white"
                              : task.priority === "MEDIUM"
                              ? "bg-yellow-600 text-white"
                              : "bg-gray-600 text-white"
                          }`}
                        >
                          {task.priority}
                        </span>
                        <span
                          className={`px-3 py-1.5 rounded-full text-xs font-bold ${
                            task.status === "DONE"
                              ? "bg-green-600 text-white"
                              : task.status === "IN_PROGRESS"
                              ? "bg-blue-600 text-white"
                              : task.status === "BLOCKED"
                              ? "bg-red-600 text-white"
                              : "bg-gray-600 text-white"
                          }`}
                        >
                          {task.status.replace("_", " ")}
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

export default TasksPage
