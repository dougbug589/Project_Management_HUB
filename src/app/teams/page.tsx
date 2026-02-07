"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import prisma from "@/lib/prisma"
import { Modal } from "@/components/ui/Modal"
import { Input } from "@/components/ui/Form"
import { Button } from "@/components/ui/Button"
import { Dropdown } from "@/components/ui/Dropdown"
import { useRef } from "react"
import { formatDate } from "@/lib/utils"
import { Users, FolderKanban, Calendar, Search, UserPlus, Pencil, Trash2, X, Check, Plus } from "lucide-react"

interface Team {
  id: string
  name: string
  description: string | null
  projectId: string
  project?: { id: string; name: string }
  members: { id: string; user: { id: string; name: string; email: string } }[]
  _count?: { members: number }
  createdAt: string
}

interface Project {
  id: string
  name: string
}

type UserRole = "ADMIN" | "TEAM_LEAD" | "MEMBER" | "CLIENT"

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [allUsers, setAllUsers] = useState<{ id: string; name: string; email: string }[]>([])
  const [inviteUserId, setInviteUserId] = useState("")
  const [inviteTeamId, setInviteTeamId] = useState<string | null>(null)
  // Add User form state
  const [addUserOpen, setAddUserOpen] = useState(false)
  const [newUserName, setNewUserName] = useState("")
  const [newUserEmail, setNewUserEmail] = useState("")
  const [addingUser, setAddingUser] = useState(false)
  const [addUserError, setAddUserError] = useState("")
  const [addUserSuccess, setAddUserSuccess] = useState("")
    // Add User handler
    const handleAddUser = async (e: React.FormEvent) => {
      e.preventDefault()
      setAddingUser(true)
      setAddUserError("")
      setAddUserSuccess("")
      try {
        const token = localStorage.getItem("token")
        const res = await fetch("/api/users", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({ name: newUserName, email: newUserEmail }),
        })
        const data = await res.json()
        if (data.success) {
          setAddUserSuccess("User created!")
          setNewUserName("")
          setNewUserEmail("")
          setAddUserOpen(false)
        } else {
          setAddUserError(data.message || "Failed to create user.")
        }
      } catch (err) {
        setAddUserError("Failed to create user.")
      } finally {
        setAddingUser(false)
      }
    }
  const [loading, setLoading] = useState(true)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [editName, setEditName] = useState("")
  const [editDescription, setEditDescription] = useState("")
  const [showCreateModal, setShowCreateModal] = useState(false)
  const [newTeam, setNewTeam] = useState({ name: "", description: "", projectId: "" })
  const [creating, setCreating] = useState(false)

  // Invite modals/buttons state
  const [inviteOpen, setInviteOpen] = useState(false)
  // removed inviteEmail, now using inviteUserId
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")
  const inviteInputRef = useRef<HTMLInputElement>(null)

  const [orgInviteOpen, setOrgInviteOpen] = useState(false)
  const [orgInviteEmail, setOrgInviteEmail] = useState("")
  const [orgInviteLoading, setOrgInviteLoading] = useState(false)
  const [orgInviteError, setOrgInviteError] = useState("")
  const [orgInviteSuccess, setOrgInviteSuccess] = useState("")
  const orgInviteInputRef = useRef<HTMLInputElement>(null)
  const [userRole, setUserRole] = useState<UserRole>("ADMIN")
  const [orgId, setOrgId] = useState<string | null>(null)

  useEffect(() => {
    fetchTeams()
    fetchProjects()
    fetchUsers()
    // Simulate fetching user role and orgId (replace with real logic)
    const storedRole = localStorage.getItem("role") as UserRole | null
    if (storedRole) setUserRole(storedRole)
    const storedOrgId = localStorage.getItem("orgId")
    if (storedOrgId) setOrgId(storedOrgId)
  }, [])

  const fetchUsers = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/users", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAllUsers(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch users:", error)
    }
  }
  // Invite Member handler
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError("")
    setInviteSuccess("")
    const token = localStorage.getItem("token")
    try {
      const res = await fetch(`/api/teams/${inviteTeamId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userId: inviteUserId }),
      })
      const data = await res.json()
      if (data.success) {
        setInviteSuccess("User added to team!")
        setInviteUserId("")
        fetchTeams()
      } else {
        setInviteError(data.message || "Failed to add user.")
      }
    } catch (err) {
      setInviteError("Failed to add user.")
    } finally {
      setInviteLoading(false)
    }
  }

  // Invite to Organization handler (Admin only)
  const handleOrgInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setOrgInviteLoading(true)
    setOrgInviteError("")
    setOrgInviteSuccess("")
    const token = localStorage.getItem("token")
    if (!orgId) {
      setOrgInviteError("No organization selected.")
      setOrgInviteLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/organizations/${orgId}/members`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: orgInviteEmail }),
      })
      const data = await res.json()
      if (data.success) {
        setOrgInviteSuccess("Invitation sent!")
        setOrgInviteEmail("")
        fetchTeams()
      } else {
        setOrgInviteError(data.message || "Failed to invite member.")
      }
    } catch (err) {
      setOrgInviteError("Failed to invite member.")
    } finally {
      setOrgInviteLoading(false)
    }
  }

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/teams", {
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        const data = await res.json()
        setTeams(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch teams:", error)
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

  const handleEdit = (team: Team) => {
    setEditingId(team.id)
    setEditName(team.name)
    setEditDescription(team.description || "")
  }

  const handleCancelEdit = () => {
    setEditingId(null)
    setEditName("")
    setEditDescription("")
  }

  const handleUpdate = async (teamId: string) => {
    if (!editName.trim()) return

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/teams/${teamId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: editName.trim(),
          description: editDescription.trim() || null,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setTeams(teams.map((t) => (t.id === teamId ? data.data : t)))
        handleCancelEdit()
      } else {
        const data = await res.json()
        alert(data.message || "Failed to update team")
      }
    } catch (error) {
      console.error("Failed to update team:", error)
      alert("Failed to update team")
    }
  }

  const handleDelete = async (team: Team) => {
    if (!confirm(`Are you sure you want to delete "${team.name}"? This will remove all team members.`)) {
      return
    }

    try {
      const token = localStorage.getItem("token")
      const res = await fetch(`/api/teams/${team.id}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      })

      if (res.ok) {
        setTeams(teams.filter((t) => t.id !== team.id))
      } else {
        const data = await res.json()
        alert(data.message || "Failed to delete team")
      }
    } catch (error) {
      console.error("Failed to delete team:", error)
      alert("Failed to delete team")
    }
  }

  const handleCreate = async () => {
    if (!newTeam.name.trim() || !newTeam.projectId) {
      alert("Name and project are required")
      return
    }

    setCreating(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/teams", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          name: newTeam.name.trim(),
          description: newTeam.description.trim() || null,
          projectId: newTeam.projectId,
        }),
      })

      if (res.ok) {
        const data = await res.json()
        setTeams([data.data, ...teams])
        setShowCreateModal(false)
        setNewTeam({ name: "", description: "", projectId: "" })
      } else {
        const data = await res.json()
        alert(data.message || "Failed to create team")
      }
    } catch (error) {
      console.error("Failed to create team:", error)
      alert("Failed to create team")
    } finally {
      setCreating(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      {/* Invite Modals */}
      <Modal open={inviteOpen} onClose={() => {
        setInviteOpen(false)
        setInviteError("")
        setInviteSuccess("")
        setInviteUserId("")
        setInviteTeamId(null)
      }}>
        <form onSubmit={handleInvite} className="bg-gray-900 p-6 rounded-lg w-full max-w-md mx-auto">
          <h3 className="text-lg font-bold mb-4 text-white">Invite Team Member</h3>
          {/* User dropdown, filter out users already in team */}
          <Dropdown
            label="Select user to invite"
            value={inviteUserId}
            options={(() => {
              const team = teams.find(t => t.id === inviteTeamId)
              const memberIds = team ? team.members.map(m => m.user.id) : []
              return allUsers
                .filter(u => !memberIds.includes(u.id))
                .map(u => ({ label: `${u.name} (${u.email})`, value: u.id }))
            })()}
            onChange={setInviteUserId}
            placeholder="Select user..."
            disabled={inviteLoading}
          />
          {inviteError && <div className="text-red-400 text-sm mb-2">{inviteError}</div>}
          {inviteSuccess && <div className="text-green-400 text-sm mb-2">{inviteSuccess}</div>}
          <div className="flex gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)} disabled={inviteLoading}>Cancel</Button>
            <Button type="submit" loading={inviteLoading} disabled={inviteLoading || !inviteUserId}>Invite</Button>
          </div>
        </form>
      </Modal>
      <Modal open={orgInviteOpen} onClose={() => { setOrgInviteOpen(false); setOrgInviteError(""); setOrgInviteSuccess("") }}>
        <form onSubmit={handleOrgInvite} className="bg-gray-900 p-6 rounded-lg w-full max-w-md mx-auto">
          <h3 className="text-lg font-bold mb-4 text-white">Invite to Organization</h3>
          <Input
            ref={orgInviteInputRef}
            type="email"
            placeholder="Email address"
            value={orgInviteEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setOrgInviteEmail(e.target.value)}
            required
            className="mb-3"
            autoFocus
          />
          {orgInviteError && <div className="text-red-400 text-sm mb-2">{orgInviteError}</div>}
          {orgInviteSuccess && <div className="text-green-400 text-sm mb-2">{orgInviteSuccess}</div>}
          <div className="flex gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setOrgInviteOpen(false)} disabled={orgInviteLoading}>Cancel</Button>
            <Button type="submit" loading={orgInviteLoading} disabled={orgInviteLoading || !orgInviteEmail}>Invite</Button>
          </div>
        </form>
      </Modal>
      <main className="max-w-7xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          {/* Add User Modal */}
          {addUserOpen && (
            <Modal open={addUserOpen} onClose={() => { setAddUserOpen(false); setAddUserError(""); setAddUserSuccess("") }}>
              <form onSubmit={handleAddUser} className="bg-gray-900 p-6 rounded-lg w-full max-w-md mx-auto">
                <h3 className="text-lg font-bold mb-4 text-white">Add User (Demo)</h3>
                <input
                  type="text"
                  placeholder="Name"
                  value={newUserName}
                  onChange={e => setNewUserName(e.target.value)}
                  required
                  className="mb-3 w-full px-3 py-2 rounded bg-gray-800 text-white"
                  autoFocus
                />
                <input
                  type="email"
                  placeholder="Email address"
                  value={newUserEmail}
                  onChange={e => setNewUserEmail(e.target.value)}
                  required
                  className="mb-3 w-full px-3 py-2 rounded bg-gray-800 text-white"
                />
                {addUserError && <div className="text-red-400 text-sm mb-2">{addUserError}</div>}
                {addUserSuccess && <div className="text-green-400 text-sm mb-2">{addUserSuccess}</div>}
                <div className="flex gap-2 mt-4">
                  <Button type="button" variant="secondary" onClick={() => setAddUserOpen(false)} disabled={addingUser}>Cancel</Button>
                  <Button type="submit" loading={addingUser} disabled={addingUser || !newUserName || !newUserEmail}>Add User</Button>
                </div>
              </form>
            </Modal>
          )}
          <div>
            <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
              <Users className="w-10 h-10 text-cyan-500" />
              Teams
            </h1>
            <p className="text-gray-400">Manage your project teams</p>
          </div>
          <div className="flex gap-2">
            <Button onClick={() => setAddUserOpen(true)} variant="primary">Add User (Demo)</Button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
            >
              <Plus className="w-4 h-4" />
              Create Team
            </button>
            {userRole === "ADMIN" && (
              <Button onClick={() => setOrgInviteOpen(true)} variant="secondary">Invite to Organization</Button>
            )}
          </div>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3, 4, 5, 6].map((i) => (
              <div key={i} className="h-48 bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : teams.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No teams found</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="mt-4 px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors"
              >
                Create your first team
              </button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {teams.map((team) => (
              <Card key={team.id} className="hover:border-cyan-500 transition-colors group relative">
                {/* Edit/Delete buttons */}
                <div className="absolute top-3 right-3 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                  {editingId !== team.id && (
                    <>
                      <button
                        onClick={() => handleEdit(team)}
                        className="p-1.5 bg-gray-700 hover:bg-gray-600 rounded-lg transition-colors"
                        title="Edit team"
                      >
                        <Pencil className="w-4 h-4 text-gray-300" />
                      </button>
                      <button
                        onClick={() => handleDelete(team)}
                        className="p-1.5 bg-gray-700 hover:bg-red-600 rounded-lg transition-colors"
                        title="Delete team"
                      >
                        <Trash2 className="w-4 h-4 text-gray-300" />
                      </button>
                    </>
                  )}
                </div>

                <CardHeader>
                  {editingId === team.id ? (
                    <div className="space-y-2">
                      <input
                        type="text"
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                        placeholder="Team name"
                        autoFocus
                      />
                      <textarea
                        value={editDescription}
                        onChange={(e) => setEditDescription(e.target.value)}
                        className="w-full px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                        placeholder="Description (optional)"
                        rows={2}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleUpdate(team.id)}
                          className="flex items-center gap-1 px-3 py-1 bg-green-600 hover:bg-green-700 text-white rounded-lg text-sm"
                        >
                          <Check className="w-4 h-4" /> Save
                        </button>
                        <button
                          onClick={handleCancelEdit}
                          className="flex items-center gap-1 px-3 py-1 bg-gray-600 hover:bg-gray-700 text-white rounded-lg text-sm"
                        >
                          <X className="w-4 h-4" /> Cancel
                        </button>
                      </div>
                    </div>
                  ) : (
                    <CardTitle className="flex items-center gap-2">
                      <Users className="w-5 h-5 text-cyan-500" />
                      <span>{team.name}</span>
                    </CardTitle>
                  )}
                </CardHeader>

                {editingId !== team.id && (
                  <CardContent className="space-y-3">
                                        <div className="flex justify-end mt-2">
                                          <Button
                                            size="sm"
                                            variant="primary"
                                            onClick={() => {
                                              setInviteOpen(true)
                                              setInviteTeamId(team.id)
                                              setInviteUserId("")
                                              setInviteError("")
                                              setInviteSuccess("")
                                            }}
                                          >
                                            Invite Member
                                          </Button>
                                        </div>
                    {team.description && (
                      <p className="text-sm text-gray-400 line-clamp-2">{team.description}</p>
                    )}
                    <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                      <p className="text-xs text-gray-500 flex items-center gap-1">
                        <FolderKanban className="w-3 h-3" /> Project
                      </p>
                      <p className="text-sm font-medium text-white">{team.project?.name || "N/A"}</p>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <UserPlus className="w-3 h-3" /> Members
                        </p>
                        <p className="text-lg font-bold text-cyan-500">{team._count?.members || 0}</p>
                      </div>
                      <div className="p-3 bg-gray-900 rounded-lg border border-gray-700">
                        <p className="text-xs text-gray-500 flex items-center gap-1">
                          <Calendar className="w-3 h-3" /> Created
                        </p>
                        <p className="text-sm font-medium text-white">{formatDate(team.createdAt)}</p>
                      </div>
                    </div>
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        )}

        {/* Create Team Modal */}
        {showCreateModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-xl p-6 w-full max-w-md border border-gray-700">
              <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                <Users className="w-5 h-5 text-cyan-500" />
                Create Team
              </h2>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Team Name *
                  </label>
                  <input
                    type="text"
                    value={newTeam.name}
                    onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                    placeholder="Enter team name"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Project *
                  </label>
                  <select
                    value={newTeam.projectId}
                    onChange={(e) => setNewTeam({ ...newTeam, projectId: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500"
                  >
                    <option value="">Select a project</option>
                    {projects.map((project) => (
                      <option key={project.id} value={project.id}>
                        {project.name}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-300 mb-1">
                    Description
                  </label>
                  <textarea
                    value={newTeam.description}
                    onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-900 border border-gray-600 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-cyan-500 resize-none"
                    placeholder="Enter description (optional)"
                    rows={3}
                  />
                </div>
              </div>
              <div className="flex justify-end gap-3 mt-6">
                <button
                  onClick={() => {
                    setShowCreateModal(false)
                    setNewTeam({ name: "", description: "", projectId: "" })
                  }}
                  className="px-4 py-2 bg-gray-600 hover:bg-gray-700 text-white rounded-lg transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={handleCreate}
                  disabled={creating}
                  className="px-4 py-2 bg-cyan-600 hover:bg-cyan-700 text-white rounded-lg transition-colors disabled:opacity-50"
                >
                  {creating ? "Creating..." : "Create Team"}
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
