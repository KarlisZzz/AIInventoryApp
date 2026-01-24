# Data Model: Dashboard Improvements

**Feature**: Dashboard Improvements  
**Branch**: 003-dashboard-improvements  
**Phase**: 1 (Design & Contracts)  
**Date**: January 24, 2026

## Overview

This feature enhances the dashboard UI and introduces a new analytics aggregation layer. No new database tables are required - it leverages existing Item and Loan entities with improved query patterns and introduces new derived data structures for analytics.

## Existing Entities (Reference)

### Item
Represents inventory items tracked in the system.

**Attributes**:
- `id` (UUID): Unique identifier
- `name` (String): Item name
- `description` (Text, optional): Item description
- `category` (String): Item category (electronics, tools, books, etc.)
- `status` (Enum): Current status - "available", "out", "maintenance", "retired"
- `imageUrl` (String, optional): URL to item image
- `createdAt` (DateTime): Timestamp of creation
- `updatedAt` (DateTime): Timestamp of last update

**Relationships**:
- Has many Loans (one-to-many)

### Loan
Represents lending transactions for items.

**Attributes**:
- `id` (UUID): Unique identifier
- `itemId` (UUID, FK): Reference to Item
- `borrower` (String): Name of person borrowing the item
- `lentAt` (DateTime): When item was lent out
- `returnedAt` (DateTime, nullable): When item was returned (null if still out)
- `notes` (Text, optional): Additional notes about the loan
- `createdAt` (DateTime): Timestamp of creation
- `updatedAt` (DateTime): Timestamp of last update

**Relationships**:
- Belongs to Item (many-to-one)

## New Derived Data Structures

These are not database entities but computed data structures returned by API endpoints.

### DashboardAnalytics
Aggregated statistics for dashboard visualization.

**Structure**:
```typescript
interface DashboardAnalytics {
  statusDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  topBorrower: {
    name: string;
    count: number;
  } | null;
}
```

**Attributes**:
- `statusDistribution`: Count of items by status
  - Key: status value ("available", "out", "maintenance", "retired")
  - Value: count of items in that status
  - Example: `{ "available": 10, "out": 5, "maintenance": 2, "retired": 1 }`

- `categoryDistribution`: Count of items by category
  - Key: category name
  - Value: count of items in that category
  - Example: `{ "electronics": 8, "tools": 7, "books": 3, "games": 2 }`

- `topBorrower`: User with most items currently borrowed
  - `name`: Borrower's name (from Loan.borrower)
  - `count`: Number of items currently borrowed (where returnedAt is null)
  - `null` if no items are currently lent out
  - Example: `{ "name": "John Doe", "count": 3 }`

**Computation Logic**:
- Status distribution: `SELECT status, COUNT(*) FROM items GROUP BY status`
- Category distribution: `SELECT category, COUNT(*) FROM items GROUP BY category`
- Top borrower: `SELECT borrower, COUNT(*) FROM loans WHERE returnedAt IS NULL GROUP BY borrower ORDER BY COUNT(*) DESC LIMIT 1`

### EnhancedItemOut
Item with embedded current loan information for "Items Currently Out" display.

**Structure**:
```typescript
interface EnhancedItemOut {
  id: string;
  name: string;
  description?: string;
  category: string;
  status: string;  // Will always be "out"
  imageUrl?: string;
  currentLoan: {
    id: string;
    borrower: string;
    lentAt: string;  // ISO 8601 datetime
    notes?: string;
  };
}
```

**Attributes**:
- All standard Item attributes
- `currentLoan`: Embedded loan information for the active loan
  - `id`: Loan ID (for potential actions like return)
  - `borrower`: Name of current borrower (NOT "Unknown")
  - `lentAt`: ISO timestamp of when lent out (NOT "Unknown")
  - `notes`: Optional notes about the loan

**Computation Logic**:
```sql
SELECT items.*, loans.id as loan_id, loans.borrower, loans.lentAt, loans.notes
FROM items
INNER JOIN loans ON items.id = loans.itemId
WHERE items.status = 'out' AND loans.returnedAt IS NULL
ORDER BY loans.lentAt ASC
```

**Ordering**: Results ordered by `loans.lentAt ASC` (earliest lent out first) to support carousel display requirement.

## Data Flow

### Dashboard Page Load Flow
```
1. Frontend: DashboardPage component mounts
2. Frontend: useQuery triggers fetchDashboardAnalytics()
3. Frontend: API call GET /api/dashboard/analytics
4. Backend: dashboardService.getAnalytics() executes 3 SQL queries
5. Backend: Returns DashboardAnalytics JSON
6. Frontend: Renders PieChart components with data
7. Frontend: Existing call for items out (enhanced with loan data)
8. Frontend: ItemCarousel displays first item from ordered list
```

### Carousel Navigation Flow
```
1. User clicks next/previous arrow
2. useCarousel hook updates currentIndex state
3. CSS transition slides to new index
4. Item card displays: name, category, currentLoan.borrower, currentLoan.lentAt
5. ARIA live region announces change to screen readers
```

### Card Navigation Flow
```
1. User clicks "Total Items" card
2. React Router <Link> navigates to /inventory
3. Inventory page loads with full item list

OR

1. User clicks "Items Currently Out" card
2. onClick handler calls navigate(`/items/${item.id}/edit`)
3. Item edit form opens with item details
```

## Data Validation Rules

### DashboardAnalytics Validation
- `statusDistribution`: Keys must be valid status enum values
- `statusDistribution`: Values must be non-negative integers
- `categoryDistribution`: Keys can be any string (dynamic categories)
- `categoryDistribution`: Values must be non-negative integers
- `topBorrower.count`: Must be positive integer (>0) if not null
- `topBorrower.name`: Must be non-empty string if not null

### EnhancedItemOut Validation
- `status`: Must be "out" (query constraint)
- `currentLoan.borrower`: Must be non-empty string (required in Loan model)
- `currentLoan.lentAt`: Must be valid ISO 8601 datetime string
- `currentLoan.lentAt`: Cannot be in the future

## State Transitions

This feature is read-only from dashboard perspective. No state transitions occur within the dashboard itself. State transitions (lending, returning) happen on other pages (Inventory, Item Edit) and are reflected in dashboard data upon refresh/reload.

**Relevant Existing Transitions** (for context):
- Item: available → out (via lend action on Inventory page)
- Item: out → available (via return action, triggers Loan.returnedAt update)

## Indexing Considerations

For optimal query performance, consider these indexes:

1. **Index on items.status**: Speeds up filtering items by status
   ```sql
   CREATE INDEX idx_items_status ON items(status);
   ```

2. **Index on loans.returnedAt**: Speeds up filtering active loans
   ```sql
   CREATE INDEX idx_loans_returned_at ON loans(returnedAt);
   ```

3. **Composite index on loans (borrower, returnedAt)**: Optimizes top borrower query
   ```sql
   CREATE INDEX idx_loans_borrower_returned ON loans(borrower, returnedAt);
   ```

Note: Evaluate query performance before adding indexes. With small-to-medium datasets (< 10,000 items), indexes may not provide significant benefit and add write overhead.

## Frontend State Management

### Component State (React)
- `currentIndex` (useCarousel hook): Current carousel position (0-based index)
- `analyticsData` (React Query): Cached DashboardAnalytics object
- `itemsOut` (React Query): Cached array of EnhancedItemOut objects
- `isLoading` (React Query): Loading state for async data fetching
- `error` (React Query): Error state if API calls fail

### Cache Strategy (TanStack React Query)
- `queryKey: ['dashboardAnalytics']`: Cache key for analytics data
- `staleTime: 5 minutes`: Data considered fresh for 5 minutes
- `cacheTime: 10 minutes`: Keep unused data in cache for 10 minutes
- `refetchOnWindowFocus: true`: Refresh when user returns to tab

## Summary

This feature requires no database schema changes. It enhances existing query patterns to properly join Items with Loans (fixing "Unknown" display issues) and introduces new aggregation queries for analytics. The data model is simple: leverage existing entities, compute analytics server-side, and return structured JSON for efficient client-side rendering.

**Key Design Decisions**:
- Server-side aggregation reduces client computation
- Embedded loan data in EnhancedItemOut eliminates "Unknown" values
- Ordering by lentAt ensures correct carousel sequence
- React Query caching minimizes API calls and improves UX
- No new database tables = minimal migration risk
