"use client"

import { useState, useEffect } from "react"
import AppLayout from "@/components/AppLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"
import { Modal } from "@/components/ui/Modal"

interface Timesheet {
  id: string
  userId: string
  userName: string
  userEmail: string
  weekStartDate: string
  totalHours: number
  status: "PENDING" | "APPROVED" | "REJECTED"
  submittedAt: string
  reviewedAt?: string
  reviewedBy?: string
  rejectionReason?: string
  entries: Array<{
    id: string
    taskId: string
    taskTitle: string
    date: string
    hoursLogged: number
  }>
}

export default function TimesheetApprovalsPage() {
  const [timesheets, setTimesheets] = useState<Timesheet[]>([])
  const [selectedTimesheet, setSelectedTimesheet] = useState<Timesheet | null>(null)
  const [loading, setLoading] = useState(true)
  const [showRejectModal, setShowRejectModal] = useState(false)
  const [rejectionReason, setRejectionReason] = useState("")
  const [processing, setProcessing] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadTimesheets()
  }, [])

  const loadTimesheets = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/timesheets-approval")
      const data = await response.json()
      if (data.success) {
        setTimesheets(data.data || [])
      }
    } catch (error) {
      console.error("Failed to load timesheets:", error)
    } finally {
      setLoading(false)
    }
  }

  const handleApprove = async (timesheetId: string) => {
    setProcessing(true)
    setMessage("")
    try {
      const response = await fetch("/api/timesheets-approval", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timesheetId,
          action: "approve",
        }),
      })

      if (response.ok) {
        setMessage("✓ Timesheet approved successfully")
        loadTimesheets()
        setSelectedTimesheet(null)
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("✗ Failed to approve timesheet")
      }
    } catch (error) {
      console.error("Failed to approve timesheet:", error)
      setMessage("✗ Error approving timesheet")
    } finally {
      setProcessing(false)
    }
  }

  const handleReject = async () => {
    if (!selectedTimesheet || !rejectionReason.trim()) {
      alert("Please provide a rejection reason")
      return
    }

    setProcessing(true)
    setMessage("")
    try {
      const response = await fetch("/api/timesheets-approval", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          timesheetId: selectedTimesheet.id,
          action: "reject",
          rejectionReason,
        }),
      })

      if (response.ok) {
        setMessage("✓ Timesheet rejected successfully")
        setShowRejectModal(false)
        setRejectionReason("")
        loadTimesheets()
        setSelectedTimesheet(null)
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("✗ Failed to reject timesheet")
      }
    } catch (error) {
      console.error("Failed to reject timesheet:", error)
      setMessage("✗ Error rejecting timesheet")
    } finally {
      setProcessing(false)
    }
  }

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      PENDING: "bg-yellow-100 text-yellow-800",
      APPROVED: "bg-green-100 text-green-800",
      REJECTED: "bg-red-100 text-red-800",
    }
    return colors[status] || "bg-gray-100 text-gray-800"
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Timesheet Approvals</h1>
          <p className="text-gray-600 mt-2">Review and approve timesheets from your team</p>
        </div>

        {message && (
          <div className={`p-4 rounded ${message.startsWith("✓") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}

        {/* Rejection Modal */}
        <Modal open={showRejectModal} onClose={() => setShowRejectModal(false)} title="Reject Timesheet">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">Rejection Reason</label>
              <textarea
                value={rejectionReason}
                onChange={(e) => setRejectionReason(e.target.value)}
                placeholder="Explain why you're rejecting this timesheet..."
                rows={4}
                className="w-full border rounded px-3 py-2"
              />
            </div>
            <div className="flex gap-3">
              <Button
                onClick={handleReject}
                disabled={processing}
                className="flex-1 bg-red-600 hover:bg-red-700 text-white"
              >
                {processing ? "Rejecting..." : "Reject"}
              </Button>
              <Button
                onClick={() => {
                  setShowRejectModal(false)
                  setRejectionReason("")
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-800"
              >
                Cancel
              </Button>
            </div>
          </div>
        </Modal>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Timesheets List */}
          <div className="lg:col-span-1">
            <Card className="p-4 bg-white sticky top-4">
              <h2 className="font-semibold mb-4">Pending Reviews</h2>
              {loading ? (
                <div className="text-center py-8 text-gray-500 text-sm">Loading...</div>
              ) : timesheets.filter((t) => t.status === "PENDING").length === 0 ? (
                <div className="text-center py-8 text-gray-500 text-sm">No pending timesheets</div>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto">
                  {timesheets
                    .filter((t) => t.status === "PENDING")
                    .map((timesheet) => (
                      <button
                        key={timesheet.id}
                        onClick={() => setSelectedTimesheet(timesheet)}
                        className={`w-full text-left p-3 rounded border-2 transition text-sm ${
                          selectedTimesheet?.id === timesheet.id
                            ? "border-blue-500 bg-blue-50"
                            : "border-gray-200 hover:border-gray-300 bg-white"
                        }`}
                      >
                        <h3 className="font-semibold truncate">{timesheet.userName}</h3>
                        <p className="text-xs text-gray-500">{timesheet.totalHours}h submitted</p>
                      </button>
                    ))}
                </div>
              )}
            </Card>
          </div>

          {/* Timesheet Detail */}
          <div className="lg:col-span-3">
            {selectedTimesheet ? (
              <Card className="p-6 bg-white">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <h2 className="text-2xl font-bold">{selectedTimesheet.userName}</h2>
                    <p className="text-gray-600 text-sm">{selectedTimesheet.userEmail}</p>
                  </div>
                  <span className={`px-4 py-2 rounded-full font-semibold text-sm ${getStatusColor(selectedTimesheet.status)}`}>
                    {selectedTimesheet.status}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-4 mb-6 p-4 bg-gray-50 rounded">
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Week Starting</p>
                    <p className="text-lg font-semibold">{new Date(selectedTimesheet.weekStartDate).toLocaleDateString()}</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Total Hours</p>
                    <p className="text-lg font-semibold">{selectedTimesheet.totalHours}h</p>
                  </div>
                  <div>
                    <p className="text-xs text-gray-600 uppercase">Submitted</p>
                    <p className="text-sm font-semibold">{new Date(selectedTimesheet.submittedAt).toLocaleString()}</p>
                  </div>
                </div>

                {/* Entries Table */}
                <div className="mb-6 overflow-x-auto">
                  <h3 className="font-semibold mb-3">Time Entries</h3>
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b border-gray-200">
                        <th className="text-left py-2 px-3">Date</th>
                        <th className="text-left py-2 px-3">Task</th>
                        <th className="text-right py-2 px-3">Hours</th>
                      </tr>
                    </thead>
                    <tbody>
                      {selectedTimesheet.entries.map((entry) => (
                        <tr key={entry.id} className="border-b border-gray-100 hover:bg-gray-50">
                          <td className="py-2 px-3 text-gray-600">
                            {new Date(entry.date).toLocaleDateString()}
                          </td>
                          <td className="py-2 px-3">{entry.taskTitle}</td>
                          <td className="py-2 px-3 text-right font-semibold">{entry.hoursLogged}h</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {/* Rejection Reason (if rejected) */}
                {selectedTimesheet.status === "REJECTED" && selectedTimesheet.rejectionReason && (
                  <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm font-semibold text-red-800 mb-1">Rejection Reason:</p>
                    <p className="text-sm text-red-700">{selectedTimesheet.rejectionReason}</p>
                  </div>
                )}

                {/* Action Buttons */}
                {selectedTimesheet.status === "PENDING" && (
                  <div className="flex gap-3">
                    <Button
                      onClick={() => handleApprove(selectedTimesheet.id)}
                      disabled={processing}
                      className="flex-1 bg-green-600 hover:bg-green-700 text-white"
                    >
                      {processing ? "Processing..." : "✓ Approve"}
                    </Button>
                    <Button
                      onClick={() => setShowRejectModal(true)}
                      disabled={processing}
                      className="flex-1 bg-red-600 hover:bg-red-700 text-white"
                    >
                      ✗ Reject
                    </Button>
                  </div>
                )}
              </Card>
            ) : (
              <Card className="p-12 bg-white flex items-center justify-center">
                <div className="text-center text-gray-500">
                  <p>Select a timesheet to review</p>
                </div>
              </Card>
            )}
          </div>
        </div>
      </div>
    </AppLayout>
  )
}
