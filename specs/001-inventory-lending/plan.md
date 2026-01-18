# Implementation Plan: Inventory Management with Lending Workflow

**Branch**: `001-inventory-lending` | **Date**: 2026-01-17 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/001-inventory-lending/spec.md`

## Summary

Web-based inventory management system with lending workflow. Enables staff to manage physical items (CRUD operations), lend items to users with atomic transaction integrity, track lending history, and view dashboard status. Built with RESTful API backend and React SPA frontend following modular architecture principles.

## Technical Context

**Language/Version**: 
- Backend: Node.js 18+ with Express 4.x
- Frontend: JavaScript/TypeScript (ES2020+) with React 18+

**Primary Dependencies**: 
- Backend: Express, Sequelize 6.x (ORM), sqlite3, cors, dotenv
- Frontend: React 18+, Vite 5.x (build tool), TanStack Query (React Query v5), Axios, react-router-dom v6, Tailwind CSS

**Storage**: SQLite 3.x with foreign key constraints enabled (`PRAGMA foreign_keys = ON`)

**Testing**: 
- Backend: Jest + Supertest (API integration tests)
- Frontend: Vitest + React Testing Library + MSW (Mock Service Worker)
- Performance: k6 or custom scripts for load testing dashboard/search endpoints

**Target Platform**: Cross-platform web application (Chrome, Firefox, Safari, Edge latest versions); development on Windows/macOS/Linux

**Project Type**: Web application (separate `backend/` and `frontend/` directories)

**Performance Goals**: 
- Dashboard load: <2 seconds (SC-004)
- Search response: <1 second (SC-005)
- Lend/return operations: <30-45 seconds end-to-end user flow (SC-002, SC-003)

**Constraints**: 
- Atomic transactions required for all lend/return operations (constitution non-negotiable)
- API must use versioned endpoints (`/api/v1/`) and consistent response envelope
- Foreign key constraints mandatory for referential integrity
- Audit trail preservation via denormalized borrower data in LendingLog

**Scale/Scope**: 
- Small-to-medium deployment: ~500 items, ~50 users, ~1000 lending transactions per year
- Single-tenant application (no multi-tenancy)
- 5 user stories, ~35 UI components, ~170 implementation tasks

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

✅ **Principle I (RESTful API Design)**: Aligned. Spec now mandates `/api/v1/` versioning (FR-001-API) and `{ data, error, message }` response envelope (FR-002-API).

✅ **Principle II (Modular Architecture)**: Aligned. Project structure uses separate routes → controllers → services → models layers per constitution.

✅ **Principle III (Atomic Transaction Integrity)**: Aligned. FR-031 mandates explicit transactions for lend/return operations; tasks T060/T061, T083/T084 implement transaction boundaries in service layer.

✅ **Principle IV (Data Integrity & Constraints)**: Aligned. Tasks T011/T033 enable `PRAGMA foreign_keys = ON`; FR-033 mandates foreign key constraints; FR-034 enforces RESTRICT on deletions with audit history.

✅ **Principle V (Clean Code & Async Operations)**: Aligned. All Node.js code uses async/await; ESLint configured (T006); functions follow single-responsibility principle.

✅ **Principle VI (Component-Based UI)**: Aligned. Frontend uses React functional components with hooks exclusively (no class components); custom hooks for reusable logic.

**Complexity Justification**: None required. Architecture follows constitution without deviations.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
backend/
├── src/
│   ├── models/         # Sequelize models (Item, User, LendingLog)
│   ├── services/       # Business logic & transactions
│   ├── controllers/    # Request handlers & response formatting
│   ├── routes/         # Express route definitions
│   ├── middleware/     # Auth, validation, error handling
│   ├── config/         # Database config, environment vars
│   ├── db/
│   │   ├── migrations/ # Database schema versioning
│   │   └── init.js     # Database initialization
│   ├── scripts/        # Utility scripts
│   ├── app.js          # Express app setup
│   └── server.js       # Application entry point
└── tests/
    ├── integration/    # API endpoint tests
    └── unit/           # Service/model unit tests

frontend/
├── src/
│   ├── components/     # Reusable UI components
│   ├── pages/          # Route-level page components
│   ├── services/       # API client services (Axios)
│   ├── hooks/          # Custom React hooks (TanStack Query)
│   ├── styles/         # Global CSS, Tailwind config
│   ├── App.jsx         # React Router setup
│   └── main.jsx        # Application entry point
└── tests/
    └── unit/           # Component tests (Vitest + RTL)
```

**Structure Decision**: Web application architecture with separated backend/frontend directories. Backend follows modular Express pattern (routes → controllers → services → models) per Constitution Principle II. Frontend uses component-based React architecture per Constitution Principle VI.

## Complexity Tracking

> No constitution violations requiring justification. Architecture adheres to all principles without added complexity.
