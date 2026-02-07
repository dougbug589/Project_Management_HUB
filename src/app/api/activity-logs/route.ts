import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"

// GET activity logs
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const entityId = searchParams.get("entityId")
    const entity = searchParams.get("entity")
    const limit = parseInt(searchParams.get("limit") || "50")

    if (!projectId) {
      return NextResponse.json({ success: false, message: "projectId is required" }, { status: 400 })
    }

    await ensureProjectAccess(user.id, projectId)

    const where: any = { projectId }
    if (entityId) where.entityId = entityId
    if (entity) where.entity = entity

    const logs = await prisma.activityLog.findMany({
      where,
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
      orderBy: { createdAt: "desc" },
      take: limit,
    })

    return NextResponse.json({ success: true, data: logs })
  } catch (error: any) {
    console.error("Get activity logs error:", error)
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: error.status || 500 })
  }
}
