import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
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
    const { title, description } = body

    const doc = await prisma.document.findUnique({ where: { id }, select: { projectId: true } })
    if (!doc) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    await ensureProjectAccess(user.id, doc.projectId)

    const updated = await prisma.document.update({
      where: { id },
      data: {
        ...(title && { title }),
        ...(description !== undefined && { description }),
      },
    })

    return NextResponse.json({ success: true, message: "Document updated", data: updated })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update document error:", error)
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

    const doc = await prisma.document.findUnique({ where: { id }, select: { projectId: true } })
    if (!doc) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    await ensureProjectAccess(user.id, doc.projectId)

    await prisma.document.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Document deleted" })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete document error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
