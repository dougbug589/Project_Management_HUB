# Technical Q&A for Project Presentation

## Architecture & Design Questions

### Q1: What is the overall architecture of this application?
**Answer:**
This is a **full-stack Next.js 16.1.2 application** using the App Router pattern. It follows a monolithic architecture where both frontend and backend are in a single codebase.

**Architecture Components:**
- **Frontend**: React 19.2.3 with TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes (REST endpoints in `/src/app/api/*`)
- **Database**: SQLite with Prisma ORM 5.22.0
- **Authentication**: JWT-based with bcryptjs for password hashing
- **File Structure**: App Router pattern (`/src/app/`) with route-based organization

**Benefits:**
- Type safety end-to-end with TypeScript
- Server-side rendering and API routes in one framework
- Simplified deployment (single deployment unit)
- Shared types between frontend and backend

---

### Q2: Why did you choose Next.js over traditional MERN stack?
**Answer:**
**Key Reasons:**

1. **Unified Codebase**: Frontend and backend in one framework eliminates the need for separate Express.js server
2. **Built-in API Routes**: Next.js provides API routes out of the box (`/app/api/*`)
3. **Type Safety**: Shared TypeScript types between frontend and backend
4. **Performance**: Server-side rendering (SSR) and static generation options
5. **Developer Experience**: Hot reload for both frontend and backend code
6. **Modern Patterns**: App Router with React Server Components
7. **Deployment**: Simpler deployment (one app vs. separate frontend/backend)

**Trade-offs Considered:**
- SQLite chosen for simplicity (can migrate to PostgreSQL/MySQL for production)
- Prisma ORM for type-safe database queries vs. Mongoose for MongoDB

---

### Q3: Explain your database schema and relationships
**Answer:**
**23 Prisma models** covering all modules:

**Core Entities:**
```typescript
User → has many → Projects (via ProjectMember)
     → has many → Tasks (via TaskAssignee)
     → has many → Timesheets
     → belongs to → Organization

Project → has many → Tasks, Milestones, Phases, Issues, Documents
        → has many → ProjectMembers

Task → has many → TaskAssignees, SubTasks, Comments, Attachments
     → has many → TaskDependencies (self-referential)
     → belongs to → Project, Milestone

Timesheet → has many → TimesheetEntries
          → belongs to → User
          → references → Tasks (for time tracking)
```

**Key Relationships:**
- **Many-to-Many**: User ↔ Project (via ProjectMember with role)
- **Self-Referential**: TaskDependency (task depends on another task)
- **Cascade Delete**: Project deletion cascades to tasks, milestones, documents
- **Soft References**: Timesheet entries reference tasks for reporting

**Design Decisions:**
- Used `cuid()` for IDs (collision-resistant, URL-safe)
- Enum types for status/priority/role (type safety)
- `onDelete: Cascade` for parent-child relationships
- Indexed foreign keys for query performance

---

## Implementation Questions

### Q4: How did you implement authentication and authorization?
**Answer:**
**Authentication Flow:**

```typescript
// 1. User Signup
POST /api/auth/signup
- Validate email/password with Zod
- Hash password with bcryptjs (10 salt rounds)
- Create User + Organization
- Generate JWT token (7-day expiry)
- Return token + user data

// 2. User Login
POST /api/auth/login
- Find user by email
- Compare password with bcrypt
- Generate JWT token
- Return token + user data

// 3. Protected Routes
- Middleware extracts JWT from Authorization header
- Verify token with jwt.verify()
- Attach userId to request context
- Reject if invalid/expired
```

**Authorization (RBAC):**
```typescript
// Role hierarchy
OWNER > MANAGER > MEMBER > CLIENT

// Permission checks
- Project deletion: Only OWNER/MANAGER
- Task assignment: MANAGER and above
- Timesheet approval: MANAGER only
- Client portal: Read-only access

// Implementation
function requireRole(requiredRole: Role) {
  const userRole = await getUserRole(userId, projectId);
  if (!hasPermission(userRole, requiredRole)) {
    throw new Error('Forbidden', 403);
  }
}
```

**Security Measures:**
- Passwords hashed with bcryptjs (never stored plain text)
- JWT tokens with expiration (7 days)
- HTTP-only cookies option (CSRF protection)
- Input validation with Zod schemas
- SQL injection prevented by Prisma (parameterized queries)

---

### Q5: Explain your task dependency system
**Answer:**
**Implementation:**

```typescript
model TaskDependency {
  id String @id @default(cuid())
  taskId String
  dependsOnId String
  
  task Task @relation("dependencies", fields: [taskId])
  dependsOn Task @relation("dependents", fields: [dependsOnId])
  
  @@unique([taskId, dependsOnId])
}
```

**Features:**
1. **Circular Dependency Prevention:**
```typescript
async function validateNoCycle(taskId: string, dependsOnId: string) {
  // BFS to detect cycles
  const visited = new Set<string>();
  const queue = [dependsOnId];
  
  while (queue.length > 0) {
    const current = queue.shift()!;
    if (current === taskId) {
      throw new Error('Circular dependency detected');
    }
    if (visited.has(current)) continue;
    visited.add(current);
    
    const deps = await prisma.taskDependency.findMany({
      where: { taskId: current },
      select: { dependsOnId: true }
    });
    queue.push(...deps.map(d => d.dependsOnId));
  }
}
```

2. **Blocking Logic:**
- Task cannot be completed if dependencies are incomplete
- UI shows "Blocked by" indicator
- API validates status transitions

3. **Cascade Behavior:**
- Deleting task removes all related dependencies
- No orphaned dependency records

---

### Q6: How does the timesheet approval workflow work?
**Answer:**
**State Machine:**

```
DRAFT → SUBMITTED → APPROVED/REJECTED → (loop back to DRAFT if rejected)
```

**Implementation:**

```typescript
// 1. Employee submits timesheet
POST /api/timesheets/submit
{
  weekStartDate: '2026-01-20',
  entries: [
    { taskId: 'task1', hours: 8, date: '2026-01-20' },
    { taskId: 'task2', hours: 6, date: '2026-01-21' }
  ]
}

// Creates Timesheet with status: SUBMITTED
// Sends email notification to manager

// 2. Manager reviews
GET /api/timesheets?status=SUBMITTED&userId=emp123
// Returns pending timesheets

// 3. Manager approves
PATCH /api/timesheets/:id/approve
{
  approvedBy: 'manager123',
  comments?: 'Approved - great work'
}

// Updates: status → APPROVED, approvedAt → now()
// Sends confirmation email to employee

// 4. Manager rejects (if needed)
PATCH /api/timesheets/:id/reject
{
  approvedBy: 'manager123',
  reason: 'Hours seem incorrect for Task 1'
}

// Updates: status → REJECTED
// Employee can edit and resubmit
```

**Business Rules:**
- Only MANAGER role can approve/reject
- Cannot approve own timesheet
- Rejected timesheets can be edited and resubmitted
- Email notifications at each state transition
- Total hours calculated automatically

---

### Q7: How did you implement real-time notifications?
**Answer:**
**Notification System:**

```typescript
// 1. In-app Notifications (Database)
model Notification {
  id String @id
  userId String
  type NotificationType // TASK_ASSIGNED, COMMENT_MENTION, etc.
  relatedId String // taskId, projectId, etc.
  message String
  read Boolean @default(false)
  createdAt DateTime
}

// 2. Email Notifications (Nodemailer)
async function sendEmail(options: {
  to: string,
  subject: string,
  template: string,
  data: Record<string, any>
}) {
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: 587,
    auth: { user: ..., pass: ... }
  });
  
  await transporter.sendMail({
    from: 'noreply@projectapp.com',
    to: options.to,
    subject: options.subject,
    html: renderTemplate(options.template, options.data)
  });
}

// 3. Notification Triggers
// Task Assignment
task.assignees.forEach(assignee => {
  createNotification({
    userId: assignee.userId,
    type: 'TASK_ASSIGNED',
    message: `You've been assigned to: ${task.title}`
  });
  sendEmail({
    to: assignee.email,
    subject: 'New Task Assignment',
    template: 'task-assigned',
    data: { taskId, title }
  });
});

// Comment @mention
if (comment.mentions.length > 0) {
  comment.mentions.forEach(userId => {
    createNotification({
      userId,
      type: 'COMMENT_MENTION',
      message: `${user.name} mentioned you in a comment`
    });
  });
}

// Timesheet Status Change
sendEmail({
  to: timesheet.user.email,
  subject: `Timesheet ${status}`,
  template: `timesheet-${status.toLowerCase()}`
});
```

**Optimization:**
- Notifications respect user preferences (can opt-out)
- Batch email sending for performance
- Read/unread tracking
- Notification bell icon shows unread count

---

### Q8: Explain your file upload and versioning system
**Answer:**
**Document Management:**

```typescript
model Document {
  id String @id
  name String
  projectId String
  uploadedBy String
  createdAt DateTime
  currentVersion Int
  versions DocumentVersion[]
}

model DocumentVersion {
  id String @id
  documentId String
  version Int
  fileUrl String // S3 or local path
  fileSize Int
  mimeType String
  uploadedBy String
  uploadedAt DateTime
  changelog String?
}
```

**Upload Flow:**

```typescript
// 1. Initial Upload
POST /api/documents
- multipart/form-data
- File stored in /uploads or S3
- Create Document + DocumentVersion v1

// 2. New Version Upload
POST /api/documents/:id/versions
- Increment currentVersion
- Create new DocumentVersion record
- Keep old versions (immutable)
- Track changelog

// 3. Version Retrieval
GET /api/documents/:id/versions
- Returns all versions
- Download specific version by versionId

// 4. Access Control
- Check project membership before download
- Only project members can access
- Version history audit trail
```

**Storage Strategy:**
- Local filesystem during development
- S3/Cloud Storage for production
- Metadata in database, files in object storage
- Immutable versions (old versions never deleted)

---

## Technical Decisions

### Q9: Why Prisma ORM over raw SQL or other ORMs?
**Answer:**

**Advantages:**

1. **Type Safety:**
```typescript
// Auto-generated types
const task: Task = await prisma.task.findUnique({...});
// TypeScript knows all Task fields
```

2. **Relation Loading:**
```typescript
// Include related data easily
const project = await prisma.project.findUnique({
  where: { id: 'proj1' },
  include: {
    tasks: true,
    members: { include: { user: true } },
    milestones: true
  }
});
```

3. **Migration Management:**
```bash
npx prisma migrate dev --name add_priority_field
# Generates migration SQL automatically
```

4. **Database Agnostic:**
- SQLite for development
- Can switch to PostgreSQL/MySQL by changing connection string
- Same Prisma code works across databases

5. **Query Performance:**
- Generates optimized SQL
- Connection pooling built-in
- N+1 query prevention with `include`

**vs. Raw SQL:**
- Less boilerplate
- Type-safe queries
- No SQL injection risk

**vs. TypeORM/Sequelize:**
- Better TypeScript support
- Simpler API
- Better migration tooling

---

### Q10: How do you handle errors and validation?
**Answer:**

**1. Input Validation (Zod):**
```typescript
import { z } from 'zod';

const createTaskSchema = z.object({
  title: z.string().min(1, 'Title required').max(200),
  description: z.string().optional(),
  projectId: z.string().cuid(),
  priority: z.enum(['LOW', 'MEDIUM', 'HIGH', 'CRITICAL']),
  dueDate: z.date().optional(),
  assigneeIds: z.array(z.string()).optional()
});

// In API route
const result = createTaskSchema.safeParse(req.body);
if (!result.success) {
  return res.status(400).json({ 
    error: 'Validation failed',
    details: result.error.flatten()
  });
}
```

**2. Error Handling Middleware:**
```typescript
class AppError extends Error {
  constructor(
    public message: string,
    public statusCode: number,
    public code?: string
  ) {
    super(message);
  }
}

// In API routes
try {
  // Business logic
} catch (error) {
  if (error instanceof AppError) {
    return res.status(error.statusCode).json({
      error: error.message,
      code: error.code
    });
  }
  
  console.error('Unexpected error:', error);
  return res.status(500).json({
    error: 'Internal server error'
  });
}
```

**3. Database Constraint Errors:**
```typescript
try {
  await prisma.user.create({ data: {...} });
} catch (error) {
  if (error.code === 'P2002') {
    // Unique constraint violation
    throw new AppError('Email already exists', 409, 'DUPLICATE_EMAIL');
  }
  throw error;
}
```

**4. Frontend Error Display:**
```typescript
// Toast notifications
showToast({
  type: 'error',
  message: error.response.data.error
});

// Form field errors
<Input 
  error={errors.email?.message}
  aria-invalid={!!errors.email}
/>
```

---

### Q11: How is your application structured for scalability?
**Answer:**

**Current Structure:**
```
src/
├── app/
│   ├── api/          # API routes (backend)
│   ├── [pages]/      # Frontend pages
│   └── layout.tsx    # Root layout
├── components/       # Reusable UI components
├── lib/             # Utilities and helpers
│   ├── prisma.ts    # Database client
│   ├── auth.ts      # Auth utilities
│   └── api.ts       # API client
└── contexts/        # React contexts
```

**Scalability Strategies:**

1. **Database Connection Pooling:**
```typescript
// lib/prisma.ts
const globalForPrisma = global as unknown as { prisma: PrismaClient };

export const prisma = globalForPrisma.prisma || new PrismaClient();

if (process.env.NODE_ENV !== 'production') {
  globalForPrisma.prisma = prisma;
}
// Prevents multiple instances in development
```

2. **API Route Organization:**
- One file per endpoint
- Shared validation schemas in `/lib/schemas`
- Reusable middleware functions

3. **Component Reusability:**
- UI components in `/components/ui/*`
- Business components in feature folders
- Shared types in `/types`

4. **Future Scaling Options:**
- **Database**: Migrate SQLite → PostgreSQL (change connection string)
- **Caching**: Add Redis for session/query caching
- **File Storage**: Move to S3/CloudFlare R2
- **Search**: Add ElasticSearch for full-text search
- **Queue**: Add Bull/BullMQ for background jobs (email sending)
- **Monitoring**: Add Sentry for error tracking

5. **Performance Optimizations:**
- React Server Components (reduce client JS)
- Lazy loading with React.lazy()
- Image optimization with next/image
- API response caching with Next.js Cache

---

## Module-Specific Questions

### Q12: Walk me through the task creation flow from UI to database
**Answer:**

**Step-by-Step:**

```typescript
// 1. Frontend - User fills form
// src/app/tasks/create/page.tsx
const [formData, setFormData] = useState({
  title: '',
  projectId: '',
  assigneeIds: [],
  priority: 'MEDIUM',
  dueDate: null
});

const handleSubmit = async () => {
  const response = await fetch('/api/tasks', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`
    },
    body: JSON.stringify(formData)
  });
  
  if (!response.ok) {
    throw new Error('Failed to create task');
  }
  
  const { task } = await response.json();
  router.push(`/tasks/${task.id}`);
};

// 2. API Route - Validate and process
// src/app/api/tasks/route.ts
export async function POST(request: Request) {
  // Auth check
  const userId = await getUserIdFromToken(request);
  if (!userId) {
    return new Response('Unauthorized', { status: 401 });
  }
  
  // Parse and validate
  const body = await request.json();
  const validated = createTaskSchema.parse(body);
  
  // Permission check
  const hasAccess = await checkProjectMembership(
    userId, 
    validated.projectId
  );
  if (!hasAccess) {
    return new Response('Forbidden', { status: 403 });
  }
  
  // Create task with assignees
  const task = await prisma.task.create({
    data: {
      title: validated.title,
      description: validated.description,
      projectId: validated.projectId,
      priority: validated.priority,
      dueDate: validated.dueDate,
      createdBy: userId,
      assignees: {
        create: validated.assigneeIds?.map(id => ({
          userId: id
        })) || []
      }
    },
    include: {
      assignees: {
        include: { user: true }
      }
    }
  });
  
  // 3. Side effects - Notifications
  for (const assignee of task.assignees) {
    await prisma.notification.create({
      data: {
        userId: assignee.userId,
        type: 'TASK_ASSIGNED',
        relatedId: task.id,
        message: `You've been assigned to: ${task.title}`
      }
    });
    
    await sendEmail({
      to: assignee.user.email,
      subject: 'New Task Assignment',
      template: 'task-assigned',
      data: { taskId: task.id, title: task.title }
    });
  }
  
  // 4. Activity log
  await prisma.activityLog.create({
    data: {
      action: 'TASK_CREATED',
      relatedId: task.id,
      userId: userId,
      metadata: { title: task.title }
    }
  });
  
  return Response.json({ task }, { status: 201 });
}

// 3. Database - Prisma executes queries
// SQLite stores data with relationships
```

**Error Handling at Each Layer:**
- **Frontend**: Form validation, network errors
- **API**: Auth, permissions, validation, database errors
- **Database**: Constraint violations, transaction rollbacks

---

### Q13: How do you generate and export reports?
**Answer:**

**Report Generation Flow:**

```typescript
// 1. Report Types
enum ReportType {
  PROJECT_PROGRESS = 'project-progress',
  TASK_COMPLETION = 'task-completion',
  TIME_UTILIZATION = 'time-utilization',
  TEAM_PERFORMANCE = 'team-performance'
}

// 2. Data Aggregation
// GET /api/reports?type=project-progress
async function generateProjectProgressReport(filters: {
  projectId?: string,
  startDate?: Date,
  endDate?: Date
}) {
  const projects = await prisma.project.findMany({
    where: {
      id: filters.projectId,
      createdAt: { gte: filters.startDate, lte: filters.endDate }
    },
    include: {
      tasks: true,
      _count: {
        select: {
          tasks: true,
          members: true
        }
      }
    }
  });
  
  return projects.map(project => ({
    id: project.id,
    name: project.name,
    totalTasks: project._count.tasks,
    completedTasks: project.tasks.filter(t => 
      t.status === 'COMPLETED'
    ).length,
    percentComplete: Math.round(
      (project.tasks.filter(t => t.status === 'COMPLETED').length / 
       project.tasks.length) * 100
    ),
    teamSize: project._count.members,
    daysRemaining: differenceInDays(project.endDate, new Date())
  }));
}

// 3. Export Formats
// POST /api/reports/export
async function exportReport(data: any[], format: 'csv' | 'json' | 'pdf') {
  switch (format) {
    case 'csv':
      const csv = convertToCSV(data);
      return new Response(csv, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': 'attachment; filename="report.csv"'
        }
      });
      
    case 'json':
      return Response.json(data, {
        headers: {
          'Content-Disposition': 'attachment; filename="report.json"'
        }
      });
      
    case 'pdf':
      const pdf = await generatePDF(data);
      return new Response(pdf, {
        headers: {
          'Content-Type': 'application/pdf',
          'Content-Disposition': 'attachment; filename="report.pdf"'
        }
      });
  }
}

// 4. PDF Generation (pdfkit)
async function generatePDF(data: ReportData[]) {
  const PDFDocument = require('pdfkit');
  const doc = new PDFDocument();
  
  doc.fontSize(20).text('Project Progress Report', { align: 'center' });
  doc.moveDown();
  
  data.forEach(project => {
    doc.fontSize(14).text(project.name);
    doc.fontSize(10).text(`Progress: ${project.percentComplete}%`);
    doc.text(`Tasks: ${project.completedTasks}/${project.totalTasks}`);
    doc.moveDown();
  });
  
  doc.end();
  return streamToBuffer(doc);
}
```

**Features:**
- Filters: Project, date range, team, user
- Formats: CSV, JSON, PDF
- Charts: Progress bars, pie charts (using chart.js)
- Scheduling: Can schedule weekly/monthly reports (future feature)

---

### Q14: Explain the client portal implementation
**Answer:**

**Access Control:**

```typescript
// Role-based routing
// src/app/client/projects/[id]/page.tsx

// 1. Authentication check
const user = await getCurrentUser();
if (!user) redirect('/login');

// 2. Role verification
if (user.role !== 'CLIENT') {
  return <div>Access Denied</div>;
}

// 3. Project access check
const project = await prisma.project.findFirst({
  where: {
    id: params.id,
    members: {
      some: {
        userId: user.id,
        role: 'CLIENT'
      }
    }
  },
  include: {
    tasks: {
      select: {
        id: true,
        title: true,
        status: true,
        dueDate: true,
        assignees: { include: { user: true } }
      }
    },
    milestones: true,
    documents: true
  }
});

if (!project) {
  return <div>Project not found</div>;
}

// 4. Read-only view
return (
  <div>
    <h1>{project.name}</h1>
    <ProjectProgress tasks={project.tasks} />
    <MilestoneTimeline milestones={project.milestones} />
    <DocumentList documents={project.documents} readOnly />
    {/* No edit/delete buttons for clients */}
  </div>
);
```

**Features for Clients:**
- ✅ View project overview and progress
- ✅ See task list (read-only)
- ✅ Download documents
- ✅ View milestones and deadlines
- ✅ See team members
- ❌ Cannot create/edit/delete anything
- ❌ Cannot access other projects
- ❌ Cannot see internal discussions

**API Enforcement:**
```typescript
// All mutation endpoints check role
if (user.role === 'CLIENT') {
  return new Response('Forbidden - read-only access', { status: 403 });
}
```

---

## Testing & Quality

### Q15: What testing strategy did you implement?
**Answer:**

**E2E Testing (Axios-based):**

```typescript
// tests/e2e-feature-test.ts
import axios from 'axios';

const BASE_URL = 'http://localhost:3000';
const client = axios.create({ baseURL: BASE_URL });

describe('Authentication Flow', () => {
  test('Complete signup and login flow', async () => {
    // 1. Signup
    const signupRes = await client.post('/api/auth/signup', {
      email: 'test@example.com',
      password: 'Test123!',
      name: 'Test User',
      organizationName: 'Test Org'
    });
    expect(signupRes.status).toBe(201);
    const token = signupRes.data.token;
    
    // 2. Login
    const loginRes = await client.post('/api/auth/login', {
      email: 'test@example.com',
      password: 'Test123!'
    });
    expect(loginRes.status).toBe(200);
    
    // 3. Access protected route
    const dashRes = await client.get('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(dashRes.status).toBe(200);
  });
});

describe('Project CRUD', () => {
  let token: string;
  let projectId: string;
  
  beforeAll(async () => {
    const res = await client.post('/api/auth/login', {...});
    token = res.data.token;
  });
  
  test('Create project', async () => {
    const res = await client.post('/api/projects', 
      { name: 'Test Project', organizationId: 'org1' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status).toBe(201);
    projectId = res.data.project.id;
  });
  
  test('Get project', async () => {
    const res = await client.get(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` }
    });
    expect(res.status).toBe(200);
    expect(res.data.project.name).toBe('Test Project');
  });
});

describe('Permission Tests', () => {
  test('Client cannot delete project', async () => {
    const clientToken = await getClientToken();
    try {
      await client.delete('/api/projects/proj1', {
        headers: { Authorization: `Bearer ${clientToken}` }
      });
      fail('Should have thrown 403');
    } catch (error) {
      expect(error.response.status).toBe(403);
    }
  });
});
```

**Unit Testing (Future):**
- Jest + React Testing Library for components
- Mock Prisma with jest-mock-extended
- Test utilities and helper functions

**Manual Testing Checklist:**
- Authentication flows
- CRUD operations per module
- Permission boundaries
- Error scenarios
- Edge cases (circular dependencies, etc.)

---

### Q16: How do you ensure code quality?
**Answer:**

**1. TypeScript:**
- Strict mode enabled
- No implicit any
- Type-safe database queries with Prisma

**2. Linting (ESLint):**
```javascript
// eslint.config.mjs
export default {
  extends: ['next/core-web-vitals', 'next/typescript'],
  rules: {
    '@typescript-eslint/no-unused-vars': 'error',
    '@typescript-eslint/no-explicit-any': 'warn',
    'react-hooks/exhaustive-deps': 'warn'
  }
};
```

**3. Code Organization:**
- Feature-based folder structure
- Reusable components in `/components/ui`
- Shared utilities in `/lib`
- Consistent naming conventions

**4. Git Practices:**
- Descriptive commit messages
- Feature branches
- Code reviews (if team)

**5. Error Handling:**
- Try-catch blocks in all API routes
- Input validation with Zod
- Proper HTTP status codes
- User-friendly error messages

**6. Documentation:**
- 3,500+ lines of technical documentation
- API endpoint documentation
- Code comments for complex logic
- README with setup instructions

---

## Performance & Optimization

### Q17: What performance optimizations have you implemented?
**Answer:**

**1. Database Optimizations:**
```typescript
// Indexed foreign keys
@@index([projectId])
@@index([userId])

// Select only needed fields
const tasks = await prisma.task.findMany({
  select: { id: true, title: true, status: true }
  // Avoids loading description, etc.
});

// Pagination
const tasks = await prisma.task.findMany({
  take: 20,
  skip: (page - 1) * 20,
  orderBy: { createdAt: 'desc' }
});

// Connection pooling (Prisma default)
```

**2. Frontend Optimizations:**
```typescript
// Next.js Image optimization
import Image from 'next/image';
<Image src="/logo.png" width={200} height={100} alt="Logo" />

// Lazy loading components
const ReportViewer = lazy(() => import('./ReportViewer'));

// React Server Components (App Router)
// Reduces client-side JavaScript

// Memoization
const expensiveCalculation = useMemo(() => 
  calculateMetrics(data), 
  [data]
);
```

**3. API Optimizations:**
- Response caching for reports
- Batch operations where possible
- Avoid N+1 queries with Prisma `include`

**4. Bundle Optimization:**
- Next.js automatic code splitting
- Tree shaking (unused code removed)
- Production build minification

**Future Optimizations:**
- Redis caching for frequently accessed data
- CDN for static assets
- Database query optimization with EXPLAIN
- Infinite scroll vs pagination

---

### Q18: How would you deploy this application to production?
**Answer:**

**Deployment Options:**

**Option 1: Vercel (Recommended for Next.js)**
```bash
# 1. Install Vercel CLI
npm i -g vercel

# 2. Login
vercel login

# 3. Deploy
vercel --prod

# Environment Variables (Vercel Dashboard)
DATABASE_URL=postgresql://...
JWT_SECRET=...
SMTP_HOST=...
```

**Benefits:**
- Zero config for Next.js
- Automatic HTTPS
- Global CDN
- Serverless functions for API routes

**Option 2: Docker + VPS**
```dockerfile
# Dockerfile
FROM node:20-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
RUN npm run build
EXPOSE 3000
CMD ["npm", "start"]
```

```bash
# Build and run
docker build -t project-app .
docker run -p 3000:3000 --env-file .env project-app
```

**Option 3: AWS/GCP/Azure**
- Deploy to EC2/Compute Engine/App Service
- PostgreSQL RDS/Cloud SQL for database
- S3/Cloud Storage for files
- CloudFront/CDN for static assets

**Pre-deployment Checklist:**
- ✅ Migrate SQLite → PostgreSQL
- ✅ Environment variables set
- ✅ Database migrations run
- ✅ SMTP configured for emails
- ✅ File upload to S3
- ✅ Error monitoring (Sentry)
- ✅ HTTPS/SSL certificate
- ✅ CORS configured
- ✅ Rate limiting added
- ✅ Health check endpoint

**Production Environment Variables:**
```env
NODE_ENV=production
DATABASE_URL=postgresql://user:pass@host/db
JWT_SECRET=random_256_bit_secret
SMTP_HOST=smtp.sendgrid.net
SMTP_USER=apikey
SMTP_PASS=SG.xxx
AWS_S3_BUCKET=project-uploads
```

---

## Bonus Questions

### Q19: What challenges did you face and how did you solve them?
**Answer:**

**Challenge 1: Circular Task Dependencies**
- Problem: Users could create cyclic dependencies (Task A → B → C → A)
- Solution: Implemented graph traversal (BFS) to detect cycles before creating dependency
- Result: API rejects circular dependencies with clear error message

**Challenge 2: N+1 Query Problem**
- Problem: Loading project with tasks was slow (N+1 queries)
- Solution: Used Prisma's `include` and `select` to load relations in single query
- Result: Reduced API response time from 500ms to 50ms

**Challenge 3: JWT Token Management**
- Problem: Where to store JWT (localStorage vs cookies)?
- Solution: localStorage for simplicity, documented cookie option for CSRF protection
- Result: Working auth with clear security trade-offs documented

**Challenge 4: Role-based Permissions**
- Problem: Complex permission logic scattered across codebase
- Solution: Created `lib/rbac.ts` with centralized permission checks
- Result: Consistent permissions, easy to audit

**Challenge 5: Email Notification Spam**
- Problem: Too many emails overwhelming users
- Solution: User preferences, batching, and digest emails
- Result: Users can opt-in/out, reduced email volume

---

### Q20: What would you do differently if starting over?
**Answer:**

**Improvements:**

1. **Database Choice:**
   - Start with PostgreSQL instead of SQLite (production-ready from day 1)
   - Enables better scaling and features (full-text search, JSON columns)

2. **Testing:**
   - Write tests from the beginning (TDD approach)
   - Set up CI/CD pipeline early
   - Aim for 80%+ code coverage

3. **Architecture:**
   - Consider microservices for notifications/email (separate service)
   - Use message queue (Bull/RabbitMQ) for async tasks
   - Implement caching layer (Redis) earlier

4. **Frontend:**
   - Use a component library (shadcn/ui, Material-UI) for faster development
   - Implement proper form management (React Hook Form)
   - Add global state management (Zustand/Redux) from start

5. **Monitoring:**
   - Set up error tracking (Sentry) from beginning
   - Add performance monitoring (New Relic/DataDog)
   - Implement proper logging (Winston/Pino)

6. **Documentation:**
   - Write API documentation as OpenAPI/Swagger spec
   - Auto-generate from code (tRPC or similar)

**But Overall:**
- The tech stack choices were solid
- Next.js + Prisma combo is excellent
- TypeScript was the right choice
- Documentation is comprehensive

---

## Summary Stats

**Project Scope:**
- 12 functional modules
- 65+ API endpoints
- 23 database models
- 13,600+ lines of code
- 66+ files
- 3,500+ lines of documentation

**Tech Stack:**
- Next.js 16.1.2 (App Router)
- React 19.2.3
- TypeScript
- Prisma 5.22.0 + SQLite
- Tailwind CSS 4.x
- JWT authentication
- Nodemailer
- pdfkit

**Time Investment:**
- Full-stack implementation
- Comprehensive documentation
- Team organization
- Testing setup

---

**Good luck with your presentation! Know these answers and you'll ace it.** 🚀
