# Team Doc: Task Management Team

## Overview
Owns task creation, assignment, dependencies, timesheets, milestones, issue tracking, documents, and notifications.

## Modules - Role Overview

| Module | Role | Contribution |
|--------|------|-------------|
| 1. Authentication & Organizations | — | Not involved |
| 2. Project Management | Support | Task creation within projects |
| 3. Task Management | **PRIMARY** | Full CRUD, dependencies, subtasks, assignments |
| 4. Milestones & Phases | **PRIMARY** | Milestone creation, phase management, deadlines |
| 5. Time Tracking & Timesheets | **PRIMARY** | Timer, timesheet approval workflows |
| 6. Collaboration | **PRIMARY** | Comments, discussions, activity logging |
| 7. Issue Tracking | **PRIMARY** | Issue CRUD, severity, prioritization |
| 8. Document Management | **PRIMARY** | File uploads, versioning, access control |
| 9. Reports & Analytics | Support | Task/timesheet data for reports |
| 10. Notifications & Preferences | **PRIMARY** | Email/in-app notifications for assignments, approvals |
| 11. Client Portal | Support | Task viewing (read-only) for clients |
| 12. Role-based Dashboards | Support | Task metrics, progress indicators |

## Key Files & Architecture
- `src/app/api/tasks/route.ts` - Task CRUD operations
- `src/app/api/tasks/[id]/route.ts` - Task detail updates
- `src/app/api/milestones/route.ts` - Milestone management
- `src/app/api/timesheets/route.ts` - Timesheet submission and approval
- `src/app/api/comments/route.ts` - Comments and activity feed
- `src/app/api/issues/route.ts` - Issue tracking
- `src/app/api/documents/route.ts` - Document uploads and versioning
- `src/app/api/notifications/route.ts` - Notification system
- `src/app/tasks/page.tsx` - Task list UI
- `src/app/tasks/[id]/page.tsx` - Task detail page
- `src/components/TimerWidget.tsx` - Time tracking widget
- `src/components/WeeklyTimesheet.tsx` - Timesheet UI

## Technical Stack
- **Database Models**: Task, SubTask, TaskAssignee, TaskDependency, Milestone, Phase, Comment, Issue, Document, DocumentVersion, Timesheet, Notification, ActivityLog
- **Email**: Nodemailer (task assignments, timesheet approvals, issue alerts)
- **Realtime**: Activity logs, comment updates

## Database Schema

```typescript
// Prisma schema excerpt
model Task {
  id String @id @default(cuid())
  title String
  description String?
  status TaskStatus @default(TODO) // TODO, IN_PROGRESS, REVIEW, COMPLETED
  priority Priority @default(MEDIUM) // LOW, MEDIUM, HIGH, CRITICAL
  projectId String
  createdBy String
  createdAt DateTime @default(now())
  dueDate DateTime?
  
  assignees TaskAssignee[]
  subtasks SubTask[]
  dependencies TaskDependency[]
  comments Comment[]
  attachments Attachment[]
}

model SubTask {
  id String @id @default(cuid())
  title String
  completed Boolean @default(false)
  taskId String
  task Task @relation(fields: [taskId], references: [id], onDelete: Cascade)
}

model TaskDependency {
  id String @id @default(cuid())
  taskId String
  task Task @relation("dependencies", fields: [taskId], references: [id], onDelete: Cascade)
  dependsOnId String
  dependsOn Task @relation("dependents", fields: [dependsOnId], references: [id], onDelete: Cascade)
}

model Milestone {
  id String @id @default(cuid())
  title String
  projectId String
  dueDate DateTime
  phase Phase?
  tasks Task[] @relation("milestoneTask")
}

model Timesheet {
  id String @id @default(cuid())
  userId String
  weekStartDate DateTime
  totalHours Float
  status TimesheetStatus @default(DRAFT) // DRAFT, SUBMITTED, APPROVED, REJECTED
  approvedBy String?
  submittedAt DateTime?
  approvedAt DateTime?
  entries TimesheetEntry[]
}
```

## Core APIs

```typescript
// Task CRUD
POST /api/tasks
{
  title: string,
  description?: string,
  projectId: string,
  assigneeIds?: string[],
  dueDate?: Date,
  priority?: 'LOW'|'MEDIUM'|'HIGH'|'CRITICAL'
}
Response: { task: Task, message: 'Task created' }

GET /api/tasks?projectId=proj1&status=IN_PROGRESS&priority=HIGH
Response: { tasks: Task[], total: number }

PATCH /api/tasks/task1
{
  title?: string,
  status?: 'TODO'|'IN_PROGRESS'|'REVIEW'|'COMPLETED',
  assigneeIds?: string[]
}
Response: { task: Task }

DELETE /api/tasks/task1
Response: { message: 'Task deleted' }

// Dependencies
POST /api/task-dependencies
{
  taskId: string,
  dependsOnId: string
}
Response: { dependency: TaskDependency }

// Timesheet
POST /api/timesheets/submit
{
  weekStartDate: Date,
  entries: { taskId: string, hours: number }[]
}
Response: { timesheet: Timesheet, notificationsSent: true }

PATCH /api/timesheets/timesh1/approve
{
  approvedBy: string // manager user ID
}
Response: { timesheet: Timesheet, emailSent: true }

// Comments
POST /api/comments
{
  taskId: string,
  content: string,
  mentions?: string[] // user IDs
}
Response: { comment: Comment, notificationsSent: true }
```

## Code Examples - Task Creation

```typescript
// Create task with assignments and notifications
export async function createTask(data: CreateTaskInput) {
  const task = await prisma.task.create({
    data: {
      title: data.title,
      description: data.description,
      projectId: data.projectId,
      priority: data.priority || 'MEDIUM',
      createdBy: data.userId,
      assignees: {
        create: data.assigneeIds?.map(id => ({ userId: id })) || []
      }
    },
    include: { assignees: true }
  });

  // Send notifications to assignees
  for (const assignee of task.assignees) {
    await sendEmail({
      to: assignee.user.email,
      subject: `New task assigned: ${task.title}`,
      template: 'task-assigned',
      data: { taskId: task.id, title: task.title }
    });

    await prisma.notification.create({
      data: {
        userId: assignee.userId,
        type: 'TASK_ASSIGNED',
        relatedId: task.id,
        message: `You've been assigned to: ${task.title}`
      }
    });
  }

  return task;
}

// Update task status
export async function updateTaskStatus(taskId: string, newStatus: TaskStatus) {
  const oldTask = await prisma.task.findUnique({ 
    where: { id: taskId },
    include: { assignees: true }
  });

  const updated = await prisma.task.update({
    where: { id: taskId },
    data: { status: newStatus },
    include: { assignees: true, comments: true }
  });

  // Log activity
  await prisma.activityLog.create({
    data: {
      relatedId: taskId,
      action: 'STATUS_CHANGED',
      oldValue: oldTask?.status,
      newValue: newStatus,
      userId: context.userId
    }
  });

  return updated;
}
```

## Testing

```typescript
test('Create task with assignees', async () => {
  const task = await axios.post('/api/tasks', {
    title: 'Fix login bug',
    projectId: 'proj1',
    assigneeIds: ['user2', 'user3'],
    priority: 'HIGH'
  }, { headers: { Authorization: `Bearer ${token}` } });
  
  expect(task.status).toBe(201);
  expect(task.data.task.assignees).toHaveLength(2);
});

test('Prevent circular task dependencies', async () => {
  // Create task1 → task2, then try task2 → task1
  await axios.post('/api/task-dependencies', {
    taskId: 'task1',
    dependsOnId: 'task2'
  });
  
  try {
    await axios.post('/api/task-dependencies', {
      taskId: 'task2',
      dependsOnId: 'task1'
    });
  } catch (error: any) {
    expect(error.response.status).toBe(400);
    expect(error.response.data.message).toContain('circular');
  }
});

test('Submit and approve timesheet', async () => {
  // Submit
  const submitRes = await axios.post('/api/timesheets/submit', {
    weekStartDate: new Date('2025-01-13'),
    entries: [
      { taskId: 'task1', hours: 8 },
      { taskId: 'task2', hours: 6 }
    ]
  });
  expect(submitRes.data.timesheet.status).toBe('SUBMITTED');

  // Approve
  const approveRes = await axios.patch(`/api/timesheets/${submitRes.data.timesheet.id}/approve`, {
    approvedBy: 'manager1'
  });
  expect(approveRes.data.timesheet.status).toBe('APPROVED');
});
```

## Demo Checklist
- Create task with subtasks, dependencies, assignments
- Highlight assignee notifications and activity feed
- Show milestone progress calculation
- Time tracking flow with approval
- Comments and @mentions
- Issue tracking with severity
- Document versioning
- Dependency validation (prevent circular)
