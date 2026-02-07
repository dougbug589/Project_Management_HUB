# Team Doc: Testing & Documentation Team

## Overview
Owns QA, documentation currency, and release readiness.

## Modules - Role Overview

| Module | Role | Contribution |
|--------|------|-------------|
| 1. Authentication & Organizations | Support | Auth flow tests, role permission tests |
| 2. Project Management | Support | Project CRUD tests, membership tests |
| 3. Task Management | Support | Task lifecycle tests, dependency tests |
| 4. Milestones & Phases | Support | Milestone tests, reminder validation |
| 5. Time Tracking & Timesheets | Support | Timer tests, approval workflow tests |
| 6. Collaboration | Support | Comment tests, discussion tests, activity log validation |
| 7. Issue Tracking | Support | Issue CRUD tests, severity filtering tests |
| 8. Document Management | Support | Upload tests, versioning tests, access control tests |
| 9. Reports & Analytics | Support | Report generation tests, export format validation |
| 10. Notifications & Preferences | Support | Notification tests, email preference tests |
| 11. Client Portal | Support | Client access tests, read-only enforcement |
| 12. Role-based Dashboards | Support | Dashboard data tests per role |

**Cross-cutting**: E2E test suite, documentation maintenance, release checklists for ALL modules

## Key Files & Architecture
- `tests/e2e-feature-test.ts` - End-to-end test suite
- `UNIFIED_DOCUMENTATION.md` - Complete technical reference
- `TEAM_*.md` - Team-specific guides
- `.github/workflows/` - CI/CD pipelines (if configured)

## Testing Stack
- **E2E**: Node.js + Axios (custom runner)
- **Unit**: Jest + React Testing Library (ready to use)
- **API**: Supertest or custom HTTP client

## Test Structure

```typescript
// tests/e2e-feature-test.ts
import axios from 'axios';
const BASE_URL = 'http://localhost:3000';
const client = axios.create({ baseURL: BASE_URL });

describe('E2E: Authentication Module', () => {
  test('User signup and login flow', async () => {
    // 1. Signup
    const signupRes = await client.post('/api/auth/signup', {
      email: 'test@example.com',
      password: 'Test123!',
      name: 'Test User',
      organizationName: 'Test Org',
    });
    expect(signupRes.status).toBe(201);
    const { token } = signupRes.data;

    // 2. Login
    const loginRes = await client.post('/api/auth/login', {
      email: 'test@example.com',
      password: 'Test123!',
    });
    expect(loginRes.status).toBe(200);
    expect(loginRes.data.token).toBe(token);

    // 3. Access dashboard (requires auth)
    const dashRes = await client.get('/api/dashboard', {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(dashRes.status).toBe(200);
  });

  test('Invalid credentials return 401', async () => {
    try {
      await client.post('/api/auth/login', {
        email: 'wrong@example.com',
        password: 'wrong',
      });
    } catch (error: any) {
      expect(error.response.status).toBe(401);
    }
  });
});

describe('E2E: Project Module', () => {
  let token: string;
  let projectId: string;

  beforeAll(async () => {
    // Setup: login
    const loginRes = await client.post('/api/auth/login', {
      email: 'pm@example.com',
      password: 'PM123!',
    });
    token = loginRes.data.token;
  });

  test('Create project', async () => {
    const res = await client.post(
      '/api/projects',
      {
        name: 'Test Project',
        organizationId: 'org123',
        startDate: new Date(),
      },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status).toBe(201);
    projectId = res.data.project.id;
  });

  test('Get project details', async () => {
    const res = await client.get(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
    expect(res.data.project.id).toBe(projectId);
  });

  test('Update project', async () => {
    const res = await client.patch(
      `/api/projects/${projectId}`,
      { name: 'Updated Project' },
      { headers: { Authorization: `Bearer ${token}` } }
    );
    expect(res.status).toBe(200);
    expect(res.data.project.name).toBe('Updated Project');
  });

  test('Delete project', async () => {
    const res = await client.delete(`/api/projects/${projectId}`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(res.status).toBe(200);
  });
});

describe('E2E: Permission & RBAC Tests', () => {
  test('Team member cannot delete project', async () => {
    const memberToken = 'member-token-here';
    try {
      await client.delete('/api/projects/proj1', {
        headers: { Authorization: `Bearer ${memberToken}` },
      });
    } catch (error: any) {
      expect(error.response.status).toBe(403);
    }
  });

  test('Client cannot modify tasks (read-only)', async () => {
    const clientToken = 'client-token-here';
    try {
      await client.post(
        '/api/tasks',
        { title: 'Task', projectId: 'proj1' },
        { headers: { Authorization: `Bearer ${clientToken}` } }
      );
    } catch (error: any) {
      expect(error.response.status).toBe(403);
    }
  });
});
```

## Run Tests

```bash
# Start dev server
npm run dev

# In another terminal, run tests
npm run test:e2e

# Or run specific test file
node --loader tsx tests/e2e-feature-test.ts
```

## Documentation Maintenance

```markdown
# When to update docs:
1. New API endpoint added → update UNIFIED_DOCUMENTATION.md
2. Team responsibility changes → update TEAM_*.md
3. DB schema change → update module section in UNIFIED_DOCUMENTATION.md
4. New feature complete → add to appropriate module
5. Bug fix → document in release notes
```

## Release Checklist

```markdown
[ ] All tests pass (npm run test:e2e)
[ ] Documentation updated
[ ] No console errors or warnings
[ ] Database migrations reviewed
[ ] API endpoints tested with curl/Postman
[ ] RBAC permissions verified
[ ] Email/notifications tested
[ ] PDF exports validated
[ ] Mobile responsive check
[ ] Accessibility scan (WCAG AA)
[ ] Performance baseline captured
```

## Testing Coverage Goals
- Authentication: 100%
- Project CRUD: 100%
- Task lifecycle: 95%+
- Permissions/RBAC: 100%
- Report generation: 90%+
- Notifications: 85%+

## Demo Checklist
- Run full E2E test suite and show passing
- Demonstrate test coverage metrics
- Walk through release checklist
- Show documentation completeness
