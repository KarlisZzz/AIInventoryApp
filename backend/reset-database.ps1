# Database Reset Script (PowerShell)
# Resets the database to initial seed data

Write-Host "╔════════════════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║          DATABASE RESET TO INITIAL DATA               ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""
Write-Host "⚠️  WARNING: This will DELETE ALL existing data!" -ForegroundColor Yellow
Write-Host ""

# Prompt for confirmation
$confirmation = Read-Host "Are you sure you want to reset the database? Type 'yes' to continue"

if ($confirmation -ne 'yes') {
    Write-Host ""
    Write-Host "❌ Database reset cancelled" -ForegroundColor Red
    exit 0
}

Write-Host ""
Write-Host "Resetting database..." -ForegroundColor Yellow
Write-Host ""

# Run the reset script
node reset-database.js

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Database successfully reset to initial data!" -ForegroundColor Green
    Write-Host ""
    Write-Host "You can now start the server with: npm start" -ForegroundColor Cyan
} else {
    Write-Host ""
    Write-Host "❌ Database reset failed" -ForegroundColor Red
    exit 1
}
