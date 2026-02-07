"use client"

import { useEffect, useState } from "react"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Form"
import { FilePlus2, Plus, X, Copy, Trash2, FolderPlus } from "lucide-react"

interface ProjectTemplate {
  id: string
  name: string
  description?: string
  config: Record<string, unknown>
  createdAt: string
}

export default function ProjectTemplatesPage() {
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [form, setForm] = useState({
    name: "",
    description: "",
    defaultPhases: "",
    defaultTasks: "",
  })
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    loadTemplates()
  }, [])

  const loadTemplates = async () => {
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Not logged in")
        setLoading(false)
        return
      }

      const res = await fetch("/api/project-templates", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTemplates(data.data || [])
      }
    } catch (err) {
      void err
      setError("Failed to load templates")
    } finally {
      setLoading(false)
    }
  }

  const handleCreateTemplate = async () => {
    if (!form.name.trim()) {
      setError("Template name is required")
      return
    }

    try {
      setCreating(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        setError("Not logged in")
        return
      }

      const config: Record<string, unknown> = {}
      if (form.defaultPhases) {
        config.phases = form.defaultPhases.split(",").map((p) => p.trim()).filter(Boolean)
      }
      if (form.defaultTasks) {
        config.tasks = form.defaultTasks.split(",").map((t) => t.trim()).filter(Boolean)
      }

      const res = await fetch("/api/project-templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          config,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setTemplates((prev) => [data.data, ...prev])
        setForm({ name: "", description: "", defaultPhases: "", defaultTasks: "" })
        setShowCreateForm(false)
      } else {
        const data = await res.json()
        setError(data.message || "Failed to create template")
      }
    } catch (err) {
      void err
      setError("Failed to create template")
    } finally {
      setCreating(false)
    }
  }

  const handleDeleteTemplate = async (templateId: string) => {
    if (!confirm("Delete this template?")) return

    try {
      const token = localStorage.getItem("token")
      if (!token) return

      const res = await fetch(`/api/project-templates/${templateId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setTemplates((prev) => prev.filter((t) => t.id !== templateId))
      }
    } catch (err) {
      void err
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
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <FilePlus2 className="w-10 h-10 text-blue-500" />
              Project Templates
            </h1>
            <p className="text-gray-400">Reusable templates for quickly creating new projects</p>
          </div>
          <Button
            variant="primary"
            onClick={() => setShowCreateForm(!showCreateForm)}
            className="flex items-center gap-2"
          >
            {showCreateForm ? <X className="w-4 h-4" /> : <Plus className="w-4 h-4" />}
            {showCreateForm ? "Cancel" : "New Template"}
          </Button>
        </div>

        {error && (
          <div className="p-4 bg-red-900/30 border border-red-700 rounded-lg text-red-400">
            {error}
          </div>
        )}

        {showCreateForm && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FolderPlus className="w-5 h-5" /> Create Template
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Template Name"
                placeholder="e.g., Agile Project, Marketing Campaign"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, name: e.target.value }))}
              />
              <Textarea
                label="Description"
                placeholder="Describe when to use this template..."
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm((prev) => ({ ...prev, description: e.target.value }))}
                rows={3}
              />
              <Input
                label="Default Phases (comma-separated)"
                placeholder="e.g., Planning, Development, Testing, Deployment"
                value={form.defaultPhases}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, defaultPhases: e.target.value }))}
              />
              <Input
                label="Default Tasks (comma-separated)"
                placeholder="e.g., Requirements gathering, Initial setup, Documentation"
                value={form.defaultTasks}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm((prev) => ({ ...prev, defaultTasks: e.target.value }))}
              />
              <Button
                variant="primary"
                onClick={handleCreateTemplate}
                disabled={creating}
                className="flex items-center gap-2"
              >
                {creating ? "Creating..." : "Create Template"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FilePlus2 className="w-5 h-5" /> Your Templates
            </CardTitle>
          </CardHeader>
          <CardContent>
            {templates.length === 0 ? (
              <div className="text-center py-12">
                <FilePlus2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                <p className="text-gray-500">No templates yet. Create one to get started.</p>
              </div>
            ) : (
              <div className="grid gap-4 md:grid-cols-2">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="bg-gray-800 border border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <h3 className="font-medium text-white text-lg">{template.name}</h3>
                      <div className="flex gap-2">
                        <button
                          className="text-gray-500 hover:text-blue-500 transition-colors"
                          title="Use template"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteTemplate(template.id)}
                          className="text-gray-500 hover:text-red-500 transition-colors"
                          title="Delete template"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    {template.description && (
                      <p className="text-sm text-gray-400 mb-3">{template.description}</p>
                    )}
                    <div className="flex flex-wrap gap-2">
                      {(template.config?.phases as string[] || []).map((phase: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-blue-600/20 text-blue-400 rounded"
                        >
                          {phase}
                        </span>
                      ))}
                      {(template.config?.tasks as string[] || []).map((task: string, i: number) => (
                        <span
                          key={i}
                          className="px-2 py-1 text-xs bg-green-600/20 text-green-400 rounded"
                        >
                          {task}
                        </span>
                      ))}
                    </div>
                    <p className="text-xs text-gray-600 mt-3">
                      Created {new Date(template.createdAt).toLocaleDateString()}
                    </p>
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
