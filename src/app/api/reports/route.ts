import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { Prisma } from "@prisma/client"
import { getUserFromRequest } from "@/lib/auth"
import { ensureOrgRole, ensureProjectAccess, ensureProjectRole } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const organizationId = searchParams.get("organizationId") || (user as unknown as { organizationId?: string }).organizationId

    const where: Prisma.ReportExportWhereInput = {}

    if (projectId) {
      await ensureProjectAccess(user.id, projectId)
      where.projectId = projectId
    } else if (organizationId) {
      await ensureOrgRole(user.id, organizationId, ["SUPER_ADMIN", "PROJECT_ADMIN"])
      where.organizationId = organizationId
    } else {
      return NextResponse.json({ success: false, message: "projectId or organizationId required" }, { status: 400 })
    }

    const reports = await prisma.reportExport.findMany({ where, orderBy: { createdAt: "desc" }, take: 50 })
    return NextResponse.json({ success: true, data: reports })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Get reports error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}

export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const body = await req.json()
    const { type, format, projectId, organizationId } = body as {
      type: string
      format: string
      projectId?: string
      organizationId?: string
    }

    if (!type || !format) {
      return NextResponse.json({ success: false, message: "type and format are required" }, { status: 400 })
    }

    if (!projectId && !organizationId) {
      return NextResponse.json({ success: false, message: "projectId or organizationId is required" }, { status: 400 })
    }

    if (projectId) {
      await ensureProjectRole(user.id, projectId, [
        "PROJECT_ADMIN",
        "PROJECT_MANAGER",
        "SUPER_ADMIN",
      ])
    } else if (organizationId) {
      const orgId = (organizationId || (user as unknown as { organizationId?: string }).organizationId)!
      await ensureOrgRole(user.id, orgId, ["SUPER_ADMIN", "PROJECT_ADMIN"])
    }

    const report = await prisma.reportExport.create({
      data: {
        type,
        format,
        status: "PENDING",
        projectId: projectId || null,
        organizationId: organizationId || null,
        createdBy: user.id,
      },
    })

    // Placeholder: actual generation should be queued/background

    return NextResponse.json({ success: true, message: "Report requested", data: report }, { status: 201 })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Create report error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
