import { NextRequest, NextResponse } from "next/server"
import prisma from "@/lib/prisma"
import { getUserFromRequest } from "@/lib/auth"
import { ensureProjectAccess } from "@/lib/rbac"
import { ApiError } from "@/lib/errors"

// Export report to CSV/PDF
export async function POST(req: NextRequest) {
  try {
    const user = getUserFromRequest(req)
    if (!user)
      return NextResponse.json(
        { success: false, message: "Unauthorized" },
        { status: 401 }
      )

    const body = await req.json()
    const { projectId, reportType, format } = body // format: 'CSV' | 'PDF' | 'JSON'

    if (!projectId || !reportType || !format) {
      return NextResponse.json(
        {
          success: false,
          message: "projectId, reportType, and format are required",
        },
        { status: 400 }
      )
    }

    await ensureProjectAccess(user.id, projectId)

    // Create export record
    const exportRecord = await prisma.reportExport.create({
      data: {
        projectId,
        type: reportType,
        format,
        status: "PENDING",
        createdBy: user.id,
      },
    })

    // Generate report data
    let reportData: Record<string, unknown> = {}
    let exportTaskList: Array<{
      id: string
      title: string
      status: string
      priority: string
      dueDate: string
      createdAt: string
    }> = []
    let utilTimesheets: Array<{
      user: { name: string | null; email: string }
      task: { title: string }
      date: Date
      hoursLogged: number
      status: string
    }> = []

    if (reportType === "TASK_COMPLETION") {
      const tasks = await prisma.task.findMany({
        where: { projectId },
        select: {
          id: true,
          title: true,
          status: true,
          priority: true,
          dueDate: true,
          createdAt: true,
        },
      })

      const total = tasks.length
      const completed = tasks.filter((t) => t.status === "DONE").length
      const inProgress = tasks.filter((t) => t.status === "IN_PROGRESS").length
      const todo = tasks.filter((t) => t.status === "TODO").length

      reportData = {
        summary: {
          total,
          completed,
          inProgress,
          todo,
          completionRate: total > 0 ? (completed / total) * 100 : 0,
        },
        tasks,
      }

      // Prepare export array with string dates for CSV/PDF
      exportTaskList = tasks.map((task) => ({
        id: task.id,
        title: task.title,
        status: task.status,
        priority: task.priority,
        dueDate: task.dueDate ? task.dueDate.toISOString() : "",
        createdAt: task.createdAt.toISOString(),
      }))
    } else if (reportType === "TIME_UTILIZATION") {
      const timesheets = await prisma.timesheet.findMany({
        where: {
          task: { projectId },
        },
        include: {
          user: { select: { name: true, email: true } },
          task: { select: { title: true } },
        },
      })

      utilTimesheets = timesheets

      const totalHours = timesheets.reduce((sum, t) => sum + t.hoursLogged, 0)
      const byUser = timesheets.reduce(
        (acc, t) => {
          const key = t.user.name || t.user.email
          acc[key] = (acc[key] || 0) + t.hoursLogged
          return acc
        },
        {} as Record<string, number>
      )

      reportData = {
        summary: {
          totalHours,
          totalEntries: timesheets.length,
        },
        byUser,
        entries: timesheets,
      }
    } else if (reportType === "PROJECT_PROGRESS") {
      const project = await prisma.project.findUnique({
        where: { id: projectId },
        include: {
          _count: {
            select: {
              tasks: true,
              milestones: true,
              issues: true,
            },
          },
        },
      })

      const tasks = await prisma.task.findMany({
        where: { projectId },
        select: { status: true },
      })

      const milestones = await prisma.milestone.findMany({
        where: { projectId },
        select: { status: true },
      })

      reportData = {
        project: {
          name: project?.name,
          status: project?.status,
          startDate: project?.startDate,
          endDate: project?.endDate,
        },
        tasks: {
          total: tasks.length,
          completed: tasks.filter((t) => t.status === "DONE").length,
        },
        milestones: {
          total: milestones.length,
          completed: milestones.filter((m) => m.status === "COMPLETED").length,
        },
        issues: {
          total: project?._count.issues || 0,
        },
      }
    } else if (reportType === "TEAM_PERFORMANCE") {
      const tasks = await prisma.task.findMany({
        where: { projectId },
        include: {
          assignees: {
            include: {
              user: { select: { id: true, name: true, email: true } },
            },
          },
        },
      })

      const userStats: Record<
        string,
        { name: string; total: number; completed: number; inProgress: number }
      > = {}

      tasks.forEach((task) => {
        task.assignees.forEach((assignee) => {
          const userId = assignee.user.id
          const userName = assignee.user.name || assignee.user.email
          if (!userStats[userId]) {
            userStats[userId] = {
              name: userName,
              total: 0,
              completed: 0,
              inProgress: 0,
            }
          }
          userStats[userId].total++
          if (task.status === "DONE") userStats[userId].completed++
          if (task.status === "IN_PROGRESS") userStats[userId].inProgress++
        })
      })

      reportData = {
        summary: {
          totalTasks: tasks.length,
          teamMembers: Object.keys(userStats).length,
        },
        teamStats: Object.values(userStats),
      }
    }

    // Generate CSV or PDF content
    let exportContent: string

    if (format === "CSV") {
      // CSV generation
      if (reportType === "TASK_COMPLETION") {
        exportContent = "Task ID,Title,Status,Priority,Due Date,Created At\n"
        exportTaskList.forEach((task) => {
          exportContent += `"${task.id}","${task.title}","${task.status}","${task.priority}","${task.dueDate || ""}","${task.createdAt}"\n`
        })
      } else if (reportType === "TIME_UTILIZATION") {
        exportContent = "User,Task,Date,Hours,Status\n"
        utilTimesheets.forEach((entry) => {
          exportContent += `"${entry.user.name || entry.user.email}","${entry.task.title}","${entry.date.toISOString()}","${entry.hoursLogged}","${entry.status}"\n`
        })
      } else if (reportType === "PROJECT_PROGRESS") {
        exportContent = "Metric,Value\n"
        const rd = reportData as {
          project?: { name: string; status: string }
          tasks?: { total: number; completed: number }
          milestones?: { total: number; completed: number }
          issues?: { total: number }
        }
        exportContent += `"Project Name","${rd.project?.name || ""}"\n`
        exportContent += `"Project Status","${rd.project?.status || ""}"\n`
        exportContent += `"Total Tasks","${rd.tasks?.total || 0}"\n`
        exportContent += `"Completed Tasks","${rd.tasks?.completed || 0}"\n`
        exportContent += `"Total Milestones","${rd.milestones?.total || 0}"\n`
        exportContent += `"Completed Milestones","${rd.milestones?.completed || 0}"\n`
        exportContent += `"Total Issues","${rd.issues?.total || 0}"\n`
      } else if (reportType === "TEAM_PERFORMANCE") {
        exportContent =
          "Team Member,Total Tasks,Completed,In Progress,Completion Rate\n"
        const rd = reportData as {
          teamStats?: {
            name: string
            total: number
            completed: number
            inProgress: number
          }[]
        }
        ;(rd.teamStats || []).forEach((stat) => {
          const rate =
            stat.total > 0
              ? ((stat.completed / stat.total) * 100).toFixed(1)
              : "0"
          exportContent += `"${stat.name}","${stat.total}","${stat.completed}","${stat.inProgress}","${rate}%"\n`
        })
      } else {
        exportContent = JSON.stringify(reportData, null, 2)
      }
    } else if (format === "PDF") {
      // For PDF, we'll return formatted text report
      let pdfContent = `${reportType.replace(/_/g, " ")} REPORT\n`
      pdfContent += `Generated: ${new Date().toISOString()}\n`
      pdfContent += "=".repeat(50) + "\n\n"

      if (reportType === "TASK_COMPLETION") {
        const rd = reportData as {
          summary?: {
            total: number
            completed: number
            inProgress: number
            todo: number
            completionRate: number
          }
        }
        pdfContent += `SUMMARY\n`
        pdfContent += `-`.repeat(30) + "\n"
        pdfContent += `Total Tasks: ${rd.summary?.total || 0}\n`
        pdfContent += `Completed: ${rd.summary?.completed || 0}\n`
        pdfContent += `In Progress: ${rd.summary?.inProgress || 0}\n`
        pdfContent += `To Do: ${rd.summary?.todo || 0}\n`
        pdfContent += `Completion Rate: ${(rd.summary?.completionRate || 0).toFixed(1)}%\n\n`
        pdfContent += `TASK DETAILS\n`
        pdfContent += `-`.repeat(30) + "\n"
        exportTaskList.forEach((task) => {
          pdfContent += `[${task.status}] ${task.title} (${task.priority})\n`
        })
      } else if (reportType === "TIME_UTILIZATION") {
        const rd = reportData as {
          summary?: { totalHours: number; totalEntries: number }
          byUser?: Record<string, number>
        }
        pdfContent += `SUMMARY\n`
        pdfContent += `-`.repeat(30) + "\n"
        pdfContent += `Total Hours: ${rd.summary?.totalHours || 0}\n`
        pdfContent += `Total Entries: ${rd.summary?.totalEntries || 0}\n\n`
        pdfContent += `HOURS BY USER\n`
        pdfContent += `-`.repeat(30) + "\n"
        Object.entries(rd.byUser || {}).forEach(([userName, hours]) => {
          pdfContent += `${userName}: ${hours} hours\n`
        })
      } else if (reportType === "PROJECT_PROGRESS") {
        const rd = reportData as {
          project?: { name: string; status: string }
          tasks?: { total: number; completed: number }
          milestones?: { total: number; completed: number }
          issues?: { total: number }
        }
        pdfContent += `PROJECT: ${rd.project?.name || "N/A"}\n`
        pdfContent += `Status: ${rd.project?.status || "N/A"}\n\n`
        pdfContent += `PROGRESS\n`
        pdfContent += `-`.repeat(30) + "\n"
        pdfContent += `Tasks: ${rd.tasks?.completed || 0}/${rd.tasks?.total || 0} completed\n`
        pdfContent += `Milestones: ${rd.milestones?.completed || 0}/${rd.milestones?.total || 0} completed\n`
        pdfContent += `Issues: ${rd.issues?.total || 0} total\n`
      } else if (reportType === "TEAM_PERFORMANCE") {
        const rd = reportData as {
          summary?: { totalTasks: number; teamMembers: number }
          teamStats?: {
            name: string
            total: number
            completed: number
            inProgress: number
          }[]
        }
        pdfContent += `TEAM SUMMARY\n`
        pdfContent += `-`.repeat(30) + "\n"
        pdfContent += `Total Tasks: ${rd.summary?.totalTasks || 0}\n`
        pdfContent += `Team Members: ${rd.summary?.teamMembers || 0}\n\n`
        pdfContent += `INDIVIDUAL PERFORMANCE\n`
        pdfContent += `-`.repeat(30) + "\n"
        ;(rd.teamStats || []).forEach((stat) => {
          const rate =
            stat.total > 0
              ? ((stat.completed / stat.total) * 100).toFixed(1)
              : "0"
          pdfContent += `${stat.name}: ${stat.completed}/${stat.total} (${rate}%)\n`
        })
      }

      exportContent = pdfContent
    } else {
      // JSON format
      exportContent = JSON.stringify(reportData, null, 2)
    }

    // Update export record
    await prisma.reportExport.update({
      where: { id: exportRecord.id },
      data: {
        status: "COMPLETED",
      },
    })

    return NextResponse.json({
      success: true,
      message: "Report exported successfully",
      data: {
        exportId: exportRecord.id,
        format,
        content: exportContent,
        reportData,
      },
    })
  } catch (error) {
    const status = error instanceof ApiError ? error.statusCode : 500
    const message =
      error instanceof ApiError ? error.message : "Internal server error"
    console.error("Export report error:", error)
    return NextResponse.json({ success: false, message }, { status })
  }
}
