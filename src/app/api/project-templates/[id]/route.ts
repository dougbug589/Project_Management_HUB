import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ApiError } from "@/lib/errors"

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const template = await prisma.projectTemplate.findUnique({ where: { id }, select: { createdBy: true } })
    if (!template) return NextResponse.json({ success: false, message: "Not found" }, { status: 404 })

    if (template.createdBy !== user.id) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 403 })
    }

    await prisma.projectTemplate.delete({ where: { id } })
    return NextResponse.json({ success: true, message: "Template deleted" })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Delete template error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
