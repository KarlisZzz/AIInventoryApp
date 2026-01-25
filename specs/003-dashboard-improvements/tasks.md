# Tasks: Dashboard Improvements

**Branch**: `003-dashboard-improvements`  
**Feature**: Dashboard Improvements  
**Input**: Design documents from `/specs/003-dashboard-improvements/`

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3, US4)
- Include exact file paths in descriptions

## Path Conventions

- **Web app**: `backend/src/`, `frontend/src/`
- Paths shown below follow the actual project structure

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Minimal setup - most infrastructure already exists in the project

- [X] T001 Review existing dashboard implementation in frontend/src/pages/DashboardPage.tsx
- [X] T002 Review existing dashboard service in backend/src/services/dashboardService.js
- [X] T003 [P] Verify database has Item and Loan models with proper associations

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Backend analytics endpoint that all dashboard enhancements depend on

**⚠️ CRITICAL**: This endpoint must work before any frontend work can display analytics

- [X] T004 Add getAnalytics method to backend/src/controllers/dashboardController.js
- [X] T005 Implement analytics aggregation logic in backend/src/services/dashboardService.js (statusDistribution, categoryDistribution, topBorrower queries)
- [X] T006 Register GET /api/dashboard/analytics route in backend/src/routes/dashboard.js
- [X] T007 Fix items-out query to include loan relationship in backend/src/services/dashboardService.js (add Loan include with borrower and lentAt, order by lentAt ASC)
- [X] T008 Test analytics endpoint returns valid JSON structure using curl or Postman

**Checkpoint**: Backend analytics API working - frontend implementation can now begin

---

## Phase 3: User Story 1 - View Dashboard Overview with Visual Analytics (Priority: P1) 🎯 MVP

**Goal**: Display pie charts showing item status distribution, category distribution, and top borrower information

**Independent Test**: Open dashboard and verify three pie charts render with accurate data matching the inventory state. Charts should use constitutional colors and display clear labels with percentages.

### Implementation for User Story 1

- [X] T009 [P] [US1] Create PieChart component in frontend/src/components/PieChart.tsx (props: data array with label/value/color, render SVG paths using trigonometry)
- [X] T010 [P] [US1] Add calculateArcPath utility function to PieChart.tsx (convert start/end angles to SVG path commands)
- [X] T011 [US1] Create DashboardAnalytics component in frontend/src/components/DashboardAnalytics.tsx (container for three pie chart sections)
- [X] T012 [US1] Add fetchDashboardAnalytics API call to frontend/src/services/dashboardService.ts (GET /api/dashboard/analytics)
- [X] T013 [US1] Add DashboardAnalytics TypeScript interface to frontend/src/services/dashboardService.ts (statusDistribution, categoryDistribution, topBorrower types)
- [X] T014 [US1] Implement React Query hook in DashboardAnalytics.tsx (useQuery with 5-minute staleTime, handle loading/error states)
- [X] T015 [US1] Render status distribution pie chart in DashboardAnalytics.tsx (map status data to PieChart with constitutional colors: green for available, yellow for out, red for maintenance)
- [X] T016 [US1] Render category distribution pie chart in DashboardAnalytics.tsx (map category data to PieChart with varied constitutional colors)
- [X] T017 [US1] Render top borrower card in DashboardAnalytics.tsx (show borrower name and count, handle null case with "No items currently lent" message)
- [X] T018 [US1] Add DashboardAnalytics component to frontend/src/pages/DashboardPage.tsx (insert after statistics cards, before items currently out section)
- [X] T019 [US1] Apply glassmorphism styling to all charts and cards (bg-white/5 border-white/10 backdrop-blur-sm)
- [X] T020 [US1] Add ARIA labels to pie chart segments for accessibility (aria-label with "Category: 45%" format)
- [X] T021 [US1] Verify pie charts display accurate data matching backend analytics response
- [X] T022 [US1] Test empty states (no items in inventory, all items in one category)

**Checkpoint**: Dashboard displays visual analytics with pie charts - User Story 1 complete and independently functional

---

## Phase 4: User Story 2 - Navigate to Detailed Views from Dashboard Cards (Priority: P2)

**Goal**: Enable users to click dashboard summary cards to navigate to detailed pages (Total Items → Inventory, Items Out cards → Item details)

**Independent Test**: Click "Total Items" card and verify navigation to /inventory page. Click any "Items Currently Out" card and verify navigation to that item's detail/edit form.

### Implementation for User Story 2

- [X] T023 [P] [US2] Wrap "Total Items" statistics card with React Router Link in frontend/src/pages/DashboardPage.tsx (Link to="/inventory")
- [X] T024 [P] [US2] Add hover state to Total Items card in frontend/src/pages/DashboardPage.tsx (className: hover:ring-2 ring-blue-500/50 transition-all duration-200)
- [X] T025 [US2] Add cursor-pointer class to Total Items card in frontend/src/pages/DashboardPage.tsx
- [X] T026 [US2] Add onClick handler to ItemCarousel cards in frontend/src/components/ItemCarousel.tsx (navigate to /items/${item.id}/edit)
- [X] T027 [US2] Add hover state to carousel item cards in frontend/src/components/ItemCarousel.tsx (className: hover:ring-2 ring-blue-500/50 transition)
- [X] T028 [US2] Add cursor-pointer class to carousel item cards in frontend/src/components/ItemCarousel.tsx
- [X] T029 [US2] Add ARIA labels to clickable cards (aria-label="Navigate to inventory page" and "View item details")
- [X] T030 [US2] Test keyboard navigation (Enter key activates navigation)
- [X] T031 [US2] Verify browser back button works correctly after navigation

**Checkpoint**: All dashboard cards are clickable and navigate correctly - User Story 2 complete

---

## Phase 5: User Story 3 - Browse Items Currently Out with Carousel Navigation (Priority: P1)

**Goal**: Display items currently out one at a time with prev/next arrows, ordered by lent-out date, showing actual borrower name and date (not "Unknown")

**Independent Test**: Lend out 3+ items, open dashboard, verify only first item shows, borrower name and lent date are accurate, prev/next arrows work, items are ordered chronologically.

### Implementation for User Story 3

- [X] T032 [P] [US3] Create useCarousel custom hook in frontend/src/hooks/useCarousel.ts (manage currentIndex state, next/prev functions, canGoNext/canGoPrev computed values)
- [X] T033 [P] [US3] Add keyboard event listener to useCarousel hook (ArrowLeft for prev, ArrowRight for next)
- [X] T034 [US3] Create ItemCarousel component in frontend/src/components/ItemCarousel.tsx (props: items array, render single item with navigation)
- [X] T035 [US3] Implement CSS transition for carousel sliding in ItemCarousel.tsx (parent: overflow-hidden, child: flex with transform translateX, transition-transform duration-300)
- [X] T036 [US3] Render prev button in ItemCarousel.tsx (conditionally shown when canGoPrev, icon: left arrow, onClick: prev())
- [X] T037 [US3] Render next button in ItemCarousel.tsx (conditionally shown when canGoNext, icon: right arrow, onClick: next())
- [X] T038 [US3] Display item card with borrower name in ItemCarousel.tsx (show item.currentLoan.borrower instead of "Unknown Borrower")
- [X] T039 [US3] Display lent-out date in ItemCarousel.tsx (format item.currentLoan.lentAt using Day.js, e.g., "Lent on Jan 20, 2026")
- [X] T040 [US3] Add ARIA live region to carousel for screen readers (aria-live="polite" announcing "Item X of Y")
- [X] T041 [US3] Add ARIA labels to navigation buttons ("Previous item" / "Next item")
- [X] T042 [US3] Update CurrentlyOutSection.tsx to use ItemCarousel component instead of list view
- [X] T043 [US3] Remove old list rendering logic from CurrentlyOutSection.tsx
- [X] T044 [US3] Handle single item case in ItemCarousel.tsx (hide navigation arrows when items.length === 1)
- [X] T045 [US3] Handle empty state in CurrentlyOutSection.tsx (show "No items currently out" message when items array is empty)
- [X] T046 [US3] Verify items are ordered by earliest lent-out date first (backend query should handle this)
- [X] T047 [US3] Test carousel navigation with keyboard (ArrowLeft/ArrowRight)
- [X] T048 [US3] Test rapid clicking of navigation buttons (debounce or disable during transition)
- [X] T049 [US3] Test carousel with different item counts (1 item, 2 items, 10+ items)

**Checkpoint**: Carousel displays items correctly with accurate borrower/date data - User Story 3 complete

---

## Phase 6: User Story 4 - Simplified Dashboard Layout (Priority: P2)

**Goal**: Remove "All Inventory Items" section from dashboard to reduce clutter and focus on summary metrics

**Independent Test**: Open dashboard and verify full inventory list is not visible. Users can access full list via "Total Items" card click (implemented in User Story 2).

### Implementation for User Story 4

- [X] T050 [US4] Remove ItemList component import from frontend/src/pages/DashboardPage.tsx
- [X] T051 [US4] Remove SearchBar component usage from frontend/src/pages/DashboardPage.tsx (no longer needed without full item list)
- [X] T052 [US4] Remove allItems section rendering from frontend/src/pages/DashboardPage.tsx JSX
- [X] T053 [US4] Remove search query state management from frontend/src/pages/DashboardPage.tsx (useState, handleSearch callback)
- [X] T054 [US4] Clean up unused props/functions related to item list display in frontend/src/pages/DashboardPage.tsx
- [X] T055 [US4] Verify dashboard layout without inventory list (should show: statistics cards → analytics charts → items currently out carousel)
- [X] T056 [US4] Test responsive layout on mobile/tablet (ensure focused layout works on all screen sizes)

**Checkpoint**: Dashboard has clean, focused layout - User Story 4 complete

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Final refinements, performance optimization, and comprehensive testing

- [X] T057 [P] Add loading skeletons for pie charts while fetching data in frontend/src/components/DashboardAnalytics.tsx
- [X] T058 [P] Add error handling and retry UI for failed analytics fetch in frontend/src/components/DashboardAnalytics.tsx
- [X] T059 [P] Memoize pie chart calculations in frontend/src/components/PieChart.tsx (use useMemo for arc paths)
- [X] T060 [P] Add fade-in animation to dashboard sections for smooth page load
- [X] T061 [P] Optimize analytics query performance in backend (add database indexes if needed: items.status, loans.returnedAt)
- [X] T062 Test dashboard load time with 100+ items (should be <3 seconds per SC-006)
- [X] T063 Test chart rendering time (should be <2 seconds per SC-001)
- [X] T064 Test carousel transition time (should be <1 second per SC-003)
- [X] T065 Run accessibility audit with axe DevTools (verify WCAG AA compliance)
- [X] T066 Test color contrast ratios for all text (minimum 4.5:1)
- [X] T067 Test keyboard navigation for all interactive elements (Tab, Enter, Arrow keys)
- [X] T068 Test screen reader announcements (NVDA or JAWS)
- [X] T069 [P] Add frontend tests for PieChart component in frontend/tests/components/PieChart.test.tsx (render, arc calculations, empty data)
- [X] T070 [P] Add frontend tests for ItemCarousel component in frontend/tests/components/ItemCarousel.test.tsx (navigation, boundaries, keyboard)
- [X] T071 [P] Add frontend tests for useCarousel hook in frontend/tests/hooks/useCarousel.test.ts (state management, edge cases)
- [X] T072 [P] Add backend tests for analytics endpoint in backend/tests/dashboard-analytics.test.js (status distribution, category distribution, top borrower)
- [X] T073 Cross-browser testing (Chrome, Firefox, Safari, Edge)
- [X] T074 Mobile responsive testing (iOS Safari, Android Chrome)
- [X] T075 Verify all user stories independently testable (can demonstrate each story working in isolation)

**Final Checkpoint**: All features polished, tested, and production-ready

---

## Dependencies & Execution Order

### Parallel Execution Opportunities

**After Phase 2 (Foundational) completes, these can run in parallel**:

**Track 1 - Visual Analytics (US1)**:
- T009-T010 (PieChart component) ║ independent
- T011-T022 (DashboardAnalytics) ║ depends on T009-T010

**Track 2 - Carousel (US3)**:
- T032-T033 (useCarousel hook) ║ independent
- T034-T049 (ItemCarousel) ║ depends on T032-T033

**Track 3 - Navigation (US2)**:
- T023-T031 (Card navigation) ║ independent, can start anytime after Phase 2

**Track 4 - Layout (US4)**:
- T050-T056 (Remove inventory list) ║ independent, can be done last

**Polish (Phase 7)** can start once all user stories are complete, with most tasks parallelizable.

### Critical Path

```
Phase 1 (Setup) → Phase 2 (Foundational: Backend API)
                     ↓
        ┌────────────┼────────────┬────────────┐
        ↓            ↓            ↓            ↓
   US1 (Charts)  US3 (Carousel)  US2 (Nav)  US4 (Layout)
        ↓            ↓            ↓            ↓
        └────────────┼────────────┴────────────┘
                     ↓
              Phase 7 (Polish)
```

### Recommended MVP Scope

**Minimum Viable Product** (fastest value delivery):
- Phase 1: Setup (T001-T003)
- Phase 2: Foundational (T004-T008)
- Phase 3: User Story 1 - Visual Analytics (T009-T022)

This delivers the core value of dashboard insights through pie charts. Other stories can be added incrementally.

---

## Implementation Strategy

### Week 1: Foundation + MVP
- Day 1: Setup + Foundational (Phases 1-2)
- Days 2-3: User Story 1 - Visual Analytics (Phase 3)
- Day 4: Testing and refinement

### Week 2: Additional Features
- Day 1: User Story 3 - Carousel (Phase 5)
- Day 2: User Story 2 - Navigation (Phase 4)
- Day 3: User Story 4 - Layout (Phase 6)
- Day 4: Polish (Phase 7)

**Total Estimated Time**: 8-10 working days (8-12 hours per phase as detailed in quickstart.md)

---

## Task Summary

- **Total Tasks**: 75
- **Setup**: 3 tasks
- **Foundational**: 5 tasks (blocking)
- **User Story 1 (P1)**: 14 tasks (visual analytics)
- **User Story 2 (P2)**: 9 tasks (navigation)
- **User Story 3 (P1)**: 18 tasks (carousel)
- **User Story 4 (P2)**: 7 tasks (layout)
- **Polish**: 19 tasks

**Parallelizable Tasks**: 28 tasks marked with [P]  
**User Story Tasks**: 48 tasks mapped to specific stories

---

## Testing Coverage

Tests are distributed across user stories and polish phase:
- **Unit Tests**: T069-T071 (PieChart, ItemCarousel, useCarousel hook)
- **Integration Tests**: T072 (backend analytics endpoint)
- **Accessibility Tests**: T065-T068 (WCAG AA compliance)
- **Performance Tests**: T062-T064 (load time, rendering speed)
- **Cross-browser Tests**: T073-T074 (compatibility)
- **User Story Tests**: T021-T022, T030-T031, T047-T049, T056 (story-specific validation)

---

*Generated from spec.md, plan.md, data-model.md, and contracts/ on January 24, 2026*
