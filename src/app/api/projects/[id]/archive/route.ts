import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function POST(
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

    await ensureProjectRole(user.id, id, ["PROJECT_ADMIN", "SUPER_ADMIN"])

    const existingProject = await prisma.project.findUnique({
      where: { id },
      select: { archivedAt: true },
    })

    if (!existingProject) {
      return NextResponse.json(
        { success: false, message: "Project not found" },
        { status: 404 }
      )
    }

    // Toggle archive status
    const isCurrentlyArchived = existingProject.archivedAt !== null

    const project = await prisma.project.update({
      where: { id },
      data: {
        archivedAt: isCurrentlyArchived ? null : new Date(),
        status: isCurrentlyArchived ? "IN_PROGRESS" : "ARCHIVED",
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
        action: isCurrentlyArchived ? "UNARCHIVED" : "ARCHIVED",
        entity: "project",
        entityId: id,
        projectId: id,
        userId: user.id,
        changes: JSON.stringify({ archived: !isCurrentlyArchived }),
      },
    })

    return NextResponse.json({
      success: true,
      message: isCurrentlyArchived ? "Project unarchived successfully" : "Project archived successfully",
      data: project,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message =
      error instanceof ApiError ? error.message : "Internal server error"
    console.error("Archive project error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
