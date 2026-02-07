import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"

// GET user by ID
export async function GET(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const params = await context.params
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
        createdAt: true,
      },
    })

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    return NextResponse.json({ success: true, data: user })
  } catch (error) {
    console.error("Get user error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to fetch user" },
      { status: 500 }
    )
  }
}

// DELETE user (admin only)
export async function DELETE(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getUserFromRequest(req)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    // Only SUPER_ADMIN can delete users
    if (currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "Only administrators can delete users" },
        { status: 403 }
      )
    }

    const params = await context.params
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      )
    }

    // Prevent self-deletion
    if (userId === currentUser.id) {
      return NextResponse.json(
        { success: false, message: "Cannot delete your own account" },
        { status: 400 }
      )
    }

    // Check if user exists
    const userToDelete = await prisma.user.findUnique({
      where: { id: userId },
    })

    if (!userToDelete) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      )
    }

    // Delete the user - cascade will handle most relations
    // For relations with onDelete: SetNull, they will be updated automatically
    await prisma.user.delete({ where: { id: userId } })

    return NextResponse.json({
      success: true,
      message: "User deleted successfully",
    })
  } catch (error) {
    console.error("Delete user error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to delete user" },
      { status: 500 }
    )
  }
}

// PATCH update user
export async function PATCH(
  req: NextRequest,
  context: { params: Promise<{ id: string }> }
) {
  try {
    const currentUser = getUserFromRequest(req)
    if (!currentUser) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const params = await context.params
    const userId = params.id

    if (!userId) {
      return NextResponse.json(
        { success: false, message: "User ID required" },
        { status: 400 }
      )
    }

    // Users can only update themselves unless they're admin
    if (userId !== currentUser.id && currentUser.role !== "SUPER_ADMIN") {
      return NextResponse.json(
        { success: false, message: "You can only update your own profile" },
        { status: 403 }
      )
    }

    const body = await req.json()
    const { name, avatar, role } = body

    const updateData: Record<string, string | undefined> = {}
    if (name !== undefined) updateData.name = name
    if (avatar !== undefined) updateData.avatar = avatar

    // Only SUPER_ADMIN can change roles
    if (role !== undefined && currentUser.role === "SUPER_ADMIN") {
      updateData.role = role
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: updateData,
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
    })

    return NextResponse.json({
      success: true,
      message: "User updated successfully",
      data: user,
    })
  } catch (error) {
    console.error("Update user error:", error)
    return NextResponse.json(
      { success: false, message: "Failed to update user" },
      { status: 500 }
    )
  }
}
