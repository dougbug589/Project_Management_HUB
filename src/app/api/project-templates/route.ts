import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    // Templates are user-specific, no org role check needed
    const templates = await prisma.projectTemplate.findMany({
      where: { createdBy: user.id },
      orderBy: { updatedAt: "desc" },
    })

    // Parse config JSON strings back to objects
    const parsedTemplates = templates.map((t) => ({
      ...t,
      config: t.config ? JSON.parse(t.config) : {},
    }))

    return NextResponse.json({ success: true, data: parsedTemplates })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get templates error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { name, description, config } = body
    if (!name) return NextResponse.json({ success: false, message: "name is required" }, { status: 400 })

    const template = await prisma.projectTemplate.create({
      data: {
        name,
        description,
        config: config ? JSON.stringify(config) : null,
        createdBy: user.id,
      },
    })

    return NextResponse.json({ success: true, message: "Template created", data: template }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create template error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
