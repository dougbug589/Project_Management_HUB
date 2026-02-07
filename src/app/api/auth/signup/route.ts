import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword, generateToken } from "@/lib/auth"
import { validateEmail, validatePassword } from "@/lib/errors"
import { getOrCreateDefaultOrganization } from "@/lib/rbac"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name } = body

    // Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { success: false, message: "Missing required fields" },
        { status: 400 }
      )
    }

    if (!validateEmail(email)) {
      return NextResponse.json(
        { success: false, message: "Invalid email format" },
        { status: 400 }
      )
    }

    const passwordValidation = validatePassword(password)
    if (!passwordValidation.valid) {
      return NextResponse.json(
        {
          success: false,
          message: "Password does not meet requirements",
          errors: passwordValidation.errors,
        },
        { status: 400 }
      )
    }

    // Check if user exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    if (existingUser) {
      return NextResponse.json(
        { success: false, message: "User already exists" },
        { status: 409 }
      )
    }

    // Hash password
    const hashedPassword = await hashPassword(password)

    // Create user with default role
    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role: "TEAM_MEMBER", // Default role for new signups
      },
    })

    // CLIENT users should not auto-create organizations
    // They must be invited to existing organizations
    if (user.role === "CLIENT") {
      const token = generateToken({
        userId: user.id,
        email: user.email,
      })

      return NextResponse.json(
        {
          success: true,
          message: "User created successfully. Please contact admin to be added to projects.",
          data: {
            user: {
              id: user.id,
              email: user.email,
              name: user.name,
              role: user.role,
            },
            token,
          },
        },
        { status: 201 }
      )
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

    return NextResponse.json(
      {
        success: true,
        message: "User created successfully",
        data: {
          user: {
            id: user.id,
            email: user.email,
            name: user.name,
          },
          organization: {
            id: orgMembership.organizationId,
            role: orgMembership.role,
          },
          token,
        },
      },
      { status: 201 }
    )
  } catch (error) {
    console.error("Signup error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
