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

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { title, description, status, completed } = body

    const sub = await prisma.subTask.findUnique({
      where: { id },
      include: { task: { include: { assignees: { select: { userId: true } } } } },
    })
    if (!sub) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    const access = await ensureProjectAccess(user.id, sub.task.projectId)
    const isAssignee = sub.task.assignees.some((a) => a.userId === user.id)
    const isCreator = sub.task.createdBy === user.id

    if (!canEdit(access.role, isAssignee, isCreator)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    const updated = await prisma.subTask.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(completed !== undefined && { completed }),
      },
    })

    return NextResponse.json({ success: true, message: "Subtask updated", data: updated })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update subtask error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const sub = await prisma.subTask.findUnique({
      where: { id },
      include: { task: { include: { assignees: { select: { userId: true } } } } },
    })
    if (!sub) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    const access = await ensureProjectAccess(user.id, sub.task.projectId)
    const isAssignee = sub.task.assignees.some((a) => a.userId === user.id)
    const isCreator = sub.task.createdBy === user.id

    if (!canEdit(access.role, isAssignee, isCreator)) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    await prisma.subTask.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Subtask deleted" })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete subtask error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
