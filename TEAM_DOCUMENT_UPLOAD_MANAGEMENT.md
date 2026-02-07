# 📄 Document Upload & Management - Technical Documentation

**Team:** Document Management & Collaboration Team  
**Module:** Document Management, Document Versioning  
**Last Updated:** 26 January 2026

---

## 📖 Overview

The Document Management system provides comprehensive file upload, versioning, and access control. Users can upload documents to projects, maintain version history with changelogs, and download any previous version. All document access is controlled by project membership.

---

## 🗄️ Database Schema

### Document Model

```prisma
model Document {
  id            String    @id @default(cuid())
  title         String
  description   String?
  projectId     String
  project       Project   @relation(fields: [projectId], references: [id], onDelete: Cascade)
  createdBy     String
  creator       User      @relation(fields: [createdBy], references: [id])
  
  currentVersion Int      @default(1)
  createdAt     DateTime  @default(now())
  updatedAt     DateTime  @updatedAt

  versions      DocumentVersion[]

  @@index([projectId])
  @@index([createdBy])
}
```

**Key Fields:**
- `id` - Unique identifier (CUID)
- `title` - Document name (displayed to users)
- `description` - Optional document description
- `projectId` - Project this document belongs to
- `createdBy` - User who created the document (User ID)
- `currentVersion` - Latest version number for quick reference
- `versions` - Array of DocumentVersion records

**Access Control:**
- Only users with project membership can view documents
- Only project members can upload new versions
- Deletions cascade when project is deleted

---

### DocumentVersion Model

```prisma
model DocumentVersion {
  id            String    @id @default(cuid())
  documentId    String
  document      Document  @relation(fields: [documentId], references: [id], onDelete: Cascade)
  
  versionNumber Int
  fileUrl       String
  fileName      String
  fileSize      Int
  fileType      String
  changeLog     String?
  
  createdBy     String
  uploader      User      @relation(fields: [createdBy], references: [id], onDelete: Restrict)
  createdAt     DateTime  @default(now())

  @@unique([documentId, versionNumber])
  @@index([documentId])
}
```

**Key Fields:**
- `versionNumber` - Sequential version (1, 2, 3...)
- `fileUrl` - URL to download the file
- `fileName` - Original file name with extension
- `fileSize` - File size in bytes
- `fileType` - MIME type (e.g., "application/pdf")
- `changeLog` - Version notes/changelog
- `uploader` - User who uploaded this version

**Immutability:**
- Versions are immutable (never updated, only created)
- Unique constraint on (documentId, versionNumber)
- Allows complete audit trail

---

## 🔌 API Endpoints

### 1. GET /api/documents
**Purpose:** Retrieve all documents for a project  
**Authentication:** Required (JWT)  
**Parameters:**
```
projectId (query, required) - Project ID to fetch documents for
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "doc_abc123",
      "title": "System Architecture Diagram",
      "description": "Initial system design with database schema",
      "projectId": "proj_123",
      "createdBy": "user_456",
      "currentVersion": 2,
      "createdAt": "2026-01-20T10:30:00Z",
      "updatedAt": "2026-01-25T14:15:00Z",
      "versions": [
        {
          "id": "docver_xyz789",
          "documentId": "doc_abc123",
          "versionNumber": 2,
          "fileUrl": "https://storage.example.com/docs/arch_v2.pdf",
          "fileName": "architecture_v2.pdf",
          "fileSize": 2048000,
          "fileType": "application/pdf",
          "changeLog": "Added authentication flow and database schema",
          "createdBy": "user_456",
          "createdAt": "2026-01-25T14:15:00Z"
        }
      ]
    }
  ]
}
```

**Error Responses:**
- `401 Unauthorized` - No JWT token
- `400 Bad Request` - Missing projectId
- `403 Forbidden` - No access to project

---

### 2. POST /api/documents
**Purpose:** Create a new document with initial file  
**Authentication:** Required (JWT)  
**Content-Type:** application/json

**Request Body:**
```json
{
  "title": "System Architecture Diagram",
  "description": "Initial system design",
  "projectId": "proj_123",
  "fileUrl": "https://storage.example.com/docs/arch_v1.pdf",
  "fileName": "architecture_v1.pdf",
  "fileSize": 1024000,
  "fileType": "application/pdf"
}
```

**Required Fields:** title, projectId, fileUrl, fileName

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Document created",
  "data": {
    "id": "doc_abc123",
    "title": "System Architecture Diagram",
    "description": "Initial system design",
    "projectId": "proj_123",
    "createdBy": "user_456",
    "currentVersion": 1,
    "createdAt": "2026-01-26T10:30:00Z",
    "updatedAt": "2026-01-26T10:30:00Z",
    "versions": [
      {
        "id": "docver_xyz789",
        "versionNumber": 1,
        "fileUrl": "https://storage.example.com/docs/arch_v1.pdf",
        "fileName": "architecture_v1.pdf",
        "fileSize": 1024000,
        "fileType": "application/pdf",
        "createdBy": "user_456",
        "createdAt": "2026-01-26T10:30:00Z"
      }
    ]
  }
}
```

**Implementation Details:**
```typescript
// Prisma create with nested version
const doc = await prisma.document.create({
  data: {
    title,
    description,
    projectId,
    createdBy: user.id,
    versions: {
      create: {
        versionNumber: 1,
        fileUrl,
        fileName,
        fileSize: fileSize || 0,
        fileType: fileType || "application/octet-stream",
        createdBy: user.id,
      },
    },
  },
  include: { versions: true },
})
```

---

### 3. POST /api/document-versions
**Purpose:** Upload new version of existing document  
**Authentication:** Required (JWT)  
**Content-Type:** application/json

**Request Body:**
```json
{
  "documentId": "doc_abc123",
  "fileUrl": "https://storage.example.com/docs/arch_v2.pdf",
  "fileName": "architecture_v2.pdf",
  "fileSize": 2048000,
  "fileType": "application/pdf",
  "changeLog": "Added authentication flow and database schema"
}
```

**Required Fields:** documentId, fileUrl, fileName

**Response (201 Created):**
```json
{
  "success": true,
  "message": "Version uploaded successfully",
  "data": {
    "id": "docver_new123",
    "documentId": "doc_abc123",
    "versionNumber": 2,
    "fileUrl": "https://storage.example.com/docs/arch_v2.pdf",
    "fileName": "architecture_v2.pdf",
    "fileSize": 2048000,
    "fileType": "application/pdf",
    "changeLog": "Added authentication flow and database schema",
    "createdBy": "user_456",
    "createdAt": "2026-01-25T14:15:00Z"
  }
}
```

**Workflow:**
1. User selects existing document
2. Uploads new file (actual file goes to cloud storage like S3)
3. Backend receives fileUrl, fileName, etc.
4. Creates new DocumentVersion with incremented versionNumber
5. Updates Document.currentVersion
6. Activity log records the version upload

---

### 4. GET /api/document-versions/:documentId
**Purpose:** Get all versions of a document  
**Authentication:** Required (JWT)  
**Path Parameters:**
```
documentId - Document ID
```

**Response (200 OK):**
```json
{
  "success": true,
  "data": [
    {
      "id": "docver_xyz789",
      "versionNumber": 2,
      "fileUrl": "https://storage.example.com/docs/arch_v2.pdf",
      "fileName": "architecture_v2.pdf",
      "fileSize": 2048000,
      "fileType": "application/pdf",
      "changeLog": "Added authentication flow",
      "createdBy": "user_456",
      "createdAt": "2026-01-25T14:15:00Z"
    },
    {
      "id": "docver_abc123",
      "versionNumber": 1,
      "fileUrl": "https://storage.example.com/docs/arch_v1.pdf",
      "fileName": "architecture_v1.pdf",
      "fileSize": 1024000,
      "fileType": "application/pdf",
      "createdBy": "user_456",
      "createdAt": "2026-01-20T10:30:00Z"
    }
  ]
}
```

**Ordering:** Descending by versionNumber (latest first)

---

### 5. DELETE /api/documents/:documentId
**Purpose:** Delete a document and all its versions  
**Authentication:** Required (JWT)  
**Path Parameters:**
```
documentId - Document ID to delete
```

**Response (200 OK):**
```json
{
  "success": true,
  "message": "Document deleted successfully"
}
```

**Access Control:**
- Only project members can delete documents
- Only admin or document creator can delete
- Cascade deletes all DocumentVersions

---

## 💻 Frontend Implementation

### Document Upload Component

```typescript
import { useState } from 'react'
import { uploadDocument } from '@/lib/api'

export default function DocumentUpload({ projectId }: { projectId: string }) {
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(false)

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFile(e.target.files[0])
    }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!file || !title) {
      alert('Please provide title and select a file')
      return
    }

    setLoading(true)
    try {
      // Step 1: Upload file to cloud storage (e.g., S3)
      // This would typically be done through presigned URLs
      const formData = new FormData()
      formData.append('file', file)
      const uploadResponse = await fetch('/api/upload', {
        method: 'POST',
        body: formData,
      })
      const { fileUrl } = await uploadResponse.json()

      // Step 2: Create document in database
      await uploadDocument({
        title,
        description,
        projectId,
        fileUrl,
        fileName: file.name,
        fileSize: file.size,
        fileType: file.type,
      })

      alert('Document uploaded successfully')
      setTitle('')
      setDescription('')
      setFile(null)
    } catch (error) {
      console.error('Upload failed:', error)
      alert('Failed to upload document')
    } finally {
      setLoading(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <label className="block text-sm font-medium mb-1">Document Title</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g., System Architecture Diagram"
          className="w-full px-3 py-2 border rounded"
          required
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Describe the document content"
          className="w-full px-3 py-2 border rounded"
          rows={3}
        />
      </div>

      <div>
        <label className="block text-sm font-medium mb-1">Select File</label>
        <input
          type="file"
          onChange={handleFileSelect}
          className="w-full"
          required
        />
        {file && <p className="text-sm text-gray-600 mt-1">{file.name}</p>}
      </div>

      <button
        type="submit"
        disabled={loading}
        className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-gray-400"
      >
        {loading ? 'Uploading...' : 'Upload Document'}
      </button>
    </form>
  )
}
```

### Document Version History Component

```typescript
export default function DocumentVersions({ documentId }: { documentId: string }) {
  const [versions, setVersions] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchVersions()
  }, [documentId])

  const fetchVersions = async () => {
    try {
      const response = await fetch(`/api/document-versions/${documentId}`)
      const data = await response.json()
      setVersions(data.data || [])
    } catch (error) {
      console.error('Failed to fetch versions:', error)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-4">
      <h3 className="font-semibold text-lg">Version History</h3>
      {loading ? (
        <p>Loading versions...</p>
      ) : (
        <div className="space-y-2">
          {versions.map((version) => (
            <div key={version.id} className="border rounded p-4">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">Version {version.versionNumber}</p>
                  <p className="text-sm text-gray-600">{version.fileName}</p>
                  {version.changeLog && (
                    <p className="text-sm mt-2">{version.changeLog}</p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-xs text-gray-500">
                    {new Date(version.createdAt).toLocaleDateString()}
                  </p>
                  <a
                    href={version.fileUrl}
                    download
                    className="text-blue-500 hover:underline text-sm"
                  >
                    Download
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
```

---

## 🔐 Access Control

**Permission Model:**

| Role | Can Upload | Can View | Can Delete | Can Manage Versions |
|------|-----------|---------|-----------|-------------------|
| Project Owner | ✅ | ✅ | ✅ | ✅ |
| Project Manager | ✅ | ✅ | ✅ | ✅ |
| Project Member | ✅ | ✅ | ❌ | ✅ |
| Client | ❌ | ✅ | ❌ | ❌ |
| Non-Member | ❌ | ❌ | ❌ | ❌ |

**Implementation:**
```typescript
// Check project membership before allowing operations
const member = await prisma.projectMember.findUnique({
  where: { projectId_userId: { projectId, userId: user.id } }
})

if (!member) {
  return NextResponse.json(
    { success: false, message: "No access to project" },
    { status: 403 }
  )
}
```

---

## 📊 Activity Logging

Every document operation creates an activity log:

```typescript
await prisma.activityLog.create({
  data: {
    projectId,
    userId: user.id,
    action: "DOCUMENT_UPLOADED",
    entityType: "DOCUMENT",
    entityId: document.id,
    details: {
      documentTitle: document.title,
      versionNumber: version.versionNumber,
      fileName: fileName,
    },
  },
})
```

**Activity Types:**
- `DOCUMENT_CREATED` - New document uploaded
- `DOCUMENT_VERSION_UPDATED` - New version added
- `DOCUMENT_DELETED` - Document removed
- `DOCUMENT_DOWNLOADED` - Version downloaded (optional)

---

## 🧪 Test Cases

### Create Document Test
```typescript
describe('Document Upload', () => {
  test('should create document with initial version', async () => {
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Test Doc',
        projectId: projectId,
        fileUrl: 'https://example.com/file.pdf',
        fileName: 'file.pdf',
        fileSize: 1024,
        fileType: 'application/pdf',
      }),
    })

    expect(response.status).toBe(201)
    const data = await response.json()
    expect(data.data.versions[0].versionNumber).toBe(1)
  })

  test('should reject without projectId', async () => {
    const response = await fetch('/api/documents', {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: JSON.stringify({
        title: 'Test Doc',
        fileUrl: 'https://example.com/file.pdf',
        fileName: 'file.pdf',
      }),
    })

    expect(response.status).toBe(400)
  })
})
```

### Version History Test
```typescript
test('should maintain version history', async () => {
  // Create document (version 1)
  const doc1 = await uploadDocument({
    title: 'Architecture',
    projectId,
    fileUrl: 'url1.pdf',
    fileName: 'arch_v1.pdf',
    fileSize: 1000,
    fileType: 'application/pdf',
  })

  // Upload new version (version 2)
  await uploadVersion({
    documentId: doc1.id,
    fileUrl: 'url2.pdf',
    fileName: 'arch_v2.pdf',
    fileSize: 2000,
    fileType: 'application/pdf',
  })

  // Fetch versions
  const versions = await getDocumentVersions(doc1.id)
  
  expect(versions).toHaveLength(2)
  expect(versions[0].versionNumber).toBe(2)
  expect(versions[1].versionNumber).toBe(1)
})
```

---

## 📝 File Upload Best Practices

### 1. Cloud Storage Integration
```typescript
// Use S3 or similar cloud storage
import AWS from 'aws-sdk'

const s3 = new AWS.S3({
  accessKeyId: process.env.AWS_ACCESS_KEY_ID,
  secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
})

export async function uploadToS3(file: File, fileName: string) {
  const params = {
    Bucket: process.env.AWS_BUCKET_NAME,
    Key: `documents/${Date.now()}-${fileName}`,
    Body: file,
  }

  const result = await s3.upload(params).promise()
  return result.Location // Return S3 URL
}
```

### 2. File Size Limits
- Maximum 100MB per file (configurable)
- Check before processing
- Return clear error to user

### 3. File Type Validation
```typescript
const ALLOWED_TYPES = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/png',
  'image/jpeg',
]

if (!ALLOWED_TYPES.includes(fileType)) {
  return NextResponse.json(
    { success: false, message: 'File type not allowed' },
    { status: 400 }
  )
}
```

### 4. Virus Scanning
- Integrate with service like ClamAV before accepting files
- Scan S3 uploads automatically
- Log scan results

---

## 🔄 Complete Document Lifecycle

```
1. User navigates to project → Documents tab
2. Clicks "Upload Document"
3. Fills form: Title, Description, Selects File
4. Frontend uploads file to S3 (gets fileUrl)
5. Frontend calls POST /api/documents
6. Backend creates Document + DocumentVersion(v1)
7. Activity log created
8. User sees success notification
9. Document appears in documents list

Later: User uploads new version
1. Clicks "Upload New Version" on document
2. Selects file
3. Frontend uploads to S3 (gets fileUrl)
4. Frontend calls POST /api/document-versions
5. Backend creates new DocumentVersion(v2)
6. Document.currentVersion updated to 2
7. User can view version history
8. User can download any version
```

---

## 🚀 Integration Points

- **Project Module**: Documents belong to projects
- **Collaboration Module**: Comments can reference documents
- **Activity Logs**: All document operations tracked
- **Notifications**: Users notified of document uploads
- **Reports Module**: Can export document metadata

---

## 📌 Summary

| Feature | Status | Notes |
|---------|--------|-------|
| Document Upload | ✅ Complete | Create with initial file |
| Version Control | ✅ Complete | Immutable version history |
| Version Download | ✅ Complete | Download any version |
| Change Logs | ✅ Complete | Track version notes |
| Access Control | ✅ Complete | Project membership based |
| Activity Logging | ✅ Complete | All operations tracked |
| Cascade Delete | ✅ Complete | Deletes all versions |

---
