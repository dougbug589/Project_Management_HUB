# Task Management Module

## Overview

The Task Management module is the core system for creating, tracking, and managing work items throughout a project lifecycle. It provides comprehensive task organization with priorities, deadlines, status tracking, and dependency management.

## Technology Stack

- **Backend:** Next.js 16.1.2 with App Router
- **Database:** SQLite with Prisma ORM
- **Authentication:** JWT-based with RBAC
- **Frontend:** React 19 with TypeScript
- **Styling:** Tailwind CSS
- **Real-time Updates:** WebSocket integration

## Database Models

### Task Model

```typescript
model Task {
  id              String    @id @default(cuid())
  title           String
  description     String?
  projectId       String
  createdBy       String
  status          String    @default("TODO")
  priority        String    @default("MEDIUM")
  dueDate         DateTime?
  startDate       DateTime?
  estimatedHours  Float?
  actualHours     Float?
  milestoneId     String?
  
  // Relations
  assignees       TaskAssignee[]
  subTasks        SubTask[]
  dependencies    TaskDependency[]
  comments        Comment[]
  attachments     Attachment[]
  timesheets      Timesheet[]
  
  createdAt       DateTime  @default(now())
  updatedAt       DateTime  @updatedAt
}
```

### TaskAssignee Model

```typescript
model TaskAssignee {
  id        String    @id @default(cuid())
  taskId    String
  userId    String
  assignedAt DateTime @default(now())
  
  @@unique([taskId, userId])
}
```

### SubTask Model

```typescript
model SubTask {
  id          String    @id @default(cuid())
  title       String
  taskId      String
  status      String    @default("TODO")
  completed   Boolean   @default(false)
  
  createdAt   DateTime  @default(now())
  updatedAt   DateTime  @updatedAt
}
```

### TaskDependency Model

```typescript
model TaskDependency {
  id            String    @id @default(cuid())
  parentTaskId  String
  childTaskId   String
  type          String    @default("BLOCKED_BY")
  
  @@unique([parentTaskId, childTaskId])
}
```

## API Endpoints

### GET /api/tasks

Retrieve all tasks accessible to the current user with filtering and pagination.

**Query Parameters:**
- `projectId` (string) - Filter by project
- `status` (string) - Filter by status (TODO, IN_PROGRESS, REVIEW, COMPLETED)
- `priority` (string) - Filter by priority (LOW, MEDIUM, HIGH)
- `assigneeId` (string) - Filter by assignee
- `page` (number) - Page number (default: 1)
- `limit` (number) - Items per page (default: 20)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "task_123",
      "title": "Design API Schema",
      "status": "IN_PROGRESS",
      "priority": "HIGH",
      "dueDate": "2026-02-15T00:00:00Z",
      "assignees": ["user_1"],
      "subTasks": 3
    }
  ],
  "total": 45,
  "page": 1,
  "pageSize": 20
}
```

### POST /api/tasks

Create a new task in a project.

**Request Body:**
```json
{
  "projectId": "proj_123",
  "title": "Implement user authentication",
  "description": "Add JWT-based authentication system",
  "priority": "HIGH",
  "dueDate": "2026-02-20T00:00:00Z",
  "startDate": "2026-02-10T00:00:00Z",
  "estimatedHours": 8,
  "milestoneId": "milestone_1",
  "assignees": ["user_1", "user_2"]
}
```

**Validation:**
- Title is required (min 1, max 255 characters)
- Project must exist and user must have access
- Due date cannot be in the past
- Estimated hours must be positive

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task_456",
    "title": "Implement user authentication",
    "status": "TODO",
    "priority": "HIGH",
    "dueDate": "2026-02-20T00:00:00Z",
    "createdAt": "2026-02-09T10:30:00Z"
  }
}
```

### GET /api/tasks/[id]

Retrieve details of a specific task.

**Parameters:**
- `id` (string) - Task ID

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "title": "Design API Schema",
    "description": "Create database schema for core features",
    "status": "IN_PROGRESS",
    "priority": "HIGH",
    "dueDate": "2026-02-15T00:00:00Z",
    "assignees": [
      {
        "id": "user_1",
        "name": "John Doe",
        "email": "john@example.com"
      }
    ],
    "subTasks": [
      {
        "id": "subtask_1",
        "title": "User model",
        "completed": true
      }
    ],
    "dependencies": [],
    "attachments": 2,
    "comments": 5
  }
}
```

### PATCH /api/tasks/[id]

Update task details.

**Request Body:**
```json
{
  "title": "Design API Schema (Updated)",
  "status": "IN_PROGRESS",
  "priority": "MEDIUM",
  "dueDate": "2026-02-18T00:00:00Z",
  "actualHours": 3.5,
  "assignees": ["user_1", "user_3"]
}
```

**Allowed Updates:**
- Title, description
- Status (TODO, IN_PROGRESS, REVIEW, COMPLETED)
- Priority (LOW, MEDIUM, HIGH)
- Due date, start date
- Estimated/actual hours
- Milestone
- Assignees

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "task_123",
    "title": "Design API Schema (Updated)",
    "status": "IN_PROGRESS",
    "updatedAt": "2026-02-09T11:45:00Z"
  }
}
```

### DELETE /api/tasks/[id]

Delete a task and all related data.

**Response:**
```json
{
  "success": true,
  "message": "Task deleted successfully"
}
```

## Subtasks Management

### POST /api/subtasks

Create a subtask for a parent task.

**Request Body:**
```json
{
  "taskId": "task_123",
  "title": "Configure database",
  "description": "Set up SQLite and Prisma"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "subtask_456",
    "title": "Configure database",
    "taskId": "task_123",
    "status": "TODO",
    "completed": false
  }
}
```

### PATCH /api/subtasks/[id]

Update subtask status or mark as complete.

**Request Body:**
```json
{
  "title": "Configure database and run migrations",
  "status": "IN_PROGRESS",
  "completed": false
}
```

### DELETE /api/subtasks/[id]

Delete a subtask. Automatically updates parent task.

## Task Dependencies

### POST /api/task-dependencies

Create a dependency between two tasks.

**Request Body:**
```json
{
  "parentTaskId": "task_100",
  "childTaskId": "task_101",
  "type": "BLOCKED_BY"
}
```

**Dependency Types:**
- `BLOCKED_BY` - Child task is blocked by parent
- `DEPENDS_ON` - Child task depends on parent completion
- `RELATED_TO` - Tasks are related

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "dep_789",
    "parentTaskId": "task_100",
    "childTaskId": "task_101",
    "type": "BLOCKED_BY"
  }
}
```

### DELETE /api/task-dependencies/[id]

Remove a task dependency.

## Status Workflow

Tasks follow a standard workflow:

1. **TODO** - Task created, awaiting work
2. **IN_PROGRESS** - Work has started
3. **REVIEW** - Task complete, awaiting approval
4. **COMPLETED** - Task approved and finished

## Priority Levels

- **LOW** - Can be deferred, not critical
- **MEDIUM** - Standard priority, should be done
- **HIGH** - Urgent, should prioritize

## Authorization

**Task Visibility:**
- Project owner: Can see and edit all tasks
- Project members: Can see and edit assigned tasks
- Non-members: No access

**Task Creation:**
- Project owner
- Project members with Manager role

**Task Deletion:**
- Project owner only
- Or creator with 24-hour window

## Frontend Integration

### useTaskStore Hook

```typescript
const {
  tasks,
  loading,
  error,
  fetchTasks,
  createTask,
  updateTask,
  deleteTask,
  addSubtask,
  assignTask
} = useTaskStore()
```

### Task Component

```typescript
<TaskCard
  task={task}
  onStatusChange={handleStatusChange}
  onAssign={handleAssign}
  editable={userCanEdit}
/>
```

## Notifications

Task actions trigger notifications:

- **Task Assigned** - User notified when assigned
- **Task Due Soon** - Reminder 24 hours before due date
- **Dependency Met** - Blocked tasks notified when blocker completes
- **Status Changed** - Assignees notified of status updates
- **Comment Added** - Task participants notified

## Timesheet Integration

Each task can track time via the Timesheet module:

- Log hours worked on specific dates
- Calculate total hours vs estimated
- Generate reports by task/user
- Approve/reject time entries

## Activity Logging

All task changes are logged:

```typescript
{
  action: "UPDATE",
  entity: "Task",
  entityId: "task_123",
  userId: "user_1",
  changes: {
    status: ["TODO", "IN_PROGRESS"],
    priority: ["MEDIUM", "HIGH"]
  },
  createdAt: "2026-02-09T12:00:00Z"
}
```

## Best Practices

1. **Clear Titles** - Use descriptive, action-oriented titles
2. **Realistic Estimates** - Include buffer time in estimates
3. **Regular Updates** - Update task status to track progress
4. **Use Subtasks** - Break large tasks into manageable pieces
5. **Set Dependencies** - Document blocking relationships
6. **Assign Early** - Assign tasks immediately after creation
7. **Log Time** - Record hours worked for accurate tracking

## Performance Optimization

- Tasks indexed by projectId, status, priority, createdBy
- Pagination limits default results to 20 items
- Lazy load assignees, subtasks, and dependencies
- Cache frequently accessed tasks in frontend store
- Batch status updates to reduce API calls

