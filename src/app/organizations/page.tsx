"use client"

import { useEffect, useState } from "react"
import { Button } from "@/components/ui/Button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Input, Textarea } from "@/components/ui/Form"
import { Building2, Plus, X, Users, Mail, Calendar, Pencil, Trash2 } from "lucide-react"
import { formatDate } from "@/lib/utils"

interface Organization {
  id: string
  organization: {
    id: string
    name: string
    description?: string
    billingEmail?: string
    createdAt: string
  }
  role: string
}

export default function OrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [loading, setLoading] = useState(true)
  const [isCreating, setIsCreating] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [form, setForm] = useState({
    name: "",
    description: "",
    billingEmail: "",
  })
  const [editForm, setEditForm] = useState({
    name: "",
    description: "",
    billingEmail: "",
  })

  useEffect(() => {
    fetchOrganizations()
  }, [])

  const fetchOrganizations = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/organizations", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setOrganizations(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch organizations:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreate = async () => {
    if (!form.name) {
      alert("Organization name is required")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/organizations", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(form),
      })

      if (res.ok) {
        setIsCreating(false)
        setForm({ name: "", description: "", billingEmail: "" })
        fetchOrganizations()
      } else {
        alert("Failed to create organization")
      }
    } catch (error) {
      console.error("Create organization error:", error)
      alert("Failed to create organization")
    }
  }

  const handleEdit = (membership: Organization) => {
    setEditingId(membership.organization.id)
    setEditForm({
      name: membership.organization.name,
      description: membership.organization.description || "",
      billingEmail: membership.organization.billingEmail || "",
    })
  }

  const handleUpdate = async (orgId: string) => {
    if (!editForm.name) {
      alert("Organization name is required")
      return
    }

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(editForm),
      })

      if (res.ok) {
        setEditingId(null)
        fetchOrganizations()
      } else {
        const data = await res.json()
        alert(data.message || "Failed to update organization")
      }
    } catch (error) {
      console.error("Update organization error:", error)
      alert("Failed to update organization")
    }
  }

  const handleDelete = async (orgId: string, orgName: string) => {
    if (!confirm(`Are you sure you want to delete "${orgName}"? This will delete all projects and data within this organization.`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/organizations/${orgId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        fetchOrganizations()
      } else {
        const data = await res.json()
        alert(data.message || "Failed to delete organization")
      }
    } catch (error) {
      console.error("Delete organization error:", error)
      alert("Failed to delete organization")
    }
  }

  const canManageOrg = (role: string) => {
    return ["SUPER_ADMIN", "PROJECT_ADMIN"].includes(role)
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-7xl mx-auto space-y-6">
        <div className="mb-8 flex justify-between items-start">
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Building2 className="w-10 h-10 text-purple-500" />
              Organizations
            </h1>
            <p className="text-gray-400">Manage your organizations and teams</p>
          </div>
          <Button
            variant={isCreating ? "secondary" : "primary"}
            onClick={() => setIsCreating(!isCreating)}
            className="flex items-center gap-2"
          >
            {isCreating ? <><X className="w-4 h-4" /> Cancel</> : <><Plus className="w-4 h-4" /> New Organization</>}
          </Button>
        </div>

        {isCreating && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Building2 className="w-5 h-5" /> Create New Organization
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <Input
                label="Organization Name"
                value={form.name}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, name: e.target.value })}
                placeholder="Enter organization name"
                required
              />
              <Textarea
                label="Description"
                value={form.description}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setForm({ ...form, description: e.target.value })}
                placeholder="Describe your organization"
                rows={3}
              />
              <Input
                label="Billing Email"
                type="email"
                value={form.billingEmail}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => setForm({ ...form, billingEmail: e.target.value })}
                placeholder="billing@example.com"
              />
              <Button variant="primary" onClick={handleCreate} className="flex items-center gap-2">
                <Plus className="w-4 h-4" /> Create Organization
              </Button>
            </CardContent>
          </Card>
        )}

        {loading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : organizations.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Building2 className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No organizations yet. Create your first one!</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {organizations.map((membership) => (
              <Card key={membership.id} className="hover:border-purple-500 transition-colors">
                <CardContent className="py-6">
                  {editingId === membership.organization.id ? (
                    <div className="space-y-4">
                      <Input
                        label="Organization Name"
                        value={editForm.name}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, name: e.target.value })}
                        placeholder="Enter organization name"
                      />
                      <Textarea
                        label="Description"
                        value={editForm.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditForm({ ...editForm, description: e.target.value })}
                        placeholder="Describe your organization"
                        rows={2}
                      />
                      <Input
                        label="Billing Email"
                        type="email"
                        value={editForm.billingEmail}
                        onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditForm({ ...editForm, billingEmail: e.target.value })}
                        placeholder="billing@example.com"
                      />
                      <div className="flex gap-2">
                        <Button variant="primary" onClick={() => handleUpdate(membership.organization.id)} className="flex-1">
                          Save
                        </Button>
                        <Button variant="secondary" onClick={() => setEditingId(null)} className="flex-1">
                          Cancel
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-lg bg-purple-600 flex items-center justify-center">
                        <Building2 className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <h3 className="text-lg font-semibold text-white">{membership.organization.name}</h3>
                          {canManageOrg(membership.role) && (
                            <div className="flex gap-1">
                              <button
                                onClick={() => handleEdit(membership)}
                                className="p-1.5 text-gray-500 hover:text-blue-500 transition-colors"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => handleDelete(membership.organization.id, membership.organization.name)}
                                className="p-1.5 text-gray-500 hover:text-red-500 transition-colors"
                                title="Delete"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          )}
                        </div>
                        {membership.organization.description && (
                          <p className="text-sm text-gray-400 mt-1 line-clamp-2">{membership.organization.description}</p>
                        )}
                        <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
                          <span className="flex items-center gap-1">
                            <Users className="w-3 h-3" /> {membership.role}
                          </span>
                          {membership.organization.billingEmail && (
                            <span className="flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {membership.organization.billingEmail}
                            </span>
                          )}
                          <span className="flex items-center gap-1">
                            <Calendar className="w-3 h-3" /> {formatDate(membership.organization.createdAt)}
                          </span>
                        </div>
                      </div>
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
