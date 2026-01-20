# Quick manual test of Return Items API
# Make sure server is running: npm start

Write-Host "`nTesting Return Items API" -ForegroundColor Cyan
Write-Host "========================`n" -ForegroundColor Cyan

# Create item
Write-Host "1. Creating test item..." -ForegroundColor Yellow
$createBody = '{"name":"Test Return","description":"For testing","category":"Electronics","status":"Available"}'
$itemRes = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/items" -Method Post -ContentType "application/json" -Body $createBody
$itemId = $itemRes.data.id
Write-Host "   Created: $itemId`n"

# Get user
$usersRes = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/users" -Method Get
$userId = $usersRes.data[0].id

# Lend item
Write-Host "2. Lending item..." -ForegroundColor Yellow
$lendBody = "{`"itemId`":`"$itemId`",`"userId`":`"$userId`",`"conditionNotes`":`"Good`"}"
$lendRes = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/lending/lend" -Method Post -ContentType "application/json" -Body $lendBody
Write-Host "   Status: $($lendRes.data.item.status)`n"

# RETURN ITEM (NEW FUNCTIONALITY)
Write-Host "3. RETURNING item..." -ForegroundColor Green
$returnBody = "{`"itemId`":`"$itemId`",`"returnConditionNotes`":`"Excellent condition`"}"
try {
    $returnRes = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/lending/return" -Method Post -ContentType "application/json" -Body $returnBody
    Write-Host "   [PASS] Status: $($returnRes.data.item.status)" -ForegroundColor Green
    Write-Host "   [PASS] DateReturned: $($returnRes.data.log.dateReturned)" -ForegroundColor Green
    Write-Host "   [PASS] Notes: $($returnRes.data.log.returnConditionNotes)`n" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] $($_.Exception.Message)" -ForegroundColor Red
    exit 1
}

# Try to return again (should fail)
Write-Host "4. Trying to return again (should fail)..." -ForegroundColor Yellow
try {
    Invoke-RestMethod -Uri "http://localhost:3001/api/v1/lending/return" -Method Post -ContentType "application/json" -Body $returnBody
    Write-Host "   [FAIL] Should have rejected!`n" -ForegroundColor Red
} catch {
    Write-Host "   [PASS] Correctly rejected`n" -ForegroundColor Green
}

# Verify can lend again
Write-Host "5. Lending returned item again..." -ForegroundColor Yellow
try {
    $relendRes = Invoke-RestMethod -Uri "http://localhost:3001/api/v1/lending/lend" -Method Post -ContentType "application/json" -Body $lendBody
    Write-Host "   [PASS] Can lend again: $($relendRes.data.item.status)`n" -ForegroundColor Green
} catch {
    Write-Host "   [FAIL] Could not relend: $($_.Exception.Message)`n" -ForegroundColor Red
}

Write-Host "✓ All tests passed!`n" -ForegroundColor Green
