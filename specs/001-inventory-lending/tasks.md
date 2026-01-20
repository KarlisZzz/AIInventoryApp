# Tasks: Inventory Management with Lending Workflow

**Input**: Design documents from `/specs/001-inventory-lending/`
**Prerequisites**: spec.md (required)

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

## Path Conventions

- **Web app structure**: `backend/src/` and `frontend/src/`
- Backend folders: `routes/`, `controllers/`, `services/`, `models/`
- Frontend folders: `components/`, `pages/`, `services/`, `hooks/`

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [X] T001 Create project root directory structure with backend/ and frontend/ folders
- [X] T002 Initialize Node.js backend project with package.json in backend/
- [X] T003 [P] Initialize React frontend project with package.json in frontend/
- [X] T004 [P] Install backend dependencies: express, sqlite3, cors, dotenv in backend/package.json
- [X] T005 [P] Install frontend dependencies: react, react-router-dom, axios in frontend/package.json
- [X] T006 [P] Configure ESLint for backend in backend/.eslintrc.json
- [X] T007 [P] Configure ESLint and Prettier for frontend in frontend/.eslintrc.json and frontend/.prettierrc
- [X] T008 Create .gitignore files for backend/ and frontend/ (exclude node_modules, .env, *.db)
- [X] T009 Create README.md with setup instructions, environment variables, and run commands

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

### Database Infrastructure

- [X] T010 Create database initialization script in backend/src/db/init.js
- [X] T011 Enable foreign key constraints (PRAGMA foreign_keys = ON) in backend/src/db/init.js
- [X] T012 Create database migration for Items table in backend/src/db/migrations/001_create_items.sql
- [X] T013 Create database migration for Users table in backend/src/db/migrations/002_create_users.sql
- [X] T014 Create database migration for LendingLogs table in backend/src/db/migrations/003_create_lending_logs.sql (include denormalized BorrowerName and BorrowerEmail fields for audit preservation per FR-016)
- [X] T015 Create database connection manager in backend/src/db/connection.js (handles async connections)
- [X] T016 Create migration runner script in backend/src/db/migrate.js

### API Standards & Versioning (Constitution Compliance)

- [X] T016a Create API versioning middleware in backend/src/middleware/apiVersion.js (enforce /api/v1/ prefix per FR-001-API)
- [X] T016b Create response envelope middleware in backend/src/middleware/responseEnvelope.js (wrap all responses in { data, error, message } format per FR-002-API)
- [X] T016c Register versioning and envelope middleware in backend/src/app.js (apply globally to all routes)

### Backend API Infrastructure

- [X] T017 [P] Create Express app setup in backend/src/app.js (CORS, JSON parsing, error handling)
- [X] T018 [P] Create environment configuration loader in backend/src/config/env.js
- [X] T019 [P] Create global error handler middleware in backend/src/middleware/errorHandler.js
- [X] T020 [P] Create request logger middleware in backend/src/middleware/logger.js
- [X] T021 [P] Create input validation middleware in backend/src/middleware/validator.js
- [X] T022 Create server entry point in backend/src/server.js (starts Express on configured port)
- [X] T023 Create .env.example file documenting required environment variables (PORT, DB_PATH)

### Frontend Infrastructure

- [X] T024 [P] Create React app structure in frontend/src/App.jsx
- [X] T025 [P] Configure React Router in frontend/src/App.jsx for navigation
- [X] T026 [P] Create API client service in frontend/src/services/api.js (axios base configuration with /api/v1/ prefix and envelope unwrapping per FR-001-API/FR-002-API)
- [X] T027 [P] Create global error boundary component in frontend/src/components/ErrorBoundary.jsx
- [X] T028 [P] Create loading spinner component in frontend/src/components/Loading.jsx
- [X] T029 [P] Create global styles in frontend/src/styles/global.css with dark theme base styles (Constitution Principle VII)
- [X] T029a [P] Apply Dark Blue/Grey theme to Layout wrapper and Global CSS using brand colors defined in Constitution (bg: #0F172A, primary: #3B82F6, neutral: #94A3B8, glassmorphism: bg-white/5 border-white/10)
- [X] T029b [P] Configure Tailwind theme in tailwind.config.ts to extend default palette with constitutional colors (slate-900: #0F172A, slate-800: #1E293B, slate-400: #94A3B8, blue-500: #3B82F6)

### Verification Checkpoint

- [X] T030 **VERIFY**: Run database migrations successfully and confirm all tables created
- [X] T031 **VERIFY**: Start backend server and confirm it listens on configured port without errors
- [X] T032 **VERIFY**: Start frontend dev server and confirm React app loads in browser
- [X] T033 **VERIFY**: Confirm foreign key constraints are enabled (query PRAGMA foreign_keys)
- [X] T033a **VERIFY**: Test any API endpoint and confirm response uses { data, error, message } envelope (FR-002-API)
- [X] T033b **VERIFY**: Test API routes use /api/v1/ prefix (FR-001-API)

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Manage Inventory Items (Priority: P1) 🎯 MVP

**Goal**: Implement full CRUD operations for inventory items

**Independent Test**: Create, view, edit, delete items through UI; verify database persistence; test search/filter functionality

### Backend - User Story 1

- [X] T034 [P] [US1] Create Item model class in backend/src/models/Item.js with CRUD methods
- [X] T035 [P] [US1] Create ItemService in backend/src/services/itemService.js (business logic, validation)
- [X] T036 [US1] Create ItemController in backend/src/controllers/itemController.js (create, getAll, getById, update, delete)
- [X] T037 [US1] Create item routes in backend/src/routes/items.js (POST /, GET /, GET /:id, PUT /:id, DELETE /:id) with /api/v1/items prefix
- [X] T038 [US1] Add input validation for item creation (Name required, Category required, Status enum) in itemController
- [X] T039 [US1] Add validation to prevent deleting items with status "Lent" OR with any LendingLog history in itemService.js (check LendingLog count before delete per FR-008/FR-009)
- [X] T040 [US1] Implement search/filter logic in itemService.js (query by Name, Description, Category)
- [X] T041 [US1] Register item routes in backend/src/app.js

### Frontend - User Story 1

- [X] T042 [P] [US1] Create item API service in frontend/src/services/itemService.js (CRUD API calls)
- [X] T043 [P] [US1] Create ItemForm component in frontend/src/components/ItemForm.jsx (create/edit form)
- [X] T044 [P] [US1] Create ItemList component in frontend/src/components/ItemList.jsx (table view with sorting)
- [X] T045 [P] [US1] Create ItemCard component in frontend/src/components/ItemCard.jsx (individual item display)
- [X] T046 [P] [US1] Create SearchBar component in frontend/src/components/SearchBar.jsx (filter input)
- [X] T047 [US1] Create InventoryPage in frontend/src/pages/InventoryPage.jsx (main page integrating all components)
- [X] T048 [US1] Add form validation in ItemForm.jsx (required fields, max lengths)
- [X] T049 [US1] Implement delete confirmation dialog in ItemCard.jsx
- [X] T050 [US1] Add real-time search filtering in InventoryPage.jsx
- [X] T051 [US1] Add route for /inventory in frontend/src/App.jsx

### Verification Checkpoint - User Story 1

- [X] T052 [US1] **VERIFY**: Create a new item via UI and confirm it appears in the item list
- [X] T053 [US1] **VERIFY**: Edit an item and confirm changes persist after page refresh
- [X] T054 [US1] **VERIFY**: Delete an Available item and confirm it's removed from database
- [X] T055 [US1] **VERIFY**: Attempt to delete a Lent item and confirm error message is displayed
- [ ] T055a [US1] **VERIFY**: Attempt to delete an Available item that has lending history (past LendingLog records) and confirm error prevents deletion (FR-008/FR-009 audit preservation)
- [X] T056 [US1] **VERIFY**: Search for items by name/category and confirm filtering works correctly
- [X] T057 [US1] **VERIFY**: Test with empty Name or Category and confirm validation prevents submission

**Checkpoint**: User Story 1 complete - Items can be managed independently of lending operations

---

## Phase 4: User Story 2 - Lend Items to Users (Priority: P2)

**Goal**: Implement lending workflow with atomic status updates and log creation

**Independent Test**: Select available item, choose user, confirm status changes to "Lent" and log is created; verify transaction atomicity

### Backend - User Story 2

- [X] T058 [P] [US2] Create User model class in backend/src/models/User.js (read-only for this feature)
- [X] T059 [P] [US2] Create LendingLog model class in backend/src/models/LendingLog.js (create, update, query methods; includes BorrowerName, BorrowerEmail denormalized fields)
- [X] T060 [US2] Create LendingService in backend/src/services/lendingService.js (lend operation with transaction)
- [X] T061 [US2] Implement atomic lend operation in lendingService.js (BEGIN TRANSACTION, update Item, insert LendingLog with denormalized BorrowerName/BorrowerEmail from User lookup per FR-016/FR-019, COMMIT)
- [X] T062 [US2] Add validation to prevent lending items with status "Lent" or "Maintenance" in lendingService.js
- [X] T063 [US2] Add rollback logic in lendingService.js for transaction failures
- [X] T064 [US2] Create LendingController in backend/src/controllers/lendingController.js (lendItem method)
- [X] T065 [US2] Create lending routes in backend/src/routes/lending.js (POST /lend) with /api/v1/ prefix
- [X] T066 [US2] Create user routes in backend/src/routes/users.js (GET / for user selection only; user CRUD out of scope per FR-015) with /api/v1/users prefix
- [X] T067 [US2] Register lending and user routes in backend/src/app.js

### Frontend - User Story 2

- [X] T068 [P] [US2] Create lending API service in frontend/src/services/lendingService.js (lendItem API call)
- [X] T069 [P] [US2] Create user API service in frontend/src/services/userService.js (getUsers API call)
- [X] T070 [P] [US2] Create LendDialog component in frontend/src/components/LendDialog.jsx (modal with user selection)
- [X] T071 [P] [US2] Create UserSelect component in frontend/src/components/UserSelect.jsx (searchable dropdown)
- [X] T072 [US2] Add "Lend" button to ItemCard.jsx (only visible for Available items)
- [X] T073 [US2] Implement lend operation in LendDialog.jsx (call API, handle success/error)
- [X] T074 [US2] Add condition notes field in LendDialog.jsx (optional textarea)
- [X] T075 [US2] Update InventoryPage.jsx to refresh after lending operation
- [X] T076 [US2] Add error handling for concurrent lending attempts in LendDialog.jsx

### Verification Checkpoint - User Story 2

- [X] T077 [US2] **VERIFY**: Lend an Available item and confirm status changes to "Lent" in database
- [X] T078 [US2] **VERIFY**: Confirm LendingLog record is created with correct Item ID, User ID, and DateLent
- [X] T079 [US2] **VERIFY**: Attempt to lend an already-Lent item and confirm error message is displayed
- [X] T080 [US2] **VERIFY**: Simulate database error during lend and confirm rollback (no partial updates)
- [X] T081 [US2] **VERIFY**: Search for user by name/email in UserSelect and confirm filtering works
- [X] T082 [US2] **VERIFY**: Add condition notes during lending and confirm they're saved in LendingLog
- [X] T082a [US2] **VERIFY**: Lend an item and confirm LendingLog record includes denormalized BorrowerName and BorrowerEmail fields copied from User (FR-016/FR-019 audit preservation)

**Checkpoint**: User Story 2 complete - Items can be lent with full transactional integrity

---

## Phase 5: User Story 3 - Return Items (Priority: P3)

**Goal**: Implement return workflow with atomic status updates and log completion

**Independent Test**: Select lent item, complete return, verify status changes to "Available" and DateReturned is set

### Backend - User Story 3

- [X] T083 [US3] Implement atomic return operation in backend/src/services/lendingService.js (returnItem method)
- [X] T084 [US3] Add transaction logic for return in lendingService.js (BEGIN, update Item status, update LendingLog, COMMIT)
- [X] T085 [US3] Add validation to prevent returning items with status "Available" or "Maintenance" in lendingService.js
- [X] T086 [US3] Add rollback logic for return transaction failures in lendingService.js
- [X] T087 [US3] Add returnItem method in backend/src/controllers/lendingController.js
- [X] T088 [US3] Create return route in backend/src/routes/lending.js (POST /return) with /api/v1/ prefix

### Frontend - User Story 3

- [X] T089 [P] [US3] Add returnItem method to frontend/src/services/lendingService.js
- [X] T090 [P] [US3] Create ReturnDialog component in frontend/src/components/ReturnDialog.jsx (modal with condition notes)
- [X] T091 [US3] Add "Return" button to ItemCard.jsx (only visible for Lent items)
- [X] T092 [US3] Implement return operation in ReturnDialog.jsx (call API, handle success/error)
- [X] T093 [US3] Add return condition notes field in ReturnDialog.jsx (optional textarea)
- [X] T094 [US3] Update InventoryPage.jsx to refresh after return operation
- [X] T095 [US3] Add error handling for invalid return attempts in ReturnDialog.jsx

### Verification Checkpoint - User Story 3

- [X] T096 [US3] **VERIFY**: Return a Lent item and confirm status changes to "Available" in database
- [X] T097 [US3] **VERIFY**: Confirm LendingLog record is updated with DateReturned (current timestamp)
- [X] T098 [US3] **VERIFY**: Attempt to return an Available item and confirm error message is displayed
- [X] T099 [US3] **VERIFY**: Simulate database error during return and confirm rollback (no partial updates)
- [X] T100 [US3] **VERIFY**: Add return condition notes and confirm they're saved in LendingLog
- [X] T101 [US3] **VERIFY**: Return item is immediately available for lending again

**Checkpoint**: User Story 3 complete - Full lending cycle (lend → return) is functional

---

## Phase 6: User Story 4 - View Lending History (Priority: P4)

**Goal**: Display complete lending history for each item with filtering capabilities

**Independent Test**: Select item with lending history, verify all transactions displayed chronologically with user names

### Backend - User Story 4

- [X] T102 [US4] Implement getHistoryByItemId method in backend/src/models/LendingLog.js (query with denormalized BorrowerName field per FR-028)
- [X] T103 [US4] Create getItemHistory method in backend/src/services/lendingService.js (with date filtering)
- [X] T104 [US4] Add getHistory method in backend/src/controllers/lendingController.js
- [X] T105 [US4] Create history route in backend/src/routes/lending.js (GET /history/:itemId) with /api/v1/ prefix

### Frontend - User Story 4

- [X] T106 [P] [US4] Add getItemHistory method to frontend/src/services/lendingService.js
- [X] T107 [P] [US4] Create HistoryDialog component in frontend/src/components/HistoryDialog.jsx (modal with transaction list)
- [X] T108 [P] [US4] Create HistoryTable component in frontend/src/components/HistoryTable.jsx (formatted transaction display)
- [X] T109 [P] [US4] Create DateRangeFilter component in frontend/src/components/DateRangeFilter.jsx (optional date filtering)
- [X] T110 [US4] Add "View History" button to ItemCard.jsx
- [X] T111 [US4] Implement history loading in HistoryDialog.jsx (call API, display results)
- [X] T112 [US4] Add date range filtering in HistoryDialog.jsx
- [X] T113 [US4] Handle empty history case in HistoryDialog.jsx (display "No lending history available")

### Verification Checkpoint - User Story 4

- [X] T114 [US4] **VERIFY**: View history for item with multiple transactions and confirm chronological order (newest first)
- [X] T115 [US4] **VERIFY**: Confirm all fields displayed correctly (BorrowerName from denormalized field, DateLent, DateReturned, ConditionNotes per FR-028)
- [X] T116 [US4] **VERIFY**: View history for never-lent item and confirm "No lending history" message
- [X] T117 [US4] **VERIFY**: Filter history by date range and confirm only matching transactions shown
- [X] T118 [US4] **VERIFY**: Verify borrower names displayed from denormalized BorrowerName field (audit trail preserved even if user data changes)

**Checkpoint**: User Story 4 complete - Full audit trail available for all items

---

## Phase 7: User Story 5 - Dashboard Overview (Priority: P5)

**Goal**: Create dashboard with "Items Currently Out" section and searchable inventory table

**Independent Test**: Open dashboard, verify currently lent items shown with borrower names, test search functionality

### Backend - User Story 5

- [X] T119 [US5] Implement getCurrentlyLentItems method in backend/src/services/itemService.js (query Items with status "Lent")
- [X] T120 [US5] Add getDashboardData method in backend/src/controllers/itemController.js (items currently out + all items)
- [X] T121 [US5] Create dashboard route in backend/src/routes/dashboard.js (GET /dashboard) with /api/v1/ prefix
- [X] T122 [US5] Register dashboard route in backend/src/app.js

### Frontend - User Story 5

- [X] T123 [P] [US5] Create dashboard API service in frontend/src/services/dashboardService.js
- [X] T124 [P] [US5] Create CurrentlyOutSection component in frontend/src/components/CurrentlyOutSection.jsx
- [X] T125 [P] [US5] Create LentItemCard component in frontend/src/components/LentItemCard.jsx (shows borrower and date)
- [X] T126 [US5] Create DashboardPage in frontend/src/pages/DashboardPage.jsx (main dashboard layout)
- [X] T127 [US5] Integrate SearchBar and ItemList components into DashboardPage.jsx
- [X] T128 [US5] Add real-time dashboard updates after lend/return operations in DashboardPage.jsx
- [X] T129 [US5] Handle empty "Currently Out" case in CurrentlyOutSection.jsx (display "No items currently lent")
- [X] T130 [US5] Add route for / (root) pointing to DashboardPage in frontend/src/App.jsx
- [X] T131 [US5] Create navigation component in frontend/src/components/Navigation.jsx (links to Dashboard and Inventory)

### Verification Checkpoint - User Story 5

- [X] T132 [US5] **VERIFY**: Dashboard loads within 2 seconds as per SC-004
- [X] T133 [US5] **VERIFY**: "Items Currently Out" section displays all Lent items with borrower names and DateLent
- [X] T134 [US5] **VERIFY**: Inventory table shows all items with correct columns (Name, Category, Status, Actions)
- [X] T135 [US5] **VERIFY**: Search box filters inventory in real-time (under 1 second per SC-005)
- [X] T136 [US5] **VERIFY**: Dashboard updates immediately after lending/returning an item
- [X] T137 [US5] **VERIFY**: When no items are lent, "Currently Out" section shows "No items currently lent"

### Performance Testing (FR-035 to FR-038)

- [ ] T137a [P] [US5] Create test dataset generator script in backend/src/scripts/generateTestData.js (500 items, 50 users, 1000 lending logs per FR-036)
- [ ] T137b [P] [US5] Create performance benchmark suite in backend/tests/performance/ using k6 or custom Node.js script
- [ ] T137c [US5] Add dashboard load time test (target: <2s per SC-004/FR-035)
- [ ] T137d [US5] Add search response time test (target: <1s per SC-005/FR-035)
- [ ] T137e [US5] Add response time logging to itemController and lendingController per FR-037
- [ ] T137f **VERIFY**: Run performance tests against test dataset and confirm all thresholds met (SC-004, SC-005)

**Checkpoint**: User Story 5 complete - Dashboard provides at-a-glance system status

---

## Phase 8: Security & Data Validation (Cross-Cutting)

**Purpose**: Implement security requirements and comprehensive data validation

- [ ] T138 [P] Add parameterized query validation to all models in backend/src/models/ (SQL injection prevention)
- [ ] T139 [P] Implement XSS sanitization middleware in backend/src/middleware/sanitizer.js
- [ ] T140 [P] Add CSRF protection middleware in backend/src/middleware/csrf.js
- [ ] T141 [P] Implement rate limiting middleware in backend/src/middleware/rateLimiter.js (100 req/min per IP)
- [ ] T142 [P] Add input length validation in backend/src/middleware/validator.js (Name 100, Description 500, etc.)
- [ ] T143 Create .env file configuration guide in README.md (DB_PATH outside web root)
- [ ] T144 Add database file permission check script in backend/src/scripts/checkPermissions.js
- [ ] T145 Implement error sanitization in errorHandler.js (never expose database errors to client)
- [ ] T146 Add request logging with sanitized data in logger.js
- [ ] T147 Document security configuration in backend/SECURITY.md

### Verification Checkpoint - Security

- [ ] T148 **VERIFY**: Test SQL injection attempts and confirm parameterized queries prevent exploitation
- [ ] T149 **VERIFY**: Submit XSS payload in item name/description and confirm sanitization
- [ ] T150 **VERIFY**: Exceed rate limit and confirm 429 Too Many Requests response
- [ ] T151 **VERIFY**: Submit oversized inputs and confirm validation rejects them
- [ ] T152 **VERIFY**: Cause database error and confirm client receives generic error (no SQL details)
- [ ] T153 **VERIFY**: Database file is stored outside web root with restricted permissions

---

## Phase 9: Error Handling & User Experience Polish

**Purpose**: Comprehensive error handling and UX improvements

- [ ] T154 [P] Add error toast notification component in frontend/src/components/Toast.jsx
- [ ] T155 [P] Add loading states to all API calls in frontend (disable buttons, show spinners)
- [ ] T156 [P] Implement optimistic UI updates in InventoryPage.jsx (show changes immediately)
- [ ] T157 [P] Add confirmation dialogs for destructive actions (delete items) in ItemCard.jsx
- [ ] T158 Add network error handling in frontend/src/services/api.js (retry logic, timeout)
- [ ] T159 Add accessible ARIA labels to all form inputs and buttons
- [ ] T160 Add keyboard navigation support to dialogs and modals
- [ ] T161 Implement responsive design for mobile viewports in global.css
- [ ] T162 Add empty state illustrations for "no items" and "no history" cases
- [ ] T163 Create user feedback for successful operations (e.g., "Item lent successfully")

### Final Verification Checkpoint

- [ ] T164 **VERIFY**: All success criteria from spec.md are met (SC-001 through SC-010)
- [ ] T165 **VERIFY**: Test complete lend-and-return cycle and confirm 95% success rate goal (SC-009)
- [ ] T166 **VERIFY**: Load test dashboard and confirm 2-second load time (SC-004)
- [ ] T167 **VERIFY**: Test concurrent lending and confirm database locking prevents race conditions
- [ ] T168 **VERIFY**: Review all error messages for user-friendliness and clarity
- [ ] T169 **VERIFY**: Test with screen reader and confirm accessibility standards met
- [ ] T170 **VERIFY**: Run full regression test covering all 5 user stories

---

## Summary

**Total Tasks**: 185 (includes 13 new tasks: 3 API versioning, 1 denormalization migration update, 6 performance testing, 2 UI theme tasks, 3 additional verifications)
**Parallelizable Tasks**: 50 (marked with [P])
**Verification Checkpoints**: 42 (includes performance benchmarks)

**Task Breakdown by User Story**:
- Setup: 9 tasks
- Foundational: 24 tasks (+ 4 verification)
- User Story 1 (Items CRUD): 24 tasks (+ 6 verification)
- User Story 2 (Lending): 19 tasks (+ 6 verification)
- User Story 3 (Returns): 13 tasks (+ 6 verification)
- User Story 4 (History): 12 tasks (+ 5 verification)
- User Story 5 (Dashboard): 13 tasks (+ 6 verification)
- Security: 10 tasks (+ 6 verification)
- Polish: 10 tasks (+ 7 verification)

**MVP Delivery**: Complete Phase 1-3 (User Story 1) for functional inventory management system

**Parallel Execution Opportunities**:
- Frontend and Backend can be developed simultaneously after Foundational phase
- Within each user story, UI components can be built in parallel
- Security tasks can be integrated progressively across phases

**Critical Path**: Phase 1 → Phase 2 → Phases 3-7 (can proceed in order or parallel) → Phases 8-9

**Independent Testing**: Each user story phase includes verification checkpoint enabling independent validation and deployment
