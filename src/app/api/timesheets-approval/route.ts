import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectRole, type UserRole } from "@/lib/rbac"

// GET timesheets pending approval
export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { searchParams } = new URL(req.url)
    const projectId = searchParams.get("projectId")
    const status = searchParams.get("status") || "PENDING"

    const approverRoles: UserRole[] = ["SUPER_ADMIN", "PROJECT_ADMIN", "PROJECT_MANAGER"]
    const query: Record<string, unknown> = { status }

    if (projectId) {
      await ensureProjectRole(user.id, projectId, approverRoles)
      query.task = { projectId }
    } else {
      const [ownedProjects, memberProjects] = await Promise.all([
        prisma.project.findMany({
          where: { ownerId: user.id },
          select: { id: true },
        }),
        prisma.projectMember.findMany({
          where: {
            userId: user.id,
            status: "ACCEPTED",
            role: { in: approverRoles },
          },
          select: { projectId: true },
        }),
      ])

      const projectIds = Array.from(
        new Set([
          ...ownedProjects.map((p) => p.id),
          ...memberProjects.map((p) => p.projectId),
        ])
      )

      if (projectIds.length === 0) {
        return NextResponse.json({ success: true, data: [] })
      }

      query.task = { projectId: { in: projectIds } }
    }

    const timesheets = await prisma.timesheet.findMany({
      where: query,
      include: {
        user: { select: { id: true, name: true, email: true } },
        task: { select: { id: true, title: true } },
      },
      orderBy: { createdAt: "desc" },
    })

    return NextResponse.json({ success: true, data: timesheets })
  } catch (error) {
    console.error("Fetch timesheets error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to fetch timesheets" },
      { status: 500 }
    )
  }
}

// APPROVE/REJECT timesheet
export async function PATCH(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user)
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })

    const { timesheetId, action } = await req.json()

    if (!timesheetId) {
      return NextResponse.json(
        { success: false, error: "timesheetId is required" },
        { status: 400 }
      )
    }

    if (!["APPROVED", "REJECTED"].includes(action)) {
      return NextResponse.json(
        { success: false, error: "Invalid action. Must be APPROVED or REJECTED" },
        { status: 400 }
      )
    }

    const approverRoles: UserRole[] = ["SUPER_ADMIN", "PROJECT_ADMIN", "PROJECT_MANAGER"]
    const existing = await prisma.timesheet.findUnique({
      where: { id: timesheetId },
      select: {
        id: true,
        userId: true,
        task: { select: { projectId: true } },
      },
    })

    if (!existing) {
      return NextResponse.json(
        { success: false, error: "Timesheet not found" },
        { status: 404 }
      )
    }

    await ensureProjectRole(user.id, existing.task.projectId, approverRoles)

    const timesheet = await prisma.timesheet.update({
      where: { id: timesheetId },
      data: {
        status: action,
        approvedBy: action === "APPROVED" ? user.id : undefined,
      },
      include: {
        user: { select: { id: true, name: true, email: true } },
      },
    })

    // Send notification
    await prisma.notification.create({
      data: {
        userId: timesheet.userId,
        title: `Timesheet ${action}`,
        message: `Your timesheet has been ${action.toLowerCase()}`,
        type: "TIMESHEET_" + action,
      },
    })

    return NextResponse.json({ success: true, data: timesheet })
  } catch (error) {
    console.error("Approve timesheet error:", error)
    return NextResponse.json(
      { success: false, error: "Failed to update timesheet" },
      { status: 500 }
    )
  }
}
