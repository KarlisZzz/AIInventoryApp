# User Story 1 Verification Script (T052-T057)
# Tests backend API to support manual UI verification

param([switch]$Verbose)

$BaseUrl = "http://localhost:3001/api/v1"
$Headers = @{ "Content-Type" = "application/json" }
$passed = 0
$failed = 0

function Test-Step {
    param($Name, $Test)
    Write-Host "`n$Name" -ForegroundColor Cyan
    try {
        & $Test
        Write-Host "PASS" -ForegroundColor Green
        $script:passed++
        return $true
    }
    catch {
        Write-Host "FAIL: $_" -ForegroundColor Red
        $script:failed++
        return $false
    }
}

Write-Host "`n========== User Story 1 Verification ==========`n" -ForegroundColor Yellow

# Check backend
Write-Host "Checking backend server..." -ForegroundColor Cyan
try {
    Invoke-RestMethod -Uri "http://localhost:3001/health" -TimeoutSec 3 | Out-Null
    Write-Host "Backend is running" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Backend not running. Start with: cd backend; npm start" -ForegroundColor Red
    exit 1
}

# T052: Create item
$itemId = $null
Test-Step "T052: Create new item" {
    $body = @{
        name = "Verification Laptop"
        description = "Test item for verification"
        category = "Hardware"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/items" -Method Post -Headers $Headers -Body $body
    $script:itemId = $response.data.id
    
    if (-not $script:itemId) {
        throw "No ID returned"
    }
    
    # Verify it appears in list
    $itemsResponse = Invoke-RestMethod -Uri "$BaseUrl/items"
    $items = $itemsResponse.data
    if (-not ($items | Where-Object { $_.id -eq $script:itemId })) {
        throw "Item not found in list"
    }
}

# T053: Edit item
Test-Step "T053: Edit item and verify persistence" {
    if (-not $itemId) { throw "No item to edit" }
    
    $body = @{
        description = "Updated at $(Get-Date -Format 'HH:mm:ss')"
    } | ConvertTo-Json
    
    $updated = Invoke-RestMethod -Uri "$BaseUrl/items/$itemId" -Method Put -Headers $Headers -Body $body
    $newDesc = $updated.data.description
    
    Start-Sleep -Milliseconds 500
    
    # Refetch to verify persistence
    $fetched = Invoke-RestMethod -Uri "$BaseUrl/items/$itemId"
    if ($fetched.data.description -ne $newDesc) {
        throw "Changes did not persist"
    }
}

# T056: Search by name
Test-Step "T056: Search by name" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/items/search?q=Laptop"
    $results = $response.data
    if ($results.Count -eq 0) {
        throw "No results found"
    }
    if (-not ($results | Where-Object { $_.name -like "*Laptop*" })) {
        throw "Results don't match search"
    }
}

# T056: Filter by status
Test-Step "T056: Filter by status" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/items?status=Available"
    $results = $response.data
    $nonAvailable = $results | Where-Object { $_.status -ne "Available" }
    if ($nonAvailable) {
        throw "Filter returned wrong status items"
    }
}

# T056: Filter by category  
Test-Step "T056: Filter by category" {
    $response = Invoke-RestMethod -Uri "$BaseUrl/items?category=Hardware"
    $results = $response.data
    $nonHardware = $results | Where-Object { $_.category -ne "Hardware" }
    if ($nonHardware) {
        throw "Filter returned wrong category items"
    }
}

# T057: Validate empty name
Test-Step "T057: Reject empty name" {
    $body = @{ category = "Hardware" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$BaseUrl/items" -Method Post -Headers $Headers -Body $body -ErrorAction Stop
        throw "Should have rejected empty name"
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 400) {
            throw "Expected 400 status code"
        }
    }
}

# T057: Validate empty category
Test-Step "T057: Reject empty category" {
    $body = @{ name = "Test" } | ConvertTo-Json
    try {
        Invoke-RestMethod -Uri "$BaseUrl/items" -Method Post -Headers $Headers -Body $body -ErrorAction Stop
        throw "Should have rejected empty category"
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 400) {
            throw "Expected 400 status code"
        }
    }
}

# T054: Delete Available item
Test-Step "T054: Delete Available item" {
    if (-not $itemId) { throw "No item to delete" }
    
    Invoke-RestMethod -Uri "$BaseUrl/items/$itemId" -Method Delete
    
    Start-Sleep -Milliseconds 500
    
    # Verify deletion
    try {
        Invoke-RestMethod -Uri "$BaseUrl/items/$itemId" -ErrorAction Stop
        throw "Item still exists"
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 404) {
            throw "Expected 404 after deletion"
        }
    }
}

# T055: Try delete Lent item
Test-Step "T055: Prevent deleting Lent item" {
    # Create a Lent item
    $body = @{
        name = "Lent Test Item"
        category = "Hardware"
        status = "Lent"
    } | ConvertTo-Json
    
    $lentItem = Invoke-RestMethod -Uri "$BaseUrl/items" -Method Post -Headers $Headers -Body $body
    $lentItemId = $lentItem.data.id
    
    # Try to delete it
    try {
        Invoke-RestMethod -Uri "$BaseUrl/items/$lentItemId" -Method Delete -ErrorAction Stop
        throw "Should not allow deleting Lent item"
    }
    catch {
        if ($_.Exception.Response.StatusCode.value__ -ne 400) {
            throw "Expected 400 status code"
        }
    }
    finally {
        # Cleanup
        try {
            $cleanup = @{ status = "Available" } | ConvertTo-Json
            Invoke-RestMethod -Uri "$BaseUrl/items/$($lentItem.id)" -Method Put -Headers $Headers -Body $cleanup | Out-Null
            Invoke-RestMethod -Uri "$BaseUrl/items/$($lentItem.id)" -Method Delete | Out-Null
        } catch {}
    }
}

# T055a note
Write-Host "`nT055a: Item with lending history" -ForegroundColor Cyan
Write-Host "Will be tested after User Story 2 (lending)" -ForegroundColor Yellow

# Summary
Write-Host "`n========== Summary ==========`n" -ForegroundColor Yellow
Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

Write-Host "`n========== Manual UI Tests ==========`n" -ForegroundColor Yellow
Write-Host "Open: http://localhost:5173/inventory" -ForegroundColor White
Write-Host ""
Write-Host "1. Click 'Add Item' and create a new item"
Write-Host "2. Verify it appears in the grid"
Write-Host "3. Click 'Edit' and change the description"
Write-Host "4. Refresh page and verify changes persist"
Write-Host "5. Use search box to filter items"
Write-Host "6. Try empty name/category - should show error"
Write-Host "7. Delete an Available item"
Write-Host "8. Try to delete a Lent item - should show error"
Write-Host ""

if ($failed -eq 0) {
    Write-Host "All API tests passed!" -ForegroundColor Green
    exit 0
}
else {
    Write-Host "Some tests failed" -ForegroundColor Red
    exit 1
}
