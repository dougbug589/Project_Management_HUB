import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const taskId = searchParams.get("taskId")
    const issueId = searchParams.get("issueId")

    if (!projectId && !taskId && !issueId) {
      return NextResponse.json(
        { success: false, message: "projectId, taskId, or issueId is required" },
        { status: 400 }
      )
    }

    let where: any = {}
    let targetProjectId = projectId

    if (taskId) {
      const task = await prisma.task.findUnique({
        where: { id: taskId },
        select: { projectId: true },
      })
      if (!task) {
        return NextResponse.json(
          { success: false, message: "Task not found" },
          { status: 404 }
        )
      }
      targetProjectId = task.projectId
      where.taskId = taskId
    } else if (issueId) {
      const issue = await prisma.issue.findUnique({
        where: { id: issueId },
        select: { projectId: true },
      })
      if (!issue) {
        return NextResponse.json(
          { success: false, message: "Issue not found" },
          { status: 404 }
        )
      }
      targetProjectId = issue.projectId
      where.issueId = issueId
    } else if (projectId) {
      where.projectId = projectId
    }

    if (!targetProjectId) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      )
    }

    await ensureProjectAccess(user.id, targetProjectId)

    const attachments = await prisma.attachment.findMany({
      where,
      include: {
        uploader: {
          select: { id: true, name: true, avatar: true },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: attachments,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get attachments error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { fileName, fileSize, fileType, fileUrl, projectId, taskId, issueId } = body

    if (!fileName || !fileUrl || (!projectId && !taskId && !issueId)) {
      return NextResponse.json(
        { success: false, message: "fileName, fileUrl and projectId, taskId, or issueId are required" },
        { status: 400 }
      )
    }

    let targetProjectId = projectId
    
    if (taskId) {
      const task = await prisma.task.findUnique({ where: { id: taskId }, select: { projectId: true } })
      if (!task) return NextResponse.json({ success: false, message: "Task not found" }, { status: 404 })
      targetProjectId = task.projectId
    } else if (issueId) {
      const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { projectId: true } })
      if (!issue) return NextResponse.json({ success: false, message: "Issue not found" }, { status: 404 })
      targetProjectId = issue.projectId
    }

    if (!targetProjectId) return NextResponse.json({ success: false, message: "Project not found" }, { status: 404 })

    await ensureProjectAccess(user.id, targetProjectId)

    const attachment = await prisma.attachment.create({
      data: {
        fileName,
        fileSize: fileSize || 0,
        fileType: fileType || "application/octet-stream",
        fileUrl,
        projectId: targetProjectId,
        taskId: taskId || null,
        issueId: issueId || null,
        uploadedBy: user.id,
      },
    })

    return NextResponse.json({ success: true, message: "Attachment saved", data: attachment }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create attachment error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
