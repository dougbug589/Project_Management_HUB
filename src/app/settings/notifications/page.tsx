"use client"

import { useState, useEffect } from "react"
import AppLayout from "@/components/AppLayout"
import { Card } from "@/components/ui/Card"
import { Button } from "@/components/ui/Button"

interface NotificationPreference {
  id: string
  userId: string
  emailOnTaskAssignment: boolean
  emailOnStatusChange: boolean
  emailOnComment: boolean
  emailOnMilestoneDeadline: boolean
  emailOnTimesheetApproval: boolean
  digestFrequency: "IMMEDIATE" | "DAILY" | "WEEKLY"
  updatedAt: string
}

export default function NotificationPreferencesPage() {
  const [preferences, setPreferences] = useState<NotificationPreference | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState("")

  useEffect(() => {
    loadPreferences()
  }, [])

  const loadPreferences = async () => {
    setLoading(true)
    try {
      const response = await fetch("/api/notification-preferences")
      const data = await response.json()
      if (data.success) {
        setPreferences(data.data)
      }
    } catch (err) {
      console.error("Failed to load preferences:", err)
    } finally {
      setLoading(false)
    }
  }

  const handleToggle = (field: keyof Omit<NotificationPreference, "id" | "userId" | "updatedAt" | "digestFrequency">) => {
    if (preferences) {
      setPreferences({
        ...preferences,
        [field]: !preferences[field],
      })
    }
  }

  const handleDigestChange = (frequency: "IMMEDIATE" | "DAILY" | "WEEKLY") => {
    if (preferences) {
      setPreferences({
        ...preferences,
        digestFrequency: frequency,
      })
    }
  }

  const handleSave = async () => {
    if (!preferences) return

    setSaving(true)
    setMessage("")
    try {
      const response = await fetch("/api/notification-preferences", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      })

      const data = await response.json()
      if (response.ok) {
        setMessage("✓ Preferences saved successfully")
        setTimeout(() => setMessage(""), 3000)
      } else {
        setMessage("✗ Failed to save preferences")
      }
    } catch (error) {
      console.error("Failed to save preferences:", error)
      setMessage("✗ Error saving preferences")
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">Loading preferences...</div>
        </div>
      </AppLayout>
    )
  }

  if (!preferences) {
    return (
      <AppLayout>
        <div className="flex justify-center items-center h-96">
          <div className="text-gray-500">Failed to load preferences</div>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="space-y-6 max-w-2xl">
        <div>
          <h1 className="text-3xl font-bold">Notification Preferences</h1>
          <p className="text-gray-600 mt-2">Manage how you receive notifications from the platform</p>
        </div>

        {message && (
          <div className={`p-4 rounded ${message.startsWith("✓") ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}>
            {message}
          </div>
        )}

        {/* Email Notifications */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-semibold mb-6">Email Notifications</h2>

          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div>
                <h3 className="font-medium">Task Assignments</h3>
                <p className="text-sm text-gray-600">Get notified when a task is assigned to you</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailOnTaskAssignment}
                onChange={() => handleToggle("emailOnTaskAssignment")}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div>
                <h3 className="font-medium">Status Changes</h3>
                <p className="text-sm text-gray-600">Get notified when task status changes</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailOnStatusChange}
                onChange={() => handleToggle("emailOnStatusChange")}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div>
                <h3 className="font-medium">New Comments</h3>
                <p className="text-sm text-gray-600">Get notified when someone comments on your tasks</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailOnComment}
                onChange={() => handleToggle("emailOnComment")}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div>
                <h3 className="font-medium">Milestone Deadlines</h3>
                <p className="text-sm text-gray-600">Get reminders about upcoming milestone deadlines</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailOnMilestoneDeadline}
                onChange={() => handleToggle("emailOnMilestoneDeadline")}
                className="w-5 h-5"
              />
            </div>

            <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
              <div>
                <h3 className="font-medium">Timesheet Approvals</h3>
                <p className="text-sm text-gray-600">Get notified when your timesheet needs approval</p>
              </div>
              <input
                type="checkbox"
                checked={preferences.emailOnTimesheetApproval}
                onChange={() => handleToggle("emailOnTimesheetApproval")}
                className="w-5 h-5"
              />
            </div>
          </div>
        </Card>

        {/* Digest Settings */}
        <Card className="p-6 bg-white">
          <h2 className="text-lg font-semibold mb-6">Digest Frequency</h2>

          <div className="space-y-3">
            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="immediate"
                name="digest"
                value="IMMEDIATE"
                checked={preferences.digestFrequency === "IMMEDIATE"}
                onChange={() => handleDigestChange("IMMEDIATE")}
                className="w-4 h-4"
              />
              <label htmlFor="immediate" className="flex-1 cursor-pointer">
                <p className="font-medium">Immediate</p>
                <p className="text-sm text-gray-600">Receive notifications as they happen</p>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="daily"
                name="digest"
                value="DAILY"
                checked={preferences.digestFrequency === "DAILY"}
                onChange={() => handleDigestChange("DAILY")}
                className="w-4 h-4"
              />
              <label htmlFor="daily" className="flex-1 cursor-pointer">
                <p className="font-medium">Daily Digest</p>
                <p className="text-sm text-gray-600">Receive a summary email once per day</p>
              </label>
            </div>

            <div className="flex items-center gap-3">
              <input
                type="radio"
                id="weekly"
                name="digest"
                value="WEEKLY"
                checked={preferences.digestFrequency === "WEEKLY"}
                onChange={() => handleDigestChange("WEEKLY")}
                className="w-4 h-4"
              />
              <label htmlFor="weekly" className="flex-1 cursor-pointer">
                <p className="font-medium">Weekly Digest</p>
                <p className="text-sm text-gray-600">Receive a summary email once per week</p>
              </label>
            </div>
          </div>
        </Card>

        {/* Save Button */}
        <div className="flex gap-3">
          <Button
            onClick={handleSave}
            disabled={saving}
            className="bg-blue-600 hover:bg-blue-700 text-white"
          >
            {saving ? "Saving..." : "Save Preferences"}
          </Button>
          <Button
            onClick={loadPreferences}
            className="bg-gray-300 hover:bg-gray-400 text-gray-800"
          >
            Cancel
          </Button>
        </div>
      </div>
    </AppLayout>
  )
}
