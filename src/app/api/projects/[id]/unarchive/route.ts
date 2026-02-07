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

    await ensureProjectRole(user.id, id, ["PROJECT_ADMIN", "PROJECT_MANAGER"])

    const project = await prisma.project.update({
      where: { id },
      data: {
        archivedAt: null,
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
        changes: JSON.stringify({ unarchived: true }),
      },
    })

    return NextResponse.json({
      success: true,
      message: "Project unarchived successfully",
      data: project,
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message =
      error instanceof ApiError ? error.message : "Internal server error"
    console.error("Unarchive project error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
