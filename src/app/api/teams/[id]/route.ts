import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const team = await prisma.team.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: { select: { members: true } },
      },
    })

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: team })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get team error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params
    const body = await req.json()
    const { name, description, memberIds } = body

    const team = await prisma.team.findUnique({
      where: { id },
      select: { projectId: true },
    })

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      )
    }

    // Check project role
    await ensureProjectRole(user.id, team.projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    // Update team and members
    const updatedTeam = await prisma.$transaction(async (tx) => {
      // Update team basic info
      const updated = await tx.team.update({
        where: { id },
        data: {
          name,
          description,
        },
      })

      // If memberIds provided, sync members
      if (memberIds !== undefined) {
        // Remove all existing members
        await tx.teamMember.deleteMany({ where: { teamId: id } })

        // Add new members
        if (memberIds.length > 0) {
          await tx.teamMember.createMany({
            data: memberIds.map((userId: string) => ({
              teamId: id,
              userId,
              role: "MEMBER",
            })),
          })
        }
      }

      return updated
    })

    // Fetch updated team with relations
    const result = await prisma.team.findUnique({
      where: { id },
      include: {
        project: { select: { id: true, name: true } },
        members: {
          include: {
            user: {
              select: { id: true, name: true, email: true, avatar: true },
            },
          },
        },
        _count: { select: { members: true } },
      },
    })

    return NextResponse.json({ success: true, data: result })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update team error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { id } = await params

    const team = await prisma.team.findUnique({
      where: { id },
      select: { projectId: true, name: true },
    })

    if (!team) {
      return NextResponse.json(
        { success: false, message: "Team not found" },
        { status: 404 }
      )
    }

    // Check project role
    await ensureProjectRole(user.id, team.projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    await prisma.team.delete({ where: { id } })

    return NextResponse.json({
      success: true,
      message: `Team "${team.name}" deleted successfully`,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete team error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
