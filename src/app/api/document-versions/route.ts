import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { documentId, fileUrl, fileName, fileSize, fileType, changeLog } = body
    if (!documentId || !fileUrl || !fileName) {
      return NextResponse.json({ success: false, message: "documentId, fileUrl, and fileName are required" }, { status: 400 })
    }

    const doc = await prisma.document.findUnique({ where: { id: documentId }, select: { projectId: true, currentVersion: true } })
    if (!doc) return NextResponse.json({ success: false, message: "Document not found" }, { status: 404 })

    await ensureProjectAccess(user.id, doc.projectId)

    const nextVersion = (doc.currentVersion || 1) + 1

    const version = await prisma.documentVersion.create({
      data: {
        documentId,
        versionNumber: nextVersion,
        fileUrl,
        fileName,
        fileSize: fileSize || 0,
        fileType: fileType || "application/octet-stream",
        changeLog,
        createdBy: user.id,
      },
    })

    await prisma.document.update({ where: { id: documentId }, data: { currentVersion: nextVersion } })

    return NextResponse.json({ success: true, message: "Version added", data: version }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create document version error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
