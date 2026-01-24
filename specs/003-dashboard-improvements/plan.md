# Implementation Plan: Dashboard Improvements

**Branch**: `003-dashboard-improvements` | **Date**: January 24, 2026 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/003-dashboard-improvements/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enhance the dashboard by adding visual analytics (pie charts for item statuses, categories, and top borrower), implementing a carousel view for items currently out with accurate borrower/date data, adding navigation from summary cards to detailed views, and removing the redundant full inventory list. This creates a focused, data-driven dashboard that provides at-a-glance insights while reducing information overload.

## Technical Context

**Language/Version**: 
- Frontend: TypeScript 5.9.3, React 19.2.0
- Backend: Node.js (CommonJS), Express 5.2.1

**Primary Dependencies**: 
- Frontend: React Router 7.12.0, Tailwind CSS 4.1.18, TanStack React Query 5.90.19, Vite (Rolldown) 7.2.5, Axios 1.13.2, Day.js 1.11.19
- Backend: Express 5.2.1, Sequelize 6.37.7, SQLite3 5.1.7, CORS 2.8.5

**Storage**: SQLite database with Sequelize ORM, foreign key constraints enabled

**Testing**: 
- Frontend: Vitest 4.0.17, React Testing Library 16.3.1, MSW 2.12.7
- Backend: Jest 30.2.0, Supertest 7.2.2

**Target Platform**: Web application (Browser - modern Chrome, Firefox, Safari, Edge)

**Project Type**: Web application (frontend + backend)

**Performance Goals**: 
- Dashboard load time <3 seconds with 100+ items
- Chart rendering <2 seconds
- Carousel navigation <1 second per transition
- API response time <200ms for dashboard data

**Constraints**: 
- Must use existing database schema (items, loans tables)
- Must follow constitutional color palette and glassmorphism design
- Must maintain backward compatibility with existing API endpoints
- Charts must be responsive and accessible

**Scale/Scope**: 
- Single page dashboard enhancement
- 3 new chart components + 1 carousel component
- 1 new API endpoint for dashboard analytics
- Expected to handle 100-1000 items efficiently

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### Principle I: RESTful API Design ✅
- New dashboard analytics endpoint will follow REST principles
- GET /api/dashboard/analytics for aggregated statistics
- Proper status codes and JSON response structure
- **Status**: COMPLIANT

### Principle II: Modular Architecture ✅
- Frontend: New components in components/ directory (PieChart, Carousel, DashboardAnalytics)
- Backend: New service layer method for analytics aggregation
- Clear separation between presentation and business logic
- **Status**: COMPLIANT

### Principle III: Atomic Transaction Integrity ✅
- Feature is read-only dashboard display, no transaction requirements
- **Status**: NOT APPLICABLE (read operations only)

### Principle IV: Data Integrity & Constraints ✅
- Uses existing database schema with foreign keys already enabled
- No new schema changes required
- **Status**: COMPLIANT

### Principle V: Clean Code & Async Operations ✅
- All database queries will use async/await
- React components will use hooks (useState, useEffect)
- Service layer will handle async data fetching
- **Status**: COMPLIANT

### Principle VI: Component-Based UI Development ✅
- All new UI components will be functional React components
- State management via useState and custom hooks
- Proper component composition
- **Status**: COMPLIANT

### Principle VII: UI/UX Design Standards ✅
- Will use constitutional color palette (Slate-800, Blue-500, etc.)
- Glassmorphism cards with bg-white/5 and border-white/10
- Status colors with muted opacity (bg-green-500/20 text-green-400)
- Proper spacing with Tailwind scale (p-4, p-6, gap-4)
- **Status**: COMPLIANT

**GATE VERDICT: ✅ PASS** - All applicable constitutional principles are satisfied. No violations to justify.

### Post-Design Re-evaluation (After Phase 1)

After completing research.md, data-model.md, contracts/, and quickstart.md:

**Principle I: RESTful API Design** ✅ CONFIRMED
- Designed endpoint: `GET /api/dashboard/analytics`
- Returns structured JSON with clear semantics
- Proper HTTP status codes (200, 500)
- OpenAPI 3.0 contract documented
- **Status**: COMPLIANT

**Principle II: Modular Architecture** ✅ CONFIRMED
- Backend: Service layer handles all business logic (dashboardService.getAnalytics())
- Controller only handles request/response (thin controller)
- Frontend: Separated PieChart, ItemCarousel, DashboardAnalytics components
- Custom hook (useCarousel) encapsulates carousel logic
- **Status**: COMPLIANT

**Principle III: Atomic Transaction Integrity** ✅ CONFIRMED
- No write operations in this feature (read-only analytics)
- **Status**: NOT APPLICABLE

**Principle IV: Data Integrity & Constraints** ✅ CONFIRMED
- Leverages existing foreign key relationships
- Queries use proper joins (Item ← Loan)
- No schema modifications
- **Status**: COMPLIANT

**Principle V: Clean Code & Async Operations** ✅ CONFIRMED
- All Sequelize queries use async/await pattern
- React components use hooks (useState, useEffect, custom hooks)
- Error handling with try/catch blocks
- Service methods declared async
- **Status**: COMPLIANT

**Principle VI: Component-Based UI Development** ✅ CONFIRMED
- All components functional (PieChart, ItemCarousel, DashboardAnalytics)
- State via useState and custom useCarousel hook
- Component composition: DashboardAnalytics contains PieChart instances
- No class components
- **Status**: COMPLIANT

**Principle VII: UI/UX Design Standards** ✅ CONFIRMED
- Research.md specifies constitutional color palette usage
- Glassmorphism: bg-white/5 border-white/10 backdrop-blur-sm
- Status colors with muted opacity (e.g., bg-green-500/20 text-green-400)
- Proper contrast ratios (WCAG AA compliance documented)
- Accessibility: ARIA labels, keyboard navigation, focus indicators
- **Status**: COMPLIANT

**FINAL GATE VERDICT: ✅ PASS** - Design phase confirms full constitutional compliance. Ready for task breakdown (Phase 2).

## Project Structure

### Documentation (this feature)

```text
specs/003-dashboard-improvements/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (chart library evaluation, carousel patterns)
├── data-model.md        # Phase 1 output (dashboard analytics data structure)
├── quickstart.md        # Phase 1 output (developer setup guide)
├── contracts/           # Phase 1 output (API contracts for dashboard analytics)
│   └── dashboard-analytics-api.yaml
├── checklists/
│   └── requirements.md  # Spec validation checklist (COMPLETED)
└── spec.md              # Feature specification (COMPLETED)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── controllers/
│   │   └── dashboardController.js    # Dashboard analytics endpoints
│   ├── services/
│   │   └── dashboardService.js       # Analytics aggregation logic (UPDATE)
│   ├── routes/
│   │   └── dashboard.js              # Dashboard routes (UPDATE if needed)
│   └── models/                       # Existing Item and Loan models
└── tests/
    └── dashboard-analytics.test.js   # New tests for analytics endpoint

frontend/
├── src/
│   ├── components/
│   │   ├── DashboardAnalytics.tsx    # NEW: Pie charts container component
│   │   ├── PieChart.tsx              # NEW: Reusable pie chart component
│   │   ├── ItemCarousel.tsx          # NEW: Carousel for items currently out
│   │   └── CurrentlyOutSection.tsx   # UPDATE: Use carousel instead of list
│   ├── pages/
│   │   └── DashboardPage.tsx         # UPDATE: Add analytics, remove all items list
│   ├── services/
│   │   └── dashboardService.ts       # UPDATE: Add analytics API call
│   └── hooks/
│       └── useCarousel.ts            # NEW: Custom hook for carousel logic
└── tests/
    └── components/
        ├── DashboardAnalytics.test.tsx
        ├── PieChart.test.tsx
        └── ItemCarousel.test.tsx
```

**Structure Decision**: Web application structure (Option 2) with existing backend/ and frontend/ directories. This feature primarily updates the frontend dashboard page and adds one new backend endpoint for analytics aggregation. Most work is in the React components layer with minimal backend changes.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

**No violations detected.** All constitutional principles are satisfied by this feature implementation.
