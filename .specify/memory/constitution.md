<!--

SYNC IMPACT REPORT - Constitution Update


VERSION CHANGE: 1.0.0 → 1.1.0
RATIONALE: MINOR version increment - Added new principle (VII. UI/UX Design Standards) establishing visual design guidelines and color palette for frontend implementation

ADDED SECTIONS:
- VII. UI/UX Design Standards (NEW in v1.1.0)
  - Color Palette (primary, neutral, background colors)
  - Design Style (glassmorphism, high-contrast dashboard)
  - Visual Feedback Standards (status badges, dark theme)

MODIFIED PRINCIPLES:
- None (existing principles I-VI unchanged)

TEMPLATES STATUS:
✅ plan-template.md - Aligns (constitution check gates present)
✅ spec-template.md - Aligns (requirements structure compatible)
⚠️  frontend-plan.md - REQUIRES UPDATE: Add Tailwind color configuration matching Principle VII palette
⚠️  frontend-tasks.md - REQUIRES UPDATE: Add task for implementing glassmorphism card styles

FOLLOW-UP TODOS:
- Update frontend-plan.md to include Tailwind config with constitutional color palette
- Add frontend task for implementing glassmorphism card component styles
- Update frontend-tasks.md to include status badge color standards (muted green/yellow for dark theme)

RATIFICATION DATE: 2026-01-17 (initial adoption)
LAST AMENDED: 2026-01-18 (UI/UX standards added)


-->

# Inventory & Lending Application Constitution

## Core Principles

### I. RESTful API Design

All backend endpoints MUST follow RESTful principles:
- Resources identified by nouns in URLs (e.g., /api/items, /api/loans)
- HTTP verbs map to CRUD operations: GET (read), POST (create), PUT/PATCH (update), DELETE (remove)
- Status codes MUST be semantically correct (200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Server Error)
- API versioning via URL path (e.g., /api/v1/...) for backward compatibility
- Response format MUST be consistent JSON structure with { data, error, message } pattern

**Rationale**: RESTful design ensures predictable, maintainable, and industry-standard API contracts that frontend and third-party consumers can rely on.

### II. Modular Architecture

Code organization MUST follow separation of concerns with distinct layers:
- **Routes**: Endpoint definitions and request/response mapping only
- **Controllers**: Request validation, orchestration, and response formatting
- **Services**: Business logic, data transformation, and transaction management
- **Models**: Data schemas, validation rules, and database interactions

Each module MUST:
- Have a single, clear responsibility
- Be independently testable
- Minimize coupling with other modules
- Export well-defined interfaces

**Rationale**: Modular architecture enables parallel development, easier testing, and better maintainability. Clear boundaries prevent spaghetti code and make the system easier to reason about.

### III. Atomic Transaction Integrity (NON-NEGOTIABLE)

All lending operations MUST be executed within database transactions:
- Creating a loan record MUST atomically update item availability status
- Returning items MUST atomically update both loan status and item availability
- Failed transactions MUST rollback completely—no partial state changes permitted
- Transaction boundaries MUST be explicit in service layer code

**Rationale**: Lending operations involve multiple related state changes. Atomic transactions prevent data corruption, inventory discrepancies, and business logic violations that could result from partial updates.

### IV. Data Integrity & Constraints

SQLite foreign key constraints MUST be enabled at application startup:
- Execute `PRAGMA foreign_keys = ON` immediately after database connection
- All relationships (itemscategories, loansitems, loansusers) MUST use foreign keys
- Cascading deletes MUST be explicitly defined where appropriate
- Database schema MUST enforce NOT NULL, UNIQUE, and CHECK constraints where business rules require

**Rationale**: Database-level constraints provide the last line of defense against data corruption. They enforce relationships and business rules even if application code has bugs.

### V. Clean Code & Async Operations

All Node.js database operations MUST use async/await (no callbacks):
- Every database query MUST be awaited with proper error handling
- Use try/catch blocks around database operations
- Avoid callback hell—promise-based code only
- Functions performing I/O MUST be declared `async`

Clean code principles MUST be followed:
- Descriptive variable and function names
- Functions limited to single responsibility ( 50 lines recommended)
- No magic numbers—use named constants
- Comments explain "why," not "what"

**Rationale**: Async/await improves readability and error handling. Clean code principles reduce cognitive load and make the codebase approachable for new developers.

### VI. Component-Based UI Development

React frontend MUST use Functional Components with Hooks:
- No class components—functional components only
- State management via `useState`, `useReducer` for complex state
- Side effects via `useEffect` with proper dependency arrays
- Custom hooks for reusable stateful logic
- Component composition over inheritance

**Rationale**: Functional components with hooks are the modern React standard, offering better code reuse, simpler testing, and improved performance optimization opportunities.

### VII. UI/UX Design Standards

All frontend interfaces MUST follow a consistent, professional design system:

**Color Palette**:
- **Primary (Dark Blue)**: 
  - `#1E293B` (Slate-800) for backgrounds, sidebars, and navigation elements
  - `#3B82F6` (Blue-500) for primary action buttons, links, and interactive elements
- **Neutral (Grey)**: 
  - `#94A3B8` (Slate-400) for body text, labels, and secondary borders
  - `#64748B` (Slate-500) for secondary text and disabled states
- **Background**: 
  - `#0F172A` (Slate-900) for the main application background (deep grey-blue)
  - `#1E293B` (Slate-800) for elevated surfaces and panels
- **Status Colors** (muted for dark theme compatibility):
  - Success: `#10B981` (Green-500) with reduced opacity for badges
  - Warning: `#F59E0B` (Amber-500) with reduced opacity for badges
  - Error: `#EF4444` (Red-500) for destructive actions and alerts

**Design Style**:
- **Professional Dashboard Aesthetic**: High-contrast, clean layouts optimized for data visualization and task completion
- **Glassmorphism**: Cards and elevated surfaces MUST use subtle transparency (`bg-white/5` or `bg-slate-800/50`) with semi-transparent borders (`border-white/10`) to create depth while maintaining readability
- **Spacing & Layout**: Consistent padding (Tailwind scale: `p-4`, `p-6`, `p-8`) and gaps (`gap-4`, `gap-6`) for visual rhythm
- **Typography**: Clear hierarchy with font weights (400 for body, 500 for emphasis, 600-700 for headings)

**Visual Feedback**:
- **Status Badges**: MUST remain visually distinct (Green for Available/Success, Yellow for Maintenance/Warning, Red for Errors) but use muted opacity (`bg-green-500/20 text-green-400`) to harmonize with dark theme
- **Interactive States**: 
  - Hover: Increase opacity or add subtle `ring-2 ring-blue-500/50`
  - Focus: Clear focus rings (`focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 focus:ring-offset-slate-900`)
  - Disabled: Reduce opacity to 40% and change cursor to `cursor-not-allowed`
- **Loading States**: Skeleton screens or spinners using primary color with animation
- **Empty States**: Friendly illustrations or icons with helpful messaging

**Accessibility Requirements**:
- Minimum contrast ratio of 4.5:1 for normal text, 3:1 for large text (WCAG AA)
- All interactive elements MUST be keyboard accessible
- ARIA labels required for icon-only buttons and complex widgets
- Focus indicators MUST be clearly visible on all interactive elements

**Rationale**: A unified design system ensures visual consistency, improves usability, reduces decision fatigue for developers, and creates a professional user experience. The dark theme with glassmorphism provides a modern aesthetic while reducing eye strain during extended use. Muted status colors maintain semantic meaning without overwhelming the interface.

## Technology Stack Requirements

**Frontend**:
- ReactJS (latest stable version)
- Functional components with React Hooks exclusively
- Component libraries (e.g., Material-UI, Ant Design) are permitted but MUST be consistent across the app

**Backend**:
- Node.js with Express framework
- Modular structure: separate `routes/`, `controllers/`, `services/`, `models/` directories
- Middleware for authentication, validation, error handling

**Database**:
- SQLite for development and small-to-medium deployments
- Foreign key constraints MUST be enabled programmatically on startup
- Migrations tool (e.g., Knex.js, Sequelize, or raw SQL migration scripts) MUST be used for schema versioning

**Testing** (if required):
- Jest for both frontend and backend unit tests
- Supertest or similar for backend API integration tests
- React Testing Library for component tests

## Development Workflow

**Code Review Requirements**:
- All code changes MUST go through pull request review
- At least one approval required before merge
- Automated checks (linting, tests) MUST pass

**Quality Gates**:
- Linting with ESLint (Airbnb or Standard config)
- Formatting with Prettier (enforced via pre-commit hooks)
- Test coverage targets (if testing is adopted):  70% for critical paths

**Version Control**:
- Feature branch workflow: `main` branch is stable
- Branch naming: `feature/###-description`, `bugfix/###-description`
- Commit messages MUST be descriptive (follow Conventional Commits if possible)

**Deployment**:
- Environment variables MUST be used for all configuration (database path, API keys, port numbers)
- Never commit secrets or credentials to version control
- README.md MUST document setup steps, environment variables, and how to run the application

## Governance

This constitution supersedes all other development practices and guidelines. Any deviation from these principles MUST be justified in writing and approved by project stakeholders.

**Amendment Process**:
- Proposals for amendments MUST be documented with rationale
- Amendments require consensus from the development team
- Version number MUST be incremented per semantic versioning rules
- All affected documentation and templates MUST be updated to reflect amendments

**Compliance Verification**:
- All feature specifications MUST include a "Constitution Check" section referencing relevant principles
- Code reviews MUST verify adherence to modular architecture and coding standards
- Database migrations MUST be reviewed for proper constraint enforcement
- Transaction boundaries in service code MUST be explicitly reviewed

**Versioning Policy**:
- **MAJOR**: Breaking changes to architecture principles or removal of non-negotiable rules
- **MINOR**: Addition of new principles or significant expansion of existing guidance
- **PATCH**: Clarifications, wording improvements, or non-semantic refinements

**Version**: 1.1.0 | **Ratified**: 2026-01-17 | **Last Amended**: 2026-01-18
