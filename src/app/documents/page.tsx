"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { formatDate } from "@/lib/utils"
import { FileText, FolderKanban, History, Calendar, Search, ChevronDown, ChevronUp, Download, Upload, Plus, X } from "lucide-react"
import { Input, Textarea } from "@/components/ui/Form"

interface DocumentVersion {
  id: string
  versionNumber: number
  fileUrl: string
  fileName: string
  fileSize: number
  fileType: string
  changeLog?: string
  createdAt: string
  createdByUser?: { name: string }
}

interface Document {
  id: string
  title: string
  description?: string
  currentVersion: number
  project?: { name: string }
  _count?: { versions: number }
  createdAt: string
  versions?: DocumentVersion[]
}

export default function DocumentsPage() {
  const [documents, setDocuments] = useState<Document[]>([])
  const [loading, setLoading] = useState(true)
  const [expandedDoc, setExpandedDoc] = useState<string | null>(null)
  const [versions, setVersions] = useState<Record<string, DocumentVersion[]>>({})
  const [uploadingTo, setUploadingTo] = useState<string | null>(null)
  const [uploadForm, setUploadForm] = useState({ changeLog: "" })

  useEffect(() => {
    fetchDocuments()
  }, [])

  const fetchDocuments = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/documents", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setDocuments(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchVersions = async (documentId: string) => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/documents/${documentId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setVersions((prev) => ({ ...prev, [documentId]: data.data?.versions || [] }))
      }
    } catch (error) {
      console.error("Failed to fetch versions:", error)
    }
  }

  const toggleExpand = (docId: string) => {
    if (expandedDoc === docId) {
      setExpandedDoc(null)
    } else {
      setExpandedDoc(docId)
      if (!versions[docId]) {
        fetchVersions(docId)
      }
    }
  }

  const handleFileUpload = async (docId: string, file: File) => {
    try {
      const token = localStorage.getItem("token")
      if (!token) return

      // Read file as data URL
      const reader = new FileReader()
      reader.onload = async () => {
        const fileUrl = reader.result as string

        const res = await fetch("/api/document-versions", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            documentId: docId,
            fileUrl,
            fileName: file.name,
            fileSize: file.size,
            fileType: file.type,
            changeLog: uploadForm.changeLog,
          }),
        })

        if (res.ok) {
          fetchDocuments()
          fetchVersions(docId)
          setUploadingTo(null)
          setUploadForm({ changeLog: "" })
        }
      }
      reader.readAsDataURL(file)
    } catch (error) {
      console.error("Upload failed:", error)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <FileText className="w-10 h-10 text-emerald-500" />
            Documents
          </h1>
          <p className="text-gray-400">Manage project documentation with version control</p>
        </div>
        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : documents.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No documents found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {documents.map((doc) => (
              <Card key={doc.id} className="hover:border-emerald-500 transition-colors">
                <CardContent className="py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <FileText className="w-5 h-5 text-emerald-500" />
                        <span>{doc.title}</span>
                      </h3>
                      {doc.description && (
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{doc.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-3">
                        <div className="px-3 py-1 bg-gray-900 rounded-lg border border-gray-700 flex items-center gap-1">
                          <FolderKanban className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium text-white">{doc.project?.name}</span>
                        </div>
                        <div className="px-3 py-1 bg-blue-600 text-white rounded-lg">
                          <span className="text-xs font-medium">v{doc.currentVersion}</span>
                        </div>
                        <div className="px-3 py-1 bg-gray-900 rounded-lg border border-gray-700 flex items-center gap-1">
                          <History className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium text-white">{doc._count?.versions || 0} versions</span>
                        </div>
                        <div className="px-3 py-1 bg-gray-900 rounded-lg border border-gray-700 flex items-center gap-1">
                          <Calendar className="w-3 h-3 text-gray-500" />
                          <span className="text-xs font-medium text-white">{formatDate(doc.createdAt)}</span>
                        </div>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="secondary"
                        onClick={() => setUploadingTo(uploadingTo === doc.id ? null : doc.id)}
                        className="flex items-center gap-1"
                      >
                        {uploadingTo === doc.id ? <X className="w-4 h-4" /> : <Upload className="w-4 h-4" />}
                        {uploadingTo === doc.id ? "Cancel" : "Upload"}
                      </Button>
                      <Button
                        variant="secondary"
                        onClick={() => toggleExpand(doc.id)}
                        className="flex items-center gap-1"
                      >
                        <History className="w-4 h-4" />
                        History
                        {expandedDoc === doc.id ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                      </Button>
                    </div>
                  </div>

                  {uploadingTo === doc.id && (
                    <div className="mt-4 p-4 bg-gray-800 rounded-lg border border-gray-700">
                      <h4 className="text-sm font-medium text-white mb-3 flex items-center gap-2">
                        <Plus className="w-4 h-4" /> Upload New Version
                      </h4>
                      <div className="space-y-3">
                        <Textarea
                          label="Change Log"
                          placeholder="Describe what changed in this version..."
                          value={uploadForm.changeLog}
                          onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUploadForm({ changeLog: e.target.value })}
                          rows={2}
                        />
                        <input
                          type="file"
                          onChange={(e) => {
                            const file = e.target.files?.[0]
                            if (file) handleFileUpload(doc.id, file)
                          }}
                          className="block w-full text-sm text-gray-400
                            file:mr-4 file:py-2 file:px-4
                            file:rounded-lg file:border-0
                            file:text-sm file:font-medium
                            file:bg-blue-600 file:text-white
                            hover:file:bg-blue-700"
                        />
                      </div>
                    </div>
                  )}

                  {expandedDoc === doc.id && (
                    <div className="mt-4 border-t border-gray-700 pt-4">
                      <h4 className="text-sm font-medium text-gray-300 mb-3 flex items-center gap-2">
                        <History className="w-4 h-4" /> Version History
                      </h4>
                      {versions[doc.id]?.length === 0 ? (
                        <p className="text-sm text-gray-500">No versions yet.</p>
                      ) : (
                        <div className="space-y-2">
                          {versions[doc.id]?.map((version) => (
                            <div
                              key={version.id}
                              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg border border-gray-700"
                            >
                              <div className="flex items-center gap-4">
                                <span className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center text-white text-sm font-bold">
                                  v{version.versionNumber}
                                </span>
                                <div>
                                  <p className="text-sm text-white">{version.fileName}</p>
                                  <div className="flex items-center gap-2 text-xs text-gray-500">
                                    <span>{formatFileSize(version.fileSize)}</span>
                                    <span>•</span>
                                    <span>{formatDate(version.createdAt)}</span>
                                    {version.createdByUser?.name && (
                                      <>
                                        <span>•</span>
                                        <span>by {version.createdByUser.name}</span>
                                      </>
                                    )}
                                  </div>
                                  {version.changeLog && (
                                    <p className="text-xs text-gray-400 mt-1">{version.changeLog}</p>
                                  )}
                                </div>
                              </div>
                              <a
                                href={version.fileUrl}
                                download={version.fileName}
                                className="p-2 text-gray-400 hover:text-blue-500 transition-colors"
                                title="Download"
                              >
                                <Download className="w-5 h-5" />
                              </a>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
