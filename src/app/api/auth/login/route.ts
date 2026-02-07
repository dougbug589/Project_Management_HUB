import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { verifyPassword, generateToken } from "@/lib/auth"
import { validateEmail } from "@/lib/errors"
import { getOrCreateDefaultOrganization } from "@/lib/rbac"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password } = body

    // Validation
    if (!email || !password) {
      return NextResponse.json(
        { success: false, message: "Email and password are required" },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Verify password
    const passwordValid = await verifyPassword(password, user.password)

    if (!passwordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      )
    }

    // CLIENT users don't have organizations - they're invited to projects
    if (user.role === "CLIENT") {
      // Find any organization they're a member of
      const membership = await prisma.organizationMember.findFirst({
        where: { userId: user.id, status: "ACCEPTED" },
        select: { organizationId: true, role: true },
      })

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
        organizationId: membership?.organizationId,
        organizationRole: membership?.role,
      })

      return NextResponse.json({
        success: true,
        message: "Login successful",
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
            avatar: user.avatar,
            role: user.role,
          },
          organization: membership ? {
            id: membership.organizationId,
            role: membership.role,
          } : null,
          token,
        },
      })
    }

    const orgMembership = await getOrCreateDefaultOrganization(user.id)

    // Generate token
    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
      organizationId: orgMembership.organizationId,
      organizationRole: orgMembership.role,
    })

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          avatar: user.avatar,
          role: user.role,
        },
        organization: {
          id: orgMembership.organizationId,
          role: orgMembership.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
