"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Tabs } from "@/components/ui/Tabs"
import { Loader } from "@/components/ui/Loader"
import { ToastContainer, type ToastItem } from "@/components/ui/Toast"
import { Pencil, Trash2 } from "lucide-react"

type Project = {
  id: string
  name: string
  description?: string
  status: string
  startDate?: string
  endDate?: string
  _count?: { tasks?: number; teams?: number }
}

type ProjectTemplate = {
  id: string
  name: string
  description: string
  config: Record<string, any>
}

export default function ProjectsPage() {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState("existing")
  const [projects, setProjects] = useState<Project[]>([])
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [loading, setLoading] = useState(false)
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [toastQueue, setToastQueue] = useState<ToastItem[]>([])

  // Create form state
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    templateId: "",
  })
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [submitting, setSubmitting] = useState(false)

  const showToast = (message: string, type: "success" | "error" = "success") => {
    const id = Date.now().toString()
    setToastQueue((prev) => [...prev, { id, message, type, durationMs: 3000 }])
  }

  const dismissToast = (id: string) => {
    setToastQueue((prev) => prev.filter((t) => t.id !== id))
  }

  // Fetch existing projects
  const fetchProjects = useCallback(async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }
      
      const response = await fetch("/api/projects", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })
      const data = await response.json()
      
      if (!response.ok) {
        // If unauthorized, redirect to login
        if (response.status === 401) {
          router.push("/login")
          return
        }
        throw new Error(data.message || "Failed to fetch projects")
      }
      
      setProjects(data.data || [])
    } catch (error) {
      console.error("Error fetching projects:", error)
      showToast("Failed to load projects", "error")
    } finally {
      setLoading(false)
    }
  }, [router])

  useEffect(() => {
    if (activeTab === "existing") {
      fetchProjects()
    } else if (activeTab === "create") {
      fetchTemplates()
    }
  }, [activeTab, fetchProjects])

  // Fetch templates
  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const response = await fetch("/api/project-templates", {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (response.ok) {
        const data = await response.json()
        setTemplates(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch templates:", error)
    } finally {
      setLoadingTemplates(false)
    }
  }

  const handleTemplateSelect = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const templateId = e.target.value
    
    // If no template selected, just update templateId
    if (!templateId) {
      setFormData((prev) => ({ ...prev, templateId: "" }))
      return
    }
    
    // Find the template and auto-fill form
    const template = templates.find((t) => t.id === templateId)
    if (template) {
      console.log("Selected template:", template)
      console.log("Template config:", template.config)
      
      setFormData({
        templateId: templateId,
        name: template.config?.name || template.name || "",
        description: template.config?.description || template.description || "",
        startDate: template.config?.startDate || "",
        endDate: template.config?.endDate || "",
      })
      
      showToast(`Applied template: ${template.name}`, "success")
    } else {
      setFormData((prev) => ({ ...prev, templateId }))
    }
  }

  // Form handlers
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }))
    }
  }

  const validate = (): boolean => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = "Project name is required"
    }

    if (formData.startDate && formData.endDate) {
      if (new Date(formData.startDate) > new Date(formData.endDate)) {
        newErrors.endDate = "End date must be after start date"
      }
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!validate()) return

    setSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        router.push("/login")
        return
      }

      const response = await fetch("/api/projects", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(formData),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || "Failed to create project")
      }

      showToast("Project created successfully!", "success")
      setFormData({ name: "", description: "", startDate: "", endDate: "", templateId: "" })

      // Refresh projects list
      setTimeout(() => {
        setActiveTab("existing")
        fetchProjects()
      }, 1000)
    } catch (error) {
      console.error("Error creating project:", error)
      showToast(error instanceof Error ? error.message : "Failed to create project", "error")
    } finally {
      setSubmitting(false)
    }
  }

  const handleViewProject = (id: string) => {
    router.push(`/projects/${id}`)
  }

  const handleDeleteProject = async (e: React.MouseEvent, project: Project) => {
    e.stopPropagation() // Prevent card click
    if (!confirm(`Are you sure you want to delete "${project.name}"? This will delete all tasks, teams, and data within this project.`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/projects/${project.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        showToast("Project deleted successfully", "success")
        fetchProjects()
      } else {
        const data = await res.json()
        showToast(data.message || "Failed to delete project", "error")
      }
    } catch (error) {
      console.error("Delete project error:", error)
      showToast("Failed to delete project", "error")
    }
  }

  const tabs = [
    { id: "existing", label: "Existing Projects" },
    { id: "create", label: "Create New" },
  ]

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-8">
      <div className="max-w-6xl mx-auto animate-fade-in">
        <div className="mb-8 animate-slide-down">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            📁 Projects
          </h1>
          <p className="text-gray-400">Manage and create projects</p>
        </div>

        <Tabs tabs={tabs} value={activeTab} onChange={setActiveTab} />

        {activeTab === "existing" && (
          <Card className="mt-8 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Your Projects</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="flex justify-center py-8">
                  <Loader />
                </div>
              ) : projects.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-6xl mb-4">📂</div>
                  <p className="text-gray-400 mb-6">No projects yet</p>
                  <Button variant="gradient" onClick={() => setActiveTab("create")}>
                    🚀 Create Your First Project
                  </Button>
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {projects.map((project: Project, index: number) => (
                    <Card
                      key={project.id}
                      className="cursor-pointer bg-gray-800/80 border-gray-700 hover:border-blue-500/50 hover:shadow-lg hover:shadow-blue-500/10 transition-all duration-300 group animate-slide-up"
                      style={{ animationDelay: `${index * 0.05}s` }}
                      onClick={() => handleViewProject(project.id)}
                    >
                      <CardContent className="pt-6">
                        <div className="flex items-start justify-between mb-2">
                          <h3 className="font-semibold text-lg text-white group-hover:text-blue-400 transition-colors">
                            {project.name}
                          </h3>
                          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                            <button
                              onClick={(e) => {
                                e.stopPropagation()
                                router.push(`/projects/${project.id}`)
                              }}
                              className="p-1.5 text-gray-500 hover:text-blue-500 transition-colors"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={(e) => handleDeleteProject(e, project)}
                              className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                              title="Delete"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                        {project.description && (
                          <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                            {project.description}
                          </p>
                        )}
                        <div className="flex items-center gap-4 text-xs text-gray-500">
                          {project.startDate && (
                            <span>
                              📅 {new Date(project.startDate).toLocaleDateString()}
                            </span>
                          )}
                          {project._count && (
                            <span>✅ {project._count.tasks || 0} tasks</span>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "create" && (
          <Card className="mt-8 bg-gray-800/50 border-gray-700">
            <CardHeader>
              <CardTitle className="text-white">Create New Project</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Template Selection */}
                {!loadingTemplates && templates.length > 0 && (
                  <div>
                    <label htmlFor="templateId" className="block text-sm font-medium text-gray-300 mb-2">
                      📋 Start from Template (Optional)
                    </label>
                    <select
                      id="templateId"
                      name="templateId"
                      value={formData.templateId}
                      onChange={handleTemplateSelect}
                      className="w-full px-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500 transition-colors"
                    >
                      <option value="">No template - Start from scratch</option>
                      {templates.map((template) => (
                        <option key={template.id} value={template.id}>
                          {template.name}{template.description ? ` - ${template.description}` : ""}
                        </option>
                      ))}
                    </select>
                    {formData.templateId && (
                      <p className="text-xs text-gray-400 mt-1">
                        ✨ Template settings will pre-fill the form below
                      </p>
                    )}
                  </div>
                )}

                {/* Project Name */}
                <div>
                  <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-2">
                    Project Name *
                  </label>
                  <Input
                    id="name"
                    name="name"
                    value={formData.name}
                    onChange={handleChange}
                    placeholder="Enter project name"
                    className={errors.name ? "border-red-500" : ""}
                  />
                  {errors.name && (
                    <p className="text-red-400 text-sm mt-1">{errors.name}</p>
                  )}
                </div>

                {/* Description */}
                <div>
                  <label htmlFor="description" className="block text-sm font-medium text-gray-300 mb-2">
                    Description
                  </label>
                  <Textarea
                    id="description"
                    name="description"
                    value={formData.description}
                    onChange={handleChange}
                    placeholder="Enter project description"
                    rows={4}
                  />
                </div>

                {/* Dates */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label htmlFor="startDate" className="block text-sm font-medium text-gray-300 mb-2">
                      Start Date
                    </label>
                    <Input
                      id="startDate"
                      name="startDate"
                      type="date"
                      value={formData.startDate}
                      onChange={handleChange}
                    />
                  </div>

                  <div>
                    <label htmlFor="endDate" className="block text-sm font-medium text-gray-300 mb-2">
                      End Date
                    </label>
                    <Input
                      id="endDate"
                      name="endDate"
                      type="date"
                      value={formData.endDate}
                      onChange={handleChange}
                      className={errors.endDate ? "border-red-500" : ""}
                    />
                    {errors.endDate && (
                      <p className="text-red-400 text-sm mt-1">{errors.endDate}</p>
                    )}
                  </div>
                </div>

                {/* Buttons */}
                <div className="flex gap-4">
                  <Button type="submit" variant="gradient" disabled={submitting}>
                    {submitting ? "Creating..." : "✨ Create Project"}
                  </Button>
                  <Button
                    type="button"
                    variant="ghost"
                    onClick={() => setActiveTab("existing")}
                  >
                    Cancel
                  </Button>
                </div>
              </form>
            </CardContent>
          </Card>
        )}
      </div>

      <ToastContainer queue={toastQueue} onDismiss={dismissToast} />
    </div>
  )
}
