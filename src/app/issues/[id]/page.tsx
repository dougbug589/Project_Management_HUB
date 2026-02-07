"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Select } from "@/components/ui/Form"
import { formatDate } from "@/lib/utils"
import { Bug, Pencil, Trash2, Paperclip, Upload, X, FileText, Download } from "lucide-react"

export default function IssueDetailPage() {
  const params = useParams()
  const router = useRouter()
  const issueId = params?.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [issue, setIssue] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [form, setForm] = useState<any>({})

  useEffect(() => {
    if (issueId) fetchIssue()
  }, [issueId])

  const fetchIssue = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/issues/${issueId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setIssue(data.data)
        setForm({
          status: data.data.status,
          severity: data.data.severity,
          priority: data.data.priority,
        })
      }
    } catch (error) {
      console.error("Failed to fetch issue:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setIsEditing(false)
        fetchIssue()
      }
    } catch (error) {
      console.error("Update issue error:", error)
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this issue?")) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/issues/${issueId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        router.push("/issues")
      }
    } catch (error) {
      console.error("Delete issue error:", error)
    }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const token = localStorage.getItem("token")
      
      // For demo purposes, we'll use a data URL. In production, upload to cloud storage.
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
            issueId,
          }),
        })

        if (res.ok) {
          fetchIssue()
        } else {
          alert("Failed to upload attachment")
        }
        setUploading(false)
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Upload error:", error)
      alert("Failed to upload attachment")
      setUploading(false)
    }
    
    // Reset the input
    if (fileInputRef.current) {
      fileInputRef.current.value = ""
    }
  }

  const handleDeleteAttachment = async (attachmentId: string) => {
    if (!confirm("Delete this attachment?")) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/attachments/${attachmentId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        fetchIssue()
      }
    } catch (error) {
      console.error("Delete attachment error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-red-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading issue...</p>
        </div>
      </div>
    )
  }

  if (!issue) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <Bug className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">Issue not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Bug className="w-10 h-10 text-red-500" />
              {issue.title}
            </h1>
            <p className="text-gray-400">Issue details and status</p>
          </div>
          <div className="flex gap-3">
            <Button variant="secondary" onClick={() => setIsEditing(!isEditing)} className="flex items-center gap-2">
              {isEditing ? <><X className="w-4 h-4" /> Cancel</> : <><Pencil className="w-4 h-4" /> Edit</>}
            </Button>
            <Button variant="danger" onClick={handleDelete} className="flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Delete
            </Button>
          </div>
        </div>
        {isEditing && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Pencil className="w-5 h-5" /> Edit Issue</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-3 gap-4">
                <Select
                  label="Status"
                  value={form.status}
                  onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="OPEN">Open</option>
                  <option value="IN_PROGRESS">In Progress</option>
                  <option value="RESOLVED">Resolved</option>
                  <option value="CLOSED">Closed</option>
                </Select>
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
              <Button variant="primary" onClick={handleUpdate}>Save Changes</Button>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Issue Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-500 mb-2">Status</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                  issue.status === "RESOLVED"
                    ? "bg-green-600"
                    : issue.status === "IN_PROGRESS"
                    ? "bg-blue-600"
                    : issue.status === "CLOSED"
                    ? "bg-gray-600"
                    : "bg-yellow-600"
                }`}>{issue.status}</span>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-500 mb-2">Severity</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                  issue.severity === "CRITICAL"
                    ? "bg-red-600"
                    : issue.severity === "HIGH"
                    ? "bg-orange-600"
                    : issue.severity === "MEDIUM"
                    ? "bg-yellow-600"
                    : "bg-gray-500"
                }`}>{issue.severity}</span>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-500 mb-2">Priority</p>
                <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                  issue.priority === "URGENT"
                    ? "bg-red-600"
                    : issue.priority === "HIGH"
                    ? "bg-orange-600"
                    : "bg-blue-600"
                }`}>{issue.priority}</span>
              </div>
            </div>
            <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
              <p className="text-sm text-gray-500 mb-2">Description</p>
              <p className="text-gray-300">{issue.description || "No description"}</p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-500 mb-1">Project</p>
                <p className="font-medium text-white">{issue.project?.name}</p>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-500 mb-1">Reported by</p>
                <p className="font-medium text-white">{issue.reporter?.name} ({issue.reporter?.email})</p>
              </div>
              {issue.assignee && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-500 mb-1">Assigned to</p>
                  <p className="font-medium text-white">{issue.assignee.name}</p>
                </div>
              )}
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-500 mb-1">Created</p>
                <p className="font-medium text-white">{formatDate(issue.createdAt)}</p>
              </div>
              {issue.dueDate && (
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-500 mb-1">Due Date</p>
                  <p className="font-medium text-white">{formatDate(issue.dueDate)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Attachments Section */}
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Paperclip className="w-5 h-5" /> Attachments
            </CardTitle>
            <div>
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleFileUpload}
                className="hidden"
                id="file-upload"
              />
              <Button 
                variant="secondary" 
                onClick={() => fileInputRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-2"
              >
                {uploading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    Uploading...
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" /> Add Attachment
                  </>
                )}
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {issue.attachments && issue.attachments.length > 0 ? (
              <div className="space-y-2">
                {issue.attachments.map((attachment: any) => (
                  <div
                    key={attachment.id}
                    className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                  >
                    <div className="flex items-center gap-3">
                      <FileText className="w-5 h-5 text-blue-400" />
                      <div>
                        <p className="text-white font-medium">{attachment.fileName}</p>
                        <p className="text-sm text-gray-500">
                          {(attachment.fileSize / 1024).toFixed(1)} KB • Uploaded by {attachment.uploader?.name}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <a
                        href={attachment.fileUrl}
                        download={attachment.fileName}
                        className="p-2 text-gray-400 hover:text-blue-400 transition-colors"
                        title="Download"
                      >
                        <Download className="w-4 h-4" />
                      </a>
                      <button
                        onClick={() => handleDeleteAttachment(attachment.id)}
                        className="p-2 text-gray-400 hover:text-red-400 transition-colors"
                        title="Delete"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 text-center py-4">No attachments yet</p>
            )}
          </CardContent>
        </Card>
      </main>
    </div>
  )
}
