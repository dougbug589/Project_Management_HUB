import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

function canEdit(role: string, isAssignee: boolean, isCreator: boolean) {
  return (
    role === "PROJECT_ADMIN" ||
    role === "PROJECT_MANAGER" ||
    role === "SUPER_ADMIN" ||
    isAssignee ||
    isCreator
  )
}

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get("taskId")
    if (!taskId) return NextResponse.json({ success: false, message: "Task ID is required" }, { status: 400 })

    const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } })
    if (!task) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })

    await ensureProjectAccess(user.id, task.projectId)

    const subs = await prisma.subTask.findMany({ where: { taskId }, orderBy: { createdAt: "asc" } })
    return NextResponse.json({ success: true, data: subs })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get subtasks error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { title, description, taskId, status } = body
    if (!title || !taskId) {
      return NextResponse.json({ success: false, message: "title and taskId are required" }, { status: 400 })
    }

    const task = await prisma.task.findUnique({
      where: { id: taskId },
      include: { assignees: { select: { userId: true } } },
    })
    if (!task) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })

    const access = await ensureProjectAccess(user.id, task.projectId)
    const isAssignee = task.assignees.some((a) => a.userId === user.id)
    const isCreator = task.createdBy === user.id

    if (!canEdit(access.role, isAssignee, isCreator)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const sub = await prisma.subTask.create({
      data: {
        title,
        description,
        taskId,
        status: status || "TODO",
      },
    })

    return NextResponse.json({ success: true, message: "Subtask created", data: sub }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create subtask error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
