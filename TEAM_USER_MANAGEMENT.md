# 👥 User Management - Technical Documentation

**Team:** User Management & Administration  
**Modules:** User Management, Authentication, Organization Management  
**Last Updated:** 26 January 2026

---

## 📖 Overview

The User Management system handles user creation, profile management, role assignment, and user deletion. Users are organized into organizations, can be assigned to projects and teams, and have role-based access control (RBAC). Each user has an authentication account with password security using bcryptjs.

---

## 🗄️ Database Schema

### User Model

```prisma
model User {
  id            String    @id @default(cuid())
  email         String    @unique
  password      String      // bcrypt hashed
  name          String
  avatar        String?     // URL to avatar image
  bio           String?     // User biography
  role          String  @default("TEAM_MEMBER")
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  // Relations
  organizationsOwned Organization[]
  organizationMemberships OrganizationMember[]
  projectMemberships ProjectMember[]
  ownedProjects Project[]
  tasks         Task[]
  teamMemberships TeamMember[]
  comments      Comment[]
  activityLogs  ActivityLog[]
  assignedTasks TaskAssignee[]
  notifications Notification[]
  attachments   Attachment[]
  timesheets    Timesheet[]
  timesheetsApproved Timesheet[] @relation("TimesheetApprover")
  issuesAssigned Issue[] @relation("IssueAssignee")
  issuesReported Issue[] @relation("IssueReporter")
  documents     Document[]
  documentVersions DocumentVersion[]
  projectTemplates ProjectTemplate[] @relation("TemplateCreator")
  reportExports ReportExport[]

  @@index([email])
}
```

**Key Fields:**
- `id` - Unique identifier (CUID)
- `email` - Email address (unique)
- `password` - Bcrypt hashed password (never store plaintext)
- `name` - User's display name
- `role` - User role (SUPER_ADMIN, PROJECT_ADMIN, PROJECT_MANAGER, TEAM_MEMBER, CLIENT)
- `avatar` - Profile picture URL
- `bio` - User biography/description

---

## 🔌 API Endpoints

### 1. POST /api/auth/signup
**Purpose:** Create new user account  
**Authentication:** Not required  
**Content-Type:** application/json

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!",
  "name": "John Doe"
}
```

**Required Fields:** email, password, name

**Password Requirements:**
- Minimum 8 characters
- At least 1 uppercase letter
- At least 1 lowercase letter
- At least 1 number
- At least 1 special character (!@#$%^&*)

**Response (201 Created):**
```json
{
  "success": true,
  "message": "User created successfully",
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "john.doe@example.com",
      "name": "John Doe"
    },
    "organization": {
      "id": "org_default",
      "role": "OWNER"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Implementation Details:**
```typescript
export async function POST(req: NextRequest) {
  const { email, password, name } = await req.json()

  // Validation
  if (!validateEmail(email)) {
    return NextResponse.json(
      { success: false, message: "Invalid email format" },
      { status: 400 }
    )
  }

  const passwordValidation = validatePassword(password)
  if (!passwordValidation.valid) {
    return NextResponse.json(
      {
        success: false,
        message: "Password requirements not met",
        errors: passwordValidation.errors,
      },
      { status: 400 }
    )
  }

  // Check if user exists
  const existingUser = await prisma.user.findUnique({
    where: { email },
  })

  if (existingUser) {
    return NextResponse.json(
      { success: false, message: "User already exists" },
      { status: 409 }
    )
  }

  // Hash password with bcryptjs
  const hashedPassword = await hashPassword(password)

  // Create user
  const user = await prisma.user.create({
    data: {
      email,
      password: hashedPassword,
      name,
    },
  })

  // Create default organization for user
  const orgMembership = await getOrCreateDefaultOrganization(user.id)

  // Generate JWT token
  const token = generateToken({
    userId: user.id,
    email: user.email,
    organizationId: orgMembership.organizationId,
    organizationRole: orgMembership.role,
  })

  return NextResponse.json(
    {
      success: true,
      message: "User created successfully",
      data: {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
        },
        organization: {
          id: orgMembership.organizationId,
          role: orgMembership.role,
        },
        token,
      },
    },
    { status: 201 }
  )
}
```

**Error Responses:**
- `400 Bad Request` - Missing fields or invalid format
- `409 Conflict` - Email already registered

---

### 2. POST /api/auth/login
**Purpose:** Authenticate user and get JWT token  
**Authentication:** Not required  
**Content-Type:** application/json

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "SecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Login successful",
  "data": {
    "user": {
      "id": "user_abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "PROJECT_MANAGER",
      "avatar": "https://example.com/avatar.jpg"
    },
    "organization": {
      "id": "org_123",
      "role": "ADMIN"
    },
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."
  }
}
```

**Error Responses:**
- `401 Unauthorized` - Invalid credentials

---

### 3. GET /api/users/:userId
**Purpose:** Get user profile details  
**Authentication:** Required (JWT)  
**Path Parameters:**
```
userId - User ID to fetch
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": {
    "id": "user_abc123",
    "email": "john.doe@example.com",
    "name": "John Doe",
    "role": "PROJECT_MANAGER",
    "avatar": "https://example.com/avatar.jpg",
    "bio": "Full-stack developer",
    "createdAt": "2026-01-01T10:00:00Z",
    "updatedAt": "2026-01-26T15:30:00Z",
    "organizationMemberships": [
      {
        "id": "orgmem_123",
        "organizationId": "org_123",
        "role": "ADMIN",
        "status": "ACCEPTED"
      }
    ],
    "projectMemberships": [
      {
        "id": "projmem_456",
        "projectId": "proj_123",
        "role": "MANAGER"
      }
    ]
  }
}
```

---

### 4. PUT /api/users/:userId
**Purpose:** Update user profile  
**Authentication:** Required (JWT)  
**Authorization:** User can only update their own profile, admins can update any

**Request Body (all fields optional):**
```json
{
  "name": "John Doe Updated",
  "bio": "Senior full-stack developer",
  "avatar": "https://example.com/new-avatar.jpg",
  "password": "NewSecurePassword123!"
}
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User updated successfully",
  "data": {
    "id": "user_abc123",
    "email": "john.doe@example.com",
    "name": "John Doe Updated",
    "role": "PROJECT_MANAGER",
    "avatar": "https://example.com/new-avatar.jpg",
    "bio": "Senior full-stack developer",
    "updatedAt": "2026-01-26T16:00:00Z"
  }
}
```

**Implementation Details:**
```typescript
export async function PUT(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const user = getUserFromRequest(req)
  if (!user) return unauthorized()

  // Authorization: only own profile or admin
  if (user.id !== params.userId && user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, message: "Cannot update other users" },
      { status: 403 }
    )
  }

  const body = await req.json()
  const { name, bio, avatar, password } = body

  const updateData: any = {}
  if (name) updateData.name = name
  if (bio) updateData.bio = bio
  if (avatar) updateData.avatar = avatar

  // Hash new password if provided
  if (password) {
    const validation = validatePassword(password)
    if (!validation.valid) {
      return NextResponse.json(
        { success: false, message: "Invalid password", errors: validation.errors },
        { status: 400 }
      )
    }
    updateData.password = await hashPassword(password)
  }

  const updatedUser = await prisma.user.update({
    where: { id: params.userId },
    data: updateData,
  })

  return NextResponse.json({
    success: true,
    message: "User updated successfully",
    data: {
      id: updatedUser.id,
      email: updatedUser.email,
      name: updatedUser.name,
      role: updatedUser.role,
      avatar: updatedUser.avatar,
      bio: updatedUser.bio,
      updatedAt: updatedUser.updatedAt,
    },
  })
}
```

---

### 5. DELETE /api/users/:userId
**Purpose:** Delete user account  
**Authentication:** Required (JWT)  
**Authorization:** SUPER_ADMIN only

**Response (200 OK):**
```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Implementation Details:**
```typescript
export async function DELETE(
  req: NextRequest,
  { params }: { params: { userId: string } }
) {
  const user = getUserFromRequest(req)
  if (!user) return unauthorized()

  // Only admin can delete users
  if (user.role !== 'SUPER_ADMIN') {
    return NextResponse.json(
      { success: false, message: "Only admins can delete users" },
      { status: 403 }
    )
  }

  // Prevent deleting self
  if (user.id === params.userId) {
    return NextResponse.json(
      { success: false, message: "Cannot delete your own account" },
      { status: 400 }
    )
  }

  // Delete user and cascade to related data
  await prisma.user.delete({
    where: { id: params.userId },
  })

  // Activity log
  await prisma.activityLog.create({
    data: {
      userId: user.id,
      action: "USER_DELETED",
      entityType: "USER",
      entityId: params.userId,
      details: { deletedUser: params.userId },
    },
  })

  return NextResponse.json({
    success: true,
    message: "User deleted successfully",
  })
}
```

**Error Responses:**
- `401 Unauthorized` - Not authenticated
- `403 Forbidden` - Not admin
- `400 Bad Request` - Cannot delete self

---

### 6. GET /api/users
**Purpose:** List all users (admin only)  
**Authentication:** Required (JWT)  
**Authorization:** SUPER_ADMIN or PROJECT_ADMIN

**Query Parameters:**
```
organizationId (optional) - Filter by organization
role (optional) - Filter by role
limit (optional, default=20) - Results per page
offset (optional, default=0) - Pagination offset
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "user_abc123",
      "email": "john.doe@example.com",
      "name": "John Doe",
      "role": "PROJECT_MANAGER",
      "createdAt": "2026-01-01T10:00:00Z"
    },
    {
      "id": "user_def456",
      "email": "jane.smith@example.com",
      "name": "Jane Smith",
      "role": "TEAM_MEMBER",
      "createdAt": "2026-01-05T14:30:00Z"
    }
  ],
  "pagination": {
    "total": 45,
    "limit": 20,
    "offset": 0,
    "hasMore": true
  }
}
```

---

## 🔐 User Roles & Permissions

### Role Hierarchy

```
SUPER_ADMIN (System Administrator)
  ├─ Can manage all users
  ├─ Can delete any user
  ├─ Can view audit logs
  └─ Can manage organizations

PROJECT_ADMIN (Organization Administrator)
  ├─ Can manage organization members
  ├─ Can create projects
  ├─ Can assign users to projects
  └─ Limited to own organization

PROJECT_MANAGER (Project Manager)
  ├─ Can manage project team
  ├─ Can assign tasks
  ├─ Can approve timesheets
  └─ Limited to assigned projects

TEAM_MEMBER (Regular Team Member)
  ├─ Can create/edit own tasks
  ├─ Can log time
  ├─ Can comment on tasks
  └─ Limited to assigned projects

CLIENT (External Client)
  ├─ View-only access
  ├─ Can see project status
  └─ Cannot create content
```

---

## 💻 Frontend Implementation

### User Registration Component

```typescript
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'react-hot-toast'

export default function SignupPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [name, setName] = useState('')
  const [loading, setLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setErrors({})

    try {
      const response = await fetch('/api/auth/signup', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password, name }),
      })

      const data = await response.json()

      if (!response.ok) {
        if (data.errors) {
          setErrors(data.errors)
        } else {
          toast.error(data.message)
        }
        return
      }

      // Save token
      localStorage.setItem('authToken', data.data.token)
      localStorage.setItem('user', JSON.stringify(data.data.user))

      toast.success('Account created successfully!')
      router.push('/dashboard')
    } catch (error) {
      toast.error('Signup failed. Please try again.')
      console.error('Signup error:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-md mx-auto p-6 space-y-4">
      <h1 className="text-2xl font-bold">Create Account</h1>

      <div>
        <label className="block text-sm font-medium mb-1">Name</label>
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Email</label>
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Password</label>
        <input
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          className="w-full px-3 py-2 border rounded"
          required
        />
        {errors.password && (
          <p className="text-red-500 text-sm mt-1">{errors.password}</p>
        )}
        <p className="text-xs text-gray-600 mt-2">
          Minimum 8 chars, 1 uppercase, 1 lowercase, 1 number, 1 special char
        </p>
      </div>

      <button
        type="submit"
        disabled={loading}
        className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Creating Account...' : 'Sign Up'}
      </button>

      <p className="text-center text-sm">
        Already have an account?{' '}
        <a href="/login" className="text-blue-500 hover:underline">
          Login
        </a>
      </p>
    </form>
  )
}
```

### User Profile Component

```typescript
import { useState, useEffect } from 'react'
import { toast } from 'react-hot-toast'

export default function UserProfile({ userId }: { userId: string }) {
  const [user, setUser] = useState(null)
  const [editing, setEditing] = useState(false)
  const [formData, setFormData] = useState({ name: '', bio: '', avatar: '' })
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    fetchUser()
  }, [userId])

  const fetchUser = async () => {
    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/users/${userId}`, {
        headers: { Authorization: `Bearer ${token}` },
      })
      const data = await response.json()
      setUser(data.data)
      setFormData({
        name: data.data.name,
        bio: data.data.bio || '',
        avatar: data.data.avatar || '',
      })
    } catch (error) {
      toast.error('Failed to load user profile')
    }
  }

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)

    try {
      const token = localStorage.getItem('authToken')
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (!response.ok) {
        toast.error(data.message)
        return
      }

      setUser(data.data)
      setEditing(false)
      toast.success('Profile updated')
    } catch (error) {
      toast.error('Update failed')
    } finally {
      setLoading(false)
    }
  }

  if (!user) return <p>Loading...</p>

  return (
    <div className="max-w-md mx-auto p-6 border rounded">
      {!editing ? (
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-600">Name</p>
            <p className="text-lg font-semibold">{user.name}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Email</p>
            <p className="text-lg">{user.email}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Bio</p>
            <p className="text-lg">{user.bio || 'No bio yet'}</p>
          </div>
          <div>
            <p className="text-sm text-gray-600">Role</p>
            <p className="text-lg font-semibold">{user.role}</p>
          </div>
          <button
            onClick={() => setEditing(true)}
            className="w-full bg-blue-500 text-white py-2 rounded hover:bg-blue-600"
          >
            Edit Profile
          </button>
        </div>
      ) : (
        <form onSubmit={handleUpdate} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Name</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Bio</label>
            <textarea
              value={formData.bio}
              onChange={(e) => setFormData({ ...formData, bio: e.target.value })}
              className="w-full px-3 py-2 border rounded"
              rows={3}
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Avatar URL</label>
            <input
              type="url"
              value={formData.avatar}
              onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
              className="w-full px-3 py-2 border rounded"
            />
          </div>
          <div className="flex gap-2">
            <button
              type="submit"
              disabled={loading}
              className="flex-1 bg-blue-500 text-white py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
            <button
              type="button"
              onClick={() => setEditing(false)}
              className="flex-1 bg-gray-300 text-gray-800 py-2 rounded hover:bg-gray-400"
            >
              Cancel
            </button>
          </div>
        </form>
      )}
    </div>
  )
}
```

---

## 🧪 Test Cases

### User Creation Test
```typescript
describe('User Management', () => {
  test('should create new user with valid data', async () => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'ValidPassword123!',
        name: 'Test User',
      }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.data.user.email).toBe('test@example.com')
    expect(data.data.token).toBeDefined()
  })

  test('should reject weak password', async () => {
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'test@example.com',
        password: 'weak',
        name: 'Test User',
      }),
    })

    expect(response.status).toBe(400)
    const data = await response.json()
    expect(data.errors).toBeDefined()
  })

  test('should prevent duplicate email', async () => {
    // Create first user
    await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        password: 'ValidPassword123!',
        name: 'First User',
      }),
    })

    // Try to create with same email
    const response = await fetch('/api/auth/signup', {
      method: 'POST',
      body: JSON.stringify({
        email: 'duplicate@example.com',
        password: 'ValidPassword123!',
        name: 'Second User',
      }),
    })

    expect(response.status).toBe(409)
  })
})
```

### User Update Test
```typescript
test('should update user profile', async () => {
  const response = await fetch(`/api/users/${userId}`, {
    method: 'PUT',
    headers: { Authorization: `Bearer ${token}` },
    body: JSON.stringify({
      name: 'Updated Name',
      bio: 'Updated bio',
    }),
  })

  expect(response.status).toBe(200)
  const data = await response.json()
  expect(data.data.name).toBe('Updated Name')
  expect(data.data.bio).toBe('Updated bio')
})
```

### User Deletion Test
```typescript
test('should delete user as admin', async () => {
  const response = await fetch(`/api/users/${targetUserId}`, {
    method: 'DELETE',
    headers: { Authorization: `Bearer ${adminToken}` },
  })

  expect(response.status).toBe(200)

  // Verify user is deleted
  const getResponse = await fetch(`/api/users/${targetUserId}`, {
    headers: { Authorization: `Bearer ${adminToken}` },
  })
  expect(getResponse.status).toBe(404)
})
```

---

## 🔑 Password Security

### Bcryptjs Implementation
```typescript
import bcryptjs from 'bcryptjs'

export async function hashPassword(password: string): Promise<string> {
  const salt = await bcryptjs.genSalt(10)
  return bcryptjs.hash(password, salt)
}

export async function comparePassword(
  password: string,
  hashedPassword: string
): Promise<boolean> {
  return bcryptjs.compare(password, hashedPassword)
}
```

### Password Validation
```typescript
export function validatePassword(password: string) {
  const errors: string[] = []

  if (password.length < 8) {
    errors.push('Password must be at least 8 characters')
  }
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain uppercase letter')
  }
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain lowercase letter')
  }
  if (!/[0-9]/.test(password)) {
    errors.push('Password must contain number')
  }
  if (!/[!@#$%^&*]/.test(password)) {
    errors.push('Password must contain special character (!@#$%^&*)')
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
```

---

## 📝 User Lifecycle

```
1. User signs up
   ├─ Email validation
   ├─ Password validation
   ├─ Duplicate check
   ├─ Password hashing
   └─ Account creation

2. User logs in
   ├─ Email lookup
   ├─ Password comparison
   ├─ JWT generation
   └─ Token return

3. User updates profile
   ├─ Authentication check
   ├─ Authorization check
   ├─ Field validation
   ├─ Password hashing (if changed)
   └─ Profile update

4. User gets deleted (admin)
   ├─ Authorization check
   ├─ Cascade deletion
   ├─ Activity logging
   └─ Confirmation
```

---

## 📌 Summary

| Feature | Status | API |
|---------|--------|-----|
| User Registration | ✅ Complete | POST /api/auth/signup |
| User Login | ✅ Complete | POST /api/auth/login |
| Profile Retrieval | ✅ Complete | GET /api/users/:userId |
| Profile Update | ✅ Complete | PUT /api/users/:userId |
| User Deletion | ✅ Complete | DELETE /api/users/:userId |
| User List | ✅ Complete | GET /api/users |
| Password Hashing | ✅ Complete | Bcryptjs |
| Password Validation | ✅ Complete | Custom rules |
| Role-Based Access | ✅ Complete | 5 roles defined |
| JWT Authentication | ✅ Complete | Token-based |

---
