import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureOrgRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(req.url)
    const page = parseInt(searchParams.get("page") || "1")
    const limit = parseInt(searchParams.get("limit") || "10")
    const status = searchParams.get("status")
    const organizationId =
      searchParams.get("organizationId") || (user as any).organizationId

    const skip = (page - 1) * limit

    const where: any = {
      OR: [
        { ownerId: user.id },
        {
          members: {
            some: {
              userId: user.id,
              status: "ACCEPTED",
            },
          },
        },
      ],
    }

    if (status) {
      where.status = status
    }

    if (organizationId) {
      where.organizationId = organizationId
    }

    const [projects, total] = await Promise.all([
      prisma.project.findMany({
        where,
        skip,
        take: limit,
        include: {
          _count: {
            select: { tasks: true, teams: true },
          },
          owner: {
            select: { id: true, name: true, email: true },
          },
          members: {
            where: { userId: user.id, status: "ACCEPTED" },
            select: { role: true },
          },
        },
        orderBy: { createdAt: "desc" },
      }),
      prisma.project.count({ where }),
    ])

    return NextResponse.json({
      success: true,
      data: projects,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get projects error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)

    if (!user) {
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )
    }

    const body = await req.json()
    const { name, description, startDate, endDate, organizationId, templateId } = body

    if (!name) {
      return NextResponse.json(
        { success: false, message: "Project name is required" },
        { status: 400 }
      )
    }

    const orgId = organizationId || (user as any).organizationId

    if (!orgId) {
      return NextResponse.json(
        { success: false, message: "Organization is required" },
        { status: 400 }
      )
    }

    await ensureOrgRole(user.id, orgId, [
      "SUPER_ADMIN",
      "PROJECT_ADMIN",
      "PROJECT_MANAGER",
    ])

    const project = await prisma.project.create({
      data: {
        name,
        description,
        startDate: startDate ? new Date(startDate) : undefined,
        endDate: endDate ? new Date(endDate) : undefined,
        ownerId: user.id,
        organizationId: orgId,
        templateId: templateId || undefined,
        members: {
          create: {
            userId: user.id,
            role: "PROJECT_ADMIN",
            status: "ACCEPTED",
          },
        },
      },
      include: {
        owner: {
          select: { id: true, name: true, email: true },
        },
      },
    })

    // Create activity log
    await prisma.activityLog.create({
      data: {
        action: "CREATED",
        entity: "project",
        entityId: project.id,
        projectId: project.id,
        userId: user.id,
      },
    })

    return NextResponse.json(
      {
        success: true,
        message: "Project created successfully",
        data: project,
      },
      { status: 201 }
    )
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create project error:", error)
    return NextResponse.json(
      { success: false, message },
      { status }
    )
  }
}
