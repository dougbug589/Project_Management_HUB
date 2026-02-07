# Team Doc: Dashboard Development Team

## Overview
Owns projects, dashboards, client portal, and project templates.

## Modules - Role Overview

| Module | Role | Contribution |
|--------|------|-------------|
| 1. Authentication & Organizations | Support | Org management UI and member invitations |
| 2. Project Management | **PRIMARY** | Full project CRUD, templates, membership, phases |
| 3. Task Management | Support | Project-task linkage, task lists in project view |
| 4. Milestones & Phases | Support | Phase management UI, milestone-project links |
| 5. Time Tracking & Timesheets | — | Not involved |
| 6. Collaboration | — | Not involved |
| 7. Issue Tracking | — | Not involved |
| 8. Document Management | Support | Project document views and access |
| 9. Reports & Analytics | Support | Dashboard data consumption and display |
| 10. Notifications & Preferences | — | Not involved |
| 11. Client Portal | **PRIMARY** | Full client-facing experience (read-only) |
| 12. Role-based Dashboards | **PRIMARY** | All 4 dashboards (Admin/PM/Lead/Member) |

## Key Files & Architecture

### Pages & Components
- `src/app/projects/page.tsx` - Project list view
- `src/app/projects/create/page.tsx` - Create project form
- `src/app/projects/[id]/page.tsx` - Project detail view
- `src/app/dashboard/page.tsx` - Main dashboard router
- `src/components/DashboardWidgets.tsx` - Widget library
- `src/components/ProjectManagerDashboard.tsx` - PM-specific dashboard
- `src/components/TeamLeadDashboard.tsx` - Team lead dashboard
- `src/app/client-login/page.tsx` - Client login
- `src/app/client-dashboard/page.tsx` - Client project view

### Database Models
- `Project` - Project metadata (name, description, status, dates)
- `ProjectMember` - User-project relationships with roles
- `ProjectTemplate` - Reusable project blueprints
- `Phase` - Project phases

### APIs
- `src/app/api/projects/route.ts` - GET/POST projects
- `src/app/api/projects/[id]/route.ts` - GET/PATCH/DELETE project
- `src/app/api/project-templates/route.ts` - Template CRUD
- `src/app/api/dashboard/route.ts` - Dashboard data aggregation
- `src/app/api/client/...` - Client portal APIs

## Technical Stack
- **Framework**: Next.js 16.1.2 with App Router
- **ORM**: Prisma 5.22.0
- **Database**: SQLite (dev) / PostgreSQL (prod)
- **API Pattern**: RESTful with Zod validation
- **State**: React hooks + Context for UI state

## APIs & Database

### Project CRUD
```typescript
// GET /api/projects
Response: { projects: Project[], total: number, page: number }

// POST /api/projects
Request: {
  name: string,
  description?: string,
  organizationId: string,
  startDate?: Date,
  endDate?: Date,
  templateId?: string
}
Response: { project: Project }

// GET /api/projects/[id]
Response: { project: Project, members: ProjectMember[], tasks: Task[] }

// PATCH /api/projects/[id]
Request: { name?, description?, status?, endDate? }
Response: { project: Project }

// DELETE /api/projects/[id]
Response: { success: boolean }
```

### Prisma Models
```prisma
model Project {
  id            String    @id @default(cuid())
  name          String
  description   String?
  ownerId       String
  owner         User      @relation(fields: [ownerId], references: [id])
  organizationId String
  organization  Organization @relation(fields: [organizationId], references: [id])
  status        String @default("ACTIVE") // ACTIVE, PAUSED, COMPLETED, ARCHIVED
  startDate     DateTime?
  endDate       DateTime?
  templateId    String?
  template      ProjectTemplate? @relation(fields: [templateId], references: [id])
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt
  
  members       ProjectMember[]
  tasks         Task[]
  phases        Phase[]
  milestones    Milestone[]
  
  @@index([ownerId])
  @@index([organizationId])
}

model ProjectMember {
  id        String    @id @default(cuid())
  projectId String
  project   Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  userId    String
  user      User      @relation(fields: [userId], references: [id], onDelete: Cascade)
  role      String @default("MEMBER") // ADMIN, LEAD, MEMBER
  joinedAt  DateTime  @default(now())
  
  @@unique([projectId, userId])
  @@index([projectId])
  @@index([userId])
}
```

## Build Implementation Steps

### Step 1: Create Project API Route
```typescript
// src/app/api/projects/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { verifyToken } from '@/lib/auth';
import { z } from 'zod';

const createProjectSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  organizationId: z.string(),
  startDate: z.date().optional(),
  endDate: z.date().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    const body = await request.json();
    const data = createProjectSchema.parse(body);
    
    const project = await prisma.project.create({
      data: {
        ...data,
        ownerId: decoded.userId,
        members: {
          create: { userId: decoded.userId, role: 'ADMIN' },
        },
      },
    });
    
    return NextResponse.json({ project }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 400 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const token = request.headers.get('Authorization')?.replace('Bearer ', '');
    if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    
    const decoded = verifyToken(token);
    const url = new URL(request.url);
    const page = parseInt(url.searchParams.get('page') || '1');
    const limit = parseInt(url.searchParams.get('limit') || '10');
    
    const projects = await prisma.project.findMany({
      where: { members: { some: { userId: decoded.userId } } },
      skip: (page - 1) * limit,
      take: limit,
      include: { members: true, tasks: true },
    });
    
    return NextResponse.json({ projects, page, limit });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
```

### Step 2: Create Project List Page
```typescript
// src/app/projects/page.tsx
'use client';
import { useEffect, useState } from 'react';
import axios from 'axios';
import { Project } from '@prisma/client';
import { Button } from '@/components/ui/Button';
import Link from 'next/link';

export default function ProjectsPage() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProjects = async () => {
      const token = localStorage.getItem('token');
      const response = await axios.get('/api/projects', {
        headers: { Authorization: `Bearer ${token}` },
      });
      setProjects(response.data.projects);
      setLoading(false);
    };
    fetchProjects();
  }, []);

  if (loading) return <div>Loading...</div>;

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold">Projects</h1>
        <Link href="/projects/create">
          <Button variant="primary">Create Project</Button>
        </Link>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {projects.map((project) => (
          <div key={project.id} className="bg-gray-800 p-4 rounded-lg shadow">
            <h2 className="text-xl font-semibold mb-2">{project.name}</h2>
            <p className="text-gray-400 mb-4">{project.description}</p>
            <Link href={`/projects/${project.id}`}>
              <Button variant="secondary">View Details</Button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}
```

### Step 3: Implement Dashboard Router
```typescript
// src/app/dashboard/page.tsx
'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import { ProjectManagerDashboard } from '@/components/ProjectManagerDashboard';
import { TeamLeadDashboard } from '@/components/TeamLeadDashboard';

export default function DashboardPage() {
  const [role, setRole] = useState('');
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) router.push('/login');
    
    const decoded = JSON.parse(atob(token?.split('.')[1] || '{}'));
    setRole(decoded.role);
  }, []);

  if (role === 'PROJECT_MANAGER') return <ProjectManagerDashboard />;
  if (role === 'TEAM_LEAD') return <TeamLeadDashboard />;
  
  return <div className="p-6">Dashboard loading...</div>;
}
```

## Testing Steps

### API Tests
```typescript
test('Create project with valid data', async () => {
  const response = await axios.post('/api/projects', {
    name: 'Test Project',
    organizationId: 'org123',
  }, { headers: { Authorization: 'Bearer token' } });
  
  expect(response.status).toBe(201);
  expect(response.data.project.name).toBe('Test Project');
});

test('Unauthorized user cannot create project', async () => {
  try {
    await axios.post('/api/projects', { name: 'Test' });
  } catch (error: any) {
    expect(error.response.status).toBe(401);
  }
});
```

### UI Tests
```typescript
test('Project list loads and displays projects', async () => {
  render(<ProjectsPage />);
  await waitFor(() => {
    expect(screen.getByText('Projects')).toBeInTheDocument();
  });
});

test('Dashboard renders correct widget per role', async () => {
  // Mock PM role
  render(<DashboardPage />);
  await waitFor(() => {
    expect(screen.getByText(/project metrics/i)).toBeInTheDocument();
  });
});
```

## Demo Checklist
- Create new project → see it in list
- Click project → show detail with members and tasks
- Switch dashboard by role and show KPI changes
- Client portal: login as client → read-only view
- Create project from template → show efficiency
