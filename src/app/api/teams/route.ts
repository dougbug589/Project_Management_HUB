import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess, ensureProjectRole } from "@/lib/rbac"
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

    let teams

    if (projectId) {
      // Get teams for specific project
      await ensureProjectAccess(user.id, projectId)

      teams = await prisma.team.findMany({
        where: { projectId },
        include: {
          project: { select: { id: true, name: true } },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          _count: {
            select: { members: true },
          },
        },
      })
    } else {
      // Get all teams for projects the user has access to
      const userProjects = await prisma.projectMember.findMany({
        where: { userId: user.id },
        select: { projectId: true },
      })

      const projectIds = userProjects.map((p) => p.projectId)

      teams = await prisma.team.findMany({
        where: { projectId: { in: projectIds } },
        include: {
          project: { select: { id: true, name: true } },
          members: {
            include: {
              user: {
                select: { id: true, name: true, email: true, avatar: true },
              },
            },
          },
          _count: {
            select: { members: true },
          },
        },
        orderBy: { createdAt: "desc" },
      })
    }

    return NextResponse.json({
      success: true,
      data: teams,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get teams error:", error)
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
    const { name, description, projectId, memberIds } = body

    if (!name || !projectId) {
      return NextResponse.json(
        { success: false, message: "Name and project ID are required" },
        { status: 400 }
      )
    }

    await ensureProjectRole(user.id, projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    const team = await prisma.team.create({
      data: {
        name,
        description,
        projectId,
        members: memberIds
          ? {
              create: memberIds.map((userId: string) => ({
                userId,
                role: "MEMBER",
              })),
            }
          : undefined,
      },
      include: {
        members: {
          include: {
            user: {
              select: { id: true, name: true, avatar: true },
            },
          },
        },
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Team created successfully",
        data: team,
      },
      { status: 201 }
    )
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create team error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}
