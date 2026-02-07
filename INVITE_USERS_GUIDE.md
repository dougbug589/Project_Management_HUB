# 🎯 HOW TO INVITE USERS - QUICK DEMO GUIDE

## Two Ways to Invite Users:

---

## 1️⃣ Invite to Organization (Admin/Manager Only)

### API Endpoint:
```
POST /api/organizations/{organizationId}/members
```

### Request Body:
```json
{
  "userId": "user_id_here",
  "role": "TEAM_MEMBER" // or "PROJECT_ADMIN", "PROJECT_MANAGER"
}
```

### Who Can Invite:
- ✅ SUPER_ADMIN
- ✅ PROJECT_ADMIN

### Steps in Postman/Code:
1. Login as admin@test.com / password123
2. Get the organization ID from dashboard/response
3. POST to `/api/organizations/{orgId}/members` with:
   ```json
   {
     "userId": "<user_id_of_person_to_invite>",
     "role": "TEAM_MEMBER"
   }
   ```
4. Member status will be "PENDING" initially
5. They can accept/decline the invitation

---

## 2️⃣ Invite to Project (Project Manager/Admin)

### API Endpoint:
```
POST /api/projects/{projectId}/members
```

### Request Body:
```json
{
  "userId": "user_id_here",
  "role": "TEAM_MEMBER" // or "PROJECT_ADMIN", "PROJECT_MANAGER", "TEAM_LEAD", "CLIENT"
}
```

### Who Can Invite:
- ✅ PROJECT_ADMIN
- ✅ PROJECT_MANAGER
- ✅ SUPER_ADMIN

### Steps in Postman/Code:
1. Login as manager@test.com / password123
2. Get project ID (e.g., from /api/projects)
3. POST to `/api/projects/{projectId}/members` with:
   ```json
   {
     "userId": "<user_id_of_person_to_invite>",
     "role": "TEAM_MEMBER"
   }
   ```
4. Member is added with "PENDING" status initially

---

## 📋 Complete Demo Flow

### Scenario: Manager invites a new team member to a project

**Step 1: Get Available Users**
```bash
# Login as manager
POST /api/auth/login
{
  "email": "manager@test.com",
  "password": "password123"
}
# Save the token
```

**Step 2: Get Organization Members**
```bash
# Get org ID from login response
GET /api/organizations/{orgId}/members
Authorization: Bearer <token>

# Response shows all users in organization
```

**Step 3: Get Your Projects**
```bash
GET /api/projects
Authorization: Bearer <token>

# Pick a project ID from the response
```

**Step 4: Invite User to Project**
```bash
POST /api/projects/{projectId}/members
Authorization: Bearer <token>
Content-Type: application/json

{
  "userId": "<userId_from_step_2>",
  "role": "TEAM_MEMBER"
}

# Response:
{
  "success": true,
  "message": "Member added/invited",
  "data": {
    "id": "...",
    "projectId": "...",
    "userId": "...",
    "role": "TEAM_MEMBER",
    "status": "PENDING",
    "invitedBy": "manager_id"
  }
}
```

**Step 5: Check Project Members**
```bash
GET /api/projects/{projectId}/members
Authorization: Bearer <token>

# See all members including newly invited one with PENDING status
```

**Step 6: Accept Invitation (as invited user)**
```bash
# Login as the invited user
POST /api/auth/login
{
  "email": "member@test.com",
  "password": "password123"
}

# Update membership status
PATCH /api/projects/{projectId}/members
Authorization: Bearer <invited_user_token>
Content-Type: application/json

{
  "userId": "<their_own_userId>",
  "status": "ACCEPTED"
}
```

---

## 🎬 FASTEST DEMO (Already Done!)

**Good News:** Test users are already invited and accepted!

### Pre-Seeded Invitations:

#### E-Commerce Platform Project:
- ✅ admin@test.com (PROJECT_ADMIN)
- ✅ manager@test.com (PROJECT_MANAGER)
- ✅ lead@test.com (TEAM_LEAD)
- ✅ member@test.com (TEAM_MEMBER)
- ✅ dev1@test.com (TEAM_MEMBER) - Sarah
- ✅ dev2@test.com (TEAM_MEMBER) - Michael
- ✅ designer@test.com (TEAM_MEMBER) - Emma
- ✅ qa@test.com (TEAM_MEMBER) - David

#### Mobile App Redesign Project:
- ✅ manager@test.com (PROJECT_MANAGER)
- ✅ lead@test.com (TEAM_LEAD)
- ✅ designer@test.com (TEAM_MEMBER)
- ✅ dev1@test.com (TEAM_MEMBER) - Sarah
- ✅ client@test.com (CLIENT) - Read-only

All are **already ACCEPTED** status, ready to demo!

---

## 🎯 For Demo Presentation

### Show Invitation Process:

**Option 1: Show Existing Members**
1. Login as manager@test.com / password123
2. Navigate to any project
3. Click "Team Members" or "Project Settings"
4. Show list of members with their roles
5. Point out: "These members were invited to the project"

**Option 2: Simulate Adding New Member (via API)**
1. Open Postman/Thunder Client
2. Show POST request to `/api/projects/{id}/members`
3. Demonstrate JSON payload with userId and role
4. Show response with "PENDING" status
5. Explain: "User receives notification and can accept/decline"

**Option 3: Show Member Status Management**
```bash
# Show current members
GET /api/projects/{projectId}/members

# Update member role
PATCH /api/projects/{projectId}/members
{
  "userId": "...",
  "role": "TEAM_LEAD"  // Promote to team lead
}
```

---

## 📊 Invitation Status Flow

```
1. User Created → 2. Invited (PENDING) → 3. Accepted (ACCEPTED) → 4. Working
                                       ↘ Declined (DECLINED)
                                       ↘ Revoked (REVOKED)
```

### Status Types:
- **PENDING** - Invitation sent, awaiting response
- **ACCEPTED** - User accepted, active member
- **DECLINED** - User declined invitation
- **REVOKED** - Admin cancelled invitation

---

## 🔐 Permission Matrix

| Action | Super Admin | Project Admin | Project Manager | Team Lead | Team Member | Client |
|--------|------------|---------------|-----------------|-----------|-------------|--------|
| Invite to Organization | ✅ | ✅ | ❌ | ❌ | ❌ | ❌ |
| Invite to Project | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Change Member Role | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Remove Member | ✅ | ✅ | ✅ | ❌ | ❌ | ❌ |
| Accept Invitation | ✅ | ✅ | ✅ | ✅ | ✅ | ✅ |

---

## 💡 Quick Demo Script

**Interviewer asks: "How do you invite users?"**

**Your Answer:**
> "Great question! We have a two-tier invitation system:
> 
> **First**, admins can invite users to the **organization** - this gives them access to the platform.
> 
> **Then**, project managers can invite those organization members to specific **projects** with different roles.
> 
> Let me show you... 
> 
> [Open browser, login as manager@test.com]
> 
> Here I'm logged in as a Project Manager. If I go to my E-Commerce project and look at Team Members, you can see we have 8 members with different roles - PROJECT_ADMIN, PROJECT_MANAGER, TEAM_MEMBER, etc.
> 
> To invite someone new, I'd make a POST request to `/api/projects/{id}/members` with their userId and desired role. The invitation starts as PENDING, and they receive a notification.
> 
> Once they accept, they're ACCEPTED status and can start working on tasks.
> 
> You can see Sarah here [point to dev1@test.com] is actually working on all 3 projects - she's been invited and accepted invitations to multiple projects, showing our flexible team structure."

---

## ✅ Key Points to Mention

1. **Two-Level System**: Organization → Project invitations
2. **Status Tracking**: PENDING → ACCEPTED flow
3. **Role-Based**: Different roles can be assigned (CLIENT, TEAM_MEMBER, TEAM_LEAD, etc.)
4. **Multi-Project**: Users can be invited to multiple projects
5. **Notifications**: Invited users get notifications
6. **Audit Trail**: `invitedBy` field tracks who sent invitation
7. **Upsert Logic**: Re-inviting updates existing membership

---

## 🚀 Already Working!

All test data has pre-accepted invitations, so you can:
- ✅ Login as any test user
- ✅ See their projects immediately
- ✅ View their team members
- ✅ No need to accept invitations manually

**Ready to demo!** 🎯
