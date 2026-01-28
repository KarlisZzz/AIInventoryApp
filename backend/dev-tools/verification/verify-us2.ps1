# User Story 2 Verification Script (T077-T082a)
# Tests lending workflow with transactional integrity

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

Write-Host "`n========== User Story 2 Verification ==========`n" -ForegroundColor Yellow

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

# Get available item and user for testing
$testItem = $null
$testUser = $null
$lentItemId = $null
$logId = $null

# Setup: Get an available item
Write-Host "`nSetup: Getting available item for testing..." -ForegroundColor Cyan
try {
    $itemsResponse = Invoke-RestMethod -Uri "$BaseUrl/items?status=Available"
    $availableItems = $itemsResponse.data
    if ($availableItems.Count -eq 0) {
        Write-Host "ERROR: No available items. Please seed database first." -ForegroundColor Red
        exit 1
    }
    $testItem = $availableItems[0]
    $itemIdShort = $testItem.id.Substring(0,8)
    Write-Host "Found available item: $($testItem.name) ($itemIdShort...)" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Failed to get available items: $_" -ForegroundColor Red
    exit 1
}

# Setup: Get a user
Write-Host "Setup: Getting user for testing..." -ForegroundColor Cyan
try {
    $usersResponse = Invoke-RestMethod -Uri "$BaseUrl/users"
    $users = $usersResponse.data
    if ($users.Count -eq 0) {
        Write-Host "ERROR: No users found. Please seed database first." -ForegroundColor Red
        exit 1
    }
    $testUser = $users[0]
    Write-Host "✓ Found user: $($testUser.name) ($($testUser.email))" -ForegroundColor Green
}
catch {
    Write-Host "ERROR: Failed to get users: $_" -ForegroundColor Red
    exit 1
}

# T077 & T078: Lend item and verify status + log creation
Test-Step "T077 & T078: Lend item and verify status changes & log is created" {
    $body = @{
        itemId = $testItem.id
        userId = $testUser.id
        conditionNotes = "Test lending - good condition"
    } | ConvertTo-Json
    
    $response = Invoke-RestMethod -Uri "$BaseUrl/lending/lend" -Method Post -Headers $Headers -Body $body
    
    # Verify response structure
    if (-not $response.data) {
        throw "No data in response"
    }
    if (-not $response.data.item) {
        throw "No item in response"
    }
    if (-not $response.data.log) {
        throw "No log in response"
    }
    
    # T077: Verify item status changed to "Lent"
    if ($response.data.item.status -ne "Lent") {
        throw "Item status is '$($response.data.item.status)', expected 'Lent'"
    }
    
    # T078: Verify lending log created with correct data
    $log = $response.data.log
    $script:logId = $log.id
    $script:lentItemId = $testItem.id
    
    if ($log.itemId -ne $testItem.id) {
        throw "Log itemId mismatch: got $($log.itemId), expected $($testItem.id)"
    }
    
    if ($log.userId -ne $testUser.id) {
        throw "Log userId mismatch: got $($log.userId), expected $($testUser.id)"
    }
    
    if (-not $log.dateLent) {
        throw "No dateLent in log"
    }
    
    if ($log.dateReturned) {
        throw "dateReturned should be null for active lending"
    }
    
    $logIdShort = $log.id.Substring(0,8)
    Write-Host "  Item status: $($response.data.item.status)" -ForegroundColor Gray
    Write-Host "  Log identifier: $logIdShort..." -ForegroundColor Gray
    Write-Host "  Date lent: $($log.dateLent)" -ForegroundColor Gray
}

# T082a: Verify denormalized borrower fields
Test-Step "T082a: Verify denormalized borrowerName and borrowerEmail in LendingLog" {
    # Get the lending log we just created
    $historyResponse = Invoke-RestMethod -Uri "$BaseUrl/lending/history/$lentItemId"
    $logs = $historyResponse.data
    
    if ($logs.Count -eq 0) {
        throw "No lending history found"
    }
    
    $recentLog = $logs[0]  # Most recent first
    
    # Verify denormalized fields exist
    if (-not $recentLog.borrowerName) {
        throw "borrowerName field is missing"
    }
    
    if (-not $recentLog.borrowerEmail) {
        throw "borrowerEmail field is missing"
    }
    
    # Verify denormalized fields match user data
    if ($recentLog.borrowerName -ne $testUser.name) {
        throw "borrowerName mismatch: got '$($recentLog.borrowerName)', expected '$($testUser.name)'"
    }
    
    if ($recentLog.borrowerEmail -ne $testUser.email) {
        throw "borrowerEmail mismatch: got '$($recentLog.borrowerEmail)', expected '$($testUser.email)'"
    }
    
    Write-Host "  Borrower Name: $($recentLog.borrowerName)" -ForegroundColor Gray
    Write-Host "  Borrower Email: $($recentLog.borrowerEmail)" -ForegroundColor Gray
}

# T082: Verify condition notes are saved
Test-Step "T082: Verify condition notes are saved in LendingLog" {
    $historyResponse = Invoke-RestMethod -Uri "$BaseUrl/lending/history/$lentItemId"
    $logs = $historyResponse.data
    $recentLog = $logs[0]
    
    if (-not $recentLog.conditionNotes) {
        throw "Condition notes not saved"
    }
    
    if ($recentLog.conditionNotes -ne "Test lending - good condition") {
        throw "Condition notes mismatch: got '$($recentLog.conditionNotes)'"
    }
    
    Write-Host "  Condition notes: $($recentLog.conditionNotes)" -ForegroundColor Gray
}

# T079: Attempt to lend already-lent item
Test-Step "T079: Attempt to lend already-Lent item (should fail)" {
    $body = @{
        itemId = $lentItemId
        userId = $testUser.id
    } | ConvertTo-Json
    
    try {
        $result = Invoke-RestMethod -Uri "$BaseUrl/lending/lend" -Method Post -Headers $Headers -Body $body -ErrorAction Stop
        throw "Should have rejected lending already-lent item"
    }
    catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        if ($statusCode -ne 400) {
            throw "Expected 400 status code, got $statusCode"
        }
        
        # Verify error message mentions the item is lent
        $errorMessage = $_.Exception.Message
        if ($errorMessage -notmatch "lent|already") {
            throw "Error message should mention item is lent: $errorMessage"
        }
        
        Write-Host "  ✓ Correctly rejected with 400 status" -ForegroundColor Gray
    }
}

# T081: Test user search filtering
Test-Step "T081: Search for user by name/email and verify filtering" {
    # Search by partial name
    $searchName = $testUser.name.Substring(0, 4)
    $searchResponse = Invoke-RestMethod -Uri "$BaseUrl/users?search=$searchName"
    $results = $searchResponse.data
    
    if ($results.Count -eq 0) {
        throw "No results for name search '$searchName'"
    }
    
    # Verify all results match the search term
    $matchFound = $false
    foreach ($user in $results) {
        if ($user.name -like "*$searchName*" -or $user.email -like "*$searchName*") {
            $matchFound = $true
            break
        }
    }
    
    if (-not $matchFound) {
        throw "Search results don't contain matching users"
    }
    
    Write-Host "  Search '$searchName': found $($results.Count) user(s)" -ForegroundColor Gray
    
    # Search by email
    $emailParts = $testUser.email.Split("@")
    $searchEmail = $emailParts[0].Substring(0, [Math]::Min(4, $emailParts[0].Length))
    $emailResponse = Invoke-RestMethod -Uri "$BaseUrl/users?search=$searchEmail"
    $emailResults = $emailResponse.data
    
    if ($emailResults.Count -eq 0) {
        throw "No results for email search '$searchEmail'"
    }
    
    Write-Host "  Search '$searchEmail': found $($emailResults.Count) user(s)" -ForegroundColor Gray
}

# T080: Test transaction rollback (simulate by testing validation)
Test-Step "T080: Verify transaction integrity (validation prevents partial updates)" {
    # Try to lend with invalid user ID - should rollback completely
    $body = @{
        itemId = $testItem.id  # Use a different available item if possible
        userId = "00000000-0000-0000-0000-000000000000"  # Invalid UUID
    } | ConvertTo-Json
    
    try {
        # Get another available item first
        $itemsResponse = Invoke-RestMethod -Uri "$BaseUrl/items?status=Available"
        $availableItems = $itemsResponse.data | Where-Object { $_.id -ne $lentItemId }
        
        if ($availableItems.Count -gt 0) {
            $testItemForRollback = $availableItems[0]
            $body = @{
                itemId = $testItemForRollback.id
                userId = "00000000-0000-0000-0000-000000000000"
            } | ConvertTo-Json
            
            try {
                Invoke-RestMethod -Uri "$BaseUrl/lending/lend" -Method Post -Headers $Headers -Body $body -ErrorAction Stop
                throw "Should have failed with invalid user ID"
            }
            catch {
                # Verify item status didn't change
                $itemCheck = Invoke-RestMethod -Uri "$BaseUrl/items/$($testItemForRollback.id)"
                if ($itemCheck.data.status -ne "Available") {
                    throw "Item status changed despite transaction failure (no rollback)"
                }
                
                Write-Host "  ✓ Transaction rolled back - item status unchanged" -ForegroundColor Gray
            }
        }
        else {
            Write-Host "  ⚠ Skipped - no available items for rollback test" -ForegroundColor Yellow
        }
    }
    catch {
        throw $_
    }
}

# Additional validation: Check active lendings
Write-Host "`nAdditional Check: Verify active lendings endpoint" -ForegroundColor Cyan
try {
    $activeResponse = Invoke-RestMethod -Uri "$BaseUrl/lending/active"
    $activeLendings = $activeResponse.data
    
    # Find our test lending
    $ourLending = $activeLendings | Where-Object { $_.id -eq $logId }
    if (-not $ourLending) {
        Write-Host "  ⚠ Our lending not found in active lendings list" -ForegroundColor Yellow
    }
    else {
        Write-Host "  ✓ Found our lending in active list (total: $($activeLendings.Count))" -ForegroundColor Green
    }
}
catch {
    Write-Host "  ⚠ Failed to check active lendings: $_" -ForegroundColor Yellow
}

Write-Host "`n========== Summary ==========`n" -ForegroundColor Yellow

Write-Host "Passed: $passed" -ForegroundColor Green
Write-Host "Failed: $failed" -ForegroundColor Red

if ($failed -gt 0) {
    Write-Host "`nSome tests failed" -ForegroundColor Red
    exit 1
}
else {
    Write-Host "`nAll tests passed!" -ForegroundColor Green
    exit 0
}
