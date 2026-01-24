# Research: Dashboard Improvements

**Feature**: Dashboard Improvements  
**Branch**: 003-dashboard-improvements  
**Phase**: 0 (Outline & Research)  
**Date**: January 24, 2026

## Research Overview

This document consolidates research findings for implementing dashboard improvements including visual analytics (pie charts), carousel navigation for items currently out, and enhanced card-based navigation.

## 1. Chart Library Selection for React

### Decision: Use Native SVG with React Components

**Rationale**:
- Current project does not include any charting libraries
- For simple pie charts, native SVG with React is lightweight and sufficient
- Avoids adding new dependencies and bundle size
- Full control over styling to match constitutional design standards
- Charts are static visualizations (no complex interactions needed)

**Alternatives Considered**:

1. **Recharts**
   - Pros: React-native, declarative API, good TypeScript support
   - Cons: +200KB bundle size, overkill for simple pie charts
   - Rejected: Too heavy for minimal chart needs

2. **Chart.js with react-chartjs-2**
   - Pros: Mature ecosystem, many chart types
   - Cons: Canvas-based (accessibility concerns), +160KB bundle size
   - Rejected: Canvas rendering harder to style with Tailwind, larger bundle

3. **Victory**
   - Pros: D3-based, React-native, accessible
   - Cons: +300KB bundle size, complex API for simple needs
   - Rejected: Most feature-rich but overkill for this use case

**Implementation Approach**:
- Create reusable `<PieChart>` component using SVG `<path>` elements
- Calculate arc paths using trigonometry (polar to Cartesian conversion)
- Use Tailwind classes for colors matching constitutional palette
- Responsive sizing with viewBox for SVG scalability
- Include text labels and percentages within/outside segments

## 2. Carousel Pattern for Items Currently Out

### Decision: Custom Carousel with CSS Transitions

**Rationale**:
- Simple use case: single item display with prev/next navigation
- No need for complex swipe gestures or infinite scroll
- Full control over transitions and styling
- Minimal JavaScript, mostly CSS-driven
- Aligns with existing project patterns (no carousel library currently used)

**Alternatives Considered**:

1. **Swiper.js**
   - Pros: Feature-rich, touch support, accessibility
   - Cons: +140KB, overkill for simple prev/next navigation
   - Rejected: Too complex for showing one card at a time

2. **React Slick**
   - Pros: Popular, jQuery Slick port for React
   - Cons: +95KB, requires react-slick + slick-carousel CSS
   - Rejected: Adds unnecessary dependency, jQuery-style patterns

3. **Embla Carousel**
   - Pros: Lightweight (18KB), modern API, TypeScript support
   - Cons: Still external dependency for simple case
   - Rejected: Custom solution more maintainable for this specific need

**Implementation Approach**:
- Custom `useCarousel` hook managing current index state
- CSS `transform: translateX()` for slide transitions
- `transition-transform duration-300` for smooth animations
- Conditional rendering of prev/next buttons based on index position
- Keyboard navigation support (arrow keys) for accessibility
- ARIA attributes for screen reader support

**Key Features**:
- Show one item card at a time
- Previous/Next arrow buttons (hidden when at boundaries)
- Smooth CSS transitions (300ms)
- Keyboard navigation (ArrowLeft/ArrowRight)
- Touch swipe support (optional, can add with touch event listeners)
- Ordered by lent-out date (earliest first)

## 3. Dashboard Analytics Data Aggregation

### Decision: Server-Side Aggregation with SQL

**Rationale**:
- Aggregating on server reduces client-side computation
- Leverages database performance for counting/grouping
- Single API call returns all analytics data
- Caching opportunities on backend

**Query Strategy**:
- Use Sequelize aggregation methods (`count`, `group`)
- Separate queries for each metric, return as single JSON object
- Queries:
  1. Item status distribution: `SELECT status, COUNT(*) FROM items GROUP BY status`
  2. Item category distribution: `SELECT category, COUNT(*) FROM items GROUP BY category`
  3. Top borrower: `SELECT borrower, COUNT(*) FROM loans WHERE returnedAt IS NULL GROUP BY borrower ORDER BY COUNT(*) DESC LIMIT 1`

**API Endpoint Design**:
```
GET /api/dashboard/analytics
Response: {
  statusDistribution: { available: 10, out: 5, maintenance: 2 },
  categoryDistribution: { electronics: 8, tools: 7, books: 2 },
  topBorrower: { name: "John Doe", count: 3 }
}
```

## 4. Data Retrieval for Items Currently Out

### Decision: Enhance Existing Dashboard Service

**Rationale**:
- Current dashboard already fetches items currently out
- Issue: Shows "Unknown Borrower" and "Lent on Unknown"
- Root cause: Needs to properly join items with loans table
- Solution: Update query to include loan relationship data

**Current Issue**:
```typescript
// Existing code may not include loan details
const itemsOut = await Item.findAll({ where: { status: 'out' } });
```

**Corrected Approach**:
```typescript
// Include loan relationship with borrower and lentAt data
const itemsOut = await Item.findAll({
  where: { status: 'out' },
  include: [{
    model: Loan,
    where: { returnedAt: null },
    required: true,
    attributes: ['borrower', 'lentAt']
  }],
  order: [[{ model: Loan }, 'lentAt', 'ASC']]  // Earliest lent out first
});
```

**Data Mapping**:
- Ensure loan data is properly serialized in API response
- Frontend receives: `{ ...item, currentLoan: { borrower, lentAt } }`
- Display borrower name and formatted date (using Day.js)

## 5. Navigation Pattern for Dashboard Cards

### Decision: React Router Link Components

**Rationale**:
- Project already uses React Router 7.12.0
- Standard pattern for SPA navigation
- Maintains browser history and back-button functionality
- Declarative routing

**Implementation Approach**:

1. **Total Items Card → Inventory Page**:
   ```tsx
   import { Link } from 'react-router-dom';
   
   <Link to="/inventory" className="glass-card p-4 hover:ring-2 ring-blue-500/50 transition">
     {/* Card content */}
   </Link>
   ```

2. **Items Currently Out Card → Item Detail**:
   ```tsx
   <div onClick={() => navigate(`/items/${item.id}/edit`)} 
        className="cursor-pointer glass-card hover:ring-2 ring-blue-500/50 transition">
     {/* Card content */}
   </div>
   ```

**User Experience**:
- Hover state: Add `ring-2 ring-blue-500/50` for visual feedback
- Cursor: Change to `cursor-pointer` on interactive cards
- Transition: `transition-all duration-200` for smooth hover effects
- Accessibility: Proper ARIA labels, keyboard navigation (Enter key)

## 6. Glassmorphism Design Standards

### Decision: Follow Constitutional UI/UX Principles

**Rationale**:
- Constitution defines specific design patterns (Principle VII)
- Consistency across all dashboard components
- Professional aesthetic with depth perception

**Applied Standards**:

**Card Styling**:
```tsx
className="bg-white/5 border border-white/10 backdrop-blur-sm rounded-lg p-6"
```

**Color Palette** (from Constitution):
- Primary: `#3B82F6` (Blue-500) for interactive elements
- Background: `#0F172A` (Slate-900) main, `#1E293B` (Slate-800) elevated
- Text: `#94A3B8` (Slate-400) for labels, `#E2E8F0` (Slate-200) for headings
- Status colors with muted opacity:
  - Available: `bg-green-500/20 text-green-400`
  - Out: `bg-yellow-500/20 text-yellow-400`
  - Maintenance: `bg-red-500/20 text-red-400`

**Chart Styling**:
- Use constitutional colors for segments
- Semi-transparent backgrounds for labels
- Border-white/10 for subtle separation
- Clear typography with proper contrast ratios

## 7. Performance Optimization

### Decision: Data Fetching Strategy

**Approach**:
- Use TanStack React Query for caching and background refetching
- Single API call for analytics data (reduces network overhead)
- Memoize chart calculations with `useMemo`
- Lazy load chart rendering (only when visible)

**Caching Strategy**:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['dashboardAnalytics'],
  queryFn: fetchDashboardAnalytics,
  staleTime: 5 * 60 * 1000,  // 5 minutes
  refetchOnWindowFocus: true
});
```

**Bundle Optimization**:
- No external chart libraries = no additional bundle size
- Code split dashboard components if needed
- Use React.lazy() for PieChart if it becomes large

## 8. Accessibility Considerations

### Decision: WCAG AA Compliance

**Requirements**:

1. **Keyboard Navigation**:
   - Tab through all interactive elements
   - Arrow keys for carousel navigation
   - Enter/Space to activate cards/buttons

2. **Screen Reader Support**:
   - ARIA labels for chart segments: `aria-label="Electronics: 45%"`
   - Live regions for carousel changes: `aria-live="polite"`
   - Descriptive button labels: "Previous item" / "Next item"

3. **Color Contrast**:
   - All text meets WCAG AA 4.5:1 ratio
   - Charts include text labels (not color-only information)
   - Focus indicators clearly visible (blue-500 ring)

4. **Alternative Text**:
   - Pie charts include table fallback for screen readers
   - Status indicators have text labels, not just colors

## Research Summary

All technical decisions align with constitutional principles and existing project architecture. No new major dependencies required - leveraging existing React, Tailwind, and React Router capabilities. Custom implementations for charts and carousel provide full control over styling and performance while maintaining constitutional design standards.

**Key Takeaways**:
1. Native SVG pie charts - lightweight, styleable, accessible
2. Custom carousel with CSS transitions - simple, performant
3. Server-side SQL aggregation - efficient data processing
4. Enhanced Sequelize queries - fix "Unknown" data issue
5. React Router navigation - standard SPA pattern
6. Constitutional design adherence - glassmorphism and color palette
7. Performance via React Query caching - minimize API calls
8. Full WCAG AA accessibility - keyboard, screen reader, contrast

**No NEEDS CLARIFICATION items remaining.** All research complete and ready for Phase 1 design.
