import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess, ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const user = getUserFromRequest(req)
    console.log('API DEBUG: user:', user, 'projectId:', id)

    if (!user) {
      console.log('API DEBUG: No user found (unauthorized)')
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const project = await prisma.project.findUnique({
      where: { id },
      include: {
        owner: {
          select: { id: true, name: true, email: true, avatar: true },
        },
        tasks: {
          select: {
            id: true,
            title: true,
            status: true,
            priority: true,
            dueDate: true,
            _count: { select: { assignees: true } },
          },
        },
        teams: {
          include: {
            members: {
              select: {
                user: { select: { id: true, name: true, avatar: true } },
                role: true,
              },
            },
          },
        },
        members: {
          select: { userId: true, role: true, status: true },
        },
        _count: {
          select: { tasks: true, teams: true, comments: true },
        },
      },
    })
    console.log('API DEBUG: project:', project)

    if (!project) {
      console.log('API DEBUG: Project not found for id', id)
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      )
    }

    try {
      await ensureProjectAccess(user.id, id)
      console.log('API DEBUG: ensureProjectAccess success for user', user.id, 'and project', id)
    } catch (err) {
      console.log('API DEBUG: ensureProjectAccess failed:', err)
      throw err
    }

    return NextResponse.json({
      success: true,
      data: project,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get project error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}

export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await ensureProjectRole(user.id, id, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
    ])

    const body = await req.json()
    const { name, description, status, startDate, endDate } = body

    const updatedProject = await prisma.project.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(status && { status }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "UPDATED",
        entity: "project",
        entityId: id,
        projectId: id,
        userId: user.id,
        changes: body,
      },
    })

    return NextResponse.json({
      success: true,
      message: "Project updated successfully",
      data: updatedProject,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update project error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}

export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await context.params
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    await ensureProjectRole(user.id, id, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
    ])

    await prisma.project.delete({
      where: { id },
    })

    return NextResponse.json({
      success: true,
      message: "Project deleted successfully",
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete project error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}
