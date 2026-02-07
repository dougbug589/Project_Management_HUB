import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ApiError } from "@/lib/errors"

export async function GET(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user) return NextResponse.json({ success: false, message: "Unauthorized" }, { status: 401 })

    const organizationId = (user as any).organizationId || undefined

    const [projects, tasks, issues, timesheets] = await Promise.all([
      prisma.project.count({ where: { organizationId } }),
      prisma.task.count({ where: { project: { organizationId } } }),
      prisma.issue.count({ where: { project: { organizationId } } }),
      prisma.timesheet.count({ where: { task: { project: { organizationId } } } }),
    ])

    const overdueTasks = await prisma.task.count({
      where: {
        project: { organizationId },
        dueDate: { lt: new Date() },
        status: { notIn: ["COMPLETED", "CANCELLED"] },
      },
    })

    return NextResponse.json({
      success: true,
      data: {
        projects,
        tasks,
        issues,
        timesheets,
        overdueTasks,
      },
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message = error instanceof ApiError ? error.message : "Internal server error"
    console.error("Dashboard error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
