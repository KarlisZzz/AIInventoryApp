# Tasks: Admin Management Section

**Branch**: `004-admin-management` | **Date**: January 25, 2026  
**Input**: Design documents from `/specs/004-admin-management/`  
**Prerequisites**: ✅ plan.md, ✅ spec.md, ✅ research.md, ✅ data-model.md, ✅ contracts/api-spec.yaml, ✅ quickstart.md

**Tests**: Tests are NOT explicitly requested in the feature specification, but the Constitution requires ≥70% coverage for critical paths. Test tasks are included for backend services and controllers.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `- [ ] [ID] [P?] [Story?] Description with file path`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: User story label (US1, US2, US3) - only for user story phases
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and database schema foundation

- [X] T001 Verify backend/frontend dependencies are installed (Node.js 18+, npm)
- [X] T002 Create feature branch `004-admin-management` from main
- [X] T003 [P] Create new model file backend/src/models/Category.js with schema definition
- [X] T004 [P] Create new model file backend/src/models/AdminAuditLog.js with schema definition
- [X] T005 [P] Create migration file backend/src/db/migrations/YYYYMMDDHHMMSS-create-categories.js
- [X] T006 [P] Create migration file backend/src/db/migrations/YYYYMMDDHHMMSS-standardize-user-roles.js
- [X] T007 [P] Create migration file backend/src/db/migrations/YYYYMMDDHHMMSS-create-admin-audit-logs.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core database changes and authorization infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T008 Update backend/src/models/User.js to change role field from STRING to ENUM('administrator', 'standard user')
- [X] T009 Update backend/src/models/User.js to add countAdministrators() class method
- [X] T010 Update backend/src/models/User.js to add canDeleteAdmin(userId) class method
- [X] T011 Update backend/src/models/User.js to update isAdmin() instance method to check for 'administrator'
- [X] T012 Update backend/src/models/Item.js to remove category STRING field and add categoryId UUID foreign key
- [X] T013 Update backend/src/models/Item.js to add belongsTo(Category) association
- [X] T014 Update backend/src/models/index.js to import Category and AdminAuditLog models
- [X] T015 Update backend/src/models/index.js to add Category↔Item associations (hasMany/belongsTo with ON DELETE RESTRICT)
- [X] T016 Update backend/src/models/index.js to add User↔AdminAuditLog associations (hasMany/belongsTo)
- [X] T017 Run database migrations with `npm run migrate` and verify all tables created successfully
- [X] T018 Verify migration success: check Categories table exists, Items have categoryId, Users have standardized roles
- [X] T019 Create authorization middleware file backend/src/middleware/auth.js with requireAdmin function
- [X] T020 Create email service stub file backend/src/services/emailService.js with sendUserCreatedEmail function
- [X] T021 Create admin routes file backend/src/routes/admin.js with route placeholders
- [X] T022 Update backend/src/app.js to mount admin routes at /api/v1/admin with requireAdmin middleware

**Checkpoint**: Foundation ready - database migrated, authorization in place, user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Manage Item Categories (Priority: P1) 🎯 MVP

**Goal**: Enable administrators to create, edit, and delete item categories with proper validation and item assignment protection

**Independent Test**: Admin can navigate to /admin/categories, create "Electronics" category, edit its name to "Electronic Devices", and delete it (if no items assigned)

### Backend Implementation for User Story 1

- [X] T023 [P] [US1] Implement getAllCategories() in backend/src/services/categoryService.js
- [X] T024 [P] [US1] Implement getCategoryById(id) in backend/src/services/categoryService.js
- [X] T025 [P] [US1] Implement createCategory(name, adminUserId) with transaction and audit log in backend/src/services/categoryService.js
- [X] T026 [P] [US1] Implement updateCategory(id, name, adminUserId) with uniqueness check and audit log in backend/src/services/categoryService.js
- [X] T027 [P] [US1] Implement deleteCategory(id, adminUserId) with item count check and audit log in backend/src/services/categoryService.js
- [X] T028 [US1] Implement getCategories controller in backend/src/controllers/categoryController.js
- [X] T029 [US1] Implement createCategory controller in backend/src/controllers/categoryController.js
- [X] T030 [US1] Implement getCategoryById controller in backend/src/controllers/categoryController.js
- [X] T031 [US1] Implement updateCategory controller in backend/src/controllers/categoryController.js
- [X] T032 [US1] Implement deleteCategory controller in backend/src/controllers/categoryController.js
- [X] T033 [US1] Add category routes to backend/src/routes/admin.js (GET/POST /categories, GET/PUT/DELETE /categories/:id)
- [X] T034 [US1] Test category endpoints manually: create, list, update, delete with/without items assigned

### Frontend Implementation for User Story 1

- [X] T035 [P] [US1] Create type definitions in frontend/src/types/admin.ts (Category, CategoryWithCount interfaces)
- [X] T036 [P] [US1] Create category API functions in frontend/src/api/adminApi.ts (getCategories, createCategory, updateCategory, deleteCategory)
- [X] T037 [P] [US1] Create reusable AdminCard component in frontend/src/components/admin/AdminCard.tsx with glassmorphism styles
- [X] T038 [P] [US1] Create ConfirmDialog component in frontend/src/components/admin/ConfirmDialog.tsx
- [X] T039 [US1] Create CategoryManagement page in frontend/src/pages/admin/CategoryManagement.tsx with category table
- [X] T040 [US1] Add category create form to CategoryManagement page with real-time validation
- [X] T041 [US1] Add category edit inline/modal functionality to CategoryManagement page
- [X] T042 [US1] Add category delete with confirmation dialog to CategoryManagement page (show item count warning)
- [X] T043 [US1] Add error handling and toast notifications for category operations

### Testing for User Story 1

- [X] T044 [P] [US1] Write unit tests for categoryService in backend/tests/services/categoryService.test.js (create, update, delete scenarios)
- [X] T045 [P] [US1] Write integration tests for category endpoints in backend/tests/integration/admin.test.js (auth checks, CRUD operations)

**Checkpoint**: At this point, User Story 1 (category management) should be fully functional and testable independently

---

## Phase 4: User Story 2 - Manage User Accounts (Priority: P2)

**Goal**: Enable administrators to create, edit, and deactivate user accounts with role management and safety checks

**Independent Test**: Admin can navigate to /admin/users, create new user with email/name/role, edit their role from "standard user" to "administrator", and deactivate account (with self-delete and last-admin prevention)

### Backend Implementation for User Story 2

- [X] T046 [P] [US2] Implement getAllUsers(roleFilter) in backend/src/services/userService.js
- [X] T047 [P] [US2] Implement getUserById(id) in backend/src/services/userService.js
- [X] T048 [P] [US2] Implement createUser(data, adminUserId) with email validation, password generation, and email notification in backend/src/services/userService.js
- [X] T049 [P] [US2] Implement updateUser(id, data, adminUserId) with email uniqueness check and audit log in backend/src/services/userService.js
- [X] T050 [P] [US2] Implement deleteUser(userId, adminUserId) with self-deletion check, last-admin check, and audit log in backend/src/services/userService.js
- [X] T051 [US2] Implement getUsers controller in backend/src/controllers/userController.js
- [X] T052 [US2] Implement createUser controller in backend/src/controllers/userController.js
- [X] T053 [US2] Implement getUserById controller in backend/src/controllers/userController.js
- [X] T054 [US2] Implement updateUser controller in backend/src/controllers/userController.js
- [X] T055 [US2] Implement deleteUser controller in backend/src/controllers/userController.js
- [X] T056 [US2] Add user routes to backend/src/routes/admin.js (GET/POST /users, GET/PUT/DELETE /users/:id)
- [X] T057 [US2] Test user endpoints manually: create, list, update, delete with safety checks (self-delete, last admin)

### Frontend Implementation for User Story 2

- [X] T058 [P] [US2] Add User interface to frontend/src/types/admin.ts
- [X] T059 [P] [US2] Create user API functions in frontend/src/api/adminApi.ts (getUsers, createUser, updateUser, deleteUser)
- [X] T060 [US2] Create UserManagement page in frontend/src/pages/admin/UserManagement.tsx with user table and role badges
- [X] T061 [US2] Add user create form to UserManagement page (name, email, role dropdown with validation)
- [X] T062 [US2] Add user edit form to UserManagement page (allow name, email, role changes)
- [X] T063 [US2] Add user delete with confirmation dialog to UserManagement page (prevent self-delete, show last-admin warning)
- [X] T064 [US2] Add error handling and success notifications for user operations
- [X] T065 [US2] Implement role badge component with color coding (administrator = blue, standard user = gray)

### Testing for User Story 2

- [X] T066 [P] [US2] Write unit tests for userService in backend/tests/services/userService.test.js (safety checks, role validation)
- [X] T067 [P] [US2] Write integration tests for user endpoints in backend/tests/integration/admin.test.js (create, update, delete with auth)

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently (categories + users)

---

## Phase 5: User Story 3 - View Admin Dashboard (Priority: P3)

**Goal**: Provide administrators with a centralized overview showing system statistics and quick navigation to management functions

**Independent Test**: Admin can navigate to /admin, see user count, category count, admin count, recent actions, and click links to /admin/categories and /admin/users

### Backend Implementation for User Story 3

- [X] T068 [US3] Implement getDashboard() in backend/src/controllers/adminController.js to fetch stats and recent audit logs
- [X] T069 [US3] Add dashboard route to backend/src/routes/admin.js (GET /dashboard)
- [X] T070 [US3] Test dashboard endpoint manually: verify stats are accurate, recent actions display correctly

### Frontend Implementation for User Story 3

- [X] T071 [P] [US3] Add AdminDashboard and AuditLogSummary interfaces to frontend/src/types/admin.ts
- [X] T072 [P] [US3] Create getAdminDashboard API function in frontend/src/services/adminApi.ts
- [X] T073 [US3] Create AdminLayout component in frontend/src/pages/admin/AdminLayout.tsx with role check and redirect for non-admins
- [X] T074 [US3] Create AdminDashboard page in frontend/src/pages/admin/AdminDashboard.tsx with stat cards (user count, category count, admin count)
- [X] T075 [US3] Add recent actions list to AdminDashboard page showing last 10 admin actions
- [X] T076 [US3] Add quick action links to AdminDashboard page (Manage Categories → /admin/categories, Manage Users → /admin/users)
- [X] T077 [US3] Update frontend routing in frontend/src/App.tsx to add /admin route group with AdminLayout and nested routes
- [X] T078 [US3] Add "Admin" link to main navigation in frontend/src/components/Layout.tsx (visible to all users)
- [X] T079 [US3] Test admin dashboard manually: verify stats display, navigation links work

**Checkpoint**: All three user stories should now be independently functional (categories, users, dashboard)

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories and final validation

- [X] T080 [P] Add loading states and skeleton screens to all admin pages (CategoryManagement, UserManagement, AdminDashboard)
- [X] T081 [P] Add empty states with helpful messages to category and user tables when no data exists
- [X] T082 [P] Implement proper error boundaries in AdminLayout to catch and display React errors gracefully
- [X] T083 [P] Add accessibility improvements: ARIA labels for icon buttons, keyboard navigation for tables, focus management in modals
- [X] T084 [P] Write frontend component tests in frontend/tests/pages/CategoryManagement.test.tsx (render, create, edit, delete flows)
- [X] T085 Validate all admin routes require authentication and return 401/403 for unauthorized access
- [X] T086 Test audit logging: verify all admin actions (create/update/delete for categories and users) are logged to AdminAuditLogs table
- [X] T087 Performance test: verify category and user lists load in <2 seconds for 1000 entries (SC-006)
- [X] T088 Run quickstart.md validation: follow implementation guide step-by-step to ensure accuracy
- [X] T089 Update backend README.md with admin endpoint documentation
- [X] T090 Update frontend README.md with admin section navigation instructions
- [X] T091 Create seed data script with sample categories and admin users for demo purposes
- [X] T092 Run full regression test suite: verify existing features (inventory, lending, dashboard) still work after admin changes

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup (T001-T007) - **BLOCKS all user stories**
  - Database migrations MUST complete successfully before any user story work
  - Authorization middleware MUST be in place before API endpoints are created
- **User Stories (Phase 3-5)**: All depend on Foundational phase (T008-T022) completion
  - User Story 1 (Categories) can start after Foundational
  - User Story 2 (Users) can start after Foundational (independent of US1)
  - User Story 3 (Dashboard) can start after Foundational but benefits from having US1/US2 data
- **Polish (Phase 6)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1 - Categories)**: ✅ No dependencies on other stories - independently testable
- **User Story 2 (P2 - Users)**: ✅ No dependencies on other stories - independently testable
- **User Story 3 (P3 - Dashboard)**: Displays stats from US1 and US2 but doesn't modify them - independently testable with mock data

### Within Each User Story

- **Backend-first approach**:
  1. Service layer (business logic with transactions and audit logging)
  2. Controllers (HTTP handlers)
  3. Routes (endpoint registration)
  4. Manual API testing
- **Then frontend**:
  1. Types and API client functions
  2. Shared components (if needed)
  3. Page components
  4. Integration with backend APIs
- **Finally tests** (for verification):
  1. Backend unit tests (services)
  2. Backend integration tests (endpoints)
  3. Frontend component tests

### Parallel Opportunities

**Phase 1 (Setup)**: All model and migration file creation tasks (T003-T007) can run in parallel

**Phase 2 (Foundational)**: Model updates (T008-T013) can run in parallel, but association updates (T014-T016) must wait for models

**User Story 1 Backend**: Service functions (T023-T027) can be written in parallel, then controllers (T028-T032) in parallel

**User Story 1 Frontend**: Types (T035), API functions (T036), and components (T037-T038) can be built in parallel

**User Story 2 Backend**: Service functions (T046-T050) can be written in parallel, then controllers (T051-T055) in parallel

**User Story 2 Frontend**: Types (T058), API functions (T059) can be built in parallel with US1 frontend work

**User Story 3 Frontend**: Types (T071), API function (T072) can be built in parallel

**Polish Phase**: Most tasks (T080-T084) can run in parallel as they affect different concerns

### Critical Path

1. T001-T007 (Setup) → 
2. T008-T022 (Foundational - MUST complete fully) → 
3. T023-T045 (US1 complete) → Test independently → 
4. T046-T067 (US2 complete) → Test independently → 
5. T068-T079 (US3 complete) → Test independently → 
6. T080-T092 (Polish)

**Parallel Team Strategy**: After Foundational phase completes, three developers can work simultaneously:
- Developer A: User Story 1 (Categories) - T023-T045
- Developer B: User Story 2 (Users) - T046-T067
- Developer C: User Story 3 (Dashboard) - T068-T079 (can start with mock data)

---

## Parallel Example: User Story 1 (Categories)

```bash
# Backend services (can launch all in parallel):
Task T023: "Implement getAllCategories() in backend/src/services/categoryService.js"
Task T024: "Implement getCategoryById(id) in backend/src/services/categoryService.js"
Task T025: "Implement createCategory() with transaction in backend/src/services/categoryService.js"
Task T026: "Implement updateCategory() with audit log in backend/src/services/categoryService.js"
Task T027: "Implement deleteCategory() with item check in backend/src/services/categoryService.js"

# Frontend foundation (can launch all in parallel):
Task T035: "Create type definitions in frontend/src/types/admin.ts"
Task T036: "Create category API functions in frontend/src/api/adminApi.ts"
Task T037: "Create AdminCard component in frontend/src/components/admin/AdminCard.tsx"
Task T038: "Create ConfirmDialog component in frontend/src/components/admin/ConfirmDialog.tsx"

# Tests (can launch all in parallel after implementation):
Task T044: "Write unit tests for categoryService in backend/tests/services/categoryService.test.js"
Task T045: "Write integration tests in backend/tests/integration/admin.test.js"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T007)
2. Complete Phase 2: Foundational (T008-T022) - **CRITICAL GATE**
3. Complete Phase 3: User Story 1 (T023-T045)
4. **STOP and VALIDATE**: 
   - Test category CRUD operations via API
   - Test category management page in browser
   - Verify audit logs are created
   - Verify item count prevents deletion
5. Deploy/demo if ready - **MVP delivered** (admin can manage categories)

### Incremental Delivery

1. **Foundation** (T001-T022) → Database migrated, auth in place
2. **+User Story 1** (T023-T045) → Category management works → **Deploy/Demo (MVP!)**
3. **+User Story 2** (T046-T067) → User management works → **Deploy/Demo**
4. **+User Story 3** (T068-T079) → Dashboard overview works → **Deploy/Demo**
5. **+Polish** (T080-T092) → Production-ready → **Final Deploy**

Each increment adds value without breaking previous functionality.

### Parallel Team Strategy (3 Developers)

**Week 1**: All developers work together
- Days 1-2: Phase 1 (Setup) - T001-T007
- Days 3-5: Phase 2 (Foundational) - T008-T022
- **Checkpoint**: Foundation ready, branch merge

**Week 2**: Developers split into parallel streams
- **Developer A**: User Story 1 (Categories) - T023-T045
- **Developer B**: User Story 2 (Users) - T046-T067
- **Developer C**: User Story 3 (Dashboard) - T068-T079 (use mock data initially)
- **End of Week 2**: All user stories complete, independent testing

**Week 3**: Integration and polish
- All developers: Phase 6 (Polish) - T080-T092
- Integration testing across all three user stories
- Performance testing and optimization
- Final deployment preparation

---

## Success Criteria Validation

After completing all tasks, verify these success criteria from the spec:

- ✅ **SC-001**: Admin can create a category in <30 seconds (T023-T029, T039-T040)
- ✅ **SC-002**: Admin can create a user in <60 seconds (T046-T048, T060-T061)
- ✅ **SC-003**: System prevents 100% of attempts to delete categories with assigned items (T027, T042)
- ✅ **SC-004**: System prevents 100% of unauthorized access attempts (T019, T073, T085)
- ✅ **SC-005**: All administrative actions are logged with 100% accuracy (T025-T027, T048-T050, T086)
- ✅ **SC-006**: Category and user lists display in <2s for 1000 entries (T087)
- ✅ **SC-007**: Role changes take effect within 5 seconds (T049, T062)
- ✅ **SC-008**: Zero data loss during edit operations (all service transactions)
- ✅ **SC-009**: 100% referential integrity maintained (migrations enforce foreign keys)

---

## Notes

- **[P] marker**: Tasks marked [P] can run in parallel (different files, no dependencies on incomplete tasks)
- **[Story] label**: Every task in user story phases (3-5) must have [US1], [US2], or [US3] label for traceability
- **File paths**: All tasks include exact file paths for clarity
- **Transactions**: All state-changing operations (create/update/delete) must use Sequelize transactions per Constitution Principle III
- **Audit logging**: All admin actions must log to AdminAuditLogs table (FR-019)
- **Safety checks**: User deletion must check self-deletion (FR-013) and last-admin (FR-014) before transaction
- **Category protection**: Category deletion must check item count (FR-004) before transaction
- **Testing**: Backend tests are included for critical paths (≥70% coverage requirement from Constitution)
- **Independent stories**: Each user story should be completable and testable without the others - commit after each checkpoint
- **Constitution compliance**: All tasks implement Constitution principles (modular architecture, atomic transactions, foreign keys, RESTful APIs)

---

## Total Task Count

- **Phase 1 (Setup)**: 7 tasks
- **Phase 2 (Foundational)**: 15 tasks
- **Phase 3 (User Story 1)**: 23 tasks
- **Phase 4 (User Story 2)**: 22 tasks
- **Phase 5 (User Story 3)**: 12 tasks
- **Phase 6 (Polish)**: 13 tasks
- **Total**: 92 tasks

**Estimated Effort**: 8-12 hours for full implementation + testing (as per quickstart.md)

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 = 45 tasks (approx. 4-6 hours for User Story 1 only)
