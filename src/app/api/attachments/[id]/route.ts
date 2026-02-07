import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"

// GET attachment by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      include: {
        uploader: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true, projectId: true } },
        project: { select: { id: true, name: true } },
      },
    })

    if (!attachment) {
      return NextResponse.json({ success: false, message: "Attachment not found" }, { status: 404 })
    }

    // Check access
    const projectId = attachment.projectId || attachment.task?.projectId
    if (projectId) {
      await ensureProjectAccess(user.id, projectId)
    }

    return NextResponse.json({ success: true, data: attachment })
  } catch (error: any) {
    console.error("Get attachment error:", error)
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: error.status || 500 })
  }
}

// DELETE attachment
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { id } = await params

    const attachment = await prisma.attachment.findUnique({
      where: { id },
      select: { projectId: true, task: { select: { projectId: true } } },
    })

    if (!attachment) {
      return NextResponse.json({ success: false, message: "Attachment not found" }, { status: 404 })
    }

    const projectId = attachment.projectId || attachment.task?.projectId
    if (projectId) {
      await ensureProjectAccess(user.id, projectId)
    }

    await prisma.attachment.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Attachment deleted" })
  } catch (error: any) {
    console.error("Delete attachment error:", error)
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: error.status || 500 })
  }
}
