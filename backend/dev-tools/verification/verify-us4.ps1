# User Story 4 Verification Script: View Lending History
# Tests T102-T105 implementation with comprehensive scenarios

Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "User Story 4: View Lending History - Backend Verification" -ForegroundColor Cyan
Write-Host "Testing Tasks T102-T105" -ForegroundColor Cyan
Write-Host "================================================================`n" -ForegroundColor Cyan

$baseUrl = "http://localhost:3001/api/v1"
$passed = 0
$failed = 0

function Test-Endpoint {
    param($description, $method, $url, $body, $expectedStatus, $validator)
    
    Write-Host "`n$description" -ForegroundColor Yellow
    
    try {
        $params = @{
            Uri = $url
            Method = $method
            Headers = @{"Content-Type"="application/json"}
            ErrorAction = "Stop"
        }
        
        if ($body) {
            $params.Body = $body | ConvertTo-Json
        }
        
        $response = Invoke-RestMethod @params
        
        if ($validator) {
            $result = & $validator $response
            if ($result) {
                Write-Host "  ✓ PASS: $description" -ForegroundColor Green
                $script:passed++
                return $response
            } else {
                Write-Host "  ✗ FAIL: Validation failed" -ForegroundColor Red
                $script:failed++
                return $null
            }
        } else {
            Write-Host "  ✓ PASS: $description" -ForegroundColor Green
            $script:passed++
            return $response
        }
        
    } catch {
        $statusCode = $_.Exception.Response.StatusCode.value__
        
        if ($expectedStatus -and $statusCode -eq $expectedStatus) {
            Write-Host "  ✓ PASS: Correctly returned $statusCode" -ForegroundColor Green
            $script:passed++
        } else {
            Write-Host "  ✗ FAIL: $($_.Exception.Message)" -ForegroundColor Red
            $script:failed++
        }
        
        return $null
    }
}

# Test 1: Get items to work with
Write-Host "`n1. Setup: Getting test items..." -ForegroundColor Cyan
$itemsResponse = Test-Endpoint `
    -description "Fetch all items" `
    -method "Get" `
    -url "$baseUrl/items" `
    -validator { param($r) $r.data -and $r.data.Count -gt 0 }

if (-not $itemsResponse) {
    Write-Host "`nℹ No items found. Creating test scenario..." -ForegroundColor Yellow
    exit 1
}

$testItem = $itemsResponse.data[0]
Write-Host "  Using item: $($testItem.name) (ID: $($testItem.id))" -ForegroundColor Gray

# Test 2: Get history for an item
Write-Host "`n2. Test GET /api/v1/lending/history/:itemId" -ForegroundColor Cyan
$historyResponse = Test-Endpoint `
    -description "Get lending history for item" `
    -method "Get" `
    -url "$baseUrl/lending/history/$($testItem.id)" `
    -validator { 
        param($r) 
        $r.data -ne $null -and $r.data -is [Array] 
    }

if ($historyResponse) {
    $history = $historyResponse.data
    Write-Host "  ℹ History entries found: $($history.Count)" -ForegroundColor Gray
    
    if ($history.Count -gt 0) {
        # Test 3: Verify denormalized fields
        Write-Host "`n3. Verify denormalized borrower fields (FR-016/FR-028)" -ForegroundColor Cyan
        $firstLog = $history[0]
        
        if ($firstLog.borrowerName) {
            Write-Host "  ✓ PASS: borrowerName present: $($firstLog.borrowerName)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ✗ FAIL: borrowerName missing" -ForegroundColor Red
            $failed++
        }
        
        if ($firstLog.borrowerEmail) {
            Write-Host "  ✓ PASS: borrowerEmail present: $($firstLog.borrowerEmail)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ✗ FAIL: borrowerEmail missing" -ForegroundColor Red
            $failed++
        }
        
        if ($firstLog.dateLent) {
            Write-Host "  ✓ PASS: dateLent present: $($firstLog.dateLent)" -ForegroundColor Green
            $passed++
        } else {
            Write-Host "  ✗ FAIL: dateLent missing" -ForegroundColor Red
            $failed++
        }
        
        # Test 4: Verify chronological order
        if ($history.Count -gt 1) {
            Write-Host "`n4. Verify chronological order (most recent first - FR-021)" -ForegroundColor Cyan
            $isOrdered = $true
            
            for ($i = 1; $i -lt $history.Count; $i++) {
                $prevDate = [DateTime]$history[$i-1].dateLent
                $currDate = [DateTime]$history[$i].dateLent
                
                if ($prevDate -lt $currDate) {
                    Write-Host "  ✗ FAIL: Entry $i out of order" -ForegroundColor Red
                    $isOrdered = $false
                    $failed++
                    break
                }
            }
            
            if ($isOrdered) {
                Write-Host "  ✓ PASS: All entries in chronological order" -ForegroundColor Green
                $passed++
            }
        } else {
            Write-Host "`n4. Skip chronological test (only 1 entry)" -ForegroundColor Gray
        }
        
        # Display sample entry
        Write-Host "`n5. Sample history entry:" -ForegroundColor Cyan
        Write-Host ($firstLog | ConvertTo-Json -Depth 3) -ForegroundColor Gray
    } else {
        Write-Host "  ℹ No history entries for this item" -ForegroundColor Gray
    }
}

# Test 5: Non-existent item
Write-Host "`n6. Test with non-existent item ID" -ForegroundColor Cyan
$fakeId = "00000000-0000-0000-0000-000000000000"
$fakeResponse = Test-Endpoint `
    -description "Get history for non-existent item" `
    -method "Get" `
    -url "$baseUrl/lending/history/$fakeId" `
    -validator { 
        param($r) 
        $r.data -is [Array] -and $r.data.Count -eq 0
    }

# Test 6: Verify response envelope format
Write-Host "`n7. Verify response envelope format (FR-002-API)" -ForegroundColor Cyan
if ($historyResponse) {
    if ($historyResponse.PSObject.Properties.Name -contains "data" -and
        $historyResponse.PSObject.Properties.Name -contains "error" -and
        $historyResponse.PSObject.Properties.Name -contains "message") {
        Write-Host "  ✓ PASS: Response has correct envelope structure" -ForegroundColor Green
        $passed++
    } else {
        Write-Host "  ✗ FAIL: Response envelope missing required properties" -ForegroundColor Red
        $failed++
    }
}

# Summary
Write-Host "`n================================================================" -ForegroundColor Cyan
Write-Host "Test Summary" -ForegroundColor Cyan
Write-Host "================================================================" -ForegroundColor Cyan
Write-Host "  Passed: $passed" -ForegroundColor Green
Write-Host "  Failed: $failed" -ForegroundColor $(if ($failed -eq 0) { "Green" } else { "Red" })
Write-Host ""

if ($failed -eq 0) {
    Write-Host "✅ All User Story 4 backend tests PASSED!" -ForegroundColor Green
    Write-Host ""
    Write-Host "Tasks T102-T105 verified:" -ForegroundColor Green
    Write-Host "  [X] T102: getHistoryByItemId in LendingLog model" -ForegroundColor Green
    Write-Host "  [X] T103: getItemHistory in lendingService" -ForegroundColor Green
    Write-Host "  [X] T104: getHistory in lendingController" -ForegroundColor Green
    Write-Host "  [X] T105: GET /api/v1/lending/history/:itemId route" -ForegroundColor Green
    Write-Host ""
    Write-Host "✓ Ready to proceed to frontend tasks T106-T113" -ForegroundColor Cyan
} else {
    Write-Host "⚠ Some tests failed. Please review the output above." -ForegroundColor Yellow
    exit 1
}
