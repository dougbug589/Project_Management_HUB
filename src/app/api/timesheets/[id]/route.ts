import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { status } = body as { status?: string }
    if (!status) return NextResponse.json({ success: false, message: "status is required" }, { status: 400 })

    const ts = await prisma.timesheet.findUnique({
      where: { id },
      select: { task: { select: { projectId: true } } },
    })
    if (!ts) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    await ensureProjectRole(user.id, ts.task.projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    const updated = await prisma.timesheet.update({
      where: { id },
      data: { status, approvedBy: status === "APPROVED" ? user.id : null },
    })

    return NextResponse.json({ success: true, message: "Timesheet updated", data: updated })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update timesheet error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const ts = await prisma.timesheet.findUnique({ where: { id }, select: { userId: true, task: { select: { projectId: true } } } })
    if (!ts) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    // Allow owner of log or project managers/admins
    try {
      await ensureProjectRole(user.id, ts.task.projectId, [
        "PROJECT_ADMIN",
        "PROJECT_MANAGER",
        "SUPER_ADMIN",
      ])
    } catch {
      if (ts.userId !== user.id) {
        return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
      }
    }

    await prisma.timesheet.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Timesheet deleted" })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete timesheet error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
