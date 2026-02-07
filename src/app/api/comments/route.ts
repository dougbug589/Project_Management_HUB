import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"
import { notifyCommentAdded, parseMentionsAndNotify } from "@/lib/notifications"

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
    const taskId = searchParams.get("taskId")
    const projectId = searchParams.get("projectId")

    if (!taskId && !projectId) {
      return NextResponse.json(
        { success: false, message: "Task ID or Project ID is required" },
        { status: 400 }
      )
    }

    let where: any = {}

    if (projectId) {
      await ensureProjectAccess(user.id, projectId)
      where.projectId = projectId
    } else if (taskId) {
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

      await ensureProjectAccess(user.id, task.projectId)
      where.taskId = taskId
    }

    const comments = await prisma.comment.findMany({
      where,
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
        replies: {
          include: {
            author: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({
      success: true,
      data: comments,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get comments error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { content, taskId, projectId, parentId } = body

    if (!content) {
      return NextResponse.json(
        { success: false, message: "Content is required" },
        { status: 400 }
      )
    }

    if (!taskId && !projectId) {
      return NextResponse.json(
        { success: false, message: "Task ID or Project ID is required" },
        { status: 400 }
      )
    }

    let targetProjectId = projectId || null

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

      await ensureProjectAccess(user.id, task.projectId)
      targetProjectId = task.projectId
    } else if (projectId) {
      await ensureProjectAccess(user.id, projectId)
    }

    const comment = await prisma.comment.create({
      data: {
        content,
        taskId,
        projectId: targetProjectId,
        parentId,
        authorId: user.id,
      },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    if (targetProjectId) {
      await prisma.activityLog.create({
        data: {
          action: "COMMENTED",
          entity: "comment",
          entityId: comment.id,
          projectId: targetProjectId,
          userId: user.id,
        },
      })

      // Notify task assignees if commenting on a task
      if (taskId) {
        const task = await prisma.task.findUnique({
          where: { id: taskId },
          select: { assignees: { select: { userId: true } } },
        })
        if (task) {
          const assigneeIds = task.assignees.map((a) => a.userId)
          await notifyCommentAdded(taskId, assigneeIds, user.id)
        }
      }

      // Parse @mentions and notify mentioned users
      await parseMentionsAndNotify(
        content,
        user.id,
        targetProjectId,
        taskId ? "task" : "project",
        taskId || comment.id
      )
    }

    return NextResponse.json({
      success: true,
      data: comment,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create comment error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { id, content } = body

    if (!id || !content) {
      return NextResponse.json(
        { success: false, message: "Comment ID and content are required" },
        { status: 400 }
      )
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true, projectId: true },
    })

    if (!existingComment) {
      return NextResponse.json(
        { success: false, message: "Comment not found" },
        { status: 404 }
      )
    }

    if (existingComment.authorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You can only edit your own comments" },
        { status: 403 }
      )
    }

    const comment = await prisma.comment.update({
      where: { id },
      data: { content, updatedAt: new Date() },
      include: {
        author: {
          select: { id: true, name: true, avatar: true },
        },
      },
    })

    return NextResponse.json({
      success: true,
      data: comment,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update comment error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")

    if (!id) {
      return NextResponse.json(
        { success: false, message: "Comment ID is required" },
        { status: 400 }
      )
    }

    const existingComment = await prisma.comment.findUnique({
      where: { id },
      select: { authorId: true, projectId: true },
    })

    if (!existingComment) {
      return NextResponse.json(
        { success: false, message: "Comment not found" },
        { status: 404 }
      )
    }

    if (existingComment.authorId !== user.id) {
      return NextResponse.json(
        { success: false, message: "You can only delete your own comments" },
        { status: 403 }
      )
    }

    await prisma.comment.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Comment deleted successfully",
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete comment error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}
