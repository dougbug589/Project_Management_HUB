# Team-Wise Documentation (Module Coverage)

Purpose: One file focused on teams. For each team: modules owned, responsibilities, key assets (APIs/UI), and demo notes.

## Team 1: UI Components Team
- **Primary Focus**: Shared UI, Authentication UI, Notification UI, Component library
- **Modules Touched**: 1 (Auth UI), 3 (task UI), 6 (collab UI), 10 (notification UI), 11 (client portal UI), 12 (dashboard widgets support)
- **Key Assets**:
  - Pages: `/login`, `/signup`, shared layouts
  - Components: `src/components/ui/*`, `AppLayout.tsx`, `Sidebar.tsx`
- **Responsibilities**:
  - Maintain reusable components and accessibility
  - Consistent theming and UX polish
  - UI for auth and notifications
- **Demo Pointers**:
  - Show login/signup; highlight consistent UI and dark theme
  - Show notifications bell and toast interactions

## Team 2: Dashboard Development Team
- **Primary Focus**: Projects, Role-based Dashboards, Client Portal, Project Templates
- **Modules Owned**: 2 (Projects), 11 (Client Portal), 12 (Dashboards)
- **Key Assets**:
  - APIs: `/api/projects`, `/api/dashboard`, `/api/client/...`
  - Pages: `/projects`, `/projects/[id]`, `/projects/create`, `/dashboard`, `/client-login`, `/client-dashboard`
  - Components: `DashboardWidgets.tsx`, `ProjectManagerDashboard.tsx`, `TeamLeadDashboard.tsx`
- **Responsibilities**:
  - Project CRUD and membership
  - Dashboard data consumption and widgets
  - Client portal read-only experience
- **Demo Pointers**:
  - Create project (or from template) and show detail
  - Switch dashboards by role; show KPIs
  - Client login read-only flow

## Team 3: Task Management Team
- **Primary Focus**: Tasks, Milestones, Time Tracking, Collaboration, Issues, Documents, Notifications
- **Modules Owned**: 3, 4, 5, 6, 7, 8, 10
- **Key Assets**:
  - APIs: `/api/tasks`, `/api/subtasks`, `/api/task-dependencies`, `/api/comments`, `/api/attachments`, `/api/milestones`, `/api/phases`, `/api/timesheets`, `/api/timers`, `/api/discussions`, `/api/activity-logs`, `/api/issues`, `/api/documents`, `/api/document-versions`, `/api/notifications`
  - Pages: `/tasks`, `/tasks/[id]`, `/milestones`, `/timesheets`, `/discussions`, `/documents`, `/issues`
  - Components: `TimerWidget.tsx`, `WeeklyTimesheet.tsx`, `ReportsExport.tsx` (collab)
- **Responsibilities**:
  - Full task lifecycle (CRUD, assignees, dependencies, subtasks)
  - Time tracking and approvals
  - Collaboration (comments, discussions, activity logs)
  - Issue tracking and document management
  - Notifications + preferences
- **Demo Pointers**:
  - Task detail with comments, attachments, subtasks, dependency
  - Timer start/stop → timesheet → manager approval
  - Discussion board + activity log
  - Notifications preference toggle and effect

## Team 4: Analytics & Reports Team
- **Primary Focus**: Reports, Exports, Analytics Data
- **Modules Owned**: 9 (Reports & Analytics)
- **Key Assets**:
  - APIs: `/api/reports`, `/api/reports/export`, `/api/dashboard` (data feed)
  - Libraries: `src/lib/pdf.ts`
  - Components: `ReportsExport.tsx`
- **Responsibilities**:
  - Report generation (task completion, time utilization, project progress, team performance)
  - CSV/JSON/PDF exports
  - Dashboard data aggregation
- **Demo Pointers**:
  - Generate Project Progress report; export CSV/PDF
  - Highlight data freshness and filters

## Team 5: Design & UX Team
- **Primary Focus**: Design system, Theming, Accessibility
- **Modules Touched**: All (cross-cutting)
- **Key Assets**:
  - Styles: `src/app/globals.css`
  - Component guidance: `src/components/ui/*`
- **Responsibilities**:
  - Maintain dark theme, spacing, typography
  - Accessibility and interaction patterns
- **Demo Pointers**:
  - Emphasize consistent dark theme and component cohesion

## Team 6: Testing & Documentation Team
- **Primary Focus**: QA, Docs, Release Readiness
- **Modules Touched**: All (cross-cutting)
- **Key Assets**:
  - Tests: `tests/e2e-feature-test.ts`
  - Docs: UNIFIED_DOCUMENTATION.md
- **Responsibilities**:
  - End-to-end validation
  - Documentation currency
  - Release checklists
- **Demo Pointers**:
  - Mention coverage and validation of critical flows

---

## Usage
- PMs: Assign work and reviews using team ownership above.
- Devs: Find your team’s APIs/pages/components and demo talking points.
- QA: Anchor test focus per team’s surface area.
- Demo leads: Credit the right team per module.
