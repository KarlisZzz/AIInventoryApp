# Feature Specification: Inventory Management with Lending Workflow

**Feature Branch**: `001-inventory-lending`  
**Created**: 2026-01-17  
**Status**: Draft  
**Input**: User description: "Inventory Management system with lending workflow"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manage Inventory Items (Priority: P1)

As an inventory manager, I need to create, view, update, and delete items in the inventory so I can maintain an accurate catalog of all available items.

**Why this priority**: Core CRUD operations are the foundation of the system. Without the ability to manage items, no other functionality can work. This is the minimum viable product that delivers immediate value.

**Independent Test**: Can be fully tested by creating sample items, updating their details, searching for them, and removing obsolete items. Delivers a functional inventory catalog without requiring lending features.

**Acceptance Scenarios**:

1. **Given** I am on the inventory management page, **When** I click "Add Item" and fill in Name, Description, Category, and Status, **Then** the new item appears in the inventory list with default status "Available"
2. **Given** an item exists in the inventory, **When** I click "Edit" and modify any field, **Then** the changes are saved and reflected immediately in the inventory list
3. **Given** an item exists with status "Available", **When** I click "Delete" and confirm, **Then** the item is removed from the inventory permanently
4. **Given** I am viewing the inventory, **When** I use the search/filter function, **Then** only items matching my search criteria are displayed

---

### User Story 2 - Lend Items to Users (Priority: P2)

As a staff member, I need to record when an item is lent to a user so I can track who has what equipment and ensure accountability.

**Why this priority**: This implements the core lending workflow. It builds on P1 (item management) by adding the ability to track item loans. This is the primary differentiator of a lending system versus a simple inventory catalog.

**Independent Test**: Can be tested by selecting an available item, assigning it to a user, and verifying the item status changes to "Lent" and a lending log is created. Delivers value by tracking item custody.

**Acceptance Scenarios**:

1. **Given** an item has status "Available", **When** I select "Lend" and choose a user and optionally add condition notes, **Then** the item status changes to "Lent", a lending log is created with the current date, and the dashboard updates to show the item as "Currently Out"
2. **Given** an item has status "Lent", **When** I attempt to lend it again, **Then** the system prevents the action and displays a message indicating the item is already lent
3. **Given** I am lending an item, **When** I search for a user by name or email, **Then** matching users appear in a dropdown for selection

---

### User Story 3 - Return Items (Priority: P3)

As a staff member, I need to record when an item is returned so I can make it available for others and complete the lending transaction.

**Why this priority**: This completes the lending cycle. While P2 allows lending items out, P3 enables the return process to free items for re-lending. This builds directly on P2 functionality.

**Independent Test**: Can be tested by returning a previously lent item, verifying status changes to "Available", the lending log is timestamped with return date, and the dashboard is updated. Delivers complete lending lifecycle management.

**Acceptance Scenarios**:

1. **Given** an item has status "Lent", **When** I select "Return" and optionally add return condition notes, **Then** the item status changes to "Available", the lending log is updated with DateReturned (current date) and condition notes, and the item is removed from "Items Currently Out"
2. **Given** an item has status "Available", **When** I attempt to return it, **Then** the system prevents the action since the item is not currently lent
3. **Given** an item is returned, **When** the return is completed, **Then** the item becomes immediately available for lending again

---

### User Story 4 - View Lending History (Priority: P4)

As an inventory manager, I need to view the complete lending history for any item so I can track usage patterns, identify frequent borrowers, and resolve disputes.

**Why this priority**: This provides audit trail and reporting capabilities. It's valuable but not essential for the basic lend/return workflow. Users can operate the system without this feature, though it greatly enhances management oversight.

**Independent Test**: Can be tested by selecting an item and viewing all past lending transactions with dates, users, and condition notes. Delivers transparency and accountability.

**Acceptance Scenarios**:

1. **Given** I select an item, **When** I click "View History", **Then** I see a chronological list of all lending logs including User, DateLent, DateReturned, and ConditionNotes
2. **Given** an item has never been lent, **When** I view its history, **Then** I see a message "No lending history available"
3. **Given** I am viewing lending history, **When** I filter by date range or user, **Then** only matching transactions are displayed

---

### User Story 5 - Dashboard Overview (Priority: P5)

As a staff member, I need a dashboard showing items currently out and the full searchable inventory so I can quickly assess availability and find items.

**Why this priority**: This provides usability enhancements and quick access to key information. While helpful, users can access the same information through other views. This is a convenience feature that improves user experience.

**Independent Test**: Can be tested by opening the application and verifying the dashboard displays "Items Currently Out" and a searchable inventory table. Delivers at-a-glance system status.

**Acceptance Scenarios**:

1. **Given** I open the application, **When** the dashboard loads, **Then** I see a section showing all items with status "Lent" including borrower name and date lent
2. **Given** I am on the dashboard, **When** I view the inventory table, **Then** I see all items with columns for Name, Category, Status, and actions (Edit, Delete, Lend/Return, View History)
3. **Given** I am on the dashboard, **When** I use the search box, **Then** the inventory table filters in real-time to show matching items
4. **Given** there are no items currently lent, **When** I view the dashboard, **Then** the "Items Currently Out" section shows "No items currently lent"

---

### Edge Cases

- What happens when a user is deleted but has active lending logs? The system preserves lending history via denormalized BorrowerName and BorrowerEmail fields captured at lend time. User deletion does not affect LendingLog audit trail. (User CRUD is out of scope per Assumption A-001.)
- What happens when attempting to lend an item in "Maintenance" status? The system should prevent lending and display a message that the item is not available.
- What happens when creating duplicate items with the same name? The system should allow it (multiple identical items may exist) but could warn the user.
- What happens when the database connection fails during a lend/return transaction? The system should rollback any partial changes to maintain data integrity (atomic transactions).
- What happens when searching with special characters or empty strings? The system should handle gracefully without errors and return appropriate results or empty sets.
- What happens when attempting to return an item after 30 days? The system should allow it but could flag it for review (overdue tracking is future enhancement).

## Requirements *(mandatory)*

### Functional Requirements

#### API Design & Standards (Constitution Compliance)

- **FR-001-API**: System MUST implement API versioning via URL path prefix `/api/v1/` for all endpoints
- **FR-002-API**: System MUST return all API responses in a consistent JSON envelope format: `{ "data": <payload>, "error": <error_object_or_null>, "message": <string_or_null> }`
- **FR-003-API**: System MUST use semantic HTTP status codes (200 OK, 201 Created, 400 Bad Request, 404 Not Found, 500 Internal Server Error)
- **FR-004-API**: System MUST include API version documentation in OpenAPI specification

#### Item Management (User Story 1)

- **FR-005**: System MUST allow users to create new items with Name (required), Description (optional), Category (required), and Status (default: "Available")
- **FR-006**: System MUST allow users to view all items in a table format with sortable columns
- **FR-007**: System MUST allow users to edit item details (Name, Description, Category, Status)
- **FR-008**: System MUST allow users to delete items that have status "Available" or "Maintenance" AND have zero associated LendingLog records (never been lent)
- **FR-009**: System MUST prevent deletion of items with status "Lent" or with any LendingLog history and display an appropriate error message
- **FR-010**: System MUST provide search/filter functionality across Name, Description, and Category fields
- **FR-011**: System MUST support item status values: "Available", "Lent", "Maintenance"

#### User Management (Read-Only Operations)

- **FR-012**: System MUST store user information including Name (required), Email (required, unique), and Role (required)
- **FR-013**: System MUST validate email format before saving user records
- **FR-014**: System MUST provide a user selection interface when lending items
- **FR-015**: User creation, updates, and deletion are OUT OF SCOPE for this feature (handled by separate authentication/admin system per Assumption A-001)
- **FR-016**: System MUST preserve user information in LendingLog records by denormalizing borrower details (BorrowerName, BorrowerEmail) at the time of lending to ensure audit trail integrity even if user records change later

#### Lending Operations (User Story 2)

- **FR-017**: System MUST allow lending an item with status "Available" to a user
- **FR-018**: System MUST atomically update item status to "Lent", create a LendingLog entry, and denormalize borrower details (BorrowerName, BorrowerEmail) within a single database transaction (see FR-031 for transaction requirements)
- **FR-019**: System MUST record DateLent (current timestamp), BorrowerName, BorrowerEmail, and optional ConditionNotes in the lending log
- **FR-020**: System MUST prevent lending items with status "Lent" or "Maintenance"
- **FR-021**: System MUST create a lending log that references both the Item ID and User ID

#### Return Operations (User Story 3)

- **FR-022**: System MUST allow returning an item with status "Lent"
- **FR-023**: System MUST atomically update item status to "Available" and update the LendingLog with DateReturned within a single database transaction (see FR-031 for transaction requirements)
- **FR-024**: System MUST record DateReturned (current timestamp) and optional return ConditionNotes in the lending log
- **FR-025**: System MUST prevent returning items with status "Available" or "Maintenance"

#### History & Reporting (User Story 4)

- **FR-026**: System MUST display a complete lending history for each item showing all past LendingLog entries
- **FR-027**: System MUST display lending history in chronological order (most recent first)
- **FR-028**: System MUST show BorrowerName (denormalized), DateLent, DateReturned, and ConditionNotes for each log entry to ensure audit trail integrity

#### Dashboard (User Story 5)

- **FR-029**: System MUST display a "Items Currently Out" section showing all items with status "Lent"
- **FR-030**: System MUST display borrower name (from denormalized BorrowerName field) and date lent for each item in "Items Currently Out"
- **FR-031-DASH**: System MUST provide a searchable inventory table on the dashboard
- **FR-032**: System MUST update the dashboard after lend/return operations (via client-side cache invalidation)

#### Data Integrity & Transactions (Constitution Principle III)

- **FR-031**: System MUST execute all lending and return operations within explicit database transactions to ensure atomicity (referenced by FR-018, FR-023). Each transaction MUST: (a) BEGIN TRANSACTION at service layer entry, (b) perform all state updates, (c) COMMIT on success, (d) ROLLBACK completely on any failure
- **FR-033**: System MUST enforce foreign key constraints between LendingLogs and Items, LendingLogs and Users via `PRAGMA foreign_keys = ON` at application startup
- **FR-034**: System MUST use database-level RESTRICT constraint on Item deletion when LendingLog records exist (enforces FR-008/FR-009)

### Performance & Testing Requirements

- **FR-035**: System MUST implement performance benchmarking for SC-004 (dashboard load time) and SC-005 (search response time) using automated testing tools (e.g., k6, Lighthouse, or custom scripts)
- **FR-036**: Performance tests MUST be executed against a representative dataset (minimum 500 items, 50 users, 1000 lending logs) to validate success criteria
- **FR-037**: System MUST log response times for critical operations (lend, return, dashboard load, search) to enable performance monitoring
- **FR-038**: Verification tasks MUST include automated performance test execution with pass/fail thresholds matching success criteria

### Key Entities

- **Item**: Represents physical inventory items. Contains Name (text), Description (text), Category (text), Status (enum: "Available", "Lent", "Maintenance"). Status determines whether item can be lent. Uniquely identified to support lending operations. Cannot be deleted if any LendingLog records exist (audit preservation).

- **User**: Represents people who can borrow items. Contains Name (text), Email (text, unique), Role (text). Users are referenced in lending logs to track accountability.

- **LendingLog**: Represents a single lending transaction (immutable audit record). Contains reference to Item (foreign key), reference to User (foreign key), denormalized borrower data (BorrowerName, BorrowerEmail captured at lend time), DateLent (timestamp), DateReturned (timestamp, nullable), ConditionNotes (text, optional). Each log tracks one complete borrow-return cycle. DateReturned is null while item is lent. Denormalized borrower fields ensure audit trail integrity even if User records change later.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create, edit, and delete inventory items in under 30 seconds per operation
- **SC-002**: Users can complete a lending operation (select item and user) in under 45 seconds
- **SC-003**: Users can complete a return operation in under 30 seconds
- **SC-004**: The dashboard loads and displays current status within 2 seconds
- **SC-005**: Search results appear within 1 second of typing
- **SC-006**: 100% of lend/return operations either complete fully or rollback completely (no partial updates)
- **SC-007**: Users can view lending history for any item with all transactions displayed correctly
- **SC-008**: The system accurately reflects item availability status at all times (Available items are not lent, Lent items are not available)
- **SC-009**: 95% of test users (minimum sample size: 20) can successfully complete a lend-and-return cycle without assistance on first attempt, as measured by moderated usability testing with task completion tracking. (Note: This is a UX research goal; implementation verification uses functional test coverage instead.)
- **SC-010**: Zero data integrity violations occur during normal operations (no orphaned logs, inconsistent statuses, or missing references)

## Assumptions

- **A-001**: User authentication, authorization, and CRUD operations (create/update/delete users) are handled by a separate admin system and are OUT OF SCOPE for this feature. Users are pre-existing in the database for lending operations.
- **A-002**: Email notifications for overdue items are out of scope for this feature
- **A-003**: Item quantity tracking (multiple identical items) is not required; each item is unique
- **A-004**: Photo uploads for items are not required in this version
- **A-005**: Barcode scanning is not required; manual selection is sufficient
- **A-006**: Concurrent lending attempts on the same item will be handled by database-level locking (first transaction wins)
- **A-007**: The system operates during normal business hours; 24/7 availability is not required
- **A-008**: Data export and backup features are handled at the infrastructure level

## Out of Scope

- Reservation system (booking items in advance)
- Overdue item tracking and notifications
- Fine/penalty management
- Item maintenance scheduling
- Multi-location inventory management
- Mobile app (web interface only)
- Bulk import/export of items
- Advanced analytics and reports
- Item depreciation tracking
- User permission levels (all users have same capabilities)
