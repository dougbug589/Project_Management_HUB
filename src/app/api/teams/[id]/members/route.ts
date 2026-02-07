import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

// Add a user to a team (invite existing user by userId)
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const user = getUserFromRequest(req)
    if (!user) {
      return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
    }
    const { id: teamId } = await params
    const body = await req.json()
    const { userId } = body
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 })
    }
    // Check project role (must be admin/manager)
    const team = await prisma.team.findUnique({ where: { id: teamId }, select: { projectId: true } })
    if (!team) {
      return NextResponse.json({ success: false, message: "Team not found" }, { status: 404 })
    }
    await ensureProjectRole(user.id, team.projectId, ["PROJECT_ADMIN", "PROJECT_MANAGER", "SUPER_ADMIN"])
    // Check if already a member
    const existing = await prisma.teamMember.findUnique({ where: { teamId_userId: { teamId, userId } } })
    if (existing) {
      return NextResponse.json({ success: false, message: "User is already a team member" }, { status: 409 })
    }
    await prisma.teamMember.create({ data: { teamId, userId, role: "MEMBER" } })
    return NextResponse.json({ success: true, message: "User added to team" })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Add team member error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
