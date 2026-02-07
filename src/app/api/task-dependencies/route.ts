import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )

    const { searchParams } = new URL(req.url)
    const taskId = searchParams.get("taskId")
    if (!taskId) {
      return NextResponse.json(
        { success: false, message: "taskId is required" },
        { status: 400 }
      )
    }

    // Fetch dependencies where this task is the child (i.e., tasks this task depends on)
    const dependencies = await prisma.taskDependency.findMany({
      where: { childTaskId: taskId },
      include: {
        parentTask: { select: { id: true, title: true, status: true } },
      },
      orderBy: { createdAt: "asc" },
    })

    // Format for UI
    const data = dependencies.map((dep) => ({
      id: dep.id,
      dependsOnId: dep.parentTaskId,
      dependsOn: dep.parentTask,
      type: dep.type,
      createdAt: dep.createdAt,
    }))
    return NextResponse.json({ success: true, data })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message =
      error instanceof ApiError ? error.message : "Internal server error"
    console.error("Fetch dependencies error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )

    const body = await req.json()
    const { parentTaskId, childTaskId, type } = body
    if (!parentTaskId || !childTaskId) {
      return NextResponse.json(
        { success: false, message: "parentTaskId and childTaskId are required" },
        { status: 400 }
      )
    }

    const [parent, child] = await Promise.all([
      prisma.task.findUnique({
        where: { id: parentTaskId },
        select: { projectId: true },
      }),
      prisma.task.findUnique({
        where: { id: childTaskId },
        select: { projectId: true },
      }),
    ])

    if (!parent || !child) {
      return NextResponse.json(
        { success: false, message: "Task not found" },
        { status: 404 }
      )
    }
    if (parent.projectId !== child.projectId) {
      return NextResponse.json(
        { success: false, message: "Tasks must belong to the same project" },
        { status: 400 }
      )
    }

    await ensureProjectRole(user.id, parent.projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    const dep = await prisma.taskDependency.create({
      data: {
        parentTaskId,
        childTaskId,
        type: type || "BLOCKED_BY",
      },
    })

    return NextResponse.json(
      { success: true, message: "Dependency created", data: dep },
      { status: 201 }
    )
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message =
      error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create dependency error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )

    const { searchParams } = new URL(req.url)
    const id = searchParams.get("id")
    if (!id) {
      return NextResponse.json(
        { success: false, message: "id is required" },
        { status: 400 }
      )
    }

    const dep = await prisma.taskDependency.findUnique({
      where: { id },
      include: {
        parentTask: { select: { projectId: true } },
      },
    })

    if (!dep) {
      return NextResponse.json(
        { success: false, message: "Dependency not found" },
        { status: 404 }
      )
    }

    await ensureProjectRole(user.id, dep.parentTask.projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    await prisma.taskDependency.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: "Dependency deleted",
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message =
      error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete dependency error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
