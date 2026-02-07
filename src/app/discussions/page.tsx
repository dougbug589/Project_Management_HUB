"use client"

import { useState, useEffect, useCallback } from "react"
import { useSearchParams } from "next/navigation"
import AppLayout from "@/components/AppLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"
import { MessageSquare, Pencil, Trash2 } from "lucide-react"

interface Discussion {
  id: string
  content: string
  author: { id: string; name: string | null; email: string }
  authorId: string
  createdAt: string
}

export default function DiscussionsPage() {
  const searchParams = useSearchParams()
  const projectId = searchParams.get("projectId") || ""

  const [discussions, setDiscussions] = useState<Discussion[]>([])
  const [loading, setLoading] = useState(true)
  const [showNewModal, setShowNewModal] = useState(false)
  const [newContent, setNewContent] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState("")
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  const loadDiscussions = useCallback(async () => {
    if (!projectId) {
      setLoading(false)
      return
    }

    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/discussions?projectId=${projectId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      if (data.success) {
        setDiscussions(data.data || [])
      }
    } catch (error) {
      console.error("Failed to load discussions:", error)
    } finally {
      setLoading(false)
    }
  }, [projectId])

  useEffect(() => {
    const userData = localStorage.getItem("user")
    if (userData) {
      try {
        const user = JSON.parse(userData)
        setCurrentUserId(user.id)
      } catch {
        // ignore
      }
    }
    loadDiscussions()
  }, [loadDiscussions])

  const handleCreateDiscussion = async () => {
    if (!newContent.trim()) {
      alert("Please enter a message")
      return
    }

    setSubmitting(true)
    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/discussions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          projectId,
          content: newContent,
        }),
      })

      if (response.ok) {
        setNewContent("")
        setShowNewModal(false)
        loadDiscussions()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to create discussion")
      }
    } catch (error) {
      console.error("Failed to create discussion:", error)
      alert("Failed to create discussion")
    } finally {
      setSubmitting(false)
    }
  }

  const handleEditDiscussion = async (id: string) => {
    if (!editContent.trim()) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch("/api/discussions", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          id,
          content: editContent,
        }),
      })

      if (response.ok) {
        setEditingId(null)
        setEditContent("")
        loadDiscussions()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to edit discussion")
      }
    } catch (error) {
      console.error("Failed to edit discussion:", error)
    }
  }

  const handleDeleteDiscussion = async (id: string) => {
    if (!confirm("Delete this message?")) return

    try {
      const token = localStorage.getItem("token")
      const response = await fetch(`/api/discussions?id=${id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (response.ok) {
        loadDiscussions()
      } else {
        const data = await response.json()
        alert(data.error || "Failed to delete discussion")
      }
    } catch (error) {
      console.error("Failed to delete discussion:", error)
    }
  }

  if (!projectId) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96">
          <div className="text-center">
            <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
            <p className="text-gray-400 text-lg">Please select a project first</p>
            <p className="text-gray-500 text-sm mt-2">
              Go to a project page and access discussions from there
            </p>
          </div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-white flex items-center gap-3">
            <MessageSquare className="w-8 h-8 text-blue-500" />
            Project Discussions
          </h1>
          <Button
            onClick={() => setShowNewModal(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            + New Message
          </Button>
        </div>

        {/* New Discussion Modal */}
        <Modal open={showNewModal} onClose={() => setShowNewModal(false)} title="New Discussion Message">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-300">Message</label>
              <textarea
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                placeholder="Share your thoughts with the team..."
                rows={5}
                className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-800 text-white focus:outline-none focus:border-blue-500"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleCreateDiscussion}
                disabled={submitting}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white"
              >
                {submitting ? "Posting..." : "Post Message"}
              </Button>
              <Button
                onClick={() => setShowNewModal(false)}
                className="flex-1 bg-gray-600 hover:bg-gray-700 text-white"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        {/* Discussions List */}
        <Card className="p-6 bg-gray-900 border-gray-700">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="text-gray-400 mt-4">Loading discussions...</p>
            </div>
          ) : discussions.length === 0 ? (
            <div className="text-center py-12">
              <MessageSquare className="w-16 h-16 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400 text-lg">No discussions yet</p>
              <p className="text-gray-500 text-sm mt-2">
                Start the conversation by posting a new message
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {discussions.map((disc) => (
                <div
                  key={disc.id}
                  className="p-4 bg-gray-800 rounded-lg border border-gray-700"
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {(disc.author?.name || disc.author?.email || "?")[0].toUpperCase()}
                      </div>
                      <div>
                        <span className="text-white font-medium">
                          {disc.author?.name || disc.author?.email || "Unknown"}
                        </span>
                        <span className="text-xs text-gray-500 ml-2">
                          {new Date(disc.createdAt).toLocaleString()}
                        </span>
                      </div>
                    </div>
                    {disc.authorId === currentUserId && (
                      <div className="flex gap-2">
                        <button
                          onClick={() => {
                            setEditingId(disc.id)
                            setEditContent(disc.content)
                          }}
                          className="text-blue-400 hover:text-blue-300 p-1"
                          title="Edit"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteDiscussion(disc.id)}
                          className="text-red-400 hover:text-red-300 p-1"
                          title="Delete"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    )}
                  </div>

                  {editingId === disc.id ? (
                    <div className="space-y-3">
                      <textarea
                        value={editContent}
                        onChange={(e) => setEditContent(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:border-blue-500"
                        rows={3}
                      />
                      <div className="flex gap-2">
                        <Button
                          onClick={() => handleEditDiscussion(disc.id)}
                          className="bg-blue-600 hover:bg-blue-700 text-white text-sm"
                        >
                          Save
                        </Button>
                        <Button
                          onClick={() => {
                            setEditingId(null)
                            setEditContent("")
                          }}
                          className="bg-gray-600 hover:bg-gray-700 text-white text-sm"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-gray-300 whitespace-pre-wrap">{disc.content}</p>
                  )}
                </div>
              ))}
            </div>
          )}
        </Card>
      </div>
    </AppLayout>
  )
}
