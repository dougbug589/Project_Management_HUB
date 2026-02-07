import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

// Get weekly timesheets
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const userId = searchParams.get("userId") || user.id
    const weekOffset = parseInt(searchParams.get("weekOffset") || "0") // 0 = current week, -1 = last week, etc.

    if (!projectId) {
      return NextResponse.json(
        { success: false, message: "projectId is required" },
        { status: 400 }
      )
    }

    await ensureProjectAccess(user.id, projectId)

    // Calculate week start and end
    const now = new Date()
    const weekStart = new Date(now)
    weekStart.setDate(now.getDate() - now.getDay() + weekOffset * 7) // Start of week (Sunday)
    weekStart.setHours(0, 0, 0, 0)

    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // End of week (Saturday)
    weekEnd.setHours(23, 59, 59, 999)

    const timesheets = await prisma.timesheet.findMany({
      where: {
        userId,
        task: { projectId },
        date: {
          gte: weekStart,
          lte: weekEnd,
        },
      },
      include: {
        task: {
          select: { id: true, title: true },
        },
      },
      orderBy: { date: "asc" },
    })

    // Group by day
    const weekData = Array.from({ length: 7 }, (_, i) => {
      const date = new Date(weekStart)
      date.setDate(weekStart.getDate() + i)
      const dateStr = date.toISOString().split("T")[0]

      const dayTimesheets = timesheets.filter(
        (ts) => ts.date.toISOString().split("T")[0] === dateStr
      )

      return {
        date: dateStr,
        totalHours: dayTimesheets.reduce((sum, ts) => sum + ts.hoursLogged, 0),
        entries: dayTimesheets,
      }
    })

    const totalWeekHours = weekData.reduce((sum, day) => sum + day.totalHours, 0)

    return NextResponse.json({
      success: true,
      data: {
        weekStart: weekStart.toISOString(),
        weekEnd: weekEnd.toISOString(),
        days: weekData,
        totalHours: totalWeekHours,
      },
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message =
      error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get weekly timesheets error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
