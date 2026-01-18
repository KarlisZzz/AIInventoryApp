# Frontend Implementation Plan (React SPA)

**Feature**: 001-inventory-lending  
**Date**: 2026-01-17

Summary: Build a responsive React application using Vite + TypeScript, Tailwind CSS for styling, TanStack Query for server-state, Axios for API calls, and react-router-dom for navigation. The app will include three primary views: Dashboard, Inventory, and Item Detail.

---

## Goals
- Fast developer experience with Vite
- Type-safe code with TypeScript
- Server-state with TanStack Query to keep UI in sync
- Clean UI using Tailwind, responsive dashboard layout
- Structured API client in `src/api/axios.ts`
- Routes: `/` (Dashboard), `/inventory` (Inventory list), `/inventory/:itemId` (Item detail)

---

## Directory Structure

```
frontend/
├─ package.json
├─ tsconfig.json
├─ vite.config.ts
├─ src/
│  ├─ main.tsx
│  ├─ App.tsx
│  ├─ index.css
│  ├─ api/
│  │  └─ axios.ts
│  ├─ hooks/
│  │  ├─ useItems.ts
│  │  └─ useLending.ts
│  ├─ pages/
│  │  ├─ Dashboard.tsx
│  │  ├─ Inventory.tsx
│  │  └─ ItemDetail.tsx
│  ├─ components/
│  │  ├─ ItemTable.tsx
│  │  ├─ ItemCard.tsx
│  │  ├─ LendModal.tsx
│  │  └─ ReturnModal.tsx
│  ├─ utils/
│  │  └─ format.ts
│  └─ assets/
└─ public/
```

---

## Dependencies (suggested)
- react, react-dom
- typescript, @types/react, @types/react-dom
- vite, vite-plugin-react
- tailwindcss, postcss, autoprefixer
- @tanstack/react-query
- axios
- react-router-dom
- clsx (optional for conditional classes)
- dayjs (date formatting)
- vitest, @testing-library/react, msw (for tests)

---

## Implementation Tasks (detailed)

1) Bootstrap project
- `npm create vite@latest frontend -- --template react-ts`
- Initialize git in `frontend/` if needed

2) Install dependencies

3) Tailwind setup
- `npx tailwindcss init -p`
- Configure `tailwind.config.ts` to extend default palette with constitutional colors (Constitution Principle VII: Slate-900 #0F172A, Slate-800 #1E293B, Slate-400 #94A3B8, Blue-500 #3B82F6)
- Import `@tailwind base; @tailwind components; @tailwind utilities;` in `index.css`
- Apply dark theme base styles (bg-slate-900, text-slate-400) in `index.css`

4) Axios API client (`src/api/axios.ts`)
- Create instance with baseURL `import.meta.env.VITE_API_BASE_URL || '/api/v1'`
- Request interceptor: set `Content-Type: application/json`
- Response interceptor: map error shape to `error` object

5) React Query setup
- Wrap `App` in `QueryClientProvider` in `main.tsx`
- Create hooks:
  - `useItems(params)` → `GET /items`
  - `useItem(itemId)` → `GET /items/{itemId}`
  - `useLendItem()` → `POST /items/{itemId}/lend`
  - `useReturnItem()` → `POST /items/{itemId}/return`
  - `useUsers()` → `GET /users`

6) Routing (`App.tsx`)
- Routes:
  - `/` → `Dashboard` (summary + items out)
  - `/inventory` → `Inventory` (table with search)
  - `/inventory/:itemId` → `ItemDetail` (history table)

7) Pages & Components
- `Dashboard`: show summary cards (total items, available, lent, maintenance), and `Currently Out` list
- `Inventory`: search bar, `ItemTable` component with rows and Action buttons (Lend/Return/View)
- `ItemDetail`: item info and `LendingLog` history
- `LendModal` and `ReturnModal`: forms to perform lend/return – use React Query mutations

8) Mutations & Cache Management
- On successful lend/return:
  - Invalidate `['items']` and `['item', itemId]` and `['dashboard']`
  - Optionally use optimistic updates for immediate UI feedback

9) UX details
- Loading and empty states
- Accessible modals and forms
- Confirmation dialogs for destructive actions

10) Testing
- Write unit tests for hooks and components
- Use msw to mock API responses in integration tests

11) Documentation
- `frontend/README.md` with setup and run commands
- Add env var guidance: `VITE_API_BASE_URL`

---

## Example Files (snippets)

- `tailwind.config.ts` (Constitutional Color Palette - Principle VII)

```ts
import type { Config } from 'tailwindcss';

export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        // Constitutional color palette (Principle VII)
        slate: {
          900: '#0F172A', // Main app background (deep grey-blue)
          800: '#1E293B', // Backgrounds, sidebars, elevated surfaces
          500: '#64748B', // Secondary text, disabled states
          400: '#94A3B8', // Body text, labels, secondary borders
        },
        blue: {
          500: '#3B82F6', // Primary actions, links, interactive elements
        },
        green: {
          500: '#10B981', // Success states, Available status
        },
        amber: {
          500: '#F59E0B', // Warning states, Maintenance status
        },
        red: {
          500: '#EF4444', // Error states, destructive actions
        },
      },
    },
  },
  plugins: [],
} satisfies Config;
```

- `src/index.css` (Dark Theme Base Styles)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  body {
    @apply bg-slate-900 text-slate-400;
    font-family: 'Inter', system-ui, -apple-system, sans-serif;
  }

  /* Glassmorphism card utility (Constitutional Principle VII) */
  .glass-card {
    @apply bg-white/5 border border-white/10 backdrop-blur-sm;
  }

  /* Status badge utilities (muted for dark theme) */
  .badge-success {
    @apply bg-green-500/20 text-green-400 border border-green-500/30;
  }

  .badge-warning {
    @apply bg-amber-500/20 text-amber-400 border border-amber-500/30;
  }

  .badge-error {
    @apply bg-red-500/20 text-red-400 border border-red-500/30;
  }
}
```

- `src/api/axios.ts` (TypeScript)

```ts
import axios from 'axios';

const api = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api/v1',
  headers: { 'Content-Type': 'application/json' },
  timeout: 15000,
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.data) {
      return Promise.reject(error.response.data);
    }
    return Promise.reject(error);
  }
);

export default api;
```

- `src/main.tsx` (wrap QueryClientProvider)

```tsx
import React from 'react';
import ReactDOM from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import App from './App';
import './index.css';

const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);
```

- `src/hooks/useItems.ts` (example)

```ts
import { useQuery } from '@tanstack/react-query';
import api from '../api/axios';

export function useItems(params = {}) {
  return useQuery(['items', params], () => api.get('/items', { params }).then(r => r.data));
}
```

---

## Time Estimates (single developer)
- Project bootstrap & config: 1 day
- Core pages and API integration: 2-3 days
- Lend/return flows and transactions: 1-2 days
- Testing and polish: 1-2 days

---

## Next Actions
- I can scaffold the `frontend/` project with Vite, install the dependencies, and add the starter files (`main.tsx`, `App.tsx`, `api/axios.ts`, `hooks`), or just provide code snippets. Which would you prefer?

---

Document Version: 1.1.0
Last Updated: 2026-01-18 (Added constitutional color palette configuration per Principle VII)
