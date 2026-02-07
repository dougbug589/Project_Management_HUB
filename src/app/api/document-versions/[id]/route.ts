import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"

// GET document version by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const version = await prisma.documentVersion.findUnique({
      where: { id },
      include: {
        document: { select: { id: true, title: true, projectId: true } },
        uploader: { select: { id: true, name: true, email: true } },
      },
    })

    if (!version) {
      return NextResponse.json({ success: false, message: "Version not found" }, { status: 404 })
    }

    await ensureProjectAccess(user.id, version.document.projectId)

    return NextResponse.json({ success: true, data: version })
  } catch (error: any) {
    console.error("Get document version error:", error)
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: error.status || 500 })
  }
}

// DELETE document version
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const version = await prisma.documentVersion.findUnique({
      where: { id },
      select: { document: { select: { projectId: true } } },
    })

    if (!version) {
      return NextResponse.json({ success: false, message: "Version not found" }, { status: 404 })
    }

    await ensureProjectAccess(user.id, version.document.projectId)

    await prisma.documentVersion.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Version deleted" })
  } catch (error: any) {
    console.error("Delete document version error:", error)
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: error.status || 500 })
  }
}
