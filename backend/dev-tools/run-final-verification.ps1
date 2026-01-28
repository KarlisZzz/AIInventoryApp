# Final Verification Script - T164-T170
# This script starts the server and runs all verification tests

Write-Host "Final Verification Test Suite (T164-T170)" -ForegroundColor Cyan
Write-Host ""

$backendDir = Split-Path -Parent $MyInvocation.MyCommand.Path

# Check if server is already running
Write-Host "Checking if backend server is running..." -ForegroundColor Yellow
$serverRunning = $false
try {
    $response = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
    $serverRunning = $true
    Write-Host "Backend server is already running" -ForegroundColor Green
} catch {
    Write-Host "Backend server is not running" -ForegroundColor Yellow
}

$serverProcess = $null

if (-not $serverRunning) {
    Write-Host "Starting backend server..." -ForegroundColor Yellow
    
    # Start server in background
    $serverProcess = Start-Process -FilePath "node" -ArgumentList "src/server.js" -WorkingDirectory $backendDir -PassThru -WindowStyle Hidden
    
    # Wait for server to be ready
    Write-Host "Waiting for server to start..." -ForegroundColor Yellow
    $maxWait = 30
    $waited = 0
    $ready = $false
    
    while (($waited -lt $maxWait) -and (-not $ready)) {
        Start-Sleep -Seconds 1
        $waited++
        try {
            $null = Invoke-RestMethod -Uri "http://localhost:3001/health" -Method GET -TimeoutSec 2 -ErrorAction Stop
            $ready = $true
            Write-Host "Backend server started successfully" -ForegroundColor Green
        } catch {
            Write-Host "." -NoNewline -ForegroundColor Yellow
        }
    }
    
    if (-not $ready) {
        Write-Host ""
        Write-Host "Failed to start backend server" -ForegroundColor Red
        if ($serverProcess) {
            Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
        }
        exit 1
    }
    Write-Host ""
}

Write-Host ""
Write-Host "Running verification tests..." -ForegroundColor Cyan
Write-Host ""

# Run the verification script
$testExitCode = 0
try {
    & node "$backendDir\verify-final-all.js"
    $testExitCode = $LASTEXITCODE
} catch {
    Write-Host "Error running tests: $_" -ForegroundColor Red
    $testExitCode = 1
}

# Cleanup: Stop server if we started it
if ($serverProcess) {
    Write-Host ""
    Write-Host "Stopping backend server..." -ForegroundColor Yellow
    Stop-Process -Id $serverProcess.Id -Force -ErrorAction SilentlyContinue
    Write-Host "Server stopped" -ForegroundColor Green
}

Write-Host ""
Write-Host "Verification complete!" -ForegroundColor Cyan
exit $testExitCode
