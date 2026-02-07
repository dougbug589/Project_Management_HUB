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
    const { name, description, sequence, startDate, endDate, status } = body

    const phase = await prisma.phase.findUnique({ where: { id }, select: { projectId: true } })
    if (!phase) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    await ensureProjectRole(user.id, phase.projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    const updated = await prisma.phase.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(sequence !== undefined && { sequence }),
        ...(startDate && { startDate: new Date(startDate) }),
        ...(endDate && { endDate: new Date(endDate) }),
        ...(status && { status }),
      },
    })

    return NextResponse.json({ success: true, message: "Phase updated", data: updated })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update phase error:", error)
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

    const phase = await prisma.phase.findUnique({ where: { id }, select: { projectId: true } })
    if (!phase) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    await ensureProjectRole(user.id, phase.projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    await prisma.phase.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Phase deleted" })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete phase error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
