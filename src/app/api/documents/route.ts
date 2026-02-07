import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    if (!projectId) return NextResponse.json({ success: false, message: "Project ID is required" }, { status: 400 })

    await ensureProjectAccess(user.id, projectId)

    const documents = await prisma.document.findMany({
      where: { projectId },
      include: {
        versions: {
          orderBy: { versionNumber: "desc" },
          take: 1,
        },
      },
      orderBy: { updatedAt: "desc" },
    })

    return NextResponse.json({ success: true, data: documents })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get documents error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { title, description, projectId, fileUrl, fileName, fileSize, fileType } = body
    if (!title || !projectId || !fileUrl || !fileName) {
      return NextResponse.json({ success: false, message: "title, projectId, fileUrl, and fileName are required" }, { status: 400 })
    }

    await ensureProjectAccess(user.id, projectId)

    const doc = await prisma.document.create({
      data: {
        title,
        description,
        projectId,
        createdBy: user.id,
        versions: {
          create: {
            versionNumber: 1,
            fileUrl,
            fileName,
            fileSize: fileSize || 0,
            fileType: fileType || "application/octet-stream",
            createdBy: user.id,
          },
        },
      },
      include: { versions: true },
    })

    return NextResponse.json({ success: true, message: "Document created", data: doc }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create document error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
