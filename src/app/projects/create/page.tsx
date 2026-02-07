"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Input, Textarea } from "@/components/ui/Form"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Dropdown } from "@/components/ui/Dropdown"

interface ProjectTemplate {
  id: string
  name: string
  description: string
  config: Record<string, any>
}

export default function CreateProject() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    startDate: "",
    endDate: "",
    templateId: "",
  })
  const [templates, setTemplates] = useState<ProjectTemplate[]>([])
  const [loadingTemplates, setLoadingTemplates] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchTemplates()
  }, [])

  const fetchTemplates = async () => {
    setLoadingTemplates(true)
    try {
      const token = localStorage.getItem("token")
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

  const handleTemplateSelect = (templateId: string) => {
    setFormData((prev) => ({ ...prev, templateId }))
    
    // Auto-fill form if template has config
    const template = templates.find((t) => t.id === templateId)
    if (template?.config) {
      setFormData((prev) => ({
        ...prev,
        name: template.config.name || prev.name,
        description: template.config.description || prev.description,
        startDate: template.config.startDate || prev.startDate,
        endDate: template.config.endDate || prev.endDate,
      }))
    }
  }

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

    setLoading(true)

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/projects", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        setErrors({ submit: data.message || "Failed to create project" })
        return
      }

      router.push(`/projects/${data.data.id}`)
    } catch (_error) {
      void _error
      setErrors({
        submit: "An error occurred. Please try again.",
      })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 via-gray-900 to-gray-800 p-8">
      <main className="max-w-2xl mx-auto">
        <div className="mb-8 animate-slide-down">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-400 to-purple-400 bg-clip-text text-transparent mb-2">
            📁 Create Project
          </h1>
          <p className="text-gray-400">Set up a new project for your team</p>
        </div>
        <Card gradient className="animate-slide-up">
          <CardHeader>
            <CardTitle>🌟 New Project Details</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Template Selection */}
              {!loadingTemplates && templates.length > 0 && (
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-2">
                    📋 Start from Template (Optional)
                  </label>
                  <Dropdown
                    options={[
                      { value: "", label: "No template - Start from scratch" },
                      ...templates.map((t) => ({
                        value: t.id,
                        label: `${t.name}${t.description ? ` - ${t.description}` : ""}`,
                      })),
                    ]}
                    value={formData.templateId}
                    onChange={handleTemplateSelect}
                    disabled={loading}
                  />
                  {formData.templateId && (
                    <p className="text-xs text-gray-400 mt-1">
                      ✨ Template settings will pre-fill the form below
                    </p>
                  )}
                </div>
              )}

              <Input
                label="Project Name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                error={errors.name}
                disabled={loading}
                required
              />

              <Textarea
                label="Description (Optional)"
                name="description"
                value={formData.description}
                onChange={handleChange}
                disabled={loading}
                rows={4}
              />

              <div className="grid grid-cols-2 gap-4">
                <Input
                  label="Start Date (Optional)"
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  disabled={loading}
                />

                <Input
                  label="End Date (Optional)"
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  error={errors.endDate}
                  disabled={loading}
                />
              </div>

              {errors.submit && (
                <div className="p-3 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-sm text-red-600">{errors.submit}</p>
                </div>
              )}

              <div className="flex gap-4">
                <Button type="submit" variant="gradient" className="flex-1" disabled={loading}>
                  {loading ? "Creating..." : "Create Project"}
                </Button>
                <Button
                  type="button"
                  variant="secondary"
                  className="flex-1"
                  onClick={() => router.back()}
                  disabled={loading}
                >
                  Cancel
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
