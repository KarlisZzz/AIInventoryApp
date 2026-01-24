# Tasks: Item Screen UI Enhancements

**Branch**: `002-item-ui-enhancements`  
**Input**: Design documents from `/specs/002-item-ui-enhancements/`  
**Prerequisites**: ✅ plan.md, ✅ spec.md, ✅ research.md, ✅ data-model.md, ✅ contracts/, ✅ quickstart.md

**Tests**: This feature does NOT explicitly request tests - implementation-only tasks generated.

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)
- Include exact file paths in descriptions

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization for image upload feature

- [X] T001 Create upload directory at backend/data/uploads/items/ with .gitkeep
- [X] T002 [P] Install multer package in backend (npm install multer)
- [X] T003 [P] Ensure Express static middleware serves /uploads in backend/src/app.js

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [X] T004 Create database migration 003_add_item_image_url.js in backend/src/db/migrations/
- [X] T005 Run migration to add imageUrl column to items table
- [X] T006 Verify migration success with sqlite3 schema check
- [X] T007 [P] Create fileStorageService.js in backend/src/services/ with ensureUploadDir, getImageUrl, deleteImageFile methods
- [X] T008 [P] Create multer middleware configuration in backend/src/middleware/upload.js with file type and size validation
- [X] T009 [P] Update multer error handling in backend/src/middleware/errorHandler.js for LIMIT_FILE_SIZE and file type errors
- [X] T010 Update Item TypeScript interface to include imageUrl field in frontend/src/services/itemService.ts

**Checkpoint**: Foundation ready - user story implementation can now begin in parallel

---

## Phase 3: User Story 1 - Add Images to Items (Priority: P1) 🎯 MVP

**Goal**: Enable image upload, display, and removal for inventory items so users can visually identify items at a glance

**Independent Test**: Upload an image when creating or editing an item, verify the image displays correctly in the item list and cards. Remove an image and verify placeholder appears.

### Implementation for User Story 1

#### Backend - Image Upload API

- [X] T011 [P] [US1] Add uploadItemImage method to backend/src/services/itemService.js
- [X] T012 [P] [US1] Add deleteItemImage method to backend/src/services/itemService.js
- [X] T013 [US1] Add uploadImage controller method in backend/src/controllers/itemController.js
- [X] T014 [US1] Add deleteImage controller method in backend/src/controllers/itemController.js
- [X] T015 [US1] Add POST /:id/image route in backend/src/routes/items.js with upload.single middleware
- [X] T016 [US1] Add DELETE /:id/image route in backend/src/routes/items.js
- [X] T017 [US1] Call ensureUploadDir on server startup in backend/src/server.js

#### Frontend - Image Upload Component

- [X] T018 [P] [US1] Create ImageUpload component in frontend/src/components/ImageUpload.tsx with file preview and validation
- [X] T019 [P] [US1] Add uploadItemImage API function in frontend/src/services/itemService.ts
- [X] T020 [P] [US1] Add deleteItemImage API function in frontend/src/services/itemService.ts
- [X] T021 [US1] Integrate ImageUpload component into ItemForm in frontend/src/components/ItemForm.tsx
- [X] T022 [US1] Add image upload/delete handling to ItemForm submit in frontend/src/components/ItemForm.tsx
- [X] T023 [US1] Update ItemCard to display image with aspect-square ratio in frontend/src/components/ItemCard.tsx
- [X] T024 [US1] Add placeholder SVG for items without images in frontend/src/components/ItemCard.tsx
- [X] T025 [US1] Add image onError fallback handler in frontend/src/components/ItemCard.tsx

**Checkpoint**: At this point, User Story 1 should be fully functional - users can upload, view, and remove images from items

---

## Phase 4: User Story 2 - Switch Between Grid and List Views (Priority: P2)

**Goal**: Provide a view toggle button so users can choose between grid view (visual browsing) and list view (detailed information)

**Independent Test**: Click the view toggle button and verify the item display switches between grid cards and table rows while preserving all functionality (search, filters, actions)

### Implementation for User Story 2

- [X] T026 [P] [US2] Create useLocalStorage custom hook in frontend/src/hooks/useLocalStorage.ts
- [X] T027 [P] [US2] Create ViewToggle component in frontend/src/components/ViewToggle.tsx with grid/list icons
- [X] T028 [US2] Add viewMode state with useLocalStorage hook in frontend/src/pages/InventoryPage.tsx
- [X] T029 [US2] Add viewMode prop to ItemList component interface in frontend/src/components/ItemList.tsx
- [X] T030 [US2] Implement grid view rendering (existing layout) in frontend/src/components/ItemList.tsx
- [X] T031 [US2] Implement list view rendering with table layout in frontend/src/components/ItemList.tsx
- [X] T032 [US2] Add thumbnail image column to list view table in frontend/src/components/ItemList.tsx
- [X] T033 [US2] Integrate ViewToggle component in InventoryPage header in frontend/src/pages/InventoryPage.tsx
- [X] T034 [US2] Verify view preference persists across page refreshes via localStorage

**Checkpoint**: At this point, User Stories 1 AND 2 should both work independently - images display correctly in both grid and list views

---

## Phase 5: User Story 3 - Improve Item Card UI with Actions Menu (Priority: P3)

**Goal**: Replace inline action buttons with a three-dots dropdown menu for a cleaner, less cluttered interface

**Independent Test**: View items in grid view, click the three-dots menu on a card, and verify all actions (Edit, Delete, Lend/Return, View History) are accessible and functional

### Implementation for User Story 3

- [X] T035 [P] [US3] Create DropdownMenu component in frontend/src/components/DropdownMenu.tsx with click-outside detection
- [X] T036 [P] [US3] Add Escape key handler to close dropdown in frontend/src/components/DropdownMenu.tsx
- [X] T037 [US3] Define MenuItem interface with label, onClick, disabled, tooltip, variant properties in frontend/src/components/DropdownMenu.tsx
- [X] T038 [US3] Refactor ItemCard to remove inline action buttons in frontend/src/components/ItemCard.tsx
- [X] T039 [US3] Add three-dots menu button in top-right corner of ItemCard image section in frontend/src/components/ItemCard.tsx
- [X] T040 [US3] Build menuItems array with Edit, Lend/Return, View History, Delete actions in frontend/src/components/ItemCard.tsx
- [X] T041 [US3] Integrate DropdownMenu component with menuItems in frontend/src/components/ItemCard.tsx
- [X] T042 [US3] Add conditional logic to disable Delete for Lent items with tooltip in frontend/src/components/ItemCard.tsx
- [X] T043 [US3] Add three-dots menu to Actions column in list view table in frontend/src/components/ItemList.tsx
- [X] T044 [US3] Ensure dropdown closes automatically after action selected in frontend/src/components/DropdownMenu.tsx

**Checkpoint**: At this point, User Stories 1, 2, AND 3 should all work independently - cleaner card UI with dropdown menus

---

## Phase 6: User Story 4 - Click Item Card to Edit (Priority: P4)

**Goal**: Enable clicking anywhere on an item card (except the three-dots menu) to open the edit dialog for faster access to editing

**Independent Test**: Click on various parts of an item card (except the three-dots menu) and verify the edit dialog opens with the correct item data pre-filled

### Implementation for User Story 4

- [X] T045 [US4] Add menuOpen state to track dropdown visibility in frontend/src/components/ItemCard.tsx
- [X] T046 [US4] Add handleCardClick function that calls onEdit when menu is not open in frontend/src/components/ItemCard.tsx
- [X] T047 [US4] Add onClick handler to card container div in frontend/src/components/ItemCard.tsx
- [X] T048 [US4] Add cursor-pointer class to card container in frontend/src/components/ItemCard.tsx
- [X] T049 [US4] Add hover ring effect (ring-2 ring-blue-500/50) to card for visual feedback in frontend/src/components/ItemCard.tsx
- [X] T050 [US4] Update three-dots menu button onClick to use stopPropagation in frontend/src/components/ItemCard.tsx
- [X] T051 [US4] Add onClick handler to list view table rows in frontend/src/components/ItemList.tsx
- [X] T052 [US4] Add stopPropagation to Actions column in list view to prevent row click in frontend/src/components/ItemList.tsx
- [X] T053 [US4] Verify scroll position is preserved when dialog opens/closes (React Portal handles this)

**Checkpoint**: All user stories should now be independently functional - complete feature ready for testing

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [X] T054 [P] Update README.md in specs/002-item-ui-enhancements/ with feature summary
- [X] T055 [P] Add image upload instructions to backend/README.md
- [X] T056 Verify all Constitutional principles are followed (RESTful API, modular architecture, clean code)
- [X] T057 Test image upload with 5MB file to verify size limit enforcement
- [X] T058 Test image upload with invalid file type (PDF, TXT) to verify validation
- [X] T059 Test orphan file cleanup when upload fails or item is deleted
- [X] T060 Test view toggle persistence across browser sessions
- [X] T061 Test three-dots menu closes on click outside and Escape key
- [X] T062 Test click-to-edit does not trigger when menu is open
- [X] T063 Run quickstart.md validation by following implementation steps
- [X] T064 Create pull request with screenshots of grid view with images

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational phase completion - P1 MVP
- **User Story 2 (Phase 4)**: Depends on Foundational phase completion (NOT dependent on US1 - could be parallel with sufficient team)
- **User Story 3 (Phase 5)**: Depends on US1 completion (needs image display and existing card structure)
- **User Story 4 (Phase 6)**: Depends on US3 completion (needs dropdown menu to handle click conflicts)
- **Polish (Phase 7)**: Depends on all user stories being complete

### User Story Dependencies

- **User Story 1 (P1)**: Can start after Foundational (Phase 2) - No dependencies on other stories
- **User Story 2 (P2)**: Can start after Foundational (Phase 2) - Could theoretically run parallel to US1, but builds on image display
- **User Story 3 (P3)**: Depends on US1 (needs ItemCard with images) - Refactors existing card UI
- **User Story 4 (P4)**: Depends on US3 (needs dropdown menu in place to prevent click conflicts)

### Within Each User Story

#### User Story 1 (Images)
- Backend API tasks (T011-T017) must complete before frontend integration (T021-T022)
- Frontend components (T018-T020) can be built in parallel with backend
- Display tasks (T023-T025) can only run after image upload is working

#### User Story 2 (View Toggle)
- useLocalStorage hook and ViewToggle component (T026-T027) can be built in parallel
- ItemList modifications (T030-T032) depend on components being ready
- Integration (T033-T034) is final step

#### User Story 3 (Dropdown Menu)
- DropdownMenu component (T035-T037) can be built independently
- ItemCard refactor (T038-T042) depends on DropdownMenu being ready
- List view integration (T043) can run in parallel with ItemCard changes

#### User Story 4 (Click-to-Edit)
- All tasks are sequential modifications to existing components
- Must have dropdown menu from US3 to handle click conflicts properly

### Parallel Opportunities

- **Phase 1 (Setup)**: All 3 tasks marked [P] can run in parallel
- **Phase 2 (Foundational)**: T007, T008, T009, T010 marked [P] can run in parallel after T004-T006 complete
- **User Story 1**: T011-T012 (backend services), T013-T014 (controllers), T018-T020 (frontend services) can all run in parallel
- **User Story 2**: T026-T027 (hooks and components) can run in parallel
- **User Story 3**: T035-T037 (DropdownMenu component) can be built independently while reviewing US2 completion
- **Polish Phase**: T054-T055 (documentation) can run in parallel, testing tasks (T057-T062) can run in parallel

---

## Parallel Example: User Story 1 (Backend + Frontend in Parallel)

```bash
# Backend team launches in parallel:
Task T011: "Add uploadItemImage method to backend/src/services/itemService.js"
Task T012: "Add deleteItemImage method to backend/src/services/itemService.js"

# Frontend team launches in parallel (can work independently):
Task T018: "Create ImageUpload component in frontend/src/components/ImageUpload.tsx"
Task T019: "Add uploadItemImage API function in frontend/src/services/itemService.ts"
Task T020: "Add deleteItemImage API function in frontend/src/services/itemService.ts"

# Once backend API is ready (T011-T017 complete), integrate frontend:
Task T021: "Integrate ImageUpload component into ItemForm"
Task T022: "Add image upload/delete handling to ItemForm submit"
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001-T003) - 30 minutes
2. Complete Phase 2: Foundational (T004-T010) - 2 hours ⚠️ CRITICAL
3. Complete Phase 3: User Story 1 (T011-T025) - 1 day
4. **STOP and VALIDATE**: Test image upload, display, and removal
5. Deploy/demo if ready - MVP delivered! ✅

### Incremental Delivery (Recommended)

1. **Day 1 AM**: Setup + Foundational → Foundation ready
2. **Day 1 PM - Day 2 AM**: User Story 1 (Images) → Test independently → **Deploy MVP**
3. **Day 2 PM - Day 3 AM**: User Story 2 (View Toggle) → Test independently → **Deploy v1.1**
4. **Day 3 PM**: User Story 3 (Dropdown Menu) → Test independently → **Deploy v1.2**
5. **Day 4 AM**: User Story 4 (Click-to-Edit) → Test independently → **Deploy v1.3**
6. **Day 4 PM**: Polish and final testing → **Deploy v2.0**

Each story adds value without breaking previous stories - this is the power of user story organization!

### Parallel Team Strategy

With 2 developers:

1. **Both**: Complete Setup + Foundational together (Day 1 AM)
2. Once Foundational is done:
   - **Developer A**: User Story 1 (Backend + Frontend images)
   - **Developer B**: User Story 2 (View toggle) - Can start immediately!
3. **Developer A**: User Story 3 (Dropdown menu) - After US1 complete
4. **Developer A**: User Story 4 (Click-to-edit) - After US3 complete
5. **Developer B**: Polish and testing in parallel with US3/US4

With this strategy, US2 can be delivered in parallel with US1, significantly reducing time to feature completion!

---

## Task Count Summary

- **Phase 1 (Setup)**: 3 tasks
- **Phase 2 (Foundational)**: 7 tasks ⚠️ Blocking
- **Phase 3 (US1 - Images)**: 15 tasks 🎯 MVP
- **Phase 4 (US2 - View Toggle)**: 9 tasks
- **Phase 5 (US3 - Dropdown Menu)**: 10 tasks
- **Phase 6 (US4 - Click-to-Edit)**: 9 tasks
- **Phase 7 (Polish)**: 11 tasks

**Total**: 64 tasks

**Estimated Effort**:
- MVP (US1): 1-1.5 days (25 tasks including setup/foundation)
- Full Feature: 3-4 days (64 tasks)
- With 2 developers: 2-3 days (parallel US1+US2)

---

## Notes

- **[P] tasks** = Different files, no dependencies, can run in parallel
- **[Story] label** maps task to specific user story (US1, US2, US3, US4) for traceability
- Each user story should be independently completable and testable
- No tests generated because feature spec does not explicitly request TDD approach
- Commit after each task or logical group (e.g., all backend API changes)
- Stop at any checkpoint to validate story independently
- **Constitution Compliance**: All tasks follow RESTful API design, modular architecture, clean code principles
- **File Paths**: Exact paths provided in every task for clarity
- **Avoid**: Vague tasks, same file conflicts, cross-story dependencies that break independence

---

## Success Criteria Checklist

After completing all tasks, verify these success criteria from spec.md:

- [ ] **SC-001**: Users can upload an image to an item in under 45 seconds
- [ ] **SC-002**: Item cards in grid view display images clearly with proper aspect ratios
- [ ] **SC-003**: Users can switch between grid and list views in under 2 seconds
- [ ] **SC-004**: Items page loads and renders up to 100 items in grid view within 3 seconds
- [ ] **SC-005**: Users can access all item actions from the three-dots menu within 3 clicks
- [ ] **SC-006**: Users can open the edit dialog by clicking on an item card in under 1 second
- [ ] **SC-007**: 90% of users prefer the new grid view with images (measure through feedback)
- [ ] **SC-008**: Zero image upload failures occur for valid file types under 5MB
- [ ] **SC-009**: System maintains responsive performance when uploading images up to 5MB
- [ ] **SC-010**: 95% of users can successfully upload an item image on their first attempt

**Feature complete when all success criteria are met!** 🎉
