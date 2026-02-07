import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"
import { notifyTaskAssigned } from "@/lib/notifications"

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
    const status = searchParams.get("status")
    const priority = searchParams.get("priority")
    const assigneeId = searchParams.get("assigneeId")
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "20")

    const skip = (page - 1) * limit

    const where: any = {
      OR: [
        { project: { ownerId: user.id } },
        {
          project: {
            members: {
              some: {
                userId: user.id,
                status: "ACCEPTED",
              },
            },
          },
        },
      ],
    }

    if (projectId) {
      where.projectId = projectId
    }
    if (status) {
      where.status = status
    }
    if (priority) {
      where.priority = priority
    }
    if (assigneeId) {
      where.assignees = {
        some: {
          userId: assigneeId,
        },
      }
    }

    const [tasks, total] = await Promise.all([
      prisma.task.findMany({
        where,
        skip,
        take: limit,
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
          project: {
            select: { id: true, name: true },
          },
          _count: {
            select: { comments: true, attachments: true, subTasks: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.task.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: tasks,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get tasks error:", error)
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
    const {
      title,
      description,
      projectId,
      status,
      priority,
      dueDate,
      startDate,
      estimatedHours,
      assigneeIds,
    } = body

    if (!title || !projectId) {
      return NextResponse.json(
        { success: false, message: "Title and project ID are required" },
        { status: 400 }
      )
    }

    await ensureProjectRole(user.id, projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    const task = await prisma.task.create({
      data: {
        title,
        description,
        projectId,
        createdBy: user.id,
        status: status || "TODO",
        priority: priority || "MEDIUM",
        dueDate: dueDate ? new Date(dueDate) : undefined,
        startDate: startDate ? new Date(startDate) : undefined,
        estimatedHours,
        assignees: assigneeIds
          ? {
              create: assigneeIds.map((userId: string) => ({
                userId,
              })),
            }
          : undefined,
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

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "CREATED",
        entity: "task",
        entityId: task.id,
        projectId,
        userId: user.id,
      },
    })

    // Notify assignees
    if (assigneeIds && assigneeIds.length > 0) {
      for (const assigneeId of assigneeIds) {
        await notifyTaskAssigned(task.id, assigneeId, user.id)
      }
    }

    return NextResponse.json(
      {
        success: true,
        message: "Task created successfully",
        data: task,
      },
      { status: 201 }
    )
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create task error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}
