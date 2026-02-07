# Team Doc: Analytics & Reports Team

## Overview
Owns reporting, exports, and dashboard data feeds.

## Modules - Role Overview

| Module | Role | Contribution |
|--------|------|-------------|
| 1. Authentication & Organizations | — | Not involved |
| 2. Project Management | Support | Project progress metrics for reports |
| 3. Task Management | Support | Task completion data for reports |
| 4. Milestones & Phases | Support | Milestone progress for reports |
| 5. Time Tracking & Timesheets | Support | Time utilization data for reports |
| 6. Collaboration | — | Not involved |
| 7. Issue Tracking | Support | Issue metrics for reports |
| 8. Document Management | — | Not involved |
| 9. Reports & Analytics | **PRIMARY** | All reports, PDF/CSV/JSON exports, aggregations |
| 10. Notifications & Preferences | — | Not involved |
| 11. Client Portal | — | Not involved |
| 12. Role-based Dashboards | Support | Data aggregation and KPIs for widgets |

## Key Files & Architecture
- `src/app/api/reports/route.ts` - Generate reports (JSON)
- `src/app/api/reports/export/route.ts` - Export CSV/JSON/PDF
- `src/lib/pdf.ts` - PDF generation with pdfkit
- `src/components/ReportsExport.tsx` - Export UI

## Technical Stack
- **PDF**: pdfkit 0.17.2
- **CSV**: csv-parser, native JSON
- **Validation**: Zod for filters

## Report APIs

```typescript
// GET /api/reports?type=project-progress&projectId=proj1
Response: {
  type, projects: [{ id, name, taskCount, completedCount, percentComplete }],
  generatedAt: Date
}

// POST /api/reports/export
Request: { type, format: 'csv'|'json'|'pdf', filters }
Response: Binary file (attachment)
```

## Code Example - Report Query
```typescript
const projects = await prisma.project.findMany({
  include: { tasks: true },
});

const report = {
  projects: projects.map(p => ({
    id: p.id,
    name: p.name,
    percentComplete: Math.round(
      (p.tasks.filter(t => t.status === 'COMPLETED').length / p.tasks.length) * 100
    ),
  })),
};
```

## Testing
```typescript
test('Export as PDF', async () => {
  const response = await axios.post('/api/reports/export', {
    type: 'project-progress',
    format: 'pdf',
  }, { responseType: 'arraybuffer' });
  expect(response.data.length).toBeGreaterThan(0);
});
```

## Demo Checklist
- Generate project progress report with filters
- Export as PDF, CSV, and show in viewer/spreadsheet
- Highlight all 4 report types
