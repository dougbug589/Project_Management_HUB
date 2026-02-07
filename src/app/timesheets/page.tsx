"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card"
import { Select } from "@/components/ui/Form"
import { formatDate } from "@/lib/utils"
import { Clock, Timer, Hourglass, CheckCircle, Filter, Search, Calendar, User } from "lucide-react"
import { TimerWidget } from "@/components/TimerWidget"
import { WeeklyTimesheet } from "@/components/WeeklyTimesheet"




export default function TimesheetsPage() {
  const [timesheets, setTimesheets] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filterStatus, setFilterStatus] = useState("")
  const [allTasks, setAllTasks] = useState<any[]>([])
  const [allProjects, setAllProjects] = useState<any[]>([])
  const [selectedProject, setSelectedProject] = useState("")
  const [timerTaskId, setTimerTaskId] = useState("")
  const [logForm, setLogForm] = useState({ taskId: "", hours: "", date: "", description: "" })
  const [logLoading, setLogLoading] = useState(false)
  const [currentUser, setCurrentUser] = useState<any>(null)
  const [userLoading, setUserLoading] = useState(true)
  const [weeklyRefreshKey, setWeeklyRefreshKey] = useState(0)
  const router = useRouter()



  useEffect(() => {
    fetchTimesheets()
    fetchAllTasks()
    fetchAllProjects()
    fetchCurrentUser()
  }, [filterStatus])

  useEffect(() => {
    if (selectedProject) {
      fetchTimesheets()
    }
  }, [selectedProject])

  const fetchCurrentUser = async () => {
    setUserLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/users/me", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setCurrentUser(data.data)
      }
    } catch (error) {
      // ignore
    } finally {
      setUserLoading(false)
    }
  }

  const fetchAllProjects = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/projects", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAllProjects(data.data || [])
        if (!selectedProject && data.data?.length > 0) setSelectedProject(data.data[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch projects:", error)
    }
  }

  const fetchAllTasks = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/tasks", {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setAllTasks(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch tasks:", error)
    }
  }

  const fetchTimesheets = async () => {
    try {
      const token = localStorage.getItem("token")
      let url = "/api/timesheets?mine=true"
      if (selectedProject) url += `&projectId=${selectedProject}`
      if (filterStatus) url += `&status=${filterStatus}`
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      })
      if (res.ok) {
        const data = await res.json()
        setTimesheets(data.data || [])
      }
    } catch (error) {
      console.error("Failed to fetch timesheets:", error)
    } finally {
      setLoading(false)
    }
  }

  const totalHours = timesheets.reduce((sum, ts) => sum + (ts.hoursLogged || 0), 0)

  return (
    <div className="min-h-screen bg-gray-900 p-8">
      <main className="max-w-7xl mx-auto space-y-6">
        {/* Timer-based Tracking */}
        <div className="mb-8 bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Timer</h2>
          <form className="flex flex-col md:flex-row md:items-end gap-4 mb-4" onSubmit={e => { e.preventDefault(); }}>
            <div className="flex-1">
              <label className="block text-gray-300 mb-1">Task</label>
              <select
                className="w-full rounded p-2 bg-gray-900 text-white border border-gray-700"
                value={timerTaskId}
                onChange={e => setTimerTaskId(e.target.value)}
                required
              >
                <option value="">Select task</option>
                {allTasks.map((task: any) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>
            <button
              type="button"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
              disabled={!timerTaskId}
              onClick={async () => {
                if (!timerTaskId) return
                try {
                  const token = localStorage.getItem("token")
                  const res = await fetch("/api/timesheets/timer", {
                    method: "POST",
                    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                    body: JSON.stringify({ taskId: timerTaskId, action: "start" }),
                  })
                  if (res.ok) {
                    setTimerTaskId("")
                  } else {
                    const data = await res.json()
                    alert(data.message || "Failed to start timer")
                  }
                } catch (error) {
                  alert("Failed to start timer")
                }
              }}
            >
              Start Timer
            </button>
          </form>
          <TimerWidget />
        </div>

        {/* Weekly Timesheet Summary */}
        <div className="mb-8 bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Weekly Timesheet</h2>
          <div className="mb-4">
            <label className="block text-gray-300 mb-1">Project</label>
            <select
              className="w-full rounded p-2 bg-gray-900 text-white border border-gray-700"
              value={selectedProject}
              onChange={e => setSelectedProject(e.target.value)}
            >
              {allProjects.map((project: any) => (
                <option key={project.id} value={project.id}>{project.name}</option>
              ))}
            </select>
          </div>
          {selectedProject && <WeeklyTimesheet projectId={selectedProject} refreshKey={weeklyRefreshKey} />}
        </div>
        <div className="mb-8 bg-gray-800 rounded-xl p-6">
          <h2 className="text-2xl font-bold text-white mb-4">Log Time</h2>
          <form
            className="flex flex-col md:flex-row md:items-end gap-4"
            onSubmit={async (e) => {
              e.preventDefault()
              setLogLoading(true)
              try {
                const token = localStorage.getItem("token")
                const res = await fetch("/api/timesheets", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                  body: JSON.stringify({
                    taskId: logForm.taskId,
                    hoursLogged: parseFloat(logForm.hours),
                    date: logForm.date,
                    description: logForm.description,
                  }),
                })
                if (res.ok) {
                  setLogForm({ taskId: "", hours: "", date: "", description: "" })
                  fetchTimesheets()
                  setWeeklyRefreshKey((k) => k + 1)
                  router.refresh()
                } else {
                  const data = await res.json()
                  alert(data.message || "Failed to log time")
                }
              } catch (error) {
                alert("Failed to log time")
              }
              setLogLoading(false)
            }}
          >
            <div className="flex-1">
              <label className="block text-gray-300 mb-1">Task</label>
              <select
                className="w-full rounded p-2 bg-gray-900 text-white border border-gray-700"
                value={logForm.taskId}
                onChange={e => setLogForm(f => ({ ...f, taskId: e.target.value }))}
                required
              >
                <option value="">Select task</option>
                {allTasks.map((task: any) => (
                  <option key={task.id} value={task.id}>{task.title}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Hours</label>
              <input
                type="number"
                min="0.01"
                step="0.01"
                className="w-full rounded p-2 bg-gray-900 text-white border border-gray-700"
                value={logForm.hours}
                onChange={e => setLogForm(f => ({ ...f, hours: e.target.value }))}
                required
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1">Date</label>
              <input
                type="date"
                className="w-full rounded p-2 bg-gray-900 text-white border border-gray-700"
                value={logForm.date}
                onChange={e => setLogForm(f => ({ ...f, date: e.target.value }))}
                required
              />
            </div>
            <div className="flex-1">
              <label className="block text-gray-300 mb-1">Description</label>
              <input
                type="text"
                className="w-full rounded p-2 bg-gray-900 text-white border border-gray-700"
                value={logForm.description}
                onChange={e => setLogForm(f => ({ ...f, description: e.target.value }))}
                placeholder="Optional"
              />
            </div>
            <button
              type="submit"
              className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-2 px-6 rounded disabled:opacity-50"
              disabled={logLoading}
            >
              {logLoading ? "Logging..." : "Log Time"}
            </button>
          </form>
        </div>
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-white mb-2 flex items-center gap-3">
            <Clock className="w-10 h-10 text-amber-500" />
            Timesheets
          </h1>
          <p className="text-gray-400">Track your time and productivity</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Timer className="w-5 h-5 text-blue-500" />
                <span>Total Hours</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-blue-500">{totalHours.toFixed(2)}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Hourglass className="w-5 h-5 text-yellow-500" />
                <span>Pending Approval</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-yellow-500">
                {timesheets.filter((ts) => ts.status === "PENDING").length}
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-500" />
                <span>Approved</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-4xl font-bold text-green-500">
                {timesheets.filter((ts) => ts.status === "APPROVED").length}
              </p>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="w-5 h-5" /> Filter
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Select
              label="Status"
              value={filterStatus}
              onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setFilterStatus(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="APPROVED">Approved</option>
              <option value="REJECTED">Rejected</option>
            </Select>
          </CardContent>
        </Card>

        {loading || userLoading ? (
          <div className="space-y-4">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="h-32 bg-gray-800 rounded-xl animate-pulse"></div>
            ))}
          </div>
        ) : timesheets.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <Search className="w-12 h-12 mx-auto mb-4 text-gray-600" />
              <p className="text-gray-400">No timesheets found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-4">
            {timesheets.map((timesheet: any) => (
              <Card key={timesheet.id} className="hover:border-amber-500 transition-colors">
                <CardContent className="py-4">
                  <div className="flex justify-between items-start">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-500" />
                        <span>{timesheet.task?.title || "Unknown Task"}</span>
                      </h3>
                      {timesheet.description && (
                        <p className="text-sm text-gray-400 mt-2 line-clamp-2">{timesheet.description}</p>
                      )}
                      <div className="flex flex-wrap gap-3 mt-3">
                        <div className="px-3 py-2 bg-gray-900 rounded-lg border border-gray-700 flex items-center gap-2">
                          <Timer className="w-4 h-4 text-blue-500" />
                          <span className="text-sm font-bold text-blue-500">{timesheet.hoursLogged}h</span>
                        </div>
                        <div className="px-3 py-2 bg-gray-900 rounded-lg border border-gray-700 flex items-center gap-2">
                          <Calendar className="w-4 h-4 text-gray-400" />
                          <span className="text-xs font-medium text-white">{formatDate(timesheet.date)}</span>
                        </div>
                        {timesheet.approver && (
                          <div className="px-3 py-2 bg-gray-900 rounded-lg border border-gray-700 flex items-center gap-2">
                            <User className="w-4 h-4 text-gray-400" />
                            <span className="text-xs font-medium text-white">{timesheet.approver.name}</span>
                          </div>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-xs font-medium text-white ${
                          timesheet.status === "APPROVED"
                            ? "bg-green-600"
                            : timesheet.status === "REJECTED"
                            ? "bg-red-600"
                            : "bg-yellow-600"
                        }`}
                      >
                        {timesheet.status}
                      </span>
                      {/* Approval buttons for managers on PENDING timesheets */}
                      {currentUser?.role === "MANAGER" && timesheet.status === "PENDING" && (
                        <div className="flex gap-2 mt-2">
                          <button
                            className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs font-bold"
                            onClick={async () => {
                              const token = localStorage.getItem("token")
                              await fetch(`/api/timesheets/${timesheet.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ status: "APPROVED" }),
                              })
                              fetchTimesheets()
                            }}
                          >
                            Approve
                          </button>
                          <button
                            className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs font-bold"
                            onClick={async () => {
                              const token = localStorage.getItem("token")
                              await fetch(`/api/timesheets/${timesheet.id}`, {
                                method: "PATCH",
                                headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
                                body: JSON.stringify({ status: "REJECTED" }),
                              })
                              fetchTimesheets()
                            }}
                          >
                            Reject
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
