import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureOrgRole } from "@/lib/rbac"

// GET organization by ID
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { id } = await params
    await ensureOrgRole(user.id, id, ["SUPER_ADMIN", "PROJECT_ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "TEAM_MEMBER"])

    const organization = await prisma.organization.findUnique({
      where: { id },
      include: {
        owner: { select: { id: true, name: true, email: true } },
        _count: {
          select: {
            memberships: true,
            projects: true,
          },
        },
      },
    })

    if (!organization) {
      return NextResponse.json({ success: false, message: "Organization not found" }, { status: 404 })
    }

    return NextResponse.json({ success: true, data: organization })
  } catch (error: any) {
    console.error("Get organization error:", error)
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: error.status || 500 })
  }
}

// PATCH organization by ID
export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { id } = await params
    await ensureOrgRole(user.id, id, ["SUPER_ADMIN", "PROJECT_ADMIN"])

    const body = await req.json()
    const { name, description, billingEmail } = body

    const updated = await prisma.organization.update({
      where: { id },
      data: {
        ...(name && { name }),
        ...(description !== undefined && { description }),
        ...(billingEmail !== undefined && { billingEmail }),
      },
      include: {
        owner: { select: { id: true, name: true, email: true } },
      },
    })

    return NextResponse.json({ success: true, data: updated })
  } catch (error: any) {
    console.error("Update organization error:", error)
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: error.status || 500 })
  }
}

// DELETE organization by ID
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { id } = await params
    await ensureOrgRole(user.id, id, ["SUPER_ADMIN"])

    await prisma.organization.delete({ where: { id } })

    return NextResponse.json({ success: true, message: "Organization deleted" })
  } catch (error: any) {
    console.error("Delete organization error:", error)
    return NextResponse.json({ success: false, message: error.message || "Server error" }, { status: error.status || 500 })
  }
}
