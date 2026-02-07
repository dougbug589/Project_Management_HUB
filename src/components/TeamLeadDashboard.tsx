

"use client"
import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "./ui/Card"
import { Loader } from "./ui/Loader"
import { Modal } from "./ui/Modal"
import { Input } from "./ui/Form"
import { Dropdown } from "./ui/Dropdown"
import { Button } from "./ui/Button"
import { useRef } from "react"
// Invite Member Modal

type Task = {
  id: string
  title: string
  status: string
  priority: string
  assignee: string
  dueDate?: string
  projectId: string
}

type Approval = {
  id: string
  type: "TIMESHEET" | "ISSUE" | "LEAVE"
  title: string
  status: string
  submittedBy: string
  submittedAt: string
}

type SprintPhase = {
  id: string
  name: string
  startDate: string
  endDate: string
  status: string
  progress: number
}

type TeamMember = {
  id: string
  name: string
  status: "ONLINE" | "AWAY" | "OFFLINE"
  currentTask?: string
}

type UserRole = "ADMIN" | "TEAM_LEAD" | "MEMBER" | "CLIENT"

export function TeamLeadDashboard() {
  const [tasks, setTasks] = useState<Task[]>([])
  const [approvals, setApprovals] = useState<Approval[]>([])
  const [sprints, setSprints] = useState<SprintPhase[]>([])
  const [teamMembers, setTeamMembers] = useState<TeamMember[]>([])
  const [loading, setLoading] = useState(true)
  // Org Invite Modal state
  const [orgInviteOpen, setOrgInviteOpen] = useState(false)
  const [orgInviteEmail, setOrgInviteEmail] = useState("")
  const [orgInviteLoading, setOrgInviteLoading] = useState(false)
  const [orgInviteError, setOrgInviteError] = useState("")
  const [orgInviteSuccess, setOrgInviteSuccess] = useState("")
  const orgInviteInputRef = useRef<HTMLInputElement>(null)
  // User role (simulate fetch or get from context/auth)
  const [userRole, setUserRole] = useState<UserRole>("TEAM_LEAD")
  // Org id (simulate fetch or get from context/auth)
  const [orgId, setOrgId] = useState<string | null>(null)
  // Invite Member Modal state
  const [inviteOpen, setInviteOpen] = useState(false)
  const [inviteEmail, setInviteEmail] = useState("")
  const [inviteLoading, setInviteLoading] = useState(false)
  const [inviteError, setInviteError] = useState("")
  const [inviteSuccess, setInviteSuccess] = useState("")
  const inviteInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    fetchData()
    // Simulate fetching user role and orgId (replace with real logic)
    const storedRole = localStorage.getItem("role") as UserRole | null
    if (storedRole) setUserRole(storedRole)
    const storedOrgId = localStorage.getItem("orgId")
    if (storedOrgId) setOrgId(storedOrgId)
  }, [])
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
        fetchData()
      } else {
        setOrgInviteError(data.message || "Failed to invite member.")
      }
    } catch (err) {
      setOrgInviteError("Failed to invite member.")
    } finally {
      setOrgInviteLoading(false)
    }
  }

  const fetchData = async () => {
    try {
      const token = localStorage.getItem("token")
      const [tasksRes, approvalsRes, sprintsRes, teamRes] = await Promise.all([
        fetch("/api/tasks", {
          headers: { Authorization: `Bearer ${token}` },
        }),
        fetch("/api/approvals", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch("/api/sprints", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
        fetch("/api/teams/members", {
          headers: { Authorization: `Bearer ${token}` },
        }).catch(() => null),
      ])
      
      const tasksData = await tasksRes.json()
      if (tasksData.success) setTasks(tasksData.data)

      if (approvalsRes) {
        const approvalsData = await approvalsRes.json()
        if (approvalsData.success) setApprovals(approvalsData.data)
      }

      if (sprintsRes) {
        const sprintsData = await sprintsRes.json()
        if (sprintsData.success) setSprints(sprintsData.data)
      }

      if (teamRes) {
        const teamData = await teamRes.json()
        if (teamData.success) setTeamMembers(teamData.data)
      }
    } catch (error) {
      console.error("Failed to fetch data:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader />

  // Team tasks overview
  const teamTasksStatus = {
    total: tasks.length,
    inProgress: tasks.filter((t) => t.status === "IN_PROGRESS").length,
    completed: tasks.filter((t) => t.status === "DONE").length,
    blocked: tasks.filter((t) => t.status === "BLOCKED").length,
  }

  // Pending approvals
  const pendingApprovals = approvals.filter((a) => a.status === "PENDING")

  // Sprint progress
  const activeSprint = sprints.find((s) => s.status === "ACTIVE")

  // Invite Member handler
  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault()
    setInviteLoading(true)
    setInviteError("")
    setInviteSuccess("")
    const token = localStorage.getItem("token")
    try {
      const res = await fetch("/api/teams/members", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ email: inviteEmail }),
      })
      const data = await res.json()
      if (data.success) {
        setInviteSuccess("Invitation sent!")
        setInviteEmail("")
        fetchData() // refresh team members
      } else {
        setInviteError(data.message || "Failed to invite member.")
      }
    } catch (err) {
      setInviteError("Failed to invite member.")
    } finally {
      setInviteLoading(false)
    }
  }


  return (
    <div className="space-y-6">
      {/* Invite to Organization Modal (Admin only) */}
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

      {/* Invite Member Modal */}
      <Modal open={inviteOpen} onClose={() => { setInviteOpen(false); setInviteError(""); setInviteSuccess("") }}>
        <form onSubmit={handleInvite} className="bg-gray-900 p-6 rounded-lg w-full max-w-md mx-auto">
          <h3 className="text-lg font-bold mb-4 text-white">Invite Team Member</h3>
          <Input
            ref={inviteInputRef}
            type="email"
            placeholder="Email address"
            value={inviteEmail}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) => setInviteEmail(e.target.value)}
            required
            className="mb-3"
            autoFocus
          />
          {inviteError && <div className="text-red-400 text-sm mb-2">{inviteError}</div>}
          {inviteSuccess && <div className="text-green-400 text-sm mb-2">{inviteSuccess}</div>}
          <div className="flex gap-2 mt-4">
            <Button type="button" variant="secondary" onClick={() => setInviteOpen(false)} disabled={inviteLoading}>Cancel</Button>
            <Button type="submit" loading={inviteLoading} disabled={inviteLoading || !inviteEmail}>Invite</Button>
          </div>
        </form>
      </Modal>

      <div className="flex justify-between items-center mb-2">
        <h2 className="text-2xl font-bold text-white">Team Lead Dashboard</h2>
        <div className="flex gap-2">
          <Button onClick={() => setInviteOpen(true)} variant="primary">Invite Member</Button>
          {userRole === "ADMIN" && (
            <Button onClick={() => setOrgInviteOpen(true)} variant="secondary">Invite to Organization</Button>
          )}
        </div>
      </div>

      {/* Team Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Team Tasks</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-white">{teamTasksStatus.total}</div>
            <p className="text-xs text-gray-400 mt-2">Total assigned</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">In Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-blue-400">{teamTasksStatus.inProgress}</div>
            <p className="text-xs text-gray-400 mt-2">Active tasks</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Pending Approvals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${pendingApprovals.length > 0 ? "text-orange-400" : "text-green-400"}`}>
              {pendingApprovals.length}
            </div>
            <p className="text-xs text-gray-400 mt-2">Awaiting review</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle className="text-sm">Team Members</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-purple-400">{teamMembers.length}</div>
            <p className="text-xs text-gray-400 mt-2">Active members</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Team Tasks Overview */}
        <Card>
          <CardHeader>
            <CardTitle>Team Tasks Overview</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-400">In Progress</span>
                <span className="text-lg font-bold text-blue-400">{teamTasksStatus.inProgress}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Completed</span>
                <span className="text-lg font-bold text-green-400">{teamTasksStatus.completed}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-400">Blocked</span>
                <span className="text-lg font-bold text-red-400">{teamTasksStatus.blocked}</span>
              </div>
              <div className="mt-4 pt-4 border-t border-gray-700">
                <div className="flex justify-between mb-2">
                  <span className="text-xs text-gray-400">Completion Rate</span>
                  <span className="text-sm font-bold text-white">
                    {teamTasksStatus.total > 0 ? Math.round((teamTasksStatus.completed / teamTasksStatus.total) * 100) : 0}%
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-green-500 h-2 rounded-full"
                    style={{
                      width: `${teamTasksStatus.total > 0 ? (teamTasksStatus.completed / teamTasksStatus.total) * 100 : 0}%`,
                    }}
                  ></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Sprint/Phase Progress */}
        <Card>
          <CardHeader>
            <CardTitle>Sprint / Phase Progress</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {activeSprint ? (
                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-sm font-medium text-white">{activeSprint.name}</h3>
                    <span className="text-xs bg-blue-600 text-white px-2 py-1 rounded">Active</span>
                  </div>
                  <div className="flex justify-between text-xs text-gray-400 mb-2">
                    <span>Progress</span>
                    <span>{activeSprint.progress}%</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2.5">
                    <div
                      className="bg-blue-500 h-2.5 rounded-full transition-all"
                      style={{ width: `${activeSprint.progress}%` }}
                    ></div>
                  </div>
                </div>
              ) : (
                <p className="text-gray-400 text-sm">No active sprint</p>
              )}
              <div className="mt-4">
                <p className="text-xs text-gray-400 mb-3">All Sprints</p>
                {sprints.slice(0, 3).map((sprint) => (
                  <div key={sprint.id} className="flex items-center justify-between text-xs mb-2">
                    <span className="text-gray-300">{sprint.name}</span>
                    <span
                      className={`px-2 py-1 rounded ${
                        sprint.status === "COMPLETED"
                          ? "bg-green-900/30 text-green-400"
                          : sprint.status === "ACTIVE"
                          ? "bg-blue-900/30 text-blue-400"
                          : "bg-gray-700 text-gray-400"
                      }`}
                    >
                      {sprint.progress}%
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Pending Approvals */}
      {pendingApprovals.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>📋 Pending Approvals ({pendingApprovals.length})</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {pendingApprovals.slice(0, 5).map((approval) => (
                <div
                  key={approval.id}
                  className="p-3 bg-orange-900/20 border border-orange-700 rounded flex justify-between items-start"
                >
                  <div className="flex-1">
                    <p className="text-sm font-medium text-orange-400">{approval.title}</p>
                    <p className="text-xs text-gray-400">
                      {approval.type} • from {approval.submittedBy}
                    </p>
                  </div>
                  <span className="text-xs bg-orange-700 text-white px-2 py-1 rounded">PENDING</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Team Members Status */}
      <Card>
        <CardHeader>
          <CardTitle>Team Members Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {teamMembers.map((member) => (
              <div
                key={member.id}
                className="p-3 border border-gray-700 rounded-lg bg-gray-800"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-sm font-medium text-white flex items-center gap-2">
                      {member.name}
                      <span
                        className={`w-2 h-2 rounded-full ${
                          member.status === "ONLINE"
                            ? "bg-green-500"
                            : member.status === "AWAY"
                            ? "bg-yellow-500"
                            : "bg-gray-500"
                        }`}
                      ></span>
                    </p>
                    <p className="text-xs text-gray-400 mt-1">
                      {member.currentTask ? `Working on: ${member.currentTask}` : "No active task"}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      {/* Team Overview */}
    </div>
  )
}
