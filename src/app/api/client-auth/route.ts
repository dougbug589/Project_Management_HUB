import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { hashPassword, verifyPassword, generateToken } from "@/lib/auth"
import { validateEmail, validatePassword } from "@/lib/errors"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { email, password, name, action } = body

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

    // SIGNUP
    if (action === "signup") {
      if (!name) {
        return NextResponse.json(
          { success: false, message: "Name is required for signup" },
          { status: 400 }
        )
      }

      const passwordValidation = validatePassword(password)
      if (!passwordValidation.valid) {
        return NextResponse.json(
          { success: false, message: "Password does not meet requirements", errors: passwordValidation.errors },
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

      // Create user with CLIENT role
      const hashedPassword = await hashPassword(password)
      const user = await prisma.user.create({
        data: {
          email,
          password: hashedPassword,
          name,
          role: "CLIENT", // Client role - read-only access
        },
      })

      const token = generateToken({
        userId: user.id,
        email: user.email,
        role: user.role,
      })

      return NextResponse.json({
        success: true,
        message: "Client account created successfully",
        data: {
          client: {
            id: user.id,
            email: user.email,
            name: user.name,
            role: user.role,
          },
          token,
        },
      }, { status: 201 })
    }

    // LOGIN
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      )
    }

    // Verify this is a CLIENT user (or allow any user to use client portal)
    // For flexibility, we allow any user to login via client portal
    // but they'll only see projects they're members of

    const passwordValid = await verifyPassword(password, user.password)
    if (!passwordValid) {
      return NextResponse.json(
        { success: false, message: "Invalid email or password" },
        { status: 401 }
      )
    }

    const token = generateToken({
      userId: user.id,
      email: user.email,
      role: user.role,
    })

    return NextResponse.json({
      success: true,
      message: "Login successful",
      data: {
        client: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
        token,
      },
    })
  } catch (error) {
    console.error("Client auth error:", error)
    return NextResponse.json(
      { success: false, message: "Internal server error" },
      { status: 500 }
    )
  }
}
