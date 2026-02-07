import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"

export async function GET(req: NextRequest) {
  const user = getUserFromRequest(req)
  if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })
  const dbUser = await prisma.user.findUnique({ where: { id: user.id }, select: { id: true, name: true, email: true, role: true } })
  if (!dbUser) return NextResponse.json({ success: false, message: "User not found" }, { status: 404 })
  return NextResponse.json({ success: true, data: dbUser })
}
