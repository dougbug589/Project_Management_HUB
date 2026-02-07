import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const access = await ensureProjectAccess(user.id, id)
    if (
      access.role === "CLIENT" ||
      access.role === "TEAM_MEMBER" ||
      access.role === "PROJECT_MANAGER" ||
      access.role === "PROJECT_ADMIN" ||
      access.role === "SUPER_ADMIN"
    ) {
      const project = await prisma.project.findUnique({
        where: { id },
        select: {
          id: true,
          name: true,
          description: true,
          status: true,
          startDate: true,
          endDate: true,
          milestones: {
            select: { id: true, title: true, status: true, dueDate: true },
            orderBy: { dueDate: "asc" },
          },
          tasks: {
            select: { id: true, title: true, status: true, priority: true, dueDate: true },
            take: 20,
            orderBy: { dueDate: "asc" },
          },
        },
      })

      return NextResponse.json({ success: true, data: project })
    }

    return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Client summary error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
