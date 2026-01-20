# User Story 4 - Frontend Testing Checklist

**Feature**: View Lending History  
**Tasks**: T106-T113  
**Date**: 2026-01-20

## Manual Testing Guide

### Prerequisites
1. ✅ Backend server running on `http://localhost:3001`
2. ✅ Frontend dev server running (or built and served)
3. ✅ Database has items with lending history
4. ✅ Some items have never been lent

---

## Test Scenarios

### Scenario 1: View History for Item with No History (T113)

**Steps:**
1. Navigate to Inventory page
2. Find an item that has never been lent (status: Available, no prior lendings)
3. Click the purple "History" button on the item card

**Expected Results:**
- ✅ History dialog opens
- ✅ Dialog shows item name in header
- ✅ Empty state icon displayed (document icon)
- ✅ Message: "No Lending History"
- ✅ Subtext: "This item has never been lent out."
- ✅ No table shown
- ✅ No filter controls shown
- ✅ Close button works

---

### Scenario 2: View History for Item with Single Transaction

**Steps:**
1. Find an item with exactly one lending record
2. Click "History" button

**Expected Results:**
- ✅ History dialog opens
- ✅ Table displays with one row
- ✅ Borrower name shown (denormalized field)
- ✅ Borrower email shown
- ✅ Lent date formatted correctly
- ✅ Returned date shown OR "Still Out" badge (if active)
- ✅ Duration calculated correctly
- ✅ Condition notes shown (or "No notes" if empty)
- ✅ Summary shows "Showing 1 of 1 transactions"

---

### Scenario 3: View History with Multiple Transactions (FR-021)

**Steps:**
1. Find an item with multiple lending records
2. Click "History" button
3. Examine the order of transactions

**Expected Results:**
- ✅ Dialog opens with table
- ✅ Transactions ordered by date (most recent first)
- ✅ First row is the newest transaction
- ✅ Last row is the oldest transaction
- ✅ All borrower names are from denormalized fields (FR-028)
- ✅ Summary shows correct count (e.g., "Showing 5 of 5 transactions")

---

### Scenario 4: Date Range Filtering (T112)

**Setup:** Use an item with history spanning multiple months/years

**Test 4A - Start Date Only:**
1. Open history dialog
2. Set start date to middle of history range
3. Click "Apply"

**Expected Results:**
- ✅ Only transactions on or after start date shown
- ✅ Summary updates (e.g., "Showing 3 of 10 transactions")
- ✅ "Filtered by date" badge appears

**Test 4B - End Date Only:**
1. Click "Clear" to reset
2. Set only end date
3. Click "Apply"

**Expected Results:**
- ✅ Only transactions on or before end date shown
- ✅ Summary updates correctly
- ✅ Filter badge appears

**Test 4C - Both Dates:**
1. Set both start and end date (narrow range)
2. Click "Apply"

**Expected Results:**
- ✅ Only transactions within date range shown
- ✅ Summary reflects filtered count
- ✅ If no transactions match, shows "No transactions found for selected date range"
- ✅ "Clear filter" link appears

**Test 4D - Clear Filter:**
1. Click "Clear" button

**Expected Results:**
- ✅ All transactions shown again
- ✅ Date inputs reset to empty
- ✅ Filter badge disappears
- ✅ Summary shows total count

---

### Scenario 5: Active Loan Indicator

**Steps:**
1. Lend an item to a user
2. Open history for that item
3. Examine the most recent transaction

**Expected Results:**
- ✅ Most recent row has "dateReturned" as null
- ✅ "Still Out" badge displayed (yellow background)
- ✅ Duration shows "(ongoing)" indicator
- ✅ Other fields populated correctly

---

### Scenario 6: Loading State (T111)

**Steps:**
1. Open developer tools, throttle network to "Slow 3G"
2. Click "History" button
3. Observe loading behavior

**Expected Results:**
- ✅ Dialog opens immediately
- ✅ Loading spinner appears
- ✅ No table or empty state shown while loading
- ✅ After data loads, content appears
- ✅ Loading spinner disappears

---

### Scenario 7: Error Handling (T111)

**Steps:**
1. Stop the backend server
2. Click "History" button
3. Observe error state

**Expected Results:**
- ✅ Dialog opens
- ✅ Error icon displayed (red alert icon)
- ✅ Error message shown
- ✅ "Retry" button appears
- ✅ Clicking retry attempts to reload
- ✅ Close button still works

---

### Scenario 8: Denormalized Borrower Fields (FR-016, FR-028)

**Setup:** 
1. Lend an item to a user
2. Note the user's name and email
3. Change the user's name in the database (directly or via admin tool if available)
4. View history for the item

**Expected Results:**
- ✅ History shows ORIGINAL name from when item was lent
- ✅ Name does NOT update to reflect current user profile
- ✅ This proves denormalization is working (audit trail preserved)
- ✅ Email also shows original value

---

### Scenario 9: UI/UX Elements

**General Checks:**
- ✅ Dialog has backdrop blur effect
- ✅ Clicking outside dialog does NOT close it (only close button)
- ✅ Close X button in header works
- ✅ Close button in footer works
- ✅ Dialog is scrollable if content exceeds viewport
- ✅ Table is horizontally scrollable on small screens
- ✅ All text is readable with good contrast
- ✅ Hover effects on table rows work
- ✅ Date inputs have proper styling

---

### Scenario 10: Integration with InventoryPage

**Steps:**
1. Navigate to /inventory
2. Verify History button appears on all item cards
3. Click History on different items
4. Close dialog
5. Click History on another item

**Expected Results:**
- ✅ History button visible on all cards (Available, Lent, Maintenance)
- ✅ Button has purple theme
- ✅ Each click opens correct item's history
- ✅ Previous dialog closes when new one opens
- ✅ State properly managed (no memory leaks)

---

## Performance Checks

### Check 1: Large History Set
- Test with item having 50+ lending records
- ✅ Dialog opens quickly
- ✅ Table renders smoothly
- ✅ Filtering is responsive
- ✅ Scrolling is smooth

### Check 2: Multiple Rapid Opens
- Open and close history dialog 10 times rapidly
- ✅ No memory leaks
- ✅ No console errors
- ✅ Smooth operation throughout

---

## Accessibility Checks

- ✅ History button has ARIA label: "View history for [item name]"
- ✅ Dialog can be closed with Escape key (if implemented)
- ✅ All interactive elements focusable
- ✅ Tab order is logical
- ✅ Color contrast meets WCAG AA standards
- ✅ Screen reader can announce dialog content

---

## Browser Compatibility

Test in multiple browsers:
- [ ] Chrome (latest)
- [ ] Firefox (latest)
- [ ] Safari (latest)
- [ ] Edge (latest)

---

## Responsive Design

Test at different viewport sizes:
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667)

Expected behavior at all sizes:
- ✅ Dialog adapts to screen size
- ✅ Table scrollable horizontally if needed
- ✅ Buttons stack on small screens
- ✅ Text remains readable
- ✅ Padding/spacing appropriate

---

## Verification Checkpoint Tasks

### T114: Chronological Order Verification
- [X] Backend returns logs ordered by dateLent DESC
- [ ] Frontend displays in correct order
- [ ] Manual verification with 3+ transactions

### T115: All Fields Displayed Correctly
- [ ] Borrower Name (from denormalized field)
- [ ] Borrower Email (from denormalized field)
- [ ] Date Lent (formatted)
- [ ] Date Returned (formatted or "Still Out")
- [ ] Duration (calculated in days)
- [ ] Condition Notes (or "No notes")

### T116: Empty History Message
- [ ] Dialog shows empty state
- [ ] Icon displayed
- [ ] Message text correct
- [ ] No errors in console

### T117: Date Range Filtering
- [ ] Start date filters correctly
- [ ] End date filters correctly
- [ ] Both dates filter correctly
- [ ] Clear filter works
- [ ] Filtered count updates

### T118: Denormalized Borrower Names
- [ ] Names shown from LendingLog.borrowerName field
- [ ] Changes to User.name don't affect history
- [ ] Audit trail preserved correctly

---

## Status

**Backend Implementation**: ✅ Complete (T102-T105)  
**Frontend Implementation**: ✅ Complete (T106-T113)  
**Build Status**: ✅ Success  
**Manual Testing**: ⏳ Pending  
**Verification Tasks**: ⏳ Pending (T114-T118)

---

## Notes

- All features implemented according to spec
- No TypeScript errors
- Build successful
- Ready for User Acceptance Testing
- Consider adding E2E tests in future phases

---

**Tester**: _______________  
**Date**: _______________  
**Result**: ⬜ Pass  ⬜ Fail (with notes)
