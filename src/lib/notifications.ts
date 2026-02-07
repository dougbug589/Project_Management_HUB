import prisma from "./prisma"

// Type definition for notification types
type NotificationType = 
  | "TASK_ASSIGNED"
  | "TASK_UPDATED"
  | "TASK_COMMENT"
  | "MILESTONE_REACHED"
  | "DEADLINE_APPROACHING"
  | "ISSUE_CREATED"
  | "TIMESHEET_APPROVED"
  | "TIMESHEET_REJECTED"
  | "PROJECT_UPDATED"
  | "COMMENT_ADDED"
  | "MILESTONE_ALERT"
  | "ISSUE_REPORTED"

export async function createNotification(
  userId: string,
  type: NotificationType,
  title: string,
  message: string,
  actionUrl?: string,
  payload?: Record<string, unknown>
) {
  return prisma.notification.create({
    data: {
      userId,
      type,
      title,
      message,
      actionUrl,
      payload: payload ? JSON.stringify(payload) : undefined,
    },
  })
}

// Email notification function (simplified - would integrate with email service in production)
export async function sendEmailNotification(
  userEmail: string,
  subject: string,
  htmlContent: string
) {
  // In production, integrate with services like:
  // - SendGrid
  // - AWS SES
  // - Nodemailer
  // - Resend
  
  console.log(`[EMAIL] To: ${userEmail}`)
  console.log(`[EMAIL] Subject: ${subject}`)
  console.log(`[EMAIL] Content: ${htmlContent}`)
  
  // For now, just log. In production:
  // await emailService.send({ to: userEmail, subject, html: htmlContent })
  
  return { sent: true, email: userEmail, subject }
}

export async function notifyTaskAssigned(taskId: string, assigneeId: string, _assignedBy: string) {
  void _assignedBy
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { title: true, projectId: true },
  })
  if (!task) return

  const assignee = await prisma.user.findUnique({
    where: { id: assigneeId },
    select: { email: true, name: true },
  })

  // In-app notification
  await createNotification(
    assigneeId,
    "TASK_ASSIGNED",
    "New Task Assigned",
    `You have been assigned to task: ${task.title}`,
    `/projects/${task.projectId}/tasks/${taskId}`
  )

  // Email notification
  if (assignee?.email) {
    await sendEmailNotification(
      assignee.email,
      "New Task Assigned",
      `<h2>New Task Assignment</h2><p>Hi ${assignee.name || "there"},</p><p>You have been assigned to task: <strong>${task.title}</strong></p><p><a href="/projects/${task.projectId}/tasks/${taskId}">View Task</a></p>`
    )
  }
}

export async function notifyTaskUpdated(taskId: string, assigneeIds: string[], updatedBy: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { title: true, projectId: true },
  })
  if (!task) return

  for (const assigneeId of assigneeIds) {
    if (assigneeId !== updatedBy) {
      await createNotification(
        assigneeId,
        "TASK_UPDATED",
        "Task Updated",
        `Task "${task.title}" has been updated`,
        `/projects/${task.projectId}/tasks/${taskId}`
      )
    }
  }
}

export async function notifyCommentAdded(taskId: string, assigneeIds: string[], commentAuthor: string) {
  const task = await prisma.task.findUnique({
    where: { id: taskId },
    select: { title: true, projectId: true },
  })
  if (!task) return

  for (const assigneeId of assigneeIds) {
    if (assigneeId !== commentAuthor) {
      await createNotification(
        assigneeId,
        "COMMENT_ADDED",
        "New Comment",
        `A comment was added to task: ${task.title}`,
        `/projects/${task.projectId}/tasks/${taskId}`
      )
    }
  }
}

export async function notifyMilestoneAlert(milestoneId: string, userIds: string[]) {
  const milestone = await prisma.milestone.findUnique({
    where: { id: milestoneId },
    select: { title: true, projectId: true, dueDate: true },
  })
  if (!milestone) return

  for (const userId of userIds) {
    await createNotification(
      userId,
      "MILESTONE_ALERT",
      "Milestone Approaching",
      `Milestone "${milestone.title}" is due soon`,
      `/projects/${milestone.projectId}`
    )
  }
}

export async function notifyIssueReported(issueId: string, projectId: string, reporterId: string) {
  const managers = await prisma.projectMember.findMany({
    where: {
      projectId,
      role: { in: ["PROJECT_ADMIN", "PROJECT_MANAGER"] },
    },
    select: { userId: true },
  })

  const issue = await prisma.issue.findUnique({ where: { id: issueId }, select: { title: true } })
  if (!issue) return

  for (const m of managers) {
    if (m.userId !== reporterId) {
      await createNotification(
        m.userId,
        "ISSUE_REPORTED",
        "New Issue Reported",
        `Issue: ${issue.title}`,
        `/projects/${projectId}/issues/${issueId}`
      )
    }
  }
}

// Parse @mentions from content and notify mentioned users
export async function parseMentionsAndNotify(
  content: string,
  authorId: string,
  projectId: string,
  entityType: "task" | "project" | "comment",
  entityId: string
) {
  // Match @username patterns (alphanumeric, underscores, hyphens)
  const mentionRegex = /@([a-zA-Z0-9_-]+)/g
  const matches = content.matchAll(mentionRegex)
  const usernames = [...matches].map((m) => m[1])

  if (usernames.length === 0) return []

  // Find users by name (case-insensitive partial match)
  const mentionedUsers = await prisma.user.findMany({
    where: {
      OR: usernames.map((name) => ({
        name: { contains: name },
      })),
    },
    select: { id: true, name: true, email: true },
  })

  // Filter to project members only
  const projectMembers = await prisma.projectMember.findMany({
    where: {
      projectId,
      userId: { in: mentionedUsers.map((u) => u.id) },
      status: "ACCEPTED",
    },
    select: { userId: true },
  })

  const memberIds = new Set(projectMembers.map((m) => m.userId))
  const validMentions = mentionedUsers.filter((u) => memberIds.has(u.id) && u.id !== authorId)

  // Create notifications for each mentioned user
  for (const user of validMentions) {
    await createNotification(
      user.id,
      "TASK_COMMENT",
      "You were mentioned",
      `You were mentioned in a ${entityType}`,
      entityType === "task" ? `/tasks/${entityId}` : `/projects/${projectId}`
    )

    // Send email notification
    if (user.email) {
      await sendEmailNotification(
        user.email,
        "You were mentioned",
        `<h2>You were mentioned</h2><p>Hi ${user.name || "there"},</p><p>Someone mentioned you in a ${entityType}.</p><p>Content: "${content.substring(0, 100)}${content.length > 100 ? "..." : ""}"</p>`
      )
    }
  }

  return validMentions
}
