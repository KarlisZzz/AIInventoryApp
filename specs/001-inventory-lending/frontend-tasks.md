# Frontend Tasks: React SPA (Inventory & Lending)

**Feature**: 001-inventory-lending - Frontend
**Date**: 2026-01-17

Purpose: A focused tasks list for implementing the React frontend: Vite + TypeScript, Tailwind CSS, Axios API layer, TanStack Query for server-state, and core pages/components.

Format: Each task follows the project's checklist format:

- [ ] T### [P?] [Story?] Description with exact file path

---

## Phase 1: Setup

- [ ] FT001 Initialize Vite React+TypeScript project in frontend/
- [ ] FT002 [P] Add `package.json` scripts: `dev`, `build`, `preview`, `test`
- [ ] FT003 [P] Install dependencies: `react`, `react-dom`, `react-router-dom`, `@tanstack/react-query`, `axios`, `tailwindcss`, `postcss`, `autoprefixer`, `typescript`, `vitest`, `@testing-library/react`
- [ ] FT004 [P] Configure Tailwind: create `tailwind.config.ts` and `postcss.config.js`
- [ ] FT005 [P] Create folder structure under `frontend/src/`: `components/`, `hooks/`, `services/`, `pages/`, `api/`, `assets/`
- [ ] FT006 Create `frontend/src/main.tsx` and `frontend/src/App.tsx` with `QueryClientProvider`
- [ ] FT007 [P] Create `frontend/.env.example` documenting `VITE_API_BASE_URL`

## Phase 2: API Layer (based on contracts/api.yaml)

- [ ] FT010 [P] Create Axios instance in `frontend/src/api/axios.ts` with baseURL from env
- [ ] FT011 [P] Implement `frontend/src/services/itemService.ts` with methods:
  - `getItems(params) -> GET /items`
  - `getItemById(itemId) -> GET /items/{itemId}`
  - `createItem(payload) -> POST /items`
  - `updateItem(itemId, payload) -> PUT /items/{itemId}`
  - `deleteItem(itemId) -> DELETE /items/{itemId}`
- [ ] FT012 [P] Implement `frontend/src/services/userService.ts` with `getUsers() -> GET /users`
- [ ] FT013 [P] Implement `frontend/src/services/lendingService.ts` with `lendItem(itemId, body) -> POST /items/{itemId}/lend` and `returnItem(itemId, body) -> POST /items/{itemId}/return`
- [ ] FT013b [P] Implement history service methods in `frontend/src/services/lendingService.ts`:
  - `getItemHistory(itemId) -> GET /items/{itemId}/history`
  - `getUserHistory(userId) -> GET /users/{userId}/history`
- [ ] FT013c [P] Implement `frontend/src/services/dashboardService.ts` with:
  - `getDashboard() -> GET /dashboard`
  - `getItemsOut() -> GET /dashboard/items-out`
- [ ] FT014 [P] Add typed response interfaces in `frontend/src/types/api.ts` matching OpenAPI schemas

## Phase 3: Core Components

- [ ] FT020 [P] Create `frontend/src/components/Badge.tsx` - reusable status badge (Available=green, Lent=yellow, Maintenance=red)
- [ ] FT021 [P] Create `frontend/src/components/ItemTable.tsx` - table listing items with columns: Name, Category, Status, Actions
- [ ] FT022 [P] Create `frontend/src/components/SearchBar.tsx` - search input with debounce
- [ ] FT023 [P] Create `frontend/src/components/LendingModal.tsx` - modal to select user and add notes (props: `itemId`, `onSuccess`)
- [ ] FT024 [P] Create `frontend/src/components/ReturnModal.tsx` - modal to add condition notes on return (props: `itemId`, `onSuccess`)
- [ ] FT025 [P] Create `frontend/src/components/Timeline.tsx` - vertical timeline UI for history logs
- [ ] FT026 [P] Create `frontend/src/components/ConfirmDialog.tsx` - confirmation dialog for deletes

## Phase 4: Pages

- [ ] FT030 [P] Create `frontend/src/pages/InventoryPage.tsx` - includes `SearchBar`, `ItemTable`, action handlers for Lend/Return/View
- [ ] FT031 [P] Create `frontend/src/pages/ItemDetailPage.tsx` - shows item details and `Timeline` with lending history
- [ ] FT032 [P] Create `frontend/src/pages/DashboardPage.tsx` - summary cards and items currently out
- [ ] FT033 [P] Add routes in `frontend/src/App.tsx` for `/`, `/inventory`, `/inventory/:itemId`

## Phase 5: Hooks and React Query

- [ ] FT040 [P] Create `frontend/src/hooks/useItems.ts` (useQuery for items list, supports search params)
- [ ] FT041 [P] Create `frontend/src/hooks/useItem.ts` (useQuery for single item)
- [ ] FT042 [P] Create `frontend/src/hooks/useLend.ts` (useMutation for lendItem with onSuccess invalidations)
- [ ] FT043 [P] Create `frontend/src/hooks/useReturn.ts` (useMutation for returnItem with onSuccess invalidations)
- [ ] FT044 [P] Ensure `onSuccess` invalidates `['items']`, `['item', itemId]`, and `['dashboard']` queries so UI refetches automatically
- [ ] FT045 [P] Create `frontend/src/hooks/useItemHistory.ts` (useQuery for `getItemHistory`)
- [ ] FT046 [P] Create `frontend/src/hooks/useUserHistory.ts` (useQuery for `getUserHistory`)
- [ ] FT047 [P] Create `frontend/src/hooks/useDashboard.ts` (useQuery for `getDashboard` and `getItemsOut`)

## Phase 6: UX, Tests, and Docs

- [ ] FT050 [P] Add loading skeletons and empty states for Inventory and ItemDetail
- [ ] FT051 [P] Write unit tests for `Badge`, `SearchBar`, and `Timeline` components
- [ ] FT052 [P] Write integration tests for lend/return flows using `msw` mocks
- [ ] FT053 Create `frontend/README.md` with setup and run instructions
- [ ] FT054 [P] Document refetch behavior in readme (which queries are invalidated)

## Verification Checkpoints

- [ ] FT060 **VERIFY**: InventoryPage updates automatically after a successful return (no full page refresh)
- [ ] FT061 **VERIFY**: Lend flow creates LendingLog and item status updates to "Lent"
- [ ] FT062 **VERIFY**: Timeline on ItemDetailPage shows entries in reverse chronological order
- [ ] FT063 **VERIFY**: Badge colors correspond to status values
- [ ] FT064 **VERIFY**: API service methods match endpoints in `specs/001-inventory-lending/contracts/api.yaml`

---

Total Frontend Tasks: 36 (many marked [P] for parallel work)

Next step: I can scaffold the `frontend/` project and implement `api/axios.ts`, `Badge`, `LendingModal`, `InventoryPage`, `ItemDetailPage`, and React Query hooks. Would you like me to scaffold and implement these now? 
