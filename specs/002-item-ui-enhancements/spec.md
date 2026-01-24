# Feature Specification: Item Screen UI Enhancements

**Feature Branch**: `002-item-ui-enhancements`  
**Created**: 2026-01-23  
**Status**: Draft  
**Input**: User description: "Improve Item screen to be focused more on item management, with grid view, item images, improved card UI with three-dots menu, and click to edit"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Add Images to Items (Priority: P1)

As an inventory manager, I need to add images to inventory items so I can visually identify items at a glance and reduce confusion between similar items.

**Why this priority**: Visual identification is the foundation for improved item management. Without images, grid view and card UI improvements provide limited value. This is the core enhancement that enables better item browsing and recognition.

**Independent Test**: Can be fully tested by uploading an image when creating or editing an item, and verifying the image displays correctly in the item list and cards. Delivers immediate value by making items visually recognizable.

**Acceptance Scenarios**:

1. **Given** I am creating a new item, **When** I click "Upload Image" and select an image file (JPG, PNG, or WebP up to 5MB), **Then** the image is uploaded, a preview is displayed, and the image URL is saved with the item
2. **Given** I am editing an existing item without an image, **When** I upload an image, **Then** the image is associated with the item and displays in all views
3. **Given** I am editing an existing item with an image, **When** I upload a new image, **Then** the old image is replaced with the new one
4. **Given** I am editing an existing item with an image, **When** I click "Remove Image", **Then** the image is removed and the item displays a placeholder image
5. **Given** an item has an image, **When** I view the item in any list or card view, **Then** the image displays with appropriate sizing and aspect ratio preservation
6. **Given** I attempt to upload an invalid file type or file exceeding 5MB, **When** I submit the form, **Then** the system displays an error message and prevents the upload

---

### User Story 2 - Switch Between Grid and List Views (Priority: P2)

As an inventory manager, I need to toggle between grid and list views so I can choose the most efficient layout for browsing items based on my current task (visual browsing vs. detailed information review).

**Why this priority**: Builds on P1 (images) by providing a view mode optimized for visual browsing. Grid view makes the most sense after images are available. This enhances usability without changing core functionality.

**Independent Test**: Can be tested by clicking a view toggle button and verifying the item display switches between grid cards and table rows while preserving all functionality (search, filters, actions). Delivers flexibility in how users browse inventory.

**Acceptance Scenarios**:

1. **Given** I am on the Items page in list view, **When** I click the "Grid View" toggle button, **Then** the items display as cards in a responsive grid layout (3-4 columns on desktop, 2 on tablet, 1 on mobile)
2. **Given** I am on the Items page in grid view, **When** I click the "List View" toggle button, **Then** the items display as rows in a table format with columns for Name, Category, Status, and Actions
3. **Given** I switch between views, **When** I navigate away and return to the Items page, **Then** my last selected view preference is preserved
4. **Given** I am in grid view, **When** I search or filter items, **Then** the grid updates to show only matching items while maintaining the grid layout
5. **Given** I am in either view, **When** I switch views, **Then** all item data, search filters, and sort order are preserved

---

### User Story 3 - Improve Item Card UI with Actions Menu (Priority: P3)

As an inventory manager, I need a cleaner card interface with actions under a menu so the UI is less cluttered and easier to navigate, especially when viewing many items at once.

**Why this priority**: This is a UX refinement that builds on P2 (grid view). It improves visual hierarchy and reduces cognitive load but doesn't add new functionality. The existing button layout still works, making this a polish feature.

**Independent Test**: Can be tested by viewing items in grid view, clicking the three-dots menu on a card, and verifying all actions (Edit, Delete, Lend/Return, View History) are accessible and functional. Delivers a cleaner, more professional interface.

**Acceptance Scenarios**:

1. **Given** I am viewing items in grid view, **When** I view an item card, **Then** I see the item image, name, category, status badge, and a three-dots menu icon (⋮) in the top-right corner
2. **Given** I am viewing an item card, **When** I click the three-dots menu icon, **Then** a dropdown menu appears with options: Edit, Delete (if allowed), Lend/Return (based on status), and View History
3. **Given** the three-dots menu is open, **When** I click outside the menu or press Escape, **Then** the menu closes without taking action
4. **Given** I am viewing items in list view, **When** I view the actions column, **Then** I see a three-dots menu icon that provides the same actions dropdown
5. **Given** I click an action from the three-dots menu, **When** the action completes or I cancel, **Then** the menu closes automatically
6. **Given** an item has status "Lent", **When** I open the three-dots menu, **Then** the "Delete" option is disabled or hidden with a tooltip explaining why

---

### User Story 4 - Click Item Card to Edit (Priority: P4)

As an inventory manager, I need to click anywhere on an item card to open the edit dialog so I can quickly update item details without hunting for the edit button.

**Why this priority**: This is a convenience feature that reduces clicks but doesn't enable new workflows. Users can already edit via the actions menu (P3). This is about optimizing the most common action for power users.

**Independent Test**: Can be tested by clicking on various parts of an item card (except the three-dots menu) and verifying the edit dialog opens with the correct item data pre-filled. Delivers faster access to editing for frequent users.

**Acceptance Scenarios**:

1. **Given** I am viewing items in grid view, **When** I click anywhere on an item card except the three-dots menu or its dropdown, **Then** the edit item dialog opens with the item's current data pre-filled
2. **Given** I am viewing items in list view, **When** I click on an item row except the actions column, **Then** the edit item dialog opens with the item's current data pre-filled
3. **Given** the three-dots menu is open on a card, **When** I click on the card itself, **Then** the menu closes and the edit dialog does NOT open (menu takes precedence)
4. **Given** I am editing an item via click-to-edit, **When** I cancel the edit dialog, **Then** I return to the item list with no changes saved and my scroll position preserved
5. **Given** I am editing an item via click-to-edit, **When** I save changes, **Then** the item updates in the list without requiring a page refresh

---

### Edge Cases

- What happens when an image upload fails mid-upload (network error)? The system should display an error message, rollback to the previous image (if any), and allow retry without losing other form data.
- What happens when viewing grid layout on a very small screen (mobile)? The system should display a single-column grid or automatically switch to list view for optimal usability.
- What happens when an item image URL becomes invalid (file deleted, server error)? The system should display a placeholder image and not break the card layout.
- What happens when clicking rapidly on a card (double-click)? The system should only open the edit dialog once and prevent duplicate submissions.
- What happens when opening the three-dots menu on multiple cards simultaneously? Each menu should operate independently without interfering with others.
- What happens when switching views while an edit dialog is open? The dialog should remain open, and the view change should apply after the dialog is closed.
- What happens when uploading a very large image (e.g., 4.9MB)? The system should process it successfully but may implement client-side compression or optimization in a future enhancement.
- What happens when an item has a very long name or category that doesn't fit in the card? The system should truncate text with ellipsis (...) and show full text on hover or in edit mode.

## Requirements *(mandatory)*

### Functional Requirements

#### Image Management

- **FR-001**: System MUST allow users to upload images when creating or editing items
- **FR-002**: System MUST support JPG, PNG, and WebP image formats
- **FR-003**: System MUST enforce a maximum file size of 5MB per image
- **FR-004**: System MUST validate file type and size before accepting uploads and display clear error messages for invalid files
- **FR-005**: System MUST store image files in a persistent storage location (local filesystem path: `/data/uploads/items/` or similar)
- **FR-006**: System MUST save the image URL/path reference in the Item entity
- **FR-007**: System MUST allow users to replace existing images with new uploads
- **FR-008**: System MUST allow users to remove images from items, reverting to a placeholder image
- **FR-009**: System MUST display placeholder images for items without uploaded images
- **FR-010**: System MUST preserve image aspect ratios when displaying in cards and lists
- **FR-011**: System MUST handle image upload failures gracefully, preserving form data and allowing retry

#### View Mode Toggle

- **FR-012**: System MUST provide a toggle button to switch between grid view and list view on the Items page
- **FR-013**: System MUST display items in a responsive grid layout in grid view (3-4 columns on desktop ≥1200px, 2 columns on tablet 768-1199px, 1 column on mobile <768px)
- **FR-014**: System MUST display items in a table format with sortable columns in list view
- **FR-015**: System MUST persist the user's view preference (grid or list) across browser sessions using localStorage
- **FR-016**: System MUST preserve search filters, sort order, and scroll position when switching between views
- **FR-017**: System MUST update the view mode icon/label to indicate the current active view

#### Item Card UI (Grid View)

- **FR-018**: System MUST display each item card with: image (or placeholder), item name, category, status badge, and three-dots menu icon in the top-right corner
- **FR-019**: System MUST display a three-dots menu icon (⋮) that opens a dropdown with actions: Edit, Delete (conditional), Lend/Return (conditional), View History
- **FR-020**: System MUST show "Return" in the menu when item status is "Lent", and "Lend" when status is "Available"
- **FR-021**: System MUST disable or hide the "Delete" option in the menu for items with status "Lent" or with existing LendingLog history, with a tooltip explaining the restriction
- **FR-022**: System MUST close the three-dots menu when clicking outside, pressing Escape, or after selecting an action
- **FR-023**: System MUST position the dropdown menu to remain visible (flip up/left if near screen edges)
- **FR-024**: System MUST prevent the edit dialog from opening when clicking the three-dots menu or its dropdown

#### Item List UI (List View)

- **FR-025**: System MUST display a three-dots menu icon in the Actions column for each item row
- **FR-026**: System MUST provide the same dropdown menu actions as grid view from the three-dots icon
- **FR-027**: System MUST maintain existing table functionality (sortable columns, row highlighting)

#### Click-to-Edit

- **FR-028**: System MUST open the edit item dialog when clicking anywhere on an item card in grid view, except on the three-dots menu or its dropdown
- **FR-029**: System MUST open the edit item dialog when clicking anywhere on an item row in list view, except in the Actions column
- **FR-030**: System MUST pre-fill the edit dialog with the item's current data (Name, Description, Category, Status, Image)
- **FR-031**: System MUST prevent opening the edit dialog when the three-dots menu is already open
- **FR-032**: System MUST close the three-dots menu if clicking on the card/row itself (menu takes precedence over edit)
- **FR-033**: System MUST preserve scroll position when opening and closing the edit dialog
- **FR-034**: System MUST update the item in the list without page refresh after saving edits

#### Item Entity Updates

- **FR-035**: System MUST add an ImageURL field to the Item entity to store the path or URL to the uploaded image
- **FR-036**: System MUST make ImageURL nullable/optional (items can exist without images)
- **FR-037**: System MUST include ImageURL in all API responses for item data

#### API Design & Standards (Constitution Compliance)

- **FR-038**: System MUST implement image upload endpoint at `/api/v1/items/:id/image` (POST) for uploading images to existing items
- **FR-039**: System MUST implement image upload support in item creation endpoint `/api/v1/items` (POST) accepting multipart/form-data
- **FR-040**: System MUST implement image deletion endpoint at `/api/v1/items/:id/image` (DELETE) for removing item images
- **FR-041**: System MUST return appropriate HTTP status codes: 201 Created for successful upload, 400 Bad Request for invalid files, 413 Payload Too Large for oversized files
- **FR-042**: System MUST include image URL in the consistent JSON envelope format: `{ "data": { "id": 1, "name": "...", "imageUrl": "..." }, "error": null, "message": "Image uploaded successfully" }`

### Key Entities

- **Item** (Updated): Existing entity with new ImageURL field (text, nullable). Contains Name, Description, Category, Status (unchanged). ImageURL stores the path or URL reference to the uploaded image file (e.g., "/uploads/items/item-123.jpg"). When null, the frontend displays a placeholder image.

- **Upload/File Storage** (Conceptual): Represents the storage mechanism for uploaded images. Not a database entity, but a filesystem or storage service. Images are organized in `/data/uploads/items/` with unique filenames (e.g., `item-{id}-{timestamp}.{ext}`). System must handle file I/O operations (write, delete) and serve images via static file hosting.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can upload an image to an item in under 45 seconds including image selection and form submission
- **SC-002**: Item cards in grid view display images clearly with proper aspect ratios and no visual distortion
- **SC-003**: Users can switch between grid and list views in under 2 seconds with no data loss or layout glitches
- **SC-004**: The Items page loads and renders up to 100 items in grid view within 3 seconds (including image loading with lazy loading optimization)
- **SC-005**: Users can access all item actions (Edit, Delete, Lend/Return, View History) from the three-dots menu within 3 clicks
- **SC-006**: Users can open the edit dialog by clicking on an item card in under 1 second
- **SC-007**: 90% of users prefer the new grid view with images over the old list-only view (measured through user feedback survey or A/B testing)
- **SC-008**: Zero image upload failures occur for valid file types under 5MB under normal network conditions
- **SC-009**: The system maintains responsive performance (no UI freezing) when uploading images up to 5MB
- **SC-010**: 95% of users can successfully upload an item image on their first attempt without errors or confusion

## Assumptions

- **A-001**: Image storage is handled via local filesystem storage in the `/data/uploads/items/` directory. Cloud storage integration (S3, Azure Blob) is out of scope but may be a future enhancement.
- **A-002**: Images are served as static files via the web server (e.g., Express static middleware) without additional CDN or optimization layers.
- **A-003**: Image optimization (compression, resizing, thumbnail generation) is not required in this version; client-side browser rendering handles aspect ratio and sizing.
- **A-004**: Only one image per item is supported; gallery/multiple images are out of scope.
- **A-005**: Image editing tools (crop, rotate, filters) are not required; users must prepare images before upload.
- **A-006**: The system operates in a trusted environment; malware scanning of uploaded images is not required (but file type validation is enforced).
- **A-007**: Concurrent editing of the same item by multiple users is handled at the database level (last write wins); real-time collaboration is not required.
- **A-008**: Image alt text for accessibility is auto-generated from item name; custom alt text is not required.

## Out of Scope

- Multiple images per item (image gallery)
- Image editing tools (crop, rotate, resize, filters)
- Video or document uploads (only images)
- Cloud storage integration (S3, Azure Blob, Cloudinary)
- Image compression or thumbnail generation on the server
- Drag-and-drop image upload (file picker only)
- Image zoom or lightbox preview in cards
- Bulk image upload for multiple items
- Image metadata extraction (EXIF data, dimensions)
- Malware or virus scanning of uploaded images
- Custom image alt text for accessibility (auto-generated from item name)
- Real-time collaborative editing with conflict resolution
- Undo/redo for image changes
- Image versioning or history tracking
