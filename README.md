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
## Screenshots

<img width="1920" height="1080" alt="Screenshot_20260207_150551" src="https://github.com/user-attachments/assets/451d1a48-06df-4573-abb1-e53c543128e6" />
<img width="1920" height="981" alt="Screenshot_20260207_150605" src="https://github.com/user-attachments/assets/4d686c9a-559e-4068-b98f-ea6d0aacc8db" />
<img width="1920" height="1080" alt="Screenshot_20260207_150706" src="https://github.com/user-attachments/assets/ac9095f7-1d0f-45ec-b50c-6de2ebe92404" />
<img width="1920" height="1080" alt="Screenshot_20260207_151219" src="https://github.com/user-attachments/assets/d8efd276-5d85-4700-8288-b7e22e8d343a" />
<img width="1920" height="1080" alt="Screenshot_20260207_151225" src="https://github.com/user-attachments/assets/33144d51-3216-4201-8311-f1929e245b13" />
<img width="1920" height="1080" alt="Screenshot_20260207_151229" src="https://github.com/user-attachments/assets/49dfae8e-5f9d-42fb-b25d-1d3ec52d527e" />
<img width="1920" height="1080" alt="Screenshot_20260207_151231" src="https://github.com/user-attachments/assets/b0bc93c3-989a-42da-aa72-39949fe955da" />
<img width="1920" height="1080" alt="Screenshot_20260207_151234" src="https://github.com/user-attachments/assets/fd887da1-1ad4-4076-898d-98a6829dd2e7" />
<img width="1920" height="1080" alt="Screenshot_20260207_151238" src="https://github.com/user-attachments/assets/41d0449e-57df-4088-b90d-d1910d668d3e" />
<img width="1920" height="1080" alt="Screenshot_20260207_151240" src="https://github.com/user-attachments/assets/8fc00024-ce76-4225-ad2f-e11f3e1a3bf0" />
<img width="1920" height="1080" alt="Screenshot_20260207_151243" src="https://github.com/user-attachments/assets/cfe78842-9594-479e-b891-9489394a0799" />
<img width="1920" height="1080" alt="Screenshot_20260207_151246" src="https://github.com/user-attachments/assets/8499397f-9133-4c81-8ac1-07b16456350c" />
<img width="1920" height="1080" alt="Screenshot_20260207_151253" src="https://github.com/user-attachments/assets/f2aff534-486d-4a0e-9eee-7b3af294f788" />
<img width="1920" height="1080" alt="Screenshot_20260207_151255" src="https://github.com/user-attachments/assets/d3ba3db6-6a91-4be6-a421-b85e8cbe863a" />
<img width="1920" height="1080" alt="Screenshot_20260207_151257" src="https://github.com/user-attachments/assets/0ee55b3e-34dd-4851-a45e-27c1baf5ac15" />
<img width="1920" height="1080" alt="Screenshot_20260207_151301" src="https://github.com/user-attachments/assets/2a8519ab-5e90-44e9-bc95-3fe9fe176241" />
<img width="1920" height="1080" alt="Screenshot_20260207_151307" src="https://github.com/user-attachments/assets/10c91be8-cc71-4c83-a28c-93ff2f953e7f" />
<img width="1920" height="1080" alt="Screenshot_20260207_151310" src="https://github.com/user-attachments/assets/15a607ba-98b0-4942-921f-af7ed769fd9a" />
<img width="1920" height="1080" alt="Screenshot_20260207_151337" src="https://github.com/user-attachments/assets/3a2adc8a-a3e1-4127-b053-a8b3aa401b1d" />
<img width="1920" height="1080" alt="Screenshot_20260207_151340" src="https://github.com/user-attachments/assets/b01e415e-fa0b-4c80-b1f7-8425cc857231" />



## License

MIT
