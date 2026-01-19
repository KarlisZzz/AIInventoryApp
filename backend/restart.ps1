# Restart backend server
Write-Host "Finding backend process on port 3001..." -ForegroundColor Cyan
$conn = Get-NetTCPConnection -LocalPort 3001 -ErrorAction SilentlyContinue
if ($conn) {
    $pid = $conn.OwningProcess
    Write-Host "Stopping process $pid..." -ForegroundColor Yellow
    Stop-Process -Id $pid -Force -ErrorAction SilentlyContinue
    Start-Sleep -Seconds 2
}

Write-Host "Starting backend server..." -ForegroundColor Cyan
cd C:\Projects\Learn\SpecKit\inventory\backend
npm start
