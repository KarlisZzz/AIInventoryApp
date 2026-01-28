# React + TypeScript + Vite

This template provides a minimal setup to get React working in Vite with HMR and some ESLint rules.

Currently, two official plugins are available:


## React Compiler

The React Compiler is enabled on this template. See [this documentation](https://react.dev/learn/react-compiler) for more information.

Note: This will impact Vite dev & build performances.

## Expanding the ESLint configuration

If you are developing a production application, we recommend updating the configuration to enable type-aware lint rules:

```js
export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...

      // Remove tseslint.configs.recommended and replace with this
      tseslint.configs.recommendedTypeChecked,
      // Alternatively, use this for stricter rules
      tseslint.configs.strictTypeChecked,
      // Optionally, add this for stylistic rules
      tseslint.configs.stylisticTypeChecked,

      // Other configs...
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

You can also install [eslint-plugin-react-x](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-x) and [eslint-plugin-react-dom](https://github.com/Rel1cx/eslint-react/tree/main/packages/plugins/eslint-plugin-react-dom) for React-specific lint rules:

```js
// eslint.config.js
import reactX from 'eslint-plugin-react-x'
import reactDom from 'eslint-plugin-react-dom'

export default defineConfig([
  globalIgnores(['dist']),
  {
    files: ['**/*.{ts,tsx}'],
    extends: [
      // Other configs...
      // Enable lint rules for React
      reactX.configs['recommended-typescript'],
      // Enable lint rules for React DOM
      reactDom.configs.recommended,
    ],
    languageOptions: {
      parserOptions: {
        project: ['./tsconfig.node.json', './tsconfig.app.json'],
        tsconfigRootDir: import.meta.dirname,
      },
      // other options...
    },
  },
])
```

## Run instructions

Quick start (from repository root):

```powershell
cd frontend
npm install
npm run dev
```

Build for production:

```powershell
cd frontend
npm run build
npm run preview
```

Environment:

- The frontend reads `VITE_API_BASE_URL` (defaults to `/api/v1`). Set it in `.env` if the backend runs on a different host/port.

Example `.env`:

```
VITE_API_BASE_URL=http://localhost:3001/api/v1
```

Notes:

- The dev server runs on `http://localhost:5173` by default.
- Tailwind is configured in `tailwind.config.ts` and PostCSS via `postcss.config.js`.

---

## Admin Management Section

The frontend provides a comprehensive admin interface for system administrators to manage categories, users, and view system analytics.

### Admin Routes

Access the admin section at `/admin` (requires administrator role):

- `/admin` - Admin Dashboard (system statistics and recent actions)
- `/admin/categories` - Category Management (create, edit, delete categories)
- `/admin/users` - User Management (create, edit, deactivate user accounts)

### Features

#### Dashboard (`/admin`)
- System statistics cards (total users, categories, administrators)
- Recent admin actions timeline (last 10 actions)
- Quick action links to category and user management

#### Category Management (`/admin/categories`)
- View all categories with item counts
- Create new categories with real-time validation
- Edit category names inline
- Delete categories (with item count protection)
- Empty state guidance for new systems

#### User Management (`/admin/users`)
- View all users with role and status badges
- Filter users by role (all, administrator, standard user)
- Create new user accounts (auto-generates temporary password)
- Edit user details (name, email, role)
- Deactivate user accounts (with safety checks)
- Self-deletion prevention
- Last admin protection

### Components

Reusable admin components located in `src/components/admin/`:

- `AdminCard.tsx` - Glassmorphism card container with optional actions
- `ConfirmDialog.tsx` - Confirmation dialog with focus management
- `ErrorBoundary.tsx` - React error boundary for graceful error handling
- `SkeletonLoader.tsx` - Loading skeleton components for better UX

### Accessibility

Admin pages include:
- ARIA labels for all icon buttons and interactive elements
- Keyboard navigation support for tables and modals
- Focus management in dialogs (focuses cancel button for destructive actions)
- Role attributes on table elements for screen readers
- Escape key handling to close dialogs

### Testing

Run frontend component tests:

```powershell
cd frontend
npm test

# Run specific test file
npm test CategoryManagement.test.tsx
```

Test files are located in `src/test/pages/`:
- `CategoryManagement.test.tsx` - Category CRUD operations
- `UserManagement.test.tsx` - User CRUD operations with safety checks

### State Management

Admin pages use:
- React Query for data fetching and caching (dashboard)
- Local state for form management
- Optimistic updates for better UX
- Auto-refresh for dashboard (every 30 seconds)

### Implementation Details

See [specs/004-admin-management/quickstart.md](../specs/004-admin-management/quickstart.md) for complete implementation guide including:
- TypeScript type definitions
- API client functions
- Page component structure
- Routing configuration
