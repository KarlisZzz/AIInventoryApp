# Phase 7 Manual Testing Checklist

## Performance Tests (T062-T064)

### T062: Dashboard Load Time with 100+ Items
**Success Criteria**: Dashboard should load in < 3 seconds (SC-006)

**Test Steps**:
1. Open browser DevTools (F12) → Network tab
2. Clear cache (Ctrl+Shift+Delete)
3. Navigate to `http://localhost:5173/dashboard`
4. Record load time from navigation to "DOMContentLoaded"
5. Verify: **Total load time < 3 seconds**

**Results**:
- [ ] Load time: _____ seconds
- [ ] Status: PASS / FAIL

---

### T063: Chart Rendering Time
**Success Criteria**: Charts should render in < 2 seconds (SC-001)

**Test Steps**:
1. Open browser DevTools → Performance tab
2. Start recording
3. Navigate to dashboard
4. Stop recording when pie charts appear
5. Find "DashboardAnalytics" component render time
6. Verify: **Render time < 2 seconds**

**Results**:
- [ ] Render time: _____ seconds
- [ ] Status: PASS / FAIL

---

### T064: Carousel Transition Time
**Success Criteria**: Transitions should complete in < 1 second (SC-003)

**Test Steps**:
1. Ensure 3+ items are currently lent out
2. Open dashboard
3. Use DevTools Performance tab
4. Record while clicking "Next" button 5 times
5. Measure transition duration (transform animation)
6. Verify: **Transition time < 1 second per click**

**Results**:
- [ ] Average transition time: _____ ms
- [ ] Status: PASS / FAIL

---

## Accessibility Tests (T065-T068)

### T065: Accessibility Audit with axe DevTools
**Success Criteria**: No critical or serious accessibility violations

**Test Steps**:
1. Install axe DevTools Chrome extension
2. Open dashboard at `http://localhost:5173/dashboard`
3. Open DevTools → axe DevTools tab
4. Click "Scan All of My Page"
5. Review violations (Critical, Serious, Moderate, Minor)
6. Verify: **0 Critical violations, 0 Serious violations**

**Results**:
- [ ] Critical violations: _____
- [ ] Serious violations: _____
- [ ] Moderate violations: _____
- [ ] Minor violations: _____
- [ ] Status: PASS / FAIL

**Common Issues to Fix**:
- Missing ARIA labels
- Insufficient color contrast
- Missing alt text on images
- Non-semantic HTML

---

### T066: Color Contrast Ratios
**Success Criteria**: All text meets WCAG AA minimum 4.5:1 contrast ratio

**Test Steps**:
1. Use WebAIM Contrast Checker: https://webaim.org/resources/contrastchecker/
2. Test the following color combinations:

**Text on Dark Background** (slate-900: #0F172A):
- [ ] Body text (slate-400: #94A3B8) → Contrast: _____ (Pass: > 4.5:1)
- [ ] Headings (slate-200: #E2E8F0) → Contrast: _____ (Pass: > 4.5:1)
- [ ] Links (blue-500: #3B82F6) → Contrast: _____ (Pass: > 4.5:1)

**Status Colors**:
- [ ] Green text (green-500: #10B981) → Contrast: _____ (Pass: > 4.5:1)
- [ ] Yellow text (yellow-500: #F59E0B) → Contrast: _____ (Pass: > 4.5:1)
- [ ] Red text (red-500: #EF4444) → Contrast: _____ (Pass: > 4.5:1)

**Chart Legend Text** (slate-300: #CBD5E1):
- [ ] Legend labels on slate-900 → Contrast: _____ (Pass: > 4.5:1)

**Results**:
- [ ] All combinations pass WCAG AA
- [ ] Status: PASS / FAIL

---

### T067: Keyboard Navigation
**Success Criteria**: All interactive elements accessible via keyboard

**Test Steps** (Do NOT use mouse):
1. Navigate to dashboard (Ctrl+L to focus address bar, Enter to navigate)
2. Press Tab repeatedly to cycle through interactive elements
3. Verify the following are reachable and functional:

**Dashboard Cards**:
- [ ] "Total Items" card receives focus (visible focus ring)
- [ ] Press Enter on "Total Items" → navigates to /inventory
- [ ] "Currently Out" and "Available" cards (no interaction needed)

**Items Currently Out Carousel**:
- [ ] "Previous" button receives focus (if not first item)
- [ ] Press Enter on "Previous" → shows previous item
- [ ] "Next" button receives focus (if not last item)
- [ ] Press Enter on "Next" → shows next item
- [ ] Item card receives focus
- [ ] Press Enter on item card → navigates to item edit page
- [ ] ArrowLeft key → shows previous item
- [ ] ArrowRight key → shows next item

**Navigation Menu**:
- [ ] All nav links receive focus
- [ ] Press Enter on links → navigates correctly

**Analytics Charts** (visual only, no interaction needed):
- [ ] Charts are visible and understandable
- [ ] Legend labels are readable

**Results**:
- [ ] All interactive elements keyboard accessible
- [ ] Focus indicators visible
- [ ] Status: PASS / FAIL

---

### T068: Screen Reader Announcements
**Success Criteria**: Screen reader can announce all important content

**Test Steps** (Windows: NVDA, macOS: VoiceOver, Linux: Orca):

**Windows (NVDA)**:
1. Download NVDA (free): https://www.nvaccess.org/download/
2. Start NVDA (Ctrl+Alt+N)
3. Navigate to dashboard
4. Use Down Arrow to read through page

**macOS (VoiceOver)**:
1. Enable VoiceOver: Cmd+F5
2. Navigate to dashboard
3. Use Cmd+Right Arrow to read through page

**What to verify**:
- [ ] Page title announced: "Dashboard - Inventory & Lending"
- [ ] Statistics cards announced with values:
  - [ ] "Total Items: [number]"
  - [ ] "Currently Out: [number]"
  - [ ] "Available: [number]"
- [ ] Analytics section announced:
  - [ ] "Analytics Overview"
  - [ ] "Status Distribution pie chart"
  - [ ] "Category Distribution pie chart"
  - [ ] "Top Borrower: [name]"
- [ ] Carousel items announced:
  - [ ] "Item 1 of 3" (live region updates)
  - [ ] Item name, borrower, and lent date
  - [ ] "Previous item" / "Next item" button labels
- [ ] Error states announced:
  - [ ] "Failed to Load Analytics" (if triggered)

**Results**:
- [ ] All content announced correctly
- [ ] ARIA labels work as expected
- [ ] Live regions update properly
- [ ] Status: PASS / FAIL

---

## Test Summary

**Performance Tests**:
- [ ] T062: Dashboard load time < 3s
- [ ] T063: Chart rendering < 2s
- [ ] T064: Carousel transitions < 1s

**Accessibility Tests**:
- [ ] T065: axe DevTools audit passed
- [ ] T066: Color contrast ratios > 4.5:1
- [ ] T067: Keyboard navigation works
- [ ] T068: Screen reader announces correctly

**Overall Phase 7 Status**: PASS / FAIL

**Notes**:
_[Add any observations, issues found, or improvements needed]_

---

## Quick Performance Check (Optional)

Run this in browser console to measure component render times:

```javascript
// Measure dashboard analytics load time
const start = performance.now();
await fetch('http://localhost:3001/api/v1/dashboard/analytics');
const end = performance.now();
console.log(`Analytics API: ${(end - start).toFixed(2)}ms`);

// Measure total dashboard data load time
const start2 = performance.now();
await fetch('http://localhost:3001/api/v1/dashboard');
const end2 = performance.now();
console.log(`Dashboard API: ${(end2 - start2).toFixed(2)}ms`);
```

Expected results:
- Analytics API: < 500ms
- Dashboard API: < 800ms
- Total frontend render: < 2000ms
