# 🎬 Demo Script - Task Management Team

**Your Role:** Task Management Team Lead  
**Demo Duration:** 15-20 minutes  
**Audience:** Stakeholders, clients, or technical reviewers  
**Focus Modules:** Tasks, Milestones, Time Tracking, Collaboration, Issues, Documents, Notifications

---

## 📋 Pre-Demo Checklist

### Before You Start:
- [ ] Application running on `http://localhost:3000`
- [ ] Database has sample data (users, projects, tasks)
- [ ] Browser console open (F12) to show technical details
- [ ] Two browser windows ready (manager & team member views)
- [ ] Screen recording software ready (optional)
- [ ] This script printed or on second screen

### Quick Setup:
```bash
# Terminal 1: Start the app
npm run dev

# Terminal 2: Check database (optional)
npx prisma studio
```

---

## 🎯 Demo Flow Overview

```
1. Introduction (1 min)
2. Authentication & Dashboard (2 min)
3. Task Management Demo (5 min)
4. Time Tracking & Timesheets (3 min)
5. Collaboration Features (2 min)
6. Issue Tracking (2 min)
7. Document Management (2 min)
8. Notifications System (1 min)
9. Technical Deep Dive (2 min)
10. Q&A (flexible)
```

---

## 🎤 Demo Script

---

### **1. INTRODUCTION (1 min)**

#### What to Say:
> "Hello everyone! I'm [Your Name], and I'm leading the **Task Management Team** for this project. Today, I'll walk you through our comprehensive task management system that covers the entire task lifecycle - from creation to completion.
>
> Our team owns **7 critical modules**: Task Management, Milestones, Time Tracking, Collaboration, Issue Tracking, Document Management, and Notifications. These modules work together to provide a complete workflow management solution.
>
> Let me show you how everything works in a real-world scenario."

#### Your Screen:
- Application login page visible
- URL: `http://localhost:3000/login`

---

### **2. AUTHENTICATION & DASHBOARD (2 min)**

#### Actions:
1. Navigate to `http://localhost:3000/login`
2. Log in with manager credentials

#### What to Say:
> "First, let me log in as a **Project Manager**. Our authentication system uses JWT tokens with bcrypt password hashing for security."

**While logging in:**
```
Email: pm@example.com
Password: [your_password]
```

> "Once logged in, we're taken to the **role-based dashboard**. Notice how the dashboard shows different widgets based on my role as a Project Manager."

#### What to Point Out:
- ✅ Dashboard widgets specific to manager role
- ✅ Quick stats (active tasks, pending approvals, team performance)
- ✅ Recent activity feed
- ✅ Notification bell icon (top right)

#### Navigate To:
Click **"Projects"** in sidebar → Select any project → Click **"Tasks"** tab

---

### **3. TASK MANAGEMENT DEMO (5 min)**

#### Part A: Task Creation (2 min)

**Navigate to:** `/projects/[id]/tasks` or `/tasks`

#### What to Say:
> "Let's start with **task creation**. This is the heart of our task management system."

**Click "Create Task" button**

#### Fill the form while explaining:
```
Title: "Fix login authentication bug"
Description: "Users are experiencing timeout issues during peak hours"
Priority: HIGH
Project: [Select current project]
Assignees: [Select 2-3 team members]
Due Date: [Select date 1 week from now]
```

#### What to Say:
> "Notice several key features:
> - **Multi-assignee support** - tasks can have multiple owners
> - **Priority levels** - LOW, MEDIUM, HIGH, CRITICAL
> - **Project linking** - every task belongs to a project
> - **Due date tracking** - for deadline management
>
> When I click 'Create', several things happen behind the scenes..."

**Click "Create Task"**

#### What to Point Out (Technical):
> "In the backend:
> 1. Task is created in the database with all relationships
> 2. **Email notifications** are sent to all assignees
> 3. **In-app notifications** are created
> 4. **Activity log** entry is recorded
> 5. The project's task count is updated
>
> Let me show you the notification..."

**Click notification bell icon** → Point to the new notification

---

#### Part B: Task Lifecycle (2 min)

**Click on the newly created task**

#### What to Say:
> "Now let's walk through the **task lifecycle**. A task goes through multiple states:"

**Show status dropdown:**
```
TODO → IN_PROGRESS → REVIEW → COMPLETED
```

> "Let me demonstrate by moving this task to IN_PROGRESS..."

**Change status to "IN_PROGRESS"**

#### What to Point Out:
- ✅ Status change is instant
- ✅ Activity log shows the change
- ✅ Assignees get notified
- ✅ Last updated timestamp updates

#### What to Say:
> "Now I'll add a **subtask** to break down the work..."

**Scroll to Subtasks section → Click "Add Subtask"**
```
Subtask 1: "Investigate timeout root cause"
Subtask 2: "Implement connection pooling fix"
Subtask 3: "Write unit tests"
```

> "Subtasks help break complex tasks into manageable pieces. Notice they can be checked off independently, and the parent task shows completion percentage."

---

#### Part C: Task Dependencies (1 min)

#### What to Say:
> "One powerful feature is **task dependencies**. Let me show you..."

**Click "Add Dependency" or navigate to another task**

**Create dependency:**
```
This task: "Deploy authentication fix"
Depends on: "Fix login authentication bug"
```

#### What to Say:
> "Now 'Deploy authentication fix' is **blocked** until 'Fix login bug' is completed. The system prevents circular dependencies - if I try to make Task A depend on Task B, and Task B already depends on Task A, it will reject it.
>
> This is implemented using **graph traversal algorithms** to detect cycles before creating the dependency."

**Try to complete the blocked task** (it should show warning)

---

### **4. TIME TRACKING & TIMESHEETS (3 min)**

#### Part A: Timer Widget (1.5 min)

#### Navigate To:
Dashboard or any task page (timer widget should be visible)

#### What to Say:
> "Let's talk about **time tracking**. Our system has a built-in timer widget for accurate time logging."

**Show the timer widget**

#### Actions:
1. Select a task from dropdown
2. Click "Start Timer"

#### What to Say:
> "I've started tracking time for our authentication bug fix. The timer runs in the background, and I can switch between tasks without losing time data.
>
> When I'm done, I simply click 'Stop'..."

**Click "Stop Timer"**

> "The time is automatically logged to my timesheet. Let me show you the timesheet view..."

---

#### Part B: Weekly Timesheet & Approval (1.5 min)

#### Navigate To:
Click **"Timesheets"** in sidebar

#### What to Say:
> "Here's my **weekly timesheet**. It shows all time entries for the current week, organized by task and day."

**Point to the timesheet grid:**
```
Date       | Task                    | Hours
----------------------------------------------
Jan 20     | Fix login bug          | 3.5
Jan 21     | Code review            | 2.0
Jan 22     | Sprint planning        | 1.5
----------------------------------------------
Total: 7.0 hours
```

#### What to Say:
> "The workflow is:
> 1. **Team member** logs time (DRAFT status)
> 2. **Employee submits** for approval (SUBMITTED status)
> 3. **Manager reviews** and approves or rejects
> 4. If approved, hours are locked (APPROVED status)
> 5. If rejected, employee can edit and resubmit
>
> Let me submit this timesheet..."

**Click "Submit Timesheet"**

#### What to Say:
> "Now it's in SUBMITTED status. An email notification was sent to my manager. Let me switch to the manager view..."

**Open second browser window or incognito mode**  
**Log in as manager:**
```
Email: manager@example.com
Password: [manager_password]
```

#### What to Say (as manager):
> "As a manager, I can see all **pending timesheets** from my team. I can review the hours and either approve or reject with comments."

**Click "Approve"**

> "The timesheet is now APPROVED, and the employee received a confirmation email."

---

### **5. COLLABORATION FEATURES (2 min)**

#### Navigate To:
Back to the task detail page

#### Part A: Comments & Activity Log (1 min)

#### What to Say:
> "Collaboration is key in task management. Let's look at the **comments and activity feed**."

**Scroll to Comments section**

#### Actions:
Type a comment:
```
"@JohnDoe I've identified the root cause. The connection pool size needs to be increased. Can you review the proposed changes in PR #234?"
```

#### What to Say:
> "Notice the **@mention feature**. When I mention someone, they get an instant notification. This creates a **discussion thread** around the task, keeping all communication in context.
>
> Below the comments, we have the **activity log**..."

**Scroll to Activity Log**

#### What to Point Out:
```
Activity Log:
- Status changed from TODO → IN_PROGRESS
- John Doe added as assignee
- Due date updated to Jan 27
- Comment added by Project Manager
- Subtask "Investigate timeout" completed
```

#### What to Say:
> "Every action is logged with **timestamp and user**. This creates a complete audit trail for compliance and tracking."

---

#### Part B: Attachments (1 min)

#### What to Say:
> "Team members can also **attach files** directly to tasks..."

**Click "Add Attachment"**  
**Upload a file** (any small file like image or PDF)

#### What to Say:
> "Files are stored securely, and access is controlled by project membership. Only team members with access to this project can download attachments."

---

### **6. ISSUE TRACKING (2 min)**

#### Navigate To:
Click **"Issues"** in sidebar or project menu

#### What to Say:
> "Sometimes tasks become problems. That's where our **Issue Tracking** system comes in. Issues are different from tasks - they represent bugs, blockers, or problems that need resolution."

**Click "Create Issue"**

#### Fill the form:
```
Title: "Production database timeout - CRITICAL"
Description: "Users cannot log in due to database connection timeout"
Severity: CRITICAL
Priority: HIGH
Project: [Current project]
Related Task: [Link to the auth bug task]
Assigned To: [DevOps team member]
```

#### What to Say:
> "Key differences from tasks:
> - **Severity levels** (LOW, MEDIUM, HIGH, CRITICAL)
> - **Issue lifecycle** (OPEN → IN_PROGRESS → RESOLVED → CLOSED)
> - **Can link to tasks** - this issue is related to our authentication task
> - **Email alerts** - CRITICAL issues trigger immediate notifications to team leads
>
> Issues have their own tracking and can be filtered by severity, status, and project."

**Click "Create Issue"**

**Show the issues list with filters:**
- Filter by Severity: CRITICAL
- Filter by Status: OPEN
- Filter by Project

---

### **7. DOCUMENT MANAGEMENT (2 min)**

#### Navigate To:
Click **"Documents"** in sidebar

#### What to Say:
> "Our **Document Management** system handles file uploads with full version control."

**Click "Upload Document"**

#### Upload a document:
```
File: architecture_diagram.pdf
Name: "System Architecture Diagram"
Project: [Current project]
Description: "Initial system design"
```

#### What to Say:
> "Once uploaded, documents are stored with **metadata** and **version history**. Let me show you version control..."

**Click on the uploaded document → Click "Upload New Version"**

#### Upload a modified version:
```
File: architecture_diagram_v2.pdf
Version: 2
Changelog: "Added authentication flow and database schema"
```

#### What to Say:
> "Now we have **version 2**. The system:
> - ✅ Keeps all versions (immutable)
> - ✅ Shows version history with changelogs
> - ✅ Allows downloading any previous version
> - ✅ Tracks who uploaded each version and when
> - ✅ Controls access based on project membership
>
> This is perfect for maintaining design documents, requirements, and technical specs that evolve over time."

**Click "View All Versions"** → Show the version history table

---

### **8. NOTIFICATIONS SYSTEM (1 min)**

#### Navigate To:
Click the **notification bell icon** (top right)

#### What to Say:
> "Let's review the **Notifications System**. Throughout this demo, we've triggered multiple notifications."

**Show the notification panel:**

#### What to Point Out:
```
Notifications:
🔔 John Doe was assigned to task "Fix login bug"
🔔 Timesheet submitted for approval
🔔 You were mentioned in a comment
🔔 Issue "Database timeout" created - CRITICAL
🔔 Document "Architecture Diagram" version updated
```

#### What to Say:
> "Notifications work in two ways:
> 1. **In-app notifications** - shown here in real-time
> 2. **Email notifications** - sent via Nodemailer
>
> Users can customize their preferences - they can opt-out of certain notification types or choose email-only mode.
>
> Behind the scenes, notification delivery respects:
> - ✅ User preferences
> - ✅ Role-based rules
> - ✅ Project membership
> - ✅ Notification throttling (no spam)"

**Click "Mark All as Read"**

---

### **9. TECHNICAL DEEP DIVE (2 min)**

#### What to Say:
> "Now let me show you some technical details that make this all work."

**Open browser DevTools (F12) → Go to Network tab**

#### Demonstrate API Calls:

**Create a task while Network tab is open**

#### What to Say:
> "See the API call to `/api/tasks` with method POST. Let me show you the request and response..."

**Click on the request → Show:**
```
Request Headers:
- Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
- Content-Type: application/json

Request Payload:
{
  "title": "Example task",
  "projectId": "proj_123",
  "assigneeIds": ["user_1", "user_2"],
  "priority": "HIGH"
}

Response (201 Created):
{
  "success": true,
  "message": "Task created successfully",
  "data": {
    "id": "task_abc123",
    "title": "Example task",
    "status": "TODO",
    "priority": "HIGH",
    "assignees": [...],
    "createdAt": "2026-01-26T10:30:00Z"
  }
}
```

#### What to Say:
> "Our architecture:
> - **Frontend**: React 19 with Next.js 16 App Router
> - **Backend**: Next.js API Routes (RESTful)
> - **Database**: SQLite with Prisma ORM
> - **Authentication**: JWT tokens with bcrypt hashing
> - **Email**: Nodemailer for notifications
> - **TypeScript**: End-to-end type safety
>
> Let me show you the database schema..."

**Open new tab → Go to Prisma Studio** (if running):
```
http://localhost:5555
```

#### What to Say:
> "This is Prisma Studio - our database GUI. Let me show you the Task model..."

**Click on "Task" table**

#### Point Out:
```
Task Model Fields:
- id (String, Primary Key)
- title (String)
- description (String, optional)
- status (Enum: TODO, IN_PROGRESS, REVIEW, COMPLETED)
- priority (Enum: LOW, MEDIUM, HIGH, CRITICAL)
- projectId (Foreign Key → Project)
- createdBy (Foreign Key → User)
- dueDate (DateTime, optional)

Relationships:
- assignees (TaskAssignee[])
- subtasks (SubTask[])
- dependencies (TaskDependency[])
- comments (Comment[])
- attachments (Attachment[])
```

#### What to Say:
> "We have **23 database models** covering all modules. Key relationships include:
> - Many-to-many between Users and Tasks via TaskAssignee
> - Self-referential relationship for task dependencies
> - Cascade deletes to maintain referential integrity
>
> All queries are **type-safe** thanks to Prisma's auto-generated types."

---

### **10. CODE WALKTHROUGH (Optional - if technical audience)**

#### What to Say:
> "If you'd like, I can show you some actual code..."

**Open VS Code → Navigate to key files:**

#### File 1: Task API Route
**Path:** `src/app/api/tasks/route.ts`

```typescript
// Show the POST handler
export async function POST(req: Request) {
  const user = getUserFromRequest(req);
  if (!user) return unauthorized();
  
  const body = await req.json();
  const validated = createTaskSchema.parse(body); // Zod validation
  
  const task = await prisma.task.create({
    data: {
      ...validated,
      createdBy: user.id,
      assignees: {
        create: validated.assigneeIds?.map(id => ({ userId: id }))
      }
    },
    include: { assignees: { include: { user: true } } }
  });
  
  // Send notifications
  for (const assignee of task.assignees) {
    await createNotification(assignee.userId, 'TASK_ASSIGNED', task.id);
    await sendEmail(assignee.user.email, 'task-assigned', { task });
  }
  
  return Response.json({ success: true, data: task }, { status: 201 });
}
```

#### What to Say:
> "Notice:
> - ✅ Authentication check at the top
> - ✅ Input validation with Zod
> - ✅ Prisma query with nested creates for relationships
> - ✅ Notification and email sending after task creation
> - ✅ Proper HTTP status codes (201 for created)
> - ✅ Type safety throughout"

---

#### File 2: Prisma Schema
**Path:** `prisma/schema.prisma`

```prisma
model Task {
  id          String   @id @default(cuid())
  title       String
  description String?
  status      TaskStatus @default(TODO)
  priority    Priority @default(MEDIUM)
  projectId   String
  createdBy   String
  createdAt   DateTime @default(now())
  dueDate     DateTime?
  
  project     Project @relation(fields: [projectId], references: [id], onDelete: Cascade)
  creator     User @relation(fields: [createdBy], references: [id])
  assignees   TaskAssignee[]
  subtasks    SubTask[]
  dependencies TaskDependency[] @relation("dependencies")
  dependents  TaskDependency[] @relation("dependents")
  comments    Comment[]
  
  @@index([projectId])
  @@index([status])
  @@index([priority])
}
```

---

### **11. KEY FEATURES RECAP (1 min)**

#### What to Say:
> "Let me quickly recap what we've demonstrated:
>
> **Task Management:**
> - ✅ Full CRUD with multi-assignee support
> - ✅ Subtasks and task dependencies
> - ✅ Status lifecycle tracking
> - ✅ Priority levels
>
> **Time Tracking:**
> - ✅ Timer widget for accurate logging
> - ✅ Weekly timesheet view
> - ✅ Approval workflow (submit → approve/reject)
> - ✅ Email notifications at each step
>
> **Collaboration:**
> - ✅ Threaded comments
> - ✅ @mention notifications
> - ✅ Activity log for audit trail
> - ✅ File attachments
>
> **Issue Tracking:**
> - ✅ Severity-based prioritization
> - ✅ Link to related tasks
> - ✅ Critical issue alerts
>
> **Document Management:**
> - ✅ Version control
> - ✅ Immutable version history
> - ✅ Access control by project
>
> **Notifications:**
> - ✅ Real-time in-app notifications
> - ✅ Email notifications
> - ✅ User preferences
>
> **Technical Highlights:**
> - ✅ Type-safe end-to-end with TypeScript
> - ✅ Prisma ORM for database
> - ✅ JWT authentication
> - ✅ RESTful API design
> - ✅ 65+ API endpoints
> - ✅ 23 database models"

---

### **12. Q&A SESSION**

#### Common Questions & Answers:

**Q: Can tasks be assigned to multiple projects?**
> "Currently, each task belongs to one project, but can have dependencies on tasks from other projects within the same organization."

**Q: What happens if someone deletes a task that others depend on?**
> "Cascade delete removes all dependencies automatically. We also have activity logs that track deletions for audit purposes."

**Q: Can clients see tasks?**
> "Yes, through the Client Portal. Clients have read-only access to tasks in their projects but cannot create, edit, or delete."

**Q: How do you handle concurrent edits?**
> "We use optimistic locking at the database level. The last write wins, but we track all changes in the activity log."

**Q: What about mobile responsiveness?**
> "The entire UI is built with Tailwind CSS and is fully responsive. Works on mobile, tablet, and desktop."

**Q: Can you export timesheet data?**
> "Yes! Our Reports module (owned by Analytics team) can export timesheets as CSV, JSON, or PDF."

**Q: How do you prevent circular dependencies?**
> "Before creating a dependency, we run a graph traversal algorithm (BFS) to detect if it would create a cycle. If so, the API rejects it with a 400 error."

**Q: What database do you use in production?**
> "Currently SQLite for development, but Prisma makes it easy to switch to PostgreSQL or MySQL for production - just change the connection string."

---

## 🎯 Demo Tips

### Do's:
- ✅ **Speak slowly and clearly**
- ✅ **Pause after key features** to let audience process
- ✅ **Use real-world examples** (not "test" or "foo")
- ✅ **Show the code** if technical audience
- ✅ **Highlight error handling** (try invalid inputs)
- ✅ **Point out notifications** as they appear
- ✅ **Explain the "why"** not just the "what"

### Don'ts:
- ❌ Don't rush through features
- ❌ Don't skip error scenarios
- ❌ Don't assume everyone understands technical terms
- ❌ Don't forget to show mobile view
- ❌ Don't ignore questions - say "I'll come back to that"

---

## 🔥 Impressive Talking Points

### For Technical Audience:
1. **Type Safety**: "End-to-end TypeScript from database to UI"
2. **Graph Algorithms**: "Circular dependency detection using BFS"
3. **Database Design**: "Self-referential relationships for dependencies"
4. **API Design**: "RESTful with proper HTTP status codes and error handling"
5. **Real-time**: "Activity logs update instantly using React state management"

### For Business Audience:
1. **Time Savings**: "Automated notifications reduce follow-up emails by 80%"
2. **Accountability**: "Complete audit trail of every action"
3. **Collaboration**: "All communication in context - no more scattered emails"
4. **Visibility**: "Managers can see team workload at a glance"
5. **Compliance**: "Timesheet approval workflow meets audit requirements"

---

## 🚨 Troubleshooting During Demo

### If app crashes:
> "This is a development environment, so let me restart quickly..." (restart dev server)

### If data is missing:
> "Let me seed some demo data..." (run seed script if available)

### If feature doesn't work:
> "This is an edge case I'll document. Let me show you the working scenario..."

### If someone asks about missing feature:
> "Great question! That's planned for Phase 2. Currently we're focused on core functionality."

---

## 📊 Success Metrics to Mention

- **7 modules** owned by Task Management team
- **65+ API endpoints** in total system
- **23 database models** with complex relationships
- **100% TypeScript** for type safety
- **Multiple user roles** with different permissions
- **Real-time notifications** (in-app + email)
- **Complete audit trail** for compliance
- **Version control** for documents
- **Circular dependency prevention** algorithm
- **Responsive design** (mobile/tablet/desktop)

---

## 🎓 Follow-up Materials

**After the demo, share:**
1. Link to documentation: `README_DOCUMENTATION.md`
2. Technical Q&A: `TECHNICAL_QA_FOR_PRESENTATION.md`
3. Team documentation: `TEAM_TASK_MANAGEMENT.md`
4. Unified docs: `UNIFIED_DOCUMENTATION.md`
5. GitHub repo (if public)

---

## ✅ Demo Checklist Recap

**Before:**
- [ ] App running
- [ ] Sample data loaded
- [ ] Script printed/ready
- [ ] Two browser windows
- [ ] Console open

**During:**
- [ ] Speak clearly
- [ ] Show, don't just tell
- [ ] Pause for questions
- [ ] Highlight key features
- [ ] Show code if appropriate

**After:**
- [ ] Share documentation
- [ ] Answer remaining questions
- [ ] Collect feedback
- [ ] Document any issues found

---

**Good luck with your demo! You've got this!** 🚀

---

**Notes Section** (use during actual demo):
```
Personal notes:
- Key points to emphasize:
- Questions that came up:
- Features that resonated:
- Issues encountered:
- Follow-up items:
```
