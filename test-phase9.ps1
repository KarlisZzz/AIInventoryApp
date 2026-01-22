# Phase 9 Manual Testing Script
# Run this script to perform quick manual tests

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "Phase 9 Manual Testing Script" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Check if frontend is running
Write-Host "Step 1: Checking if frontend dev server is running..." -ForegroundColor Yellow
$frontendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:5173" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $frontendRunning = $true
        Write-Host "✓ Frontend is running at http://localhost:5173" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Frontend is not running" -ForegroundColor Red
    Write-Host "  Run: cd frontend; npm run dev" -ForegroundColor Yellow
}

# Check if backend is running
Write-Host ""
Write-Host "Step 2: Checking if backend server is running..." -ForegroundColor Yellow
$backendRunning = $false
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3000/api/v1/dashboard" -TimeoutSec 2 -UseBasicParsing -ErrorAction SilentlyContinue
    if ($response.StatusCode -eq 200) {
        $backendRunning = $true
        Write-Host "✓ Backend is running at http://localhost:3000" -ForegroundColor Green
    }
} catch {
    Write-Host "✗ Backend is not running" -ForegroundColor Red
    Write-Host "  Run: cd backend; npm start" -ForegroundColor Yellow
}

if ($frontendRunning -and $backendRunning) {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Green
    Write-Host "[OK] Both servers are running!" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Green
    
    Write-Host ""
    Write-Host "Manual Testing Checklist:" -ForegroundColor Cyan
    Write-Host "------------------------"
    Write-Host ""
    
    Write-Host "T154 - Toast Notifications:" -ForegroundColor Yellow
    Write-Host "  [ ] Create an item and verify success toast appears"
    Write-Host "  [ ] Edit an item and verify success toast appears"
    Write-Host "  [ ] Delete an item and verify success toast appears"
    Write-Host "  [ ] Try invalid operation and verify error toast appears"
    Write-Host "  [ ] Verify toast auto-dismisses after 3-5 seconds"
    Write-Host "  [ ] Click X button to manually close toast"
    Write-Host ""
    
    Write-Host "T155 - Loading States:" -ForegroundColor Yellow
    Write-Host "  [ ] Verify loading spinner appears when page loads"
    Write-Host "  [ ] Verify buttons disable during form submission"
    Write-Host "  [ ] Verify ""Lending..."" text appears during lend operation"
    Write-Host "  [ ] Verify ""Deleting..."" text appears during delete"
    Write-Host ""
    
    Write-Host "T158 - Network Error Handling:" -ForegroundColor Yellow
    Write-Host "  [ ] Open DevTools Network tab"
    Write-Host "  [ ] Throttle network to ""Slow 3G"""
    Write-Host "  [ ] Perform an operation and verify retry happens"
    Write-Host "  [ ] Stop backend and verify friendly error message"
    Write-Host ""
    
    Write-Host "T159 - ARIA Labels and Accessibility:" -ForegroundColor Yellow
    Write-Host "  [ ] Press Tab key and verify focus visible"
    Write-Host "  [ ] Tab to ""Skip to main content"" link (top-left)"
    Write-Host "  [ ] Press Enter on skip link"
    Write-Host "  [ ] Right-click button - Inspect - Verify aria-label present"
    Write-Host ""
    
    Write-Host "T160 - Keyboard Navigation:" -ForegroundColor Yellow
    Write-Host "  [ ] Open Lend dialog"
    Write-Host "  [ ] Press ESC key - dialog should close"
    Write-Host "  [ ] Open dialog again"
    Write-Host "  [ ] Press Tab repeatedly - focus stays in dialog"
    Write-Host "  [ ] Verify first input auto-focuses"
    Write-Host ""
    
    Write-Host "T161 - Responsive Design:" -ForegroundColor Yellow
    Write-Host "  [ ] Open DevTools (F12)"
    Write-Host "  [ ] Click ""Toggle device toolbar"" (Ctrl+Shift+M)"
    Write-Host "  [ ] Select ""iPhone 12"" or ""iPad"" preset"
    Write-Host "  [ ] Verify layout adapts to mobile"
    Write-Host "  [ ] Verify toast positioning adapts"
    Write-Host ""
    
    Write-Host "T162 - Empty States:" -ForegroundColor Yellow
    Write-Host "  [ ] Search for non-existent item"
    Write-Host "  [ ] Verify empty state shows with icon and message"
    Write-Host "  [ ] Return all lent items"
    Write-Host "  [ ] Verify ""Currently Out"" shows empty state"
    Write-Host ""
    
    Write-Host "T163 - Success Messages:" -ForegroundColor Yellow
    Write-Host "  [ ] Create item - see 'Item [name] created successfully'"
    Write-Host "  [ ] Update item - see 'Item [name] updated successfully'"
    Write-Host "  [ ] Delete item - see 'Item [name] deleted successfully'"
    Write-Host "  [ ] Lend item - see 'Item [name] lent successfully'"
    Write-Host "  [ ] Return item - see 'Item [name] returned successfully'"
    Write-Host ""
    Write-Host ""
    Write-Host "Performance Tests:" -ForegroundColor Cyan
    Write-Host "-----------------"
    Write-Host ""
    
    Write-Host "Dashboard Load Time (SC-004):" -ForegroundColor Yellow
    Write-Host "  1. Open browser DevTools (F12)"
    Write-Host "  2. Go to Console tab"
    Write-Host "  3. Navigate to http://localhost:5173"
    Write-Host "  4. Type: performance.getEntriesByType(""navigation"")[0].loadEventEnd"
    Write-Host "  5. Expected: < 2000 (2 seconds)"
    Write-Host ""
    
    Write-Host "Search Performance (SC-005):" -ForegroundColor Yellow
    Write-Host "  1. Go to Dashboard"
    Write-Host "  2. Type in search box"
    Write-Host "  3. Observe results update"
    Write-Host "  4. Expected: Results appear in < 1 second"
    Write-Host ""
    Write-Host ""
    Write-Host "Opening browser..." -ForegroundColor Green
    Start-Process "http://localhost:5173"
    
} else {
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Red
    Write-Host "[X] Servers not running" -ForegroundColor Red
    Write-Host "========================================" -ForegroundColor Red
    Write-Host ""
    Write-Host "To start servers:" -ForegroundColor Yellow
    Write-Host "  Terminal 1: cd backend; npm start"
    Write-Host "  Terminal 2: cd frontend; npm run dev"
    Write-Host ""
}

Write-Host ""
Write-Host "Press any key to exit..."
$null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
