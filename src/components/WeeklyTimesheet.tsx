"use client"

import { useState, useEffect } from "react"
import { Loader } from "./ui/Loader"

type DayData = {
  date: string
  totalHours: number
  entries: Array<{
    id: string
    hoursLogged: number
    description: string | null
    task: { id: string; title: string }
  }>
}

type WeeklyData = {
  weekStart: string
  weekEnd: string
  days: DayData[]
  totalHours: number
}

export function WeeklyTimesheet({ projectId, refreshKey }: { projectId: string, refreshKey?: number }) {
  const [data, setData] = useState<WeeklyData | null>(null)
  const [loading, setLoading] = useState(true)
  const [weekOffset, setWeekOffset] = useState(0)

  useEffect(() => {
    fetchWeeklyData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [weekOffset, projectId, refreshKey])

  const fetchWeeklyData = async () => {
    setLoading(true)
    try {
      const token = localStorage.getItem("token")
      const res = await fetch(
        `/api/timesheets/weekly?projectId=${projectId}&weekOffset=${weekOffset}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      const result = await res.json()
      if (result.success) {
        setData(result.data)
      }
    } catch (error) {
      console.error("Failed to fetch weekly timesheet:", error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) return <Loader />
  if (!data) return <div>No data</div>

  const formatDate = (dateStr: string) => {
    const d = new Date(dateStr)
    return d.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
  }

  return (
    <div className="bg-gray-900 rounded-lg border border-gray-700 p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-medium text-white">Weekly Timesheet</h3>
        <div className="flex gap-2">
          <button
            onClick={() => setWeekOffset(weekOffset - 1)}
            className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-800 text-gray-300"
          >
            ← Prev
          </button>
          <button
            onClick={() => setWeekOffset(weekOffset + 1)}
            disabled={weekOffset >= 0}
            className="px-3 py-1 text-sm border border-gray-600 rounded hover:bg-gray-800 disabled:opacity-50 text-gray-300"
          >
            Next →
          </button>
        </div>
      </div>

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="border-b">
            <tr>
              <th className="text-left py-2">Day</th>
              <th className="text-right py-2">Hours</th>
              <th className="text-left py-2 pl-4">Tasks</th>
            </tr>
          </thead>
          <tbody>
            {data.days.map((day) => (
              <tr key={day.date} className="border-b">
                <td className="py-2">{formatDate(day.date)}</td>
                <td className="text-right py-2 font-medium">{day.totalHours.toFixed(2)}</td>
                <td className="py-2 pl-4 text-gray-400">
                  {day.entries.length > 0
                    ? day.entries.map((e) => e.task.title).join(", ")
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="font-bold border-t-2">
            <tr>
              <td className="py-2">Total</td>
              <td className="text-right py-2">{data.totalHours.toFixed(2)}</td>
              <td className="py-2 pl-4"></td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  )
}
