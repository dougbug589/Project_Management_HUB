# Team Doc: UI Components Team

## Overview
Owns shared UI library and front-door experiences; ensures accessible, consistent UI.

## Modules - Role Overview

| Module | Role | Contribution |
|--------|------|-------------|
| 1. Authentication & Organizations | **PRIMARY** | Login/signup pages, org forms, JWT UI integration |
| 2. Project Management | Support | Shared forms, buttons, cards for project UI |
| 3. Task Management | Support | Task cards, forms, filters, action buttons |
| 4. Milestones & Phases | Support | Date pickers, progress bars, milestone cards |
| 5. Time Tracking & Timesheets | Support | Timer widget UI, timesheet grid components |
| 6. Collaboration | Support | Comment forms, discussion threads UI, activity feed |
| 7. Issue Tracking | Support | Issue cards, severity badges, status indicators |
| 8. Document Management | Support | Upload UI, document cards, version list |
| 9. Reports & Analytics | Support | Report selectors, export buttons, table components |
| 10. Notifications & Preferences | **PRIMARY** | Notification bell, toasts, preferences form |
| 11. Client Portal | Support | Client-facing UI components and layouts |
| 12. Role-based Dashboards | Support | Widget containers, chart wrappers, KPI cards |

## Key Files & Architecture

### Component Library
- `src/components/ui/Button.tsx` - Reusable button with variants (primary, secondary, danger, ghost)
- `src/components/ui/Card.tsx` - Card layout with header/body/footer
- `src/components/ui/Form.tsx` - Form inputs (text, textarea, select, checkbox)
- `src/components/ui/Modal.tsx` - Dialog component
- `src/components/ui/Toast.tsx` - Toast notifications
- `src/components/ui/Loader.tsx` - Loading spinners and skeletons
- `src/components/ui/Tabs.tsx` - Tab switching
- `src/components/ui/Dropdown.tsx` - Dropdown menus

### Pages & Layouts
- `src/app/login/page.tsx` - Login form with email/password
- `src/app/signup/page.tsx` - Signup form with org creation
- `src/app/layout.tsx` - Root layout with theme provider
- `src/components/AppLayout.tsx` - Main app layout (sidebar + content)
- `src/components/Sidebar.tsx` - Navigation sidebar

### Theme & Styling
- `src/app/globals.css` - Global styles and Tailwind config
- `src/contexts/ThemeContext.tsx` - Dark theme toggle context
- `postcss.config.mjs` - PostCSS configuration
- `tailwind.config.ts` - Tailwind CSS customization

## Technical Stack
- **Frontend Framework**: React 19.2.3 with TypeScript
- **Styling**: Tailwind CSS 4.x with dark mode
- **UI Icons**: Lucide React, React Icons
- **State**: React Context (ThemeContext)
- **HTTP**: Axios for API calls
- **Validation**: Zod for form validation

## APIs Used (Read-Heavy)

```typescript
// Module 1 - Authentication
POST /api/auth/login
  Request: { email: string, password: string }
  Response: { token: string, user: User }

POST /api/auth/signup
  Request: { email, password, name, organizationName }
  Response: { token, user, organization }

GET /api/users/profile
  Response: { user: User, organizations: Organization[] }

// Module 10 - Notifications
GET /api/notifications
  Response: { notifications: Notification[], unreadCount: number }

PATCH /api/notifications/[id]/read
  Response: { notification: Notification }
```

## Build Implementation Steps

### Step 1: Set up Theme Provider
```typescript
// src/contexts/ThemeContext.tsx
import { createContext, useState } from 'react';

export const ThemeContext = createContext<{ isDark: boolean; toggle: () => void }>(
  { isDark: true, toggle: () => {} }
);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [isDark, setIsDark] = useState(true);
  return (
    <ThemeContext.Provider value={{ isDark, toggle: () => setIsDark(!isDark) }}>
      {children}
    </ThemeContext.Provider>
  );
}
```

### Step 2: Create Reusable Button Component
```typescript
// src/components/ui/Button.tsx
import { ReactNode } from 'react';

type ButtonVariant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps {
  children: ReactNode;
  variant?: ButtonVariant;
  onClick?: () => void;
  disabled?: boolean;
  className?: string;
}

export function Button({
  children,
  variant = 'primary',
  onClick,
  disabled,
  className = '',
}: ButtonProps) {
  const baseStyles = 'px-4 py-2 rounded font-medium transition';
  const variants = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700',
    secondary: 'bg-gray-300 text-black hover:bg-gray-400',
    danger: 'bg-red-600 text-white hover:bg-red-700',
    ghost: 'text-blue-600 hover:bg-blue-50',
  };

  return (
    <button
      className={`${baseStyles} ${variants[variant]} ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${className}`}
      onClick={onClick}
      disabled={disabled}
    >
      {children}
    </button>
  );
}
```

### Step 3: Implement Login Page
```typescript
// src/app/login/page.tsx
'use client';
import { useState } from 'react';
import axios from 'axios';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/Button';
import { Form } from '@/components/ui/Form';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async () => {
    try {
      const response = await axios.post('/api/auth/login', { email, password });
      localStorage.setItem('token', response.data.token);
      router.push('/dashboard');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Login failed');
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-900">
      <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-96">
        <h1 className="text-2xl font-bold mb-6 text-white">Login</h1>
        <Form>
          <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          />
          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-2 mb-4 bg-gray-700 text-white rounded"
          />
          {error && <p className="text-red-400 mb-4">{error}</p>}
          <Button onClick={handleLogin} variant="primary" className="w-full">
            Login
          </Button>
        </Form>
      </div>
    </div>
  );
}
```

## Testing Steps

### Unit Tests
```typescript
// Test Button component variant rendering
import { render, screen } from '@testing-library/react';
import { Button } from '@/components/ui/Button';

test('Button renders with primary variant', () => {
  render(<Button variant="primary">Click me</Button>);
  const button = screen.getByRole('button');
  expect(button).toHaveClass('bg-blue-600');
});

test('Button is disabled when disabled prop is true', () => {
  render(<Button disabled>Click me</Button>);
  const button = screen.getByRole('button');
  expect(button).toBeDisabled();
});
```

### Integration Tests
```typescript
// Test login flow
test('Login flow: enter credentials and submit', async () => {
  render(<LoginPage />);
  
  const emailInput = screen.getByPlaceholderText('Email');
  const passwordInput = screen.getByPlaceholderText('Password');
  const submitButton = screen.getByRole('button', { name: /login/i });
  
  fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
  fireEvent.change(passwordInput, { target: { value: 'password123' } });
  fireEvent.click(submitButton);
  
  // Assert redirect or success message
  await waitFor(() => expect(window.location.href).toContain('/dashboard'));
});
```

## Demo Checklist
- Show login form with real-time validation feedback
- Highlight consistent button styling across app
- Demo dark theme toggle and persistence
- Show notification bell with unread count
- Mention accessibility: keyboard navigation, focus states, color contrast
