"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import Link from "next/link"
import { Input, Textarea } from "@/components/ui/Form"
import { Button } from "@/components/ui/Button"
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/Card"
import { Tabs } from "@/components/ui/Tabs"
import { WeeklyTimesheet } from "@/components/WeeklyTimesheet"
import { ReportsExport } from "@/components/ReportsExport"
import { canManageProject, canViewReports } from "@/lib/rbac-ui"
import { FolderKanban, LayoutGrid, Clock, FileBarChart, Pencil, Trash2, Search, CheckSquare, Users, MessageSquare, Activity, Layers, History, Plus, X, Calendar, ArchiveRestore, Archive, Paperclip, Upload } from "lucide-react"
import { Project, Phase, ActivityLogItem } from "./types"

export default function ProjectDetailsPage() {
  const params = useParams()
  const router = useRouter()
  const projectId = (params?.id as string) || ""
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [project, setProject] = useState<Project | null>(null)
  const [loading, setLoading] = useState(true)
  const [attachments, setAttachments] = useState<any[]>([])
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isEditing, setIsEditing] = useState(false)
  const [saveLoading, setSaveLoading] = useState(false)
  const [deleteLoading, setDeleteLoading] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [archiveLoading, setArchiveLoading] = useState(false)
  const [discussions, setDiscussions] = useState<any[]>([])
  const [newDiscussion, setNewDiscussion] = useState("")
  const [editingDiscussionId, setEditingDiscussionId] = useState<string | null>(null)
  const [editingDiscussionContent, setEditingDiscussionContent] = useState("")
  const [postingDiscussion, setPostingDiscussion] = useState(false)
  const handleArchiveToggle = async () => {
    if (!project) return
    setArchiveLoading(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("You are not logged in. Please login first.")
        return
      }
      const endpoint = project.archivedAt ? `/api/projects/${projectId}/unarchive` : `/api/projects/${projectId}/archive`
      const res = await fetch(endpoint, { method: "POST", headers: { Authorization: `Bearer ${token}` } })
      const data = await res.json()
      if (!res.ok) {
        setError(data.message || "Failed to update archive status")
        return
      }
      setProject(data.data)
    } catch (err) {
      setError("Could not update archive status. Please try again.")
    } finally {
      setArchiveLoading(false)
    }
  }
  const [userRole, setUserRole] = useState<string | null>(null)
  const [phases, setPhases] = useState<Phase[]>([])
  const [activityLogs, setActivityLogs] = useState<ActivityLogItem[]>([])
  const [newPhaseName, setNewPhaseName] = useState("")
  const [form, setForm] = useState({
    name: "",
    description: "",
    status: "",
    startDate: "",
    endDate: "",
  })

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      const user = JSON.parse(userData)
      setUserRole(user.role)
    }

    const loadProject = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) {
          setError("You are not logged in. Please login first.")
          setLoading(false)
          return
        }

        const res = await fetch(`/api/projects/${projectId}`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        })

        if (res.status === 401 || res.status === 403) {
          setError("Unauthorized. Please login again.")
          setLoading(false)
          return
        }

        if (!res.ok) {
          setError("Failed to load project")
          setLoading(false)
          return
        }

        const data = await res.json()
        console.log("Fetched project data:", data)
        setProject(data.data)
        setForm({
          name: data.data?.name || "",
          description: data.data?.description || "",
          status: data.data?.status || "",
          startDate: data.data?.startDate
            ? new Date(data.data.startDate).toISOString().slice(0, 10)
            : "",
          endDate: data.data?.endDate
            ? new Date(data.data.endDate).toISOString().slice(0, 10)
            : "",
        })
      } catch (err) {
        console.error("Error loading project:", err)
        setError("Something went wrong while loading the project.")
      } finally {
        setLoading(false)
      }
    }

    const loadPhases = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return
        const res = await fetch(`/api/phases?projectId=${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setPhases(data.data || [])
        }
      } catch (err) {
        void err
      }
    }

    const loadActivityLogs = async () => {
      try {
        const token = localStorage.getItem("token")
        if (!token) return
        const res = await fetch(`/api/activity-logs?projectId=${projectId}`, {
          headers: { Authorization: `Bearer ${token}` },
        })
        if (res.ok) {
          const data = await res.json()
          setActivityLogs(data.data || [])
        }
      } catch (err) {
        void err
      }
    }

    if (projectId) {
      loadProject()
      loadPhases()
      loadActivityLogs()
      fetchAttachments()
      fetchDiscussions()
    }
  }, [projectId])

  const fetchDiscussions = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/discussions?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDiscussions(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch discussions:", error)
    }
  }

  const handleAddDiscussion = async () => {
    if (!newDiscussion.trim()) return
    setPostingDiscussion(true)
    setError(null)
    try {
      const token = localStorage.getItem("token")
      console.log("=== DISCUSSION POST START ===")
      console.log("projectId:", projectId)
      console.log("token exists:", !!token)
      console.log("content:", newDiscussion)
      
      if (!token) {
        setError("You are not logged in. Please login first.")
        setPostingDiscussion(false)
        return
      }
      
      const payload = {
        projectId,
        content: newDiscussion,
      }
      console.log("Sending payload:", payload)
      
      const res = await fetch("/api/discussions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
      })
      
      console.log("Response status:", res.status, res.statusText)
      console.log("Response headers:", Array.from(res.headers.entries()))
      
      // Try to get response text first
      const text = await res.text()
      console.log("Response text length:", text.length)
      console.log("Response text:", text.substring(0, 500))
      
      // Try to parse as JSON
      let data
      try {
        data = text ? JSON.parse(text) : {}
      } catch (e) {
        console.error("Failed to parse response as JSON:", text)
        setError(`Server error: ${text.substring(0, 200)}`)
        setPostingDiscussion(false)
        return
      }
      
      console.log("Parsed data:", data)
      
      if (!res.ok) {
        console.error("Failed to post discussion - status not ok")
        console.error("Full data:", JSON.stringify(data, null, 2))
        setError(data.error || data.message || data.details || `Failed to post discussion (${res.status})`)
        setPostingDiscussion(false)
        return
      }
      
      console.log("Success! Discussion created:", data)
      setNewDiscussion("")
      fetchDiscussions()
    } catch (error) {
      console.error("Add discussion error:", error)
      setError("Could not post discussion. Please try again.")
    } finally {
      setPostingDiscussion(false)
      console.log("=== DISCUSSION POST END ===")
    }
  }

  const handleEditDiscussion = async (id: string) => {
    if (!editingDiscussionContent.trim()) return
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("You are not logged in. Please login first.")
        return
      }
      const res = await fetch("/api/discussions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          content: editingDiscussionContent,
        }),
      })
      const data = await res.json()
      if (!res.ok) {
        console.error("Failed to edit discussion:", data)
        setError(data.error || data.message || "Failed to edit discussion")
        return
      }
      setEditingDiscussionId(null)
      setEditingDiscussionContent("")
      fetchDiscussions()
    } catch (error) {
      console.error("Edit discussion error:", error)
      setError("Could not edit discussion. Please try again.")
    }
  }

  const handleDeleteDiscussion = async (id: string) => {
    if (!confirm("Delete this discussion message?")) return
    try {
      const token = localStorage.getItem("token")
      if (!token) {
        setError("You are not logged in. Please login first.")
        return
      }
      const res = await fetch(`/api/discussions?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (!res.ok) {
        console.error("Failed to delete discussion:", data)
        setError(data.error || data.message || "Failed to delete discussion")
        return
      }
      fetchDiscussions()
    } catch (error) {
      console.error("Delete discussion error:", error)
      setError("Could not delete discussion. Please try again.")
    }
  }

  const fetchAttachments = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/attachments?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAttachments(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch project attachments:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const token = localStorage.getItem("token")
      const reader = new FileReader()
      reader.onload = async () => {
        const fileUrl = reader.result as string
        const res = await fetch("/api/attachments", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            fileUrl,
            projectId,
          }),
        })
        if (res.ok) fetchAttachments()
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Upload error:", error)
      setUploading(false)
    }
    if (fileInputRef.current) fileInputRef.current.value = ""
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchAttachments()
    } catch (error) {
      console.error("Delete attachment error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8">
        <div className="max-w-5xl mx-auto space-y-6">
          <div className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
          <div className="h-64 bg-gray-800 rounded-xl animate-pulse"></div>
          <div className="h-48 bg-gray-800 rounded-xl animate-pulse"></div>
        </div>
      </div>
    )
  }

  const handleFieldChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
  }

  const handleCreatePhase = async () => {
    if (!newPhaseName.trim()) return
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const res = await fetch("/api/phases", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          name: newPhaseName,
          sequence: phases.length + 1,
        }),
      })
      if (res.ok) {
        const data = await res.json()
        setPhases((prev) => [...prev, data.data])
        setNewPhaseName("")
      }
    } catch (err) {
      void err
    }
  }

  const handleDeletePhase = async (phaseId: string) => {
    if (!confirm("Delete this phase?")) return
    try {
      const token = localStorage.getItem("token")
      if (!token) return
      const res = await fetch(`/api/phases/${phaseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        setPhases((prev) => prev.filter((p) => p.id !== phaseId))
      }
    } catch (err) {
      void err
    }
  }

  const handleUpdate = async () => {
    if (!form.name.trim()) {
      setError("Project name is required")
      return
    }

    try {
      setSaveLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        setError("You are not logged in. Please login first.")
        return
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: form.name,
          description: form.description,
          status: form.status,
          startDate: form.startDate || null,
          endDate: form.endDate || null,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.message || "Failed to update project")
        return
      }

      setProject(data.data)
      setIsEditing(false)
    } catch (err) {
      void err
      setError("Could not update project. Please try again.")
    } finally {
      setSaveLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this project? This cannot be undone.")) return

    try {
      setDeleteLoading(true)
      setError(null)
      const token = localStorage.getItem("token")
      if (!token) {
        setError("You are not logged in. Please login first.")
        return
      }

      const res = await fetch(`/api/projects/${projectId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${token}`,
        },
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data.message || "Failed to delete project")
        return
      }

      router.push("/dashboard")
    } catch (err) {
      void err
      setError("Could not delete project. Please try again.")
    } finally {
      setDeleteLoading(false)
    }
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <FolderKanban className="w-5 h-5" /> Project
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-red-500">{error}</p>
            <div className="flex gap-3">
              <Link
                href="/login"
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Login
              </Link>
              <button
                onClick={() => router.refresh()}
                className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Retry
              </button>
              <Link
                href="/projects/create"
                className="px-4 py-2 border border-gray-600 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
              >
                Create Project
              </Link>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  if (!project) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">Project not found.</p>
            <div className="mt-4 p-2 bg-gray-800 text-left text-xs text-gray-300 rounded">
              <div><b>Debug info:</b></div>
              <div>projectId: {String(projectId)}</div>
              <div>project: <pre>{JSON.stringify(project, null, 2)}</pre></div>
            </div>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-5xl mx-auto space-y-8">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <FolderKanban className="w-10 h-10 text-blue-500" />
              {project.name}
            </h1>
            <p className="text-gray-400">Manage project details and resources</p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => setIsEditing(!isEditing)}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center gap-2 transition-colors"
            >
              {isEditing ? <><X className="w-4 h-4" /> Cancel</> : <><Pencil className="w-4 h-4" /> Edit</>}
            </button>
            <button
              onClick={handleArchiveToggle}
              disabled={archiveLoading}
              className="px-4 py-2 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              {project.archivedAt ? <><ArchiveRestore className="w-4 h-4" /> Unarchive</> : <><Archive className="w-4 h-4" /> Archive</>}
            </button>
            <button
              onClick={handleDelete}
              disabled={deleteLoading}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 flex items-center gap-2 transition-colors disabled:opacity-50"
            >
              <Trash2 className="w-4 h-4" /> Delete
            </button>
          </div>
        </div>

        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Pencil className="w-5 h-5" /> Edit Project
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                name="name"
                value={form.name}
                onChange={handleFieldChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Project name"
              />
              <textarea
                name="description"
                value={form.description}
                onChange={handleFieldChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                placeholder="Description"
                rows={4}
              />
              <div className="grid grid-cols-2 gap-4">
                <select
                  name="status"
                  value={form.status}
                  onChange={handleFieldChange}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                >
                  <option value="">Select Status</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ON_HOLD">On Hold</option>
                  <option value="COMPLETED">Completed</option>
                </select>
                <input
                  type="date"
                  name="startDate"
                  value={form.startDate}
                  onChange={handleFieldChange}
                  className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                />
              </div>
              <input
                type="date"
                name="endDate"
                value={form.endDate}
                onChange={handleFieldChange}
                className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
              />
              <Button
                onClick={handleUpdate}
                disabled={saveLoading}
                variant="primary"
              >
                {saveLoading ? "Saving..." : "Save Changes"}
              </Button>
            </CardContent>
          </Card>
        )}

        <Tabs
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "discussions", label: `Discussions (${discussions.length})` },
            { id: "phases", label: `Phases (${phases.length})` },
            { id: "activity", label: `Activity (${activityLogs.length})` },
            { id: "attachments", label: `Attachments (${attachments.length})` },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "overview" && (
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <LayoutGrid className="w-5 h-5" /> Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Status</p>
                    <p className="text-white font-semibold">{project.status || "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Owner</p>
                    <p className="text-white font-semibold">{project.owner?.name}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">Start Date</p>
                    <p className="text-white font-semibold">{project.startDate ? new Date(project.startDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1">End Date</p>
                    <p className="text-white font-semibold">{project.endDate ? new Date(project.endDate).toLocaleDateString() : "N/A"}</p>
                  </div>
                </div>
                {project.description && (
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm mb-2">Description</p>
                    <p className="text-white">{project.description}</p>
                  </div>
                )}
                <div className="grid grid-cols-3 gap-4">
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1 flex items-center gap-2"><CheckSquare className="w-4 h-4" /> Tasks</p>
                    <p className="text-white font-semibold text-2xl">{project._count?.tasks || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1 flex items-center gap-2"><Users className="w-4 h-4" /> Teams</p>
                    <p className="text-white font-semibold text-2xl">{project._count?.teams || 0}</p>
                  </div>
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-gray-400 text-sm mb-1 flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Comments</p>
                    <p className="text-white font-semibold text-2xl">{project._count?.comments || 0}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {canManageProject(userRole) && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="w-5 h-5" /> Project Members
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  {project.members && project.members.length > 0 ? (
                    <div className="space-y-2">
                      {project.members.map((member: any) => (
                        <div key={member.userId} className="p-3 bg-gray-800 rounded-lg border border-gray-700 flex justify-between items-center">
                          <span className="text-white">{member.userId}</span>
                          <span className="text-xs bg-blue-600 px-2 py-1 rounded">{member.role}</span>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-gray-400">No members assigned</p>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "discussions" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <MessageSquare className="w-5 h-5" /> Project Discussion Board
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-3">
                {discussions.length > 0 ? (
                  discussions.map((disc: any) => (
                    <div key={disc.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          <span className="text-white font-semibold">{disc.author?.name || "Unknown"}</span>
                          <span className="text-xs text-gray-500">{new Date(disc.createdAt).toLocaleString()}</span>
                        </div>
                        {disc.authorId === JSON.parse(localStorage.getItem("user") || "{}").id && (
                          <div className="flex gap-2">
                            <button
                              onClick={() => {
                                setEditingDiscussionId(disc.id)
                                setEditingDiscussionContent(disc.content)
                              }}
                              className="text-blue-400 hover:text-blue-300 text-sm"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => handleDeleteDiscussion(disc.id)}
                              className="text-red-400 hover:text-red-300 text-sm"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        )}
                      </div>
                      {editingDiscussionId === disc.id ? (
                        <div className="space-y-2">
                          <textarea
                            value={editingDiscussionContent}
                            onChange={(e) => setEditingDiscussionContent(e.target.value)}
                            className="w-full px-3 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                            rows={3}
                          />
                          <div className="flex gap-2">
                            <Button
                              onClick={() => handleEditDiscussion(disc.id)}
                              variant="primary"
                              className="text-sm"
                            >
                              Save
                            </Button>
                            <Button
                              onClick={() => {
                                setEditingDiscussionId(null)
                                setEditingDiscussionContent("")
                              }}
                              variant="secondary"
                              className="text-sm"
                            >
                              Cancel
                            </Button>
                          </div>
                        </div>
                      ) : (
                        <p className="text-gray-300">{disc.content}</p>
                      )}
                    </div>
                  ))
                ) : (
                  <div className="text-center py-8">
                    <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No discussions yet. Start the conversation!</p>
                  </div>
                )}
              </div>

              <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                {error && activeTab === "discussions" && (
                  <div className="p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-200 text-sm">
                    {error}
                  </div>
                )}
                <textarea
                  value={newDiscussion}
                  onChange={(e) => setNewDiscussion(e.target.value)}
                  placeholder="Share your thoughts..."
                  className="w-full px-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                  rows={3}
                  disabled={postingDiscussion}
                />
                <Button
                  onClick={handleAddDiscussion}
                  variant="primary"
                  className="w-full flex items-center justify-center gap-2"
                  disabled={!newDiscussion.trim() || postingDiscussion}
                >
                  <Plus className="w-4 h-4" /> {postingDiscussion ? "Posting..." : "Post Message"}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "phases" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Layers className="w-5 h-5" /> Project Phases
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {phases.length > 0 ? (
                  <div className="space-y-2">
                    {phases.map((phase: any) => (
                      <div key={phase.id} className="p-4 bg-gray-800 rounded-lg border border-gray-700 flex justify-between items-center">
                        <div>
                          <p className="text-white font-semibold">{phase.name}</p>
                        </div>
                        {canManageProject(userRole) && (
                          <button
                            onClick={() => handleDeletePhase(phase.id)}
                            className="p-2 text-red-500 hover:text-red-400"
                          >
                            <Trash2 className="w-4 h-4" />
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400">No phases created</p>
                )}

                {canManageProject(userRole) && (
                  <div className="mt-4 pt-4 border-t border-gray-700 space-y-3">
                    <input
                      type="text"
                      value={newPhaseName}
                      onChange={(e) => setNewPhaseName(e.target.value)}
                      placeholder="New phase name"
                      className="w-full px-4 py-2 bg-gray-900 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
                    />
                    <Button onClick={handleCreatePhase} variant="primary" className="w-full flex items-center justify-center gap-2">
                      <Plus className="w-4 h-4" /> Add Phase
                    </Button>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "activity" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <History className="w-5 h-5" /> Activity Log
              </CardTitle>
            </CardHeader>
            <CardContent>
              {activityLogs.length > 0 ? (
                <div className="space-y-3">
                  {activityLogs.map((log: any) => (
                    <div key={log.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700 text-sm">
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="text-white font-semibold capitalize">{log.action}</p>
                          <p className="text-gray-400 text-xs">{log.entity}</p>
                        </div>
                        <p className="text-gray-500 text-xs">{new Date(log.createdAt).toLocaleString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No activity yet</p>
              )}
            </CardContent>
          </Card>
        )}

        {activeTab === "attachments" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Paperclip className="w-5 h-5" /> Attachments
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment: any) => (
                    <div key={attachment.id} className="p-3 bg-gray-800 rounded-lg border border-gray-700 flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Paperclip className="w-4 h-4 text-gray-400" />
                        <span className="text-white">{attachment.fileName}</span>
                        <span className="text-xs text-gray-500">({(attachment.fileSize / 1024).toFixed(2)} KB)</span>
                      </div>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="p-2 text-red-500 hover:text-red-400"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-gray-400">No attachments</p>
              )}

              <div className="mt-4 pt-4 border-t border-gray-700">
                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={uploading}
                  className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  <Upload className="w-4 h-4" /> {uploading ? "Uploading..." : "Upload Attachment"}
                </button>
                <input
                  ref={fileInputRef}
                  type="file"
                  onChange={handleFileUpload}
                  hidden
                />
              </div>
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
