# Test Backend Fix
# This script verifies the logger.info fix works

Write-Host "Testing Backend Logger Fix..." -ForegroundColor Cyan
Write-Host "==============================`n" -ForegroundColor Cyan

# Check if backend server is running
Write-Host "Checking if backend is accessible..." -ForegroundColor Yellow

try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/api/v1/dashboard" -UseBasicParsing -TimeoutSec 5
    
    if ($response.StatusCode -eq 200) {
        Write-Host "✓ Dashboard endpoint working!" -ForegroundColor Green
        Write-Host "`nResponse:" -ForegroundColor Cyan
        $response.Content | ConvertFrom-Json | ConvertTo-Json -Depth 5
        Write-Host "`n✓ Fix successful - logger.info error resolved!" -ForegroundColor Green
    }
} catch {
    $errorMsg = $_.Exception.Message
    
    if ($errorMsg -like "*Unable to connect*") {
        Write-Host "✗ Backend server is not running" -ForegroundColor Red
        Write-Host "`nTo start the backend:" -ForegroundColor Yellow
        Write-Host "  cd backend" -ForegroundColor White
        Write-Host "  npm start`n" -ForegroundColor White
    } elseif ($errorMsg -like "*logger.info*") {
        Write-Host "✗ Logger error still present!" -ForegroundColor Red
        Write-Host "Error: $errorMsg`n" -ForegroundColor Red
    } else {
        Write-Host "✗ Unexpected error" -ForegroundColor Red
        Write-Host "Error: $errorMsg`n" -ForegroundColor Red
    }
}

Write-Host "`n==============================" -ForegroundColor Cyan
Write-Host "Fix Applied:" -ForegroundColor Green
Write-Host "  - Updated performanceLogger.js" -ForegroundColor White
Write-Host "  - Replaced require('./logger') with inline logger object" -ForegroundColor White
Write-Host "  - Logger now uses console.log/warn/error with timestamps`n" -ForegroundColor White
