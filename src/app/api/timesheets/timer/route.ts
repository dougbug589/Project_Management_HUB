import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ApiError } from "@/lib/errors"

// Timer-based time tracking
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )

    const body = await req.json()
    const { taskId, action } = body // action: 'start' | 'stop'

    if (!taskId || !action) {
      return NextResponse.json(
        { success: false, message: "taskId and action are required" },
        { status: 400 }
      )
    }

    if (action === "start") {
      // Start timer
      const activeTimer = await prisma.timesheet.findFirst({
        where: {
          userId: user.id,
          taskId,
          status: "PENDING",
        },
      })

      if (activeTimer) {
        return NextResponse.json(
          { success: false, message: "Timer already running for this task" },
          { status: 400 }
        )
      }

      const timer = await prisma.timesheet.create({
        data: {
          userId: user.id,
          taskId,
          date: new Date(),
          hoursLogged: 0,
          description: JSON.stringify({ startedAt: new Date().toISOString() }),
          status: "PENDING",
        },
      })

      return NextResponse.json({
        success: true,
        message: "Timer started",
        data: timer,
      })
    } else if (action === "stop") {
      // Stop timer
      const activeTimer = await prisma.timesheet.findFirst({
        where: {
          userId: user.id,
          taskId,
          status: "PENDING",
        },
      })

      if (!activeTimer) {
        return NextResponse.json(
          { success: false, message: "No active timer found" },
          { status: 404 }
        )
      }

      const endTime = new Date()
      let startedAt: Date | null = null
      try {
        const meta = typeof activeTimer.description === "string" ? JSON.parse(activeTimer.description) : null
        if (meta?.startedAt) startedAt = new Date(meta.startedAt)
      } catch {}
      const start = startedAt || activeTimer.date
      const hours = (endTime.getTime() - start.getTime()) / (1000 * 60 * 60)

      const updatedTimer = await prisma.timesheet.update({
        where: { id: activeTimer.id },
        data: {
          hoursLogged: Math.round(hours * 100) / 100,
          description: null,
        },
      })

      return NextResponse.json({
        success: true,
        message: "Timer stopped",
        data: updatedTimer,
      })
    } else {
      return NextResponse.json(
        { success: false, message: "Invalid action. Use 'start' or 'stop'" },
        { status: 400 }
      )
    }
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message =
      error instanceof ApiError ? error.message : "Internal server error"
    console.error("Timer error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

// Get active timer
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )

    const activeTimer = await prisma.timesheet.findFirst({
      where: {
        userId: user.id,
        status: "PENDING",
      },
      include: {
        task: {
          select: { id: true, title: true, projectId: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: activeTimer,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message =
      error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get active timer error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
