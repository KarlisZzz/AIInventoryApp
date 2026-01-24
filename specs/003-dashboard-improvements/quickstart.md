# Quickstart: Dashboard Improvements

**Feature**: Dashboard Improvements  
**Branch**: `003-dashboard-improvements`  
**Estimated Implementation Time**: 8-12 hours

## Prerequisites

Before starting implementation, ensure you have:

- [x] Node.js 18+ installed
- [x] Existing inventory project cloned and running
- [x] Backend running on `http://localhost:3000`
- [x] Frontend running on `http://localhost:5173`
- [x] SQLite database with Items and Loans tables
- [x] Familiarity with React hooks and TypeScript
- [x] Familiarity with Tailwind CSS utilities

## Project Context

This feature enhances the existing Dashboard page by:
1. Adding visual analytics (pie charts)
2. Implementing carousel for items currently out
3. Fixing "Unknown Borrower" and "Unknown Date" display issues
4. Adding click navigation from dashboard cards
5. Removing the "All Inventory Items" section

**Files to Create**: 5 new files  
**Files to Modify**: 3 existing files  
**No Database Changes Required**

## Implementation Overview

### Phase 1: Backend Enhancement (2-3 hours)

#### Task 1.1: Add Dashboard Analytics Endpoint
**File**: `backend/src/controllers/dashboardController.js`

Add new controller method:
```javascript
async getAnalytics(req, res) {
  try {
    const analytics = await dashboardService.getAnalytics();
    res.json(analytics);
  } catch (error) {
    console.error('Error fetching analytics:', error);
    res.status(500).json({ 
      error: 'Internal server error',
      message: 'Failed to retrieve analytics data'
    });
  }
}
```

Register route in `backend/src/routes/dashboard.js`:
```javascript
router.get('/analytics', dashboardController.getAnalytics);
```

#### Task 1.2: Implement Analytics Service Logic
**File**: `backend/src/services/dashboardService.js`

Add `getAnalytics()` method with three aggregation queries:
1. Status distribution: Count items by status
2. Category distribution: Count items by category
3. Top borrower: Find borrower with most active loans

Use Sequelize's `count()` and `group()` methods.

#### Task 1.3: Fix Items Out Query
**File**: `backend/src/services/dashboardService.js`

Update existing method to include loan relationship:
```javascript
const itemsOut = await Item.findAll({
  where: { status: 'out' },
  include: [{
    model: Loan,
    where: { returnedAt: null },
    required: true,
    attributes: ['id', 'borrower', 'lentAt', 'notes']
  }],
  order: [[{ model: Loan }, 'lentAt', 'ASC']]
});
```

**Testing**: Use `curl` or Postman to verify:
- `GET http://localhost:3000/api/dashboard/analytics` returns expected JSON
- Items out include `currentLoan` object with borrower and lentAt

---

### Phase 2: Frontend Components (4-5 hours)

#### Task 2.1: Create PieChart Component
**File**: `frontend/src/components/PieChart.tsx`

Reusable SVG-based pie chart component:
- Props: `data` (array of { label, value, color })
- Calculate arc paths using trigonometry
- Render SVG with `<path>` elements
- Include labels and percentages
- Use constitutional colors

**Key Functions**:
```typescript
const calculateArcPath = (startAngle: number, endAngle: number, radius: number) => {
  // Convert angles to Cartesian coordinates
  // Return SVG path string for arc
};
```

#### Task 2.2: Create DashboardAnalytics Component
**File**: `frontend/src/components/DashboardAnalytics.tsx`

Container component with three sections:
1. Status distribution pie chart
2. Category distribution pie chart
3. Top borrower card

Fetch data using React Query:
```typescript
const { data, isLoading } = useQuery({
  queryKey: ['dashboardAnalytics'],
  queryFn: fetchDashboardAnalytics,
  staleTime: 5 * 60 * 1000
});
```

#### Task 2.3: Create Carousel Hook
**File**: `frontend/src/hooks/useCarousel.ts`

Custom hook managing carousel state:
```typescript
export const useCarousel = (itemCount: number) => {
  const [currentIndex, setCurrentIndex] = useState(0);
  
  const next = () => setCurrentIndex((prev) => 
    Math.min(prev + 1, itemCount - 1)
  );
  
  const prev = () => setCurrentIndex((prev) => 
    Math.max(prev - 1, 0)
  );
  
  const canGoNext = currentIndex < itemCount - 1;
  const canGoPrev = currentIndex > 0;
  
  return { currentIndex, next, prev, canGoNext, canGoPrev };
};
```

#### Task 2.4: Create ItemCarousel Component
**File**: `frontend/src/components/ItemCarousel.tsx`

Display single item with prev/next navigation:
- Use `useCarousel` hook
- CSS transitions for smooth sliding
- Show borrower name and lent date (from `currentLoan`)
- Prev/Next arrow buttons (conditionally rendered)
- Click card to navigate to item edit form

Styling:
```tsx
<div className="overflow-hidden">
  <div 
    className="flex transition-transform duration-300 ease-in-out"
    style={{ transform: `translateX(-${currentIndex * 100}%)` }}
  >
    {items.map(item => (
      <div className="min-w-full glass-card p-6" key={item.id}>
        {/* Item card content */}
      </div>
    ))}
  </div>
</div>
```

#### Task 2.5: Update CurrentlyOutSection
**File**: `frontend/src/components/CurrentlyOutSection.tsx` (UPDATE)

Replace list view with carousel:
- Import `ItemCarousel` component
- Pass `itemsOut` array to carousel
- Remove old list rendering logic
- Ensure proper ordering (already handled by backend)

#### Task 2.6: Update DashboardPage
**File**: `frontend/src/pages/DashboardPage.tsx` (UPDATE)

Major changes:
1. Add `<DashboardAnalytics />` component above items out section
2. Remove "All Inventory Items" section (delete ItemList rendering)
3. Wrap "Total Items" card with React Router Link to `/inventory`
4. Remove search bar (no longer needed without full item list)

Layout structure:
```tsx
<main>
  <h1>Dashboard</h1>
  <StatisticsCards />  {/* Make Total Items clickable */}
  <DashboardAnalytics />  {/* NEW */}
  <CurrentlyOutSection />  {/* Now uses carousel */}
  {/* REMOVE: ItemList for all items */}
</main>
```

#### Task 2.7: Update Dashboard Service
**File**: `frontend/src/services/dashboardService.ts` (UPDATE)

Add new API call:
```typescript
export const fetchDashboardAnalytics = async (): Promise<DashboardAnalytics> => {
  const response = await axios.get('/api/dashboard/analytics');
  return response.data;
};
```

Update types:
```typescript
export interface DashboardAnalytics {
  statusDistribution: Record<string, number>;
  categoryDistribution: Record<string, number>;
  topBorrower: { name: string; count: number } | null;
}
```

---

### Phase 3: Testing & Polish (2-4 hours)

#### Task 3.1: Manual Testing Checklist

Dashboard Load:
- [ ] Pie charts display with accurate data
- [ ] Charts use constitutional color palette
- [ ] Top borrower card shows correct name and count
- [ ] Empty states handled (no items, no borrowers)

Carousel Navigation:
- [ ] Only one item shown at a time
- [ ] Items ordered by earliest lent date first
- [ ] Borrower name displayed (not "Unknown")
- [ ] Lent date formatted correctly (not "Unknown")
- [ ] Previous arrow hidden on first item
- [ ] Next arrow hidden on last item
- [ ] Smooth CSS transitions between items
- [ ] Keyboard navigation works (arrow keys)

Card Navigation:
- [ ] Clicking "Total Items" navigates to Inventory page
- [ ] Clicking item in carousel opens Item edit form
- [ ] Hover states show visual feedback (ring effect)

Layout:
- [ ] "All Inventory Items" section removed
- [ ] Dashboard loads in <3 seconds
- [ ] Responsive on mobile/tablet
- [ ] Glassmorphism styling matches design standards

#### Task 3.2: Unit Tests (Optional but Recommended)

Create test files:
- `frontend/tests/components/PieChart.test.tsx`
- `frontend/tests/components/ItemCarousel.test.tsx`
- `frontend/tests/hooks/useCarousel.test.ts`
- `backend/tests/dashboard-analytics.test.js`

Focus on:
- PieChart renders correct number of segments
- Carousel navigation logic (prev/next boundaries)
- Analytics endpoint returns valid data structure
- Items out include loan relationship data

#### Task 3.3: Accessibility Testing

- [ ] All interactive elements keyboard accessible
- [ ] Tab order logical
- [ ] ARIA labels present on charts and buttons
- [ ] Focus indicators visible
- [ ] Color contrast meets WCAG AA (4.5:1 minimum)
- [ ] Screen reader announces carousel changes

---

## Quick Reference

### Key Files Modified
```
backend/src/
├── controllers/dashboardController.js    (ADD getAnalytics method)
├── services/dashboardService.js          (ADD getAnalytics, UPDATE getItemsOut)
└── routes/dashboard.js                   (ADD /analytics route)

frontend/src/
├── components/
│   ├── PieChart.tsx                      (NEW)
│   ├── DashboardAnalytics.tsx            (NEW)
│   ├── ItemCarousel.tsx                  (NEW)
│   └── CurrentlyOutSection.tsx           (UPDATE: use carousel)
├── pages/
│   └── DashboardPage.tsx                 (UPDATE: add analytics, remove list)
├── services/
│   └── dashboardService.ts               (UPDATE: add fetchAnalytics)
└── hooks/
    └── useCarousel.ts                    (NEW)
```

### API Endpoints
- `GET /api/dashboard` - Existing, enhanced with loan data
- `GET /api/dashboard/analytics` - **NEW** endpoint for charts

### Color Palette Reference
```
Backgrounds:    bg-slate-900 (main), bg-slate-800 (cards)
Interactive:    bg-blue-500, hover:ring-blue-500/50
Text:           text-slate-200 (headings), text-slate-400 (labels)
Status (muted): bg-green-500/20 text-green-400 (available)
                bg-yellow-500/20 text-yellow-400 (out)
                bg-red-500/20 text-red-400 (maintenance)
Glassmorphism:  bg-white/5 border border-white/10 backdrop-blur-sm
```

### Useful Commands

Start development servers:
```bash
# Backend (from /backend)
npm run dev

# Frontend (from /frontend)  
npm run dev
```

Test API manually:
```bash
# Get analytics
curl http://localhost:3000/api/dashboard/analytics

# Get dashboard data
curl http://localhost:3000/api/dashboard
```

Run tests:
```bash
# Backend tests
cd backend && npm test

# Frontend tests
cd frontend && npm test
```

---

## Troubleshooting

### "Unknown Borrower" still showing
**Cause**: Loan relationship not properly included in query  
**Fix**: Check `include` clause in `dashboardService.getItemsOut()` - ensure `Loan` model is included with `required: true`

### Pie charts not rendering
**Cause**: SVG path calculation errors or missing data  
**Fix**: Console log `data` prop, verify arc angle calculations, check for division by zero

### Carousel not sliding
**Cause**: CSS transform not applying or transition missing  
**Fix**: Verify `style={{ transform: \`translateX(-${currentIndex * 100}%)\` }}` syntax, check parent has `overflow-hidden`

### Analytics endpoint returns 500
**Cause**: Sequelize query error or missing model associations  
**Fix**: Check server logs for SQL errors, verify Item-Loan association defined in models

### Performance issues with large datasets
**Cause**: No database indexes on frequently queried columns  
**Fix**: Add indexes on `items.status`, `loans.returnedAt`, `loans.borrower`

---

## Next Steps

After completing implementation:

1. **Code Review**: Create pull request from `003-dashboard-improvements` branch
2. **Documentation**: Update main README if dashboard features changed significantly
3. **User Testing**: Get feedback on dashboard usability and chart clarity
4. **Performance Monitoring**: Check dashboard load times with production data volumes
5. **Accessibility Audit**: Run automated tools (axe DevTools, Lighthouse)

## Resources

- [OpenAPI Contract](./contracts/dashboard-analytics-api.yaml)
- [Data Model](./data-model.md)
- [Research Decisions](./research.md)
- [Feature Specification](./spec.md)
- [Implementation Plan](./plan.md)

## Support

If you encounter issues during implementation:
1. Check troubleshooting section above
2. Review research.md for design rationale
3. Verify constitution compliance in plan.md
4. Check existing similar components for patterns

---

**Ready to start?** Begin with Phase 1 (Backend Enhancement) to establish the data layer, then move to Phase 2 (Frontend Components) for UI implementation.
