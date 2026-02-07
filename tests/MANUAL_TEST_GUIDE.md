# 🧪 Manual Feature Test Guide

This guide walks you through testing all 12 modules of the Project Management App.

---

## Prerequisites

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open http://localhost:3000 in your browser

---

## Module 1: Authentication & Organization ✅

### Test 1.1: User Signup
1. Go to http://localhost:3000/signup
2. Fill in:
   - Name: `Test User`
   - Email: `test@example.com`
   - Password: `Test@123456`
3. Click **Sign Up**
4. ✅ Expected: Redirected to dashboard with welcome message

### Test 1.2: User Login
1. Click logout (or go to http://localhost:3000/login)
2. Enter the same credentials
3. Click **Login**
4. ✅ Expected: Redirected to dashboard

### Test 1.3: Organization (Auto-created)
- ✅ An organization is automatically created on first login
- Check the sidebar for organization name

---

## Module 2: Project Management 📁

### Test 2.1: Create Project
1. Click **Projects** in sidebar
2. Click **Create New** tab
3. Fill in:
   - Name: `My Test Project`
   - Description: `Testing all features`
   - Start Date: Today
   - End Date: 30 days from now
4. Click **Create Project**
5. ✅ Expected: Success toast, redirected to project list

### Test 2.2: View Project
1. Click on the created project card
2. ✅ Expected: Project detail page with tabs

### Test 2.3: Archive Project (API Test)
```bash
# Get your token from localStorage in browser console:
# localStorage.getItem('token')

curl -X POST http://localhost:3000/api/projects/YOUR_PROJECT_ID/archive \
  -H "Authorization: Bearer YOUR_TOKEN"
```
✅ Expected: `{"success":true,"message":"Project archived successfully"}`

---

## Module 3: Task Management ✅

### Test 3.1: Create Task
1. Go to **Tasks** page (sidebar)
2. Click **Create Task** button
3. Fill in:
   - Title: `Complete feature testing`
   - Description: `Test all modules`
   - Priority: `High`
   - Due Date: Next week
4. Select your project
5. Click **Create**
6. ✅ Expected: Task appears in list

### Test 3.2: View Task Details
1. Click on the task
2. ✅ Expected: Task detail page with comments section

### Test 3.3: Create Subtask (API Test)
```bash
curl -X POST http://localhost:3000/api/subtasks \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"title":"Subtask 1","taskId":"YOUR_TASK_ID"}'
```

---

## Module 4: Milestones 🎯

### Test 4.1: Create Milestone
1. Go to **Milestones** page
2. Click **Create Milestone**
3. Fill in:
   - Title: `Phase 1 Complete`
   - Due Date: 2 weeks from now
   - Project: Select your project
4. Click **Create**
5. ✅ Expected: Milestone appears in list

### Test 4.2: View Milestones
1. Check the milestones list
2. ✅ Expected: Shows progress and status

---

## Module 5: Time Tracking ⏱️

### Test 5.1: Log Time
1. Go to **Timesheets** page
2. Click **Log Time** or use the timer widget
3. Select a task
4. Enter hours: `2.5`
5. Add description: `Worked on testing`
6. Click **Submit**
7. ✅ Expected: Time entry appears in list

### Test 5.2: Timer Widget (Dashboard)
1. Go to **Dashboard**
2. Find the Timer widget
3. ✅ Expected: Shows timer controls

### Test 5.3: Weekly View
1. On Timesheets page, view weekly grid
2. ✅ Expected: Shows daily breakdown

---

## Module 6: Collaboration 💬

### Test 6.1: Add Comment
1. Go to a task detail page
2. Scroll to comments section
3. Type: `This is a test comment`
4. Click **Add Comment**
5. ✅ Expected: Comment appears with your avatar

### Test 6.2: @Mention in Comment
1. Add another comment: `Hey @Test User, check this out!`
2. ✅ Expected: Comment saved, notification sent

### Test 6.3: Reply to Comment
1. Click reply on a comment
2. Type: `This is a reply`
3. Submit
4. ✅ Expected: Nested reply appears

---

## Module 7: Issue Tracking 🐛

### Test 7.1: Create Issue
1. Go to **Issues** page
2. Click **Report Issue**
3. Fill in:
   - Title: `Button not working`
   - Description: `The submit button is unresponsive`
   - Severity: `High`
   - Priority: `Urgent`
   - Project: Select your project
4. Click **Create**
5. ✅ Expected: Issue appears in list with status

### Test 7.2: View Issues
1. Check the issues list
2. ✅ Expected: Shows severity badges and status

---

## Module 8: Documents 📄

### Test 8.1: Upload Document
1. Go to **Documents** page
2. Click **Upload Document**
3. Fill in:
   - Title: `Project Requirements`
   - Description: `Initial requirements doc`
   - Select a file (or provide URL)
4. Click **Upload**
5. ✅ Expected: Document appears in list

### Test 8.2: Version History
1. View a document's versions
2. ✅ Expected: Shows version numbers and dates

---

## Module 9: Reports & Analytics 📊

### Test 9.1: Export Report
1. Go to a project detail page
2. Find the **Reports** section
3. Select:
   - Report Type: `Task Completion`
   - Format: `CSV`
4. Click **Export**
5. ✅ Expected: File downloads

### Test 9.2: View Analytics
1. Check dashboard for analytics widgets
2. ✅ Expected: Charts and progress bars visible

---

## Module 10: Notifications 🔔

### Test 10.1: View Notifications
1. Click the **bell icon** in the top right header
2. ✅ Expected: Dropdown shows recent notifications

### Test 10.2: Unread Badge
1. After actions (task creation, comments), check bell icon
2. ✅ Expected: Red badge shows unread count

### Test 10.3: Mark as Read
1. Click on a notification
2. ✅ Expected: Navigates to relevant page, marks as read

### Test 10.4: Mark All as Read
1. Click "Mark all read" in dropdown
2. ✅ Expected: All notifications marked read, badge disappears

---

## Module 11: Client Portal 👤

### Test 11.1: Client View Access
1. Go to `/client/projects/YOUR_PROJECT_ID`
2. ✅ Expected: Read-only view of project

### Test 11.2: View Milestones as Client
1. On client portal, check milestones section
2. ✅ Expected: Shows milestone progress

### Test 11.3: View Tasks as Client
1. On client portal, check tasks section
2. ✅ Expected: Shows task list (read-only)

---

## Module 12: Role-Based Dashboards 📈

### Test 12.1: Admin Dashboard
1. With ADMIN role, go to Dashboard
2. ✅ Expected: Shows:
   - Total Projects count
   - Active Projects count
   - Organization Users count
   - Project Health progress bar

### Test 12.2: Project Manager Dashboard
1. With PROJECT_MANAGER role, go to Dashboard
2. ✅ Expected: Shows:
   - Active Projects
   - Overdue Tasks (with alert color)
   - Milestones On Track
   - Avg Tasks per Member

### Test 12.3: Team Lead Dashboard
1. With TEAM_LEAD role, go to Dashboard
2. ✅ Expected: Shows:
   - Team Tasks
   - In Progress tasks
   - Pending Approvals
   - Team Members count

### Test 12.4: Member Dashboard
1. With TEAM_MEMBER role, go to Dashboard
2. ✅ Expected: Shows:
   - My Tasks
   - Completed Today
   - Pending Tasks
   - Weekly Summary

---

## 🎉 All Features Tested!

If all tests pass, your Project Management App is fully functional with:

- ✅ JWT Authentication
- ✅ Organization Management
- ✅ Project CRUD with Archive
- ✅ Task Management with Subtasks & Dependencies
- ✅ Milestone Tracking
- ✅ Time Logging & Timesheets
- ✅ Comments with @mentions
- ✅ File Attachments
- ✅ Issue Tracking
- ✅ Document Versioning
- ✅ Report Export (CSV/PDF)
- ✅ In-App Notifications with Bell Icon
- ✅ Client Portal (Read-Only)
- ✅ Role-Based Dashboards with Charts

---

## Run Automated Tests

For automated API testing:

```bash
# Install tsx if not already installed
npm install -D tsx

# Run the E2E test script
npx tsx tests/e2e-feature-test.ts
```

This will test all API endpoints and report results.
