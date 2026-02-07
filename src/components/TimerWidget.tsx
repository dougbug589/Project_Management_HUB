"use client"

import { useState, useEffect } from "react"
import { Button } from "./ui/Button"
import { Loader } from "./ui/Loader"

type ActiveTimer = {
  id: string
  taskId: string
  date: string
  status: string
  task: { id: string; title: string; projectId: string }
}

export function TimerWidget({ projectId }: { projectId?: string }) {
  void projectId
  const [activeTimer, setActiveTimer] = useState<ActiveTimer | null>(null)
  const [loading, setLoading] = useState(true)
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    fetchActiveTimer()
  }, [])

  useEffect(() => {
    if (!activeTimer) return
    const interval = setInterval(() => {
      const start = new Date(activeTimer.date).getTime()
      const now = Date.now()
      setElapsed(Math.floor((now - start) / 1000))
    }, 1000)
    return () => clearInterval(interval)
  }, [activeTimer])

  const fetchActiveTimer = async () => {
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/timesheets/timer", {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await res.json()
      if (data.success && data.data) {
        setActiveTimer(data.data)
      }
    } catch (error) {
      console.error("Failed to fetch timer:", error)
    } finally {
      setLoading(false)
    }
  }

  const stopTimer = async () => {
    if (!activeTimer) return
    try {
      const token = localStorage.getItem("token")
      const res = await fetch("/api/timesheets/timer", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          taskId: activeTimer.taskId,
          action: "stop",
        }),
      })
      const data = await res.json()
      if (data.success) {
        setActiveTimer(null)
        setElapsed(0)
      }
    } catch (error) {
      console.error("Failed to stop timer:", error)
    }
  }

  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600)
    const m = Math.floor((seconds % 3600) / 60)
    const s = seconds % 60
    return `${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`
  }

  if (loading) return <Loader />

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
      <h3 className="text-sm font-medium mb-3 text-white">Timer</h3>
      {activeTimer ? (
        <div>
          <div className="text-2xl font-mono font-bold mb-2 text-white">{formatTime(elapsed)}</div>
          <div className="text-sm text-gray-400 mb-3">{activeTimer.task.title}</div>
          <Button size="sm" onClick={stopTimer}>
            Stop Timer
          </Button>
        </div>
      ) : (
        <div className="text-sm text-gray-500">No active timer</div>
      )}
    </div>
  )
}
