import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const issue = await prisma.issue.findUnique({
      where: { id },
      include: {
        reporter: { select: { id: true, name: true, email: true, avatar: true } },
        assignee: { select: { id: true, name: true, email: true, avatar: true } },
        project: { select: { id: true, name: true } },
        attachments: {
          include: {
            uploader: { select: { id: true, name: true } },
          },
          orderBy: { createdAt: "desc" },
        },
      },
    })

    if (!issue) return NextResponse.json({ success: false, message: "Issue not found" }, { status: 404 })

    await ensureProjectAccess(user.id, issue.projectId)

    return NextResponse.json({ success: true, data: issue })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get issue error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
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
    const { title, description, status, priority, severity, dueDate, assigneeId } = body

    const issue = await prisma.issue.findUnique({ where: { id }, select: { projectId: true, reportedBy: true } })
    if (!issue) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    const access = await ensureProjectAccess(user.id, issue.projectId)

    const privileged = ["PROJECT_ADMIN", "PROJECT_MANAGER", "SUPER_ADMIN"]
    const canEdit = privileged.includes(access.role) || issue.reportedBy === user.id
    if (!canEdit) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })

    const updated = await prisma.issue.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(severity && { severity }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(assigneeId !== undefined && { assigneeId }),
      },
    })

    return NextResponse.json({ success: true, message: "Issue updated", data: updated })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update issue error:", error)
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

    const issue = await prisma.issue.findUnique({ where: { id }, select: { projectId: true, reportedBy: true } })
    if (!issue) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    const access = await ensureProjectAccess(user.id, issue.projectId)
    const privileged = ["PROJECT_ADMIN", "PROJECT_MANAGER", "SUPER_ADMIN"]
    if (!privileged.includes(access.role) && issue.reportedBy !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    await prisma.issue.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Issue deleted" })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete issue error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
