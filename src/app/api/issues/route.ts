import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"
import { notifyIssueReported } from "@/lib/notifications"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status") as string | null

    // Build where clause - if no projectId, get issues from all accessible projects
    const where: Record<string, unknown> = {}
    
    if (projectId) {
      await ensureProjectAccess(user.id, projectId)
      where.projectId = projectId
    } else {
      // Get all projects user has access to
      const userProjects = await prisma.projectMember.findMany({
        where: { userId: user.id },
        select: { projectId: true },
      })
      const projectIds = userProjects.map(pm => pm.projectId)
      where.projectId = { in: projectIds }
    }
    
    if (status) {
      where.status = status
    }

    const issues = await prisma.issue.findMany({
      where,
      orderBy: { createdAt: "desc" },
      include: {
        reporter: { select: { id: true, name: true, avatar: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
        project: { select: { id: true, name: true } },
      },
    })

    return NextResponse.json({ success: true, data: issues })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get issues error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { title, description, projectId, severity, priority, dueDate, assigneeId } = body
    if (!title || !projectId) {
      return NextResponse.json({ success: false, message: "title and projectId are required" }, { status: 400 })
    }

    await ensureProjectAccess(user.id, projectId)

    const issue = await prisma.issue.create({
      data: {
        title,
        description,
        projectId,
        reportedBy: user.id,
        severity: severity || "MEDIUM",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : undefined,
        assigneeId,
      },
      include: {
        reporter: { select: { id: true, name: true, avatar: true } },
        assignee: { select: { id: true, name: true, avatar: true } },
      },
    })

    // Notify project managers/admins
    await notifyIssueReported(issue.id, projectId, user.id)

    return NextResponse.json({ success: true, message: "Issue created", data: issue }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create issue error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
