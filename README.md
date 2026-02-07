# ProjectHub - Project Management Application

A comprehensive project management application inspired by Zoho Projects, built with Next.js, Prisma, and TypeScript.

## Features

### Core Modules

- **Authentication & Organization** - JWT-based auth, user registration, organization management
- **Project Management** - Create, update, delete projects with templates and team assignments
- **Task Management** - Tasks with multi-assignee support, priorities, subtasks, and dependencies
- **Milestones & Phases** - Project milestones with due dates and phase organization
- **Time Tracking** - Timer widget, weekly timesheets, manual entry, approval workflow
- **Collaboration** - Comments, @mentions, file attachments, activity logs
- **Issue Tracking** - Issue creation, severity levels, status lifecycle
- **Document Management** - Central repository with version control
- **Reports & Analytics** - Project progress reports with CSV/JSON/PDF export
- **Notifications** - In-app and email notifications with preferences
- **Client Portal** - Read-only access for external clients
- **Dashboards** - Role-specific views for different user types

### User Roles

| Role | Permissions |
|------|-------------|
| SUPER_ADMIN | Full organization control |
| PROJECT_ADMIN | Project creation and configuration |
| PROJECT_MANAGER | Task planning and monitoring |
| TEAM_MEMBER | Task execution and updates |
| CLIENT | Read-only project access |

## Tech Stack

- **Frontend**: Next.js 16, React 19, TypeScript, Tailwind CSS
- **Backend**: Next.js API Routes
- **Database**: Prisma ORM with SQLite (dev) / PostgreSQL (prod)
- **Authentication**: JWT with bcryptjs
- **Email**: Nodemailer

## Getting Started

### Prerequisites

- Node.js 20+
- npm or yarn

### Installation

```bash
# Clone the repository
git clone https://github.com/dougbug589/Project_Management_HUB.git
cd Project_Management_HUB

# Install dependencies
npm install

# Set up environment variables
cp .env.example .env
# Edit .env with your settings

# Run database migrations
npx prisma migrate dev

# Start development server
npm run dev
```

### Environment Variables

```
DATABASE_URL="file:./dev.db"
JWT_SECRET="your-secret-key"
SMTP_HOST="smtp.example.com"
SMTP_PORT=587
SMTP_USER="user@example.com"
SMTP_PASS="password"
```

## Project Structure

```
src/
  app/
    api/           # API routes
    dashboard/     # Dashboard page
    projects/      # Projects pages
    tasks/         # Tasks pages
    ...
  components/      # React components
  contexts/        # React contexts
  lib/             # Utilities and helpers
prisma/
  schema.prisma    # Database schema
  migrations/      # Database migrations
```

## API Endpoints

| Module | Endpoints |
|--------|-----------|
| Auth | POST /api/auth/signup, POST /api/auth/login |
| Projects | GET/POST /api/projects, GET/PUT/DELETE /api/projects/[id] |
| Tasks | GET/POST /api/tasks, GET/PUT/DELETE /api/tasks/[id] |
| Timesheets | GET/POST /api/timesheets |
| Issues | GET/POST /api/issues |
| Documents | GET/POST /api/documents |
| Reports | GET /api/reports, POST /api/reports/export |
| Notifications | GET /api/notifications |

## Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production server
npm start

# Run linting
npm run lint

# Generate Prisma client
npx prisma generate

# Open Prisma Studio
npx prisma studio
```

## Docker

```bash
# Build and run with Docker Compose
docker-compose up --build
```

## License

MIT
