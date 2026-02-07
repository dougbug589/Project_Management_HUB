# Team Doc: Design & UX Team

## Overview
Owns design system, theming, accessibility across all modules.

## Modules - Role Overview

| Module | Role | Contribution |
|--------|------|-------------|
| 1. Authentication & Organizations | Support | UX flows, form design, validation patterns |
| 2. Project Management | Support | Project card design, layout, status indicators |
| 3. Task Management | Support | Task UI patterns, priority/status design |
| 4. Milestones & Phases | Support | Timeline visualizations, progress indicators |
| 5. Time Tracking & Timesheets | Support | Timer UI, weekly grid design, approval flows |
| 6. Collaboration | Support | Comment threading, discussion board layout |
| 7. Issue Tracking | Support | Severity color coding, issue card design |
| 8. Document Management | Support | Upload patterns, version history UI |
| 9. Reports & Analytics | Support | Chart styling, export button design |
| 10. Notifications & Preferences | Support | Bell icon, toast design, preferences layout |
| 11. Client Portal | Support | Simplified client-facing design system |
| 12. Role-based Dashboards | Support | Widget layouts, chart styling, KPI cards |

**Cross-cutting**: Dark theme, spacing tokens, typography, iconography, accessibility for ALL modules

## Key Files & Architecture
- `src/app/globals.css` - Global styles and theme variables
- `src/contexts/ThemeContext.tsx` - Dark theme toggle
- `tailwind.config.ts` - Tailwind customization
- `src/components/ui/*` - Component design patterns
- `postcss.config.mjs` - PostCSS pipeline

## Technical Stack
- **CSS Framework**: Tailwind CSS 4.x
- **Theming**: CSS variables + Tailwind dark mode
- **Icons**: Lucide React, React Icons
- **Font**: System fonts (via Tailwind defaults)

## Design Token System

```css
/* src/app/globals.css */
@tailwind base;
@tailwind components;
@tailwind utilities;

:root {
  --color-primary: #3b82f6;      /* Blue */
  --color-success: #10b981;      /* Green */
  --color-danger: #ef4444;       /* Red */
  --color-warning: #f59e0b;      /* Amber */
  --color-bg-primary: #0a0a0a;   /* Gray-950 */
  --color-bg-secondary: #1a1a1a; /* Gray-900 */
  --color-text-primary: #ededed; /* White */
  --color-text-secondary: #d1d5db; /* Gray-300 */
}

.btn-primary {
  @apply px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition;
}

.btn-secondary {
  @apply px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600 transition;
}
```

## Tailwind Configuration

```typescript
// tailwind.config.ts
import type { Config } from 'tailwindcss';

const config: Config = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: '#3b82f6',
        success: '#10b981',
        danger: '#ef4444',
      },
      spacing: {
        xs: '0.25rem',
        sm: '0.5rem',
        md: '1rem',
        lg: '1.5rem',
        xl: '2rem',
      },
    },
  },
  plugins: [],
};
export default config;
```

## Accessibility Standards (WCAG 2.1 AA)

```typescript
// Example: Accessible Form Input
function FormInput({
  label,
  id,
  error,
  ...props
}: InputProps) {
  return (
    <div className="mb-4">
      <label htmlFor={id} className="block text-sm font-medium mb-2">
        {label}
      </label>
      <input
        id={id}
        aria-invalid={!!error}
        aria-describedby={error ? `${id}-error` : undefined}
        className="w-full px-3 py-2 bg-gray-700 text-white rounded border-2 border-gray-600 focus:border-blue-500 focus:outline-none"
        {...props}
      />
      {error && (
        <p id={`${id}-error`} className="text-red-400 text-xs mt-1">
          {error}
        </p>
      )}
    </div>
  );
}
```

## Testing

```typescript
// Contrast checker
test('Button text meets WCAG AA contrast ratio', () => {
  const primaryBtn = document.querySelector('.btn-primary');
  // Use axe or similar tool to verify contrast >= 4.5:1
});

// Keyboard navigation
test('Form inputs are keyboard accessible', () => {
  const input = screen.getByLabelText(/email/i);
  userEvent.tab();
  expect(input).toHaveFocus();
});

// Mobile breakpoint
test('Layout is responsive on mobile', () => {
  render(<ProjectCard />);
  expect(screen.getByRole('heading')).toHaveClass('text-lg md:text-xl');
});
```

## Demo Checklist
- Show consistent dark theme across all pages
- Demonstrate keyboard navigation on forms
- Test color contrast (use WCAG contrast checker)
- Show responsive design on mobile/tablet/desktop
- Mention accessibility features (ARIA, focus states)
