import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectRole, ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    await ensureProjectAccess(user.id, id)

    const members = await prisma.projectMember.findMany({
      where: { projectId: id },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    })

    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get project members error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    await ensureProjectRole(user.id, id, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    const body = await req.json()
    const { userId, role } = body
    if (!userId) return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 })

    const member = await prisma.projectMember.upsert({
      where: { projectId_userId: { projectId: id, userId } },
      update: { role: role || "TEAM_MEMBER", status: "ACCEPTED" },
      create: {
        projectId: id,
        userId,
        role: role || "TEAM_MEMBER",
        status: "PENDING",
        invitedBy: user.id,
      },
    })

    return NextResponse.json({ success: true, message: "Member added/invited", data: member }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Add project member error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { status, userId, role } = body
    if (!userId) return NextResponse.json({ success: false, message: "userId is required" }, { status: 400 })

    const membership = await prisma.projectMember.findUnique({
      where: { projectId_userId: { projectId: id, userId } },
      select: { userId: true },
    })
    if (!membership) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })

    await ensureProjectRole(user.id, id, [
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
      "SUPER_ADMIN",
    ])

    const updated = await prisma.projectMember.update({
      where: { projectId_userId: { projectId: id, userId } },
      data: {
        ...(status && { status }),
        ...(role && { role }),
      },
    })

    return NextResponse.json({ success: true, message: "Membership updated", data: updated })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update project member error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
