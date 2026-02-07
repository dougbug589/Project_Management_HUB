import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const memberships = await prisma.organizationMember.findMany({
      where: { userId: user.id, status: "ACCEPTED" },
      include: { organization: true },
    })

    return NextResponse.json({ success: true, data: memberships })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get orgs error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    // Check actual user role from database to prevent CLIENT users from creating orgs
    const dbUser = await prisma.user.findUnique({
      where: { id: user.id },
      select: { role: true },
    })

    if (!dbUser) {
      return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
    }

    // CLIENT users cannot create organizations
    if (dbUser.role === "CLIENT") {
      return NextResponse.json(
        { success: false, message: "CLIENT users cannot create organizations" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, description, billingEmail } = body
    if (!name) return NextResponse.json({ success: false, message: "name is required" }, { status: 400 })

    const org = await prisma.organization.create({
      data: {
        name,
        description,
        billingEmail,
        ownerId: user.id,
        memberships: {
          create: {
            userId: user.id,
            role: "SUPER_ADMIN",
            status: "ACCEPTED",
          },
        },
      },
    })

    return NextResponse.json({ success: true, message: "Organization created", data: org }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create org error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
