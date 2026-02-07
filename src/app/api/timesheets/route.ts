import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get("taskId")
    const projectId = searchParams.get("projectId")
    const mine = searchParams.get("mine") === "true"

    if (!taskId && !projectId) {
      return NextResponse.json({ success: false, message: "taskId or projectId is required" }, { status: 400 })
    }

    const where: Prisma.TimesheetWhereInput = {}

    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } })
      if (!task) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })
      await ensureProjectAccess(user.id, task.projectId)
      where.taskId = taskId
    } else if (projectId) {
      await ensureProjectAccess(user.id, projectId)
      where.task = { projectId }
    }

    if (mine) {
      where.userId = user.id
    }

    const logs = await prisma.timesheet.findMany({
      where,
      orderBy: { date: "desc" },
      include: {
        task: { select: { id: true, title: true, projectId: true } },
      },
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get timesheets error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { taskId, hoursLogged, date, description } = body
    if (!taskId || !hoursLogged || !date) {
      return NextResponse.json({ success: false, message: "taskId, hoursLogged, and date are required" }, { status: 400 })
    }

    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } })
    if (!task) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })

    await ensureProjectAccess(user.id, task.projectId)

    const log = await prisma.timesheet.create({
      data: {
        taskId,
        userId: user.id,
        hoursLogged,
        date: new Date(date),
        description,
        status: "PENDING",
      },
    })

    return NextResponse.json({ success: true, message: "Time logged", data: log }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create timesheet error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
