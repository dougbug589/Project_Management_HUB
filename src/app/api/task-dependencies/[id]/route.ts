import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const dep = await prisma.taskDependency.findUnique({
      where: { id },
      include: { parentTask: { select: { projectId: true } } },
    })
    if (!dep) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    await ensureProjectRole(user.id, dep.parentTask.projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    await prisma.taskDependency.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Dependency removed" })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete dependency error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
