import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess, ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    if (!projectId) return NextResponse.json({ success: false, message: "Project ID is required" }, { status: 400 })

    await ensureProjectAccess(user.id, projectId)

    const phases = await prisma.phase.findMany({
      where: { projectId },
      orderBy: { sequence: "asc" },
    })

    return NextResponse.json({ success: true, data: phases })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get phases error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, description, projectId, sequence, startDate, endDate, status } = body

    if (!name || !projectId || sequence === undefined) {
      return NextResponse.json(
        { success: false, message: "name, projectId, and sequence are required" },
        { status: 400 }
      )
    }

    await ensureProjectRole(user.id, projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    const phase = await prisma.phase.create({
      data: {
        name,
        description,
        projectId,
        sequence,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        status: status || "PENDING",
      },
    })

    return NextResponse.json({ success: true, message: "Phase created", data: phase }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create phase error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
