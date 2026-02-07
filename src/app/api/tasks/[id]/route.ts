import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"
import { notifyTaskUpdated } from "@/lib/notifications"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        creator: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        project: {
          select: { id: true, name: true, ownerId: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true, email: true },
            },
          },
        },
        comments: {
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
        },
        attachments: {
          select: {
            id: true,
            fileName: true,
            fileSize: true,
            fileType: true,
            fileUrl: true,
            createdAt: true,
          },
        },
        subTasks: true,
        dependencies: {
          include: {
            childTask: {
              select: { id: true, title: true, status: true },
            },
          },
        },
        _count: {
          select: { comments: true, attachments: true, subTasks: true },
        },
      },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      )
    }

    await ensureProjectAccess(user.id, task.projectId)

    return NextResponse.json({
      success: true,
      data: {
        ...task,
        project: { id: task.project.id, name: task.project.name },
      },
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get task error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const {
      title,
      description,
      status,
      priority,
      dueDate,
      startDate,
      estimatedHours,
      actualHours,
    } = body

    const task = await prisma.task.findUnique({
      where: { id },
      include: {
        assignees: { select: { userId: true } },
      },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      )
    }

    const access = await ensureProjectAccess(user.id, task.projectId)

    const isAssignee = task.assignees.some((a) => a.userId === user.id)
    const isCreator = task.createdBy === user.id
    const privilegedRoles = [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ]

    const canEdit =
      privilegedRoles.includes(access.role) || isAssignee || isCreator

    if (!canEdit) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      )
    }


    // Enforce dependency completion before allowing IN_PROGRESS or IN_REVIEW
    if (status === "IN_PROGRESS" || status === "IN_REVIEW") {
      // Find all dependencies (tasks this task depends on)
      const dependencies = await prisma.taskDependency.findMany({
        where: { childTaskId: id },
        include: { parentTask: { select: { id: true, title: true, status: true } } },
      })
      const incompleteDeps = dependencies.filter(dep => dep.parentTask.status !== "DONE")
      if (incompleteDeps.length > 0) {
        return NextResponse.json(
          {
            success: false,
            message: `Cannot start task until all dependencies are DONE. Incomplete: ${incompleteDeps.map(dep => dep.parentTask.title).join(", ")}`,
          },
          { status: 400 }
        )
      }
    }

    const updatedTask = await prisma.task.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(priority && { priority }),
        ...(dueDate && { dueDate: new Date(dueDate) }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(estimatedHours !== undefined && { estimatedHours }),
        ...(actualHours !== undefined && { actualHours }),
      },
      include: {
        creator: {
          select: { id: true, name: true, avatar: true },
        },
        assignees: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    await prisma.activityLog.create({
      data: {
        action: status && status !== task.status ? "STATUS_CHANGED" : "UPDATED",
        entity: "task",
        entityId: id,
        projectId: task.projectId,
        userId: user.id,
        changes: body,
      },
    })

    // Notify assignees of update
    const assigneeIds = updatedTask.assignees.map((a) => a.user.id)
    if (assigneeIds.length > 0) {
      await notifyTaskUpdated(id, assigneeIds, user.id)
    }

    return NextResponse.json({
      success: true,
      message: "Task updated successfully",
      data: updatedTask,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update task error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const task = await prisma.task.findUnique({
      where: { id },
    })

    if (!task) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      )
    }

    const access = await ensureProjectAccess(user.id, task.projectId)

    const privilegedRoles = [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ]

    if (!privilegedRoles.includes(access.role) && task.createdBy !== user.id) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 403 }
      )
    }

    await prisma.task.delete({
      where: { id },
    })

    await prisma.activityLog.create({
      data: {
        action: "DELETED",
        entity: "task",
        entityId: id,
        projectId: task.projectId,
        userId: user.id,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Task deleted successfully",
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete task error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}
