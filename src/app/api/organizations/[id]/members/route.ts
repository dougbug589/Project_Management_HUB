import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureOrgRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"
import { sendEmail } from "@/lib/email"

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    await ensureOrgRole(user.id, id)

    const members = await prisma.organizationMember.findMany({
      where: { organizationId: id },
      include: { user: { select: { id: true, name: true, email: true, avatar: true } } },
    })

    return NextResponse.json({ success: true, data: members })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get org members error:", error)
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

    await ensureOrgRole(user.id, id, ["SUPER_ADMIN", "PROJECT_ADMIN"])

    const body = await req.json()
    const { userId, role, email } = body
    if (!userId && !email) return NextResponse.json({ success: false, message: "userId or email is required" }, { status: 400 })

    let invitedUser = null
    let invitedUserId = userId
    // If email is provided but not userId, create a pending user
    if (!userId && email) {
      // Check if user already exists
      invitedUser = await prisma.user.findUnique({ where: { email } })
      if (!invitedUser) {
        invitedUser = await prisma.user.create({
          data: {
            email,
            name: email.split("@")[0],
            password: "changeme123", // Default password for invited users
          },
        })
      }
      invitedUserId = invitedUser.id
    }

    const member = await prisma.organizationMember.upsert({
      where: { organizationId_userId: { organizationId: id, userId: invitedUserId } },
      update: { role: role || "TEAM_MEMBER", status: "ACCEPTED" },
      create: {
        organizationId: id,
        userId: invitedUserId,
        role: role || "TEAM_MEMBER",
        status: "PENDING",
        invitedBy: user.id,
      },
    })

    // Send invitation email if email is provided
    if (email) {
      const joinUrl = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/signup?org=${id}&email=${encodeURIComponent(email)}`
      await sendEmail({
        to: email,
        subject: "You're invited to join an organization",
        html: `<h2>You've been invited!</h2><p>You have been invited to join an organization in ProjectHub.</p><p><a href="${joinUrl}">Click here to join</a></p>`
      })
    }

    return NextResponse.json({ success: true, message: "Member added/invited", data: member }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Add org member error:", error)
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
    const { status, userId } = body
    if (!status || !userId) return NextResponse.json({ success: false, message: "status and userId are required" }, { status: 400 })

    const membership = await prisma.organizationMember.findUnique({
      where: { organizationId_userId: { organizationId: id, userId } },
      select: { userId: true },
    })
    if (!membership) return NextResponse.json({ success: false, message: "Member not found" }, { status: 404 })

    if (userId !== user.id) {
      await ensureOrgRole(user.id, id, ["SUPER_ADMIN", "PROJECT_ADMIN"])
    }

    const updated = await prisma.organizationMember.update({
      where: { organizationId_userId: { organizationId: id, userId } },
      data: { status },
    })

    return NextResponse.json({ success: true, message: "Membership updated", data: updated })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Update org member error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
