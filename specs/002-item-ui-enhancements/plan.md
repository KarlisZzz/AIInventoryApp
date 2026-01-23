# Implementation Plan: Item Screen UI Enhancements

**Branch**: `002-item-ui-enhancements` | **Date**: 2026-01-23 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-item-ui-enhancements/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/commands/plan.md` for the execution workflow.

## Summary

Enhance the Item screen with visual improvements focused on item management: add image upload capability (Item entity + storage), implement grid/list view toggle with localStorage persistence, refactor actions into three-dots dropdown menu, and enable click-to-edit for faster item updates. This builds on existing functional components to create a more intuitive, visual-first inventory browsing experience.

## Technical Context

**Language/Version**: TypeScript 5.x (Frontend), Node.js 18+ (Backend)  
**Primary Dependencies**: React 18, Vite, TailwindCSS 3.x (Frontend); Express.js, SQLite3, multer (Backend)  
**Storage**: SQLite3 database (Item entity with ImageURL field), Local filesystem for image files (`/data/uploads/items/`)  
**Testing**: Vitest (Frontend unit tests), Manual testing for UI interactions  
**Target Platform**: Web application (responsive design: desktop ≥1200px, tablet 768-1199px, mobile <768px)  
**Project Type**: Web application (frontend + backend)  
**Performance Goals**: Grid view renders 100 items <3s with lazy image loading, view toggle <2s, image upload <45s  
**Constraints**: Image files ≤5MB, supported formats JPG/PNG/WebP, maintain accessibility (WCAG AA), no page refresh on edits  
**Scale/Scope**: Single-feature enhancement affecting 4 user stories, ~8 frontend components modified/created, 3 backend endpoints added

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

### ✅ Gate 1: RESTful API Design (Principle I)
- **Status**: PASS
- **Validation**: New endpoints follow RESTful conventions:
  - `POST /api/v1/items/:id/image` for image upload
  - `DELETE /api/v1/items/:id/image` for image removal
  - Multipart/form-data support in `POST /api/v1/items` for creation with image
  - Proper HTTP status codes (201 Created, 400 Bad Request, 413 Payload Too Large)
  - Consistent JSON envelope: `{ data, error, message }`

### ✅ Gate 2: Modular Architecture (Principle II)
- **Status**: PASS
- **Validation**: Follows existing separation of concerns:
  - Routes: Image upload endpoint definitions in `routes/itemRoutes.js`
  - Controllers: File validation and response formatting in `controllers/itemController.js`
  - Services: Image storage logic (save/delete files) in `services/itemService.js`
  - Models: Item entity with ImageURL field in `models/Item.js`
  - Frontend: Separate components (ItemCard, ItemList, ViewToggle, DropdownMenu)

### ⚠️ Gate 3: Atomic Transaction Integrity (Principle III)
- **Status**: CONDITIONAL PASS
- **Validation**: Image operations do NOT require database transactions (file I/O is separate from database state). However, when creating/updating items WITH images, the following atomic sequence is required:
  1. Validate and save image file to filesystem
  2. BEGIN transaction
  3. Insert/update Item record with ImageURL
  4. COMMIT transaction
  5. On failure: Rollback DB + delete uploaded file (orphan cleanup)
- **Complexity Justification**: Filesystem operations are outside DB transactions by design. Orphan file cleanup on error prevents disk space leaks.

### ✅ Gate 4: Data Integrity & Constraints (Principle IV)
- **Status**: PASS
- **Validation**: Item entity update maintains existing constraints:
  - ImageURL field is nullable (items can exist without images)
  - Foreign key constraints remain enabled (PRAGMA foreign_keys = ON)
  - No cascading delete required (images are orphaned on item delete - handled by service layer cleanup)

### ✅ Gate 5: Clean Code & Async Operations (Principle V)
- **Status**: PASS
- **Validation**:
  - All file I/O operations use async/await (multer middleware, fs.promises)
  - Try/catch blocks for error handling in image upload/delete
  - Descriptive function names (uploadItemImage, deleteItemImage, getImageUrl)
  - Frontend: useState/useEffect for view toggle persistence, event handlers

### ✅ Gate 6: Component-Based UI Development (Principle VI)
- **Status**: PASS
- **Validation**: Frontend follows functional component patterns:
  - Existing ItemCard/ItemList components refactored (no class components)
  - Custom hooks: useLocalStorage for view preference persistence
  - useState for dropdown menu open/close state, image preview
  - useEffect for view preference initialization
  - Component composition: ItemCard contains DropdownMenu component

### ✅ Gate 7: UI/UX Design Standards (Principle VII)
- **Status**: PASS
- **Validation**: Design adheres to constitutional palette and standards:
  - **Primary**: Blue-500 (#3B82F6) for view toggle active state, action buttons
  - **Background**: Slate-800 (#1E293B) for cards, Slate-900 (#0F172A) for page background
  - **Glassmorphism**: Cards use `bg-slate-800/50 backdrop-blur-sm border-slate-700`
  - **Status Badges**: Muted opacity (bg-green-500/20 text-green-400) for Available/Lent
  - **Interactive States**: Hover with ring-2 ring-blue-500/50, focus rings, disabled opacity 40%
  - **Accessibility**: Proper aria-labels for icon buttons, keyboard navigation, 4.5:1 contrast ratio

**Overall Status**: ✅ ALL GATES PASS (1 conditional pass with justified complexity)

**Re-evaluation Checkpoint**: After Phase 1 (data-model.md, contracts), verify that image upload transaction handling is documented in quickstart.md with orphan cleanup pattern.

## Project Structure

### Documentation (this feature)

```text
specs/002-item-ui-enhancements/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output - Technology research decisions
├── data-model.md        # Phase 1 output - Item entity schema update
├── quickstart.md        # Phase 1 output - Implementation guide
├── contracts/           # Phase 1 output - API endpoint specifications
│   ├── POST-items-id-image.yaml
│   ├── DELETE-items-id-image.yaml
│   └── POST-items-with-image.yaml
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)

```text
# Web application structure (frontend + backend)

backend/
├── src/
│   ├── models/
│   │   └── Item.js              # [MODIFY] Add ImageURL field
│   ├── services/
│   │   ├── itemService.js       # [MODIFY] Add image upload/delete logic
│   │   └── fileStorageService.js # [NEW] Filesystem operations for images
│   ├── controllers/
│   │   └── itemController.js    # [MODIFY] Add uploadImage, deleteImage handlers
│   ├── routes/
│   │   └── itemRoutes.js        # [MODIFY] Add image upload/delete endpoints
│   ├── middleware/
│   │   ├── upload.js            # [NEW] Multer configuration for image uploads
│   │   └── errorHandler.js      # [MODIFY] Handle multer errors (file size, type)
│   └── db/
│       └── migrations/          # [NEW] Add migration for ImageURL field
│           └── 003_add_item_image_url.js
├── data/
│   └── uploads/
│       └── items/               # [NEW] Image storage directory
└── tests/
    ├── integration/
    │   └── itemImage.test.js    # [NEW] Image upload/delete API tests
    └── unit/
        └── fileStorageService.test.js # [NEW] Filesystem service tests

frontend/
├── src/
│   ├── components/
│   │   ├── ItemCard.tsx         # [MODIFY] Add image display, three-dots menu, click-to-edit
│   │   ├── ItemList.tsx         # [MODIFY] Add grid/list view toggle rendering
│   │   ├── ItemForm.tsx         # [MODIFY] Add image upload field with preview
│   │   ├── ViewToggle.tsx       # [NEW] Grid/List toggle button component
│   │   ├── DropdownMenu.tsx     # [NEW] Three-dots menu component
│   │   └── ImageUpload.tsx      # [NEW] Image upload/preview/remove component
│   ├── hooks/
│   │   └── useLocalStorage.ts   # [NEW] Custom hook for view preference persistence
│   ├── pages/
│   │   └── InventoryPage.tsx    # [MODIFY] Integrate view toggle, edit dialog handling
│   ├── services/
│   │   └── itemService.ts       # [MODIFY] Add uploadImage, deleteImage API calls
│   └── types/
│       └── item.ts              # [MODIFY] Add imageUrl field to Item type
└── tests/
    └── components/
        ├── ViewToggle.test.tsx  # [NEW] View toggle component tests
        └── DropdownMenu.test.tsx # [NEW] Dropdown menu tests
```

**Structure Decision**: Using existing web application structure (frontend + backend). Image storage is local filesystem-based (`/data/uploads/items/`) with Express static middleware for serving. Frontend follows component-based architecture with custom hooks for state persistence. Backend maintains modular separation (routes → controllers → services → models).

## Complexity Tracking

> **No violations requiring justification**

All Constitutional principles are satisfied without complexity exceptions. The conditional pass for Atomic Transaction Integrity (Gate 3) is a documentation requirement, not a violation—filesystem operations are intentionally outside database transactions, with explicit orphan cleanup patterns documented in the implementation.
