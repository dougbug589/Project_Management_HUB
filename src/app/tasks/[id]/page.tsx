"use client"

import { useEffect, useState, useRef } from "react"
import { useParams, useRouter } from "next/navigation"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input, Select, Textarea } from "@/components/ui/Form"
import { formatDate } from "@/lib/utils"
import { Tabs } from "@/components/ui/Tabs"
import { 
  CheckSquare, Pencil, Trash2, X, Plus, MessageSquare, 
  Paperclip, Upload, Download, FileText, ListTodo, Link2, 
  CheckCircle, Circle, User, Calendar, FolderKanban
} from "lucide-react"

interface Subtask {
  id: string
  title: string
  description?: string
  status: string
  createdAt: string
}

interface Dependency {
  id: string
  dependsOnId: string
  dependsOn: { id: string; title: string; status: string }
}

export default function TaskDetailPage() {
  const params = useParams()
  const router = useRouter()
  const taskId = params?.id as string
  const fileInputRef = useRef<HTMLInputElement>(null)

  const [task, setTask] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [isEditing, setIsEditing] = useState(false)
  const [activeTab, setActiveTab] = useState("overview")
  const [form, setForm] = useState<any>({})
  const [comments, setComments] = useState<any[]>([])
  const [newComment, setNewComment] = useState("")
  const [attachments, setAttachments] = useState<any[]>([])
  const [subtasks, setSubtasks] = useState<Subtask[]>([])
  const [dependencies, setDependencies] = useState<Dependency[]>([])
  const [newSubtaskTitle, setNewSubtaskTitle] = useState("")
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [selectedDependency, setSelectedDependency] = useState("")
  const [addingDependency, setAddingDependency] = useState(false)
  const [uploading, setUploading] = useState(false)

  useEffect(() => {
    if (taskId) {
      fetchTask()
      fetchComments()
      fetchSubtasks()
      fetchDependencies()
      fetchAllTasks()
    }
  }, [taskId])

  const fetchAllTasks = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAllTasks(data.data?.filter((t: any) => t.id !== taskId) || [])
      }
    } catch (error) {
      console.error("Failed to fetch all tasks:", error)
    }
  }
  const handleAddDependency = async () => {
    if (!selectedDependency) return
    setAddingDependency(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/task-dependencies", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ parentTaskId: selectedDependency, childTaskId: taskId }),
      })
      if (res.ok) {
        setSelectedDependency("")
        fetchDependencies()
      } else {
        const data = await res.json()
        alert(data.message || "Failed to add dependency")
      }
    } catch (error) {
      console.error("Add dependency error:", error)
      alert("Failed to add dependency")
    }
    setAddingDependency(false)
  }

  const fetchTask = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/tasks/${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTask(data.data)
        setForm({
          title: data.data.title,
          description: data.data.description || "",
          status: data.data.status,
          priority: data.data.priority,
          dueDate: data.data.dueDate ? new Date(data.data.dueDate).toISOString().slice(0, 10) : "",
        })
        setAttachments(data.data.attachments || [])
      }
    } catch (error) {
      console.error("Failed to fetch task:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchComments = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/comments?taskId=${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setComments(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch comments:", error)
    }
  }

  const fetchSubtasks = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/subtasks?taskId=${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setSubtasks(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch subtasks:", error)
    }
  }

  const fetchDependencies = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/task-dependencies?taskId=${taskId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setDependencies(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch dependencies:", error)
    }
  }

  const handleUpdate = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setIsEditing(false)
        fetchTask()
      } else {
        alert("Failed to update task")
      }
    } catch (error) {
      console.error("Update task error:", error)
      alert("Failed to update task")
    }
  }

  const handleDelete = async () => {
    if (!confirm("Delete this task?")) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/tasks/${taskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        router.push("/tasks")
      } else {
        alert("Failed to delete task")
      }
    } catch (error) {
      console.error("Delete task error:", error)
      alert("Failed to delete task")
    }
  }

  const handleAddComment = async () => {
    if (!newComment.trim()) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/comments", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ content: newComment, taskId }),
      })

      if (res.ok) {
        setNewComment("")
        fetchComments()
      }
    } catch (error) {
      console.error("Add comment error:", error)
    }
  }

  const handleAddSubtask = async () => {
    if (!newSubtaskTitle.trim()) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/subtasks", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ title: newSubtaskTitle, taskId }),
      })

      if (res.ok) {
        setNewSubtaskTitle("")
        fetchSubtasks()
      }
    } catch (error) {
      console.error("Add subtask error:", error)
    }
  }

  const handleToggleSubtask = async (subtask: Subtask) => {
    const newStatus = subtask.status === "DONE" ? "TODO" : "DONE"
    try {
      const token = localStorage.getItem("token")
      await fetch(`/api/subtasks/${subtask.id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status: newStatus }),
      })
      fetchSubtasks()
    } catch (error) {
      console.error("Toggle subtask error:", error)
    }
  }

  const handleDeleteSubtask = async (subtaskId: string) => {
    try {
      const token = localStorage.getItem("token")
      await fetch(`/api/subtasks/${subtaskId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })
      fetchSubtasks()
    } catch (error) {
      console.error("Delete subtask error:", error)
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
            taskId,
          }),
        })
        if (res.ok) fetchTask()
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
      fetchTask()
    } catch (error) {
      console.error("Delete attachment error:", error)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full animate-spin mx-auto"></div>
          <p className="text-gray-400">Loading task...</p>
        </div>
      </div>
    )
  }

  if (!task) {
    return (
      <div className="min-h-screen bg-gray-900 p-8 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="text-center py-12">
            <CheckSquare className="w-12 h-12 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">Task not found</p>
          </CardContent>
        </Card>
      </div>
    )
  }

  const completedSubtasks = subtasks.filter(s => s.status === "DONE").length

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <CheckSquare className="w-10 h-10 text-blue-500" />
              {task.title}
            </h1>
            <p className="text-gray-400">Task details and activity</p>
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
        {isEditing ? (
          <Card>
            <CardHeader>
              <CardTitle>Edit Task</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Title"
                value={form.title}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, title: e.target.value })}
              />
              <Textarea
                label="Description"
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })}
                rows={4}
              />
              <div className="grid grid-cols-2 gap-4">
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
              <Button onClick={handleUpdate}>Save Changes</Button>
            </CardContent>
          </Card>
        ) : null}

        <Tabs
          tabs={[
            { id: "overview", label: "Overview" },
            { id: "subtasks", label: `Subtasks (${completedSubtasks}/${subtasks.length})` },
            { id: "comments", label: `Comments (${comments.length})` },
            { id: "attachments", label: `Attachments (${attachments.length})` },
            { id: "dependencies", label: `Dependencies (${dependencies.length})` },
          ]}
          value={activeTab}
          onChange={setActiveTab}
        />

        {activeTab === "overview" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="w-5 h-5" /> Task Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-500 mb-2">Status</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                    task.status === "DONE" ? "bg-green-600" :
                    task.status === "IN_PROGRESS" ? "bg-blue-600" :
                    task.status === "IN_REVIEW" ? "bg-purple-600" :
                    task.status === "BLOCKED" ? "bg-red-600" : "bg-gray-600"
                  }`}>{task.status}</span>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-500 mb-2">Priority</p>
                  <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium text-white ${
                    task.priority === "URGENT" ? "bg-red-600" :
                    task.priority === "HIGH" ? "bg-orange-600" :
                    task.priority === "MEDIUM" ? "bg-yellow-600" : "bg-gray-600"
                  }`}>{task.priority}</span>
                </div>
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-500 mb-2">Project</p>
                  <p className="text-white flex items-center gap-2">
                    <FolderKanban className="w-4 h-4" /> {task.project?.name || "N/A"}
                  </p>
                </div>
              </div>
              <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                <p className="text-sm text-gray-500 mb-2">Description</p>
                <p className="text-gray-300">{task.description || "No description"}</p>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                  <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Created</p>
                  <p className="font-medium text-white">{formatDate(task.createdAt)}</p>
                </div>
                {task.dueDate && (
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><Calendar className="w-3 h-3" /> Due Date</p>
                    <p className="font-medium text-white">{formatDate(task.dueDate)}</p>
                  </div>
                )}
                {task.assignees?.length > 0 && (
                  <div className="p-4 bg-gray-800 rounded-lg border border-gray-700 col-span-2">
                    <p className="text-sm text-gray-500 mb-1 flex items-center gap-1"><User className="w-3 h-3" /> Assignees</p>
                    <p className="font-medium text-white">{task.assignees.map((a: any) => a.user.name).join(", ")}</p>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {activeTab === "subtasks" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><ListTodo className="w-5 h-5" /> Add Subtask</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex gap-2">
                  <Input
                    label=""
                    value={newSubtaskTitle}
                    onChange={(e: React.ChangeEvent<HTMLInputElement>) => setNewSubtaskTitle(e.target.value)}
                    placeholder="Enter subtask title..."
                    onKeyDown={(e: React.KeyboardEvent) => e.key === "Enter" && handleAddSubtask()}
                  />
                  <Button onClick={handleAddSubtask} className="flex items-center gap-2">
                    <Plus className="w-4 h-4" /> Add
                  </Button>
                </div>
              </CardContent>
            </Card>

            {subtasks.length > 0 ? (
              <Card>
                <CardContent className="py-4">
                  <div className="space-y-2">
                    {subtasks.map((subtask) => (
                      <div
                        key={subtask.id}
                        className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                      >
                        <div className="flex items-center gap-3">
                          <button
                            onClick={() => handleToggleSubtask(subtask)}
                            className={`${subtask.status === "DONE" ? "text-green-500" : "text-gray-500"} hover:text-green-400`}
                          >
                            {subtask.status === "DONE" ? <CheckCircle className="w-5 h-5" /> : <Circle className="w-5 h-5" />}
                          </button>
                          <span className={`${subtask.status === "DONE" ? "text-gray-500 line-through" : "text-white"}`}>
                            {subtask.title}
                          </span>
                        </div>
                        <button
                          onClick={() => handleDeleteSubtask(subtask.id)}
                          className="text-gray-400 hover:text-red-400"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <ListTodo className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No subtasks yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "comments" && (
          <div className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2"><MessageSquare className="w-5 h-5" /> Add Comment</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  label=""
                  value={newComment}
                  onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewComment(e.target.value)}
                  rows={3}
                  placeholder="Write your comment... Use @username to mention someone"
                />
                <Button onClick={handleAddComment} className="flex items-center gap-2">
                  <Plus className="w-4 h-4" /> Post Comment
                </Button>
              </CardContent>
            </Card>

            {comments.length > 0 ? (
              <div className="space-y-3">
                {comments.map((comment) => (
                  <Card key={comment.id}>
                    <CardContent className="py-4">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm">
                          {comment.author?.name?.charAt(0) || "?"}
                        </div>
                        <div className="flex-1">
                          <p className="text-sm font-medium text-white">{comment.author?.name}</p>
                          <p className="text-sm text-gray-300 mt-1">{comment.content}</p>
                          <p className="text-xs text-gray-500 mt-2">{formatDate(comment.createdAt)}</p>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <MessageSquare className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No comments yet</p>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        {activeTab === "attachments" && (
          <div className="space-y-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle className="flex items-center gap-2"><Paperclip className="w-5 h-5" /> Attachments</CardTitle>
                <div>
                  <input
                    type="file"
                    ref={fileInputRef}
                    onChange={handleFileUpload}
                    className="hidden"
                  />
                  <Button
                    variant="secondary"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploading}
                    className="flex items-center gap-2"
                  >
                    {uploading ? (
                      <><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" /> Uploading...</>
                    ) : (
                      <><Upload className="w-4 h-4" /> Upload File</>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {attachments.length > 0 ? (
                  <div className="space-y-2">
                    {attachments.map((att) => (
                      <div key={att.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                        <div className="flex items-center gap-3">
                          <FileText className="w-5 h-5 text-blue-400" />
                          <div>
                            <p className="text-white font-medium">{att.fileName}</p>
                            <p className="text-sm text-gray-500">{(att.fileSize / 1024).toFixed(1)} KB</p>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <a href={att.fileUrl} download={att.fileName} className="p-2 text-gray-400 hover:text-blue-400">
                            <Download className="w-4 h-4" />
                          </a>
                          <button onClick={() => handleDeleteAttachment(att.id)} className="p-2 text-gray-400 hover:text-red-400">
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <Paperclip className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                    <p className="text-gray-400">No attachments yet</p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        )}

        {activeTab === "dependencies" && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Link2 className="w-5 h-5" /> Task Dependencies</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="mb-4 flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-sm text-gray-400 mb-1">Add Dependency (Blocked by)</label>
                  <select
                    className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-white"
                    value={selectedDependency}
                    onChange={e => setSelectedDependency(e.target.value)}
                  >
                    <option value="">Select a task...</option>
                    {allTasks.map((t: any) => (
                      <option key={t.id} value={t.id}>{t.title}</option>
                    ))}
                  </select>
                </div>
                <Button onClick={handleAddDependency} disabled={!selectedDependency || addingDependency}>
                  {addingDependency ? "Adding..." : <><Plus className="w-4 h-4" /> Add</>}
                </Button>
              </div>
              {dependencies.length > 0 ? (
                <div className="space-y-2">
                  {dependencies.map((dep) => (
                    <div key={dep.id} className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700">
                      <div className="flex items-center gap-3">
                        <Link2 className="w-4 h-4 text-yellow-500" />
                        <span className="text-white">{dep.dependsOn.title}</span>
                        <span className={`px-2 py-0.5 rounded text-xs ${
                          dep.dependsOn.status === "DONE" ? "bg-green-600 text-white" : "bg-gray-600 text-gray-200"
                        }`}>{dep.dependsOn.status}</span>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Link2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
                  <p className="text-gray-400">No dependencies</p>
                </div>
              )}
            </CardContent>
          </Card>
        )}
      </main>
    </div>
  )
}
