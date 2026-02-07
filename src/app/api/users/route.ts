export async function DELETE(req: NextRequest) {
  try {
    const url = new URL(req.url)
    const userId = url.searchParams.get("id")
    if (!userId) {
      return NextResponse.json({ success: false, message: "User ID required" }, { status: 400 })
    }
    // TODO: Add admin authentication/authorization check here
    await prisma.user.delete({ where: { id: userId } })
    return NextResponse.json({ success: true, message: "User deleted" })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json({ success: false, message: "Failed to delete user" }, { status: 500 })
  }
}
export async function GET(req: NextRequest) {
  try {
    const users = await prisma.user.findMany({
      select: { id: true, name: true, email: true }
    })
    return NextResponse.json({ success: true, data: users })
  } catch (error) {
    console.error("Get users error:", error)
    return NextResponse.json({ success: false, message: "Failed to fetch users" }, { status: 500 })
  }
}
import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"

export async function POST(req: NextRequest) {
  try {
    const body = await req.json()
    const { name, email } = body
    if (!name || !email) {
      return NextResponse.json({ success: false, message: "Name and email are required" }, { status: 400 })
    }
    // Check if user already exists
    const existing = await prisma.user.findUnique({ where: { email } })
    if (existing) {
      return NextResponse.json({ success: false, message: "User already exists" }, { status: 409 })
    }
    const user = await prisma.user.create({
      data: {
        name,
        email,
        password: "demo123", // default password for demo
      },
    })
    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("Add user error:", error)
    return NextResponse.json({ success: false, message: "Failed to create user" }, { status: 500 })
  }
}
