import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess, ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    if (!projectId) {
      return NextResponse.json({ success: false, message: "Project ID is required" }, { status: 400 })
    }

    await ensureProjectAccess(user.id, projectId)

    const milestones = await prisma.milestone.findMany({
      where: { projectId },
      orderBy: { dueDate: "asc" },
    })

    return NextResponse.json({ success: true, data: milestones })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get milestones error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }

    const body = await req.json()
    const { title, description, projectId, dueDate, status } = body

    if (!title || !projectId || !dueDate) {
      return NextResponse.json(
        { success: false, message: "Title, projectId, and dueDate are required" },
        { status: 400 }
      )
    }

    await ensureProjectRole(user.id, projectId, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    const milestone = await prisma.milestone.create({
      data: {
        title,
        description,
        projectId,
        dueDate: new Date(dueDate),
        status: status || "PENDING",
      },
    })

    return NextResponse.json({ success: true, message: "Milestone created", data: milestone }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create milestone error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
