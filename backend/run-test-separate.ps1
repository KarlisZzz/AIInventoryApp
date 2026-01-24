# Simple script to run the test
# Make sure the server is already running before executing this

Write-Host "`n=== Image Upload Test ===" -ForegroundColor Cyan
Write-Host "Make sure the server is running on port 3001 first!" -ForegroundColor Yellow
Write-Host ""

# Wait a moment
Start-Sleep -Seconds 1

# Check if server is running
try {
    $response = Invoke-WebRequest -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Server is running" -ForegroundColor Green
    Write-Host ""
} catch {
    Write-Host "✗ Server is NOT running on port 3001" -ForegroundColor Red
    Write-Host "Please start the server first: npm run dev" -ForegroundColor Yellow
    exit 1
}

# Run the test
node test-image-upload.js

Write-Host "`n=== Test Complete ===" -ForegroundColor Cyan
