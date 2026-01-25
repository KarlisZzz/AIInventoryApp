# Feature Specification: Dashboard Improvements

**Feature Branch**: `003-dashboard-improvements`  
**Created**: January 24, 2026  
**Status**: Draft  
**Input**: User description: "I want to make a plan for improvements in Dashboard: 1.Remove All inventory Items view 2. in Items Currently Out 2.1. Show only first row, ordered by first lent out. Add arrow to the right to see next items. 2.2. Items currently Out shows Unknown Borrower and Lent on Unknown, read this data from Item table. 2.3. When press on the card, it should open Item form. 3. Before Items Currently Out add pie charts with item statuses, item categories and display user name with the most lent out item and that amount. 4. When pressing on Total Items card it should navigate to Inventory page"

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Dashboard Overview with Visual Analytics (Priority: P1)

A user opens the dashboard to quickly understand the current state of their inventory through visual representations and key metrics.

**Why this priority**: This provides immediate value to users by giving them an at-a-glance understanding of their inventory status, which is the primary purpose of a dashboard. Visual analytics help users make quick decisions without navigating through multiple screens.

**Independent Test**: Can be fully tested by opening the dashboard and verifying that pie charts display item statuses, item categories, and the top borrower with their borrowing count. This delivers standalone value by providing inventory insights.

**Acceptance Scenarios**:

1. **Given** the user is on the dashboard, **When** the page loads, **Then** two pie charts are displayed showing item statuses (available, out, maintenance, etc.), item categories distribution, and one user/borrower card with the most items lent out along with the count
2. **Given** the dashboard has loaded with pie charts, **When** the user views the charts, **Then** each chart displays accurate data with clear labels and percentages
3. **Given** multiple items exist in different statuses and categories, **When** the dashboard loads, **Then** the top borrower's name and their total borrowed item count are prominently displayed

---

### User Story 2 - Navigate to Detailed Views from Dashboard Cards (Priority: P2)

A user clicks on dashboard summary cards to navigate to detailed views for more information.

**Why this priority**: This enhances user workflow by providing quick navigation paths from summary information to detailed pages, improving efficiency and reducing clicks.

**Independent Test**: Can be tested by clicking the "Total Items" card and verifying navigation to the Inventory page. This delivers value by creating intuitive navigation shortcuts.

**Acceptance Scenarios**:

1. **Given** the user is viewing the dashboard, **When** they click on the "Total Items" summary card, **Then** the system navigates to the Inventory page showing all items
2. **Given** the user is on the dashboard, **When** they click on an "Items Currently Out" card, **Then** the system opens the Item form/detail view for that specific item

---

### User Story 3 - Browse Items Currently Out with Carousel Navigation (Priority: P1)

A user views items currently lent out, seeing one item at a time with the ability to navigate through them in chronological order of when they were lent out.

**Why this priority**: This directly addresses a usability issue where users need to track items that are currently lent out. The carousel approach reduces visual clutter while maintaining quick access to this critical information.

**Independent Test**: Can be tested by lending out multiple items, then viewing the dashboard to verify that only the first (oldest) lent item is shown with navigation arrows to see additional items. This delivers immediate value by improving how users track lent items.

**Acceptance Scenarios**:

1. **Given** multiple items are currently lent out, **When** the user views the dashboard, **Then** only the first item (ordered by earliest lent-out date) is displayed in the "Items Currently Out" section
2. **Given** an item is displayed in "Items Currently Out", **When** the item was lent to a borrower, **Then** the card shows the borrower's name and the date it was lent out (not "Unknown Borrower" or "Lent on Unknown")
3. **Given** more than one item is currently out, **When** the user views the first item card, **Then** a navigation arrow (next button) is visible on the right side of the card
4. **Given** the user is viewing an item in the carousel, **When** they click the next arrow, **Then** the system displays the next item ordered by lent-out date
5. **Given** the user is viewing any item except the first, **When** viewing the carousel, **Then** a previous arrow is also visible to navigate backwards
6. **Given** multiple items are out, **When** items are displayed in the carousel, **Then** they are ordered chronologically from first lent out to most recently lent out

---

### User Story 4 - Simplified Dashboard Layout (Priority: P2)

A user opens the dashboard and sees a focused, streamlined layout without the complete inventory list, reducing information overload.

**Why this priority**: This improves user experience by removing redundant information (full inventory list already exists on Inventory page) and focusing the dashboard on summary metrics and actionable information.

**Independent Test**: Can be tested by verifying the "All Inventory Items" section is no longer present on the dashboard. This delivers value by creating a cleaner, more focused dashboard experience.

**Acceptance Scenarios**:

1. **Given** the user is on the dashboard, **When** the page loads, **Then** the "All Inventory Items" view/section is not visible
2. **Given** the user wants to see all items, **When** they are on the dashboard, **Then** they can click the "Total Items" card to navigate to the full Inventory page

---

### Edge Cases

- What happens when no items are currently lent out? Display a message like "No items currently out" in the Items Currently Out section
- What happens when there's only one item currently out? Hide the navigation arrows since there's nothing to navigate to
- What happens when an item was lent out but the borrower information is missing from the database? Display "Borrower information unavailable" instead of "Unknown"
- What happens when there are no items in the inventory at all? Show empty state messages for pie charts and sections
- What happens when all items are in the same category or status? Pie charts should still display with 100% for that single category/status
- How does the carousel handle rapid clicking of navigation arrows? Implement debouncing or disable buttons during transitions to prevent UI issues
- What happens when item lending data exists but the lent-out date is null? Order these items last in the carousel or exclude them with appropriate messaging

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST remove the "All Inventory Items" view/section from the dashboard page
- **FR-002**: System MUST display three pie charts on the dashboard showing: item status distribution, item category distribution, and top borrower information
- **FR-003**: Pie charts MUST display accurate real-time data reflecting current inventory state
- **FR-004**: System MUST display the name of the user/borrower who has the most items currently lent out along with the count of items they have borrowed
- **FR-005**: "Items Currently Out" section MUST display only one item card at a time (carousel view)
- **FR-006**: Items in the "Items Currently Out" carousel MUST be ordered chronologically by lent-out date (earliest first)
- **FR-007**: System MUST retrieve and display the actual borrower name from the Item table for items currently out (not "Unknown Borrower")
- **FR-008**: System MUST retrieve and display the actual lent-out date from the Item table for items currently out (not "Lent on Unknown")
- **FR-009**: "Items Currently Out" carousel MUST display navigation arrows (next/previous) when multiple items are lent out
- **FR-010**: When user clicks the next arrow, system MUST display the next item in chronological order
- **FR-011**: When user clicks the previous arrow, system MUST display the previous item in chronological order
- **FR-012**: When user clicks on an "Items Currently Out" card, system MUST open the Item form/detail view for that specific item
- **FR-013**: When user clicks on the "Total Items" card, system MUST navigate to the Inventory page
- **FR-014**: System MUST position the pie charts section before (above) the "Items Currently Out" section on the dashboard
- **FR-015**: System MUST handle empty states gracefully (no items out, no items in inventory, etc.)

### Key Entities *(include if feature involves data)*

- **Item**: Represents inventory items with attributes including status (available, out, maintenance), category, borrower information, and lent-out date
- **Borrower**: User or person who borrows items, tracked with borrowing history
- **Dashboard Metrics**: Aggregated data including status counts, category counts, borrowing statistics

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can view item status distribution through pie charts within 2 seconds of dashboard load
- **SC-002**: Dashboard displays accurate borrower names and lent-out dates for all items currently out (0% "Unknown" values when data exists)
- **SC-003**: Users can navigate through all currently lent items using carousel arrows in under 1 second per item transition
- **SC-004**: Users can access the Inventory page from the dashboard with one click on the Total Items card
- **SC-005**: Users can open item details from the dashboard with one click on any Items Currently Out card
- **SC-006**: Dashboard load time remains under 3 seconds even with large inventories (100+ items)
- **SC-007**: Visual analytics (pie charts) accurately reflect inventory state with 100% data accuracy
- **SC-008**: 90% of users report finding the streamlined dashboard more useful than the previous version (post-implementation survey)
