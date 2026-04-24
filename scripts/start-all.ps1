# ============================================================
#  AASAS – Launch ALL services in separate windows (No Docker)
# ============================================================
#  Run this after setup-backend.ps1 has been completed once.
# ============================================================

$ROOT    = Split-Path $PSScriptRoot -Parent
$SCRIPTS = $PSScriptRoot

Write-Host "==> Launching AASAS local stack..." -ForegroundColor Cyan

# Backend
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$SCRIPTS\start-backend.ps1`"" `
    -WindowStyle Normal

Start-Sleep -Seconds 3   # give Django a moment to start

# Celery worker
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$SCRIPTS\start-celery.ps1`"" `
    -WindowStyle Normal

# Frontend
Start-Process powershell -ArgumentList "-NoExit", "-File", "`"$SCRIPTS\start-frontend.ps1`"" `
    -WindowStyle Normal

Write-Host ""
Write-Host "  Three terminal windows have been opened." -ForegroundColor Green
Write-Host "  Backend  -> http://localhost:8000"        -ForegroundColor Green
Write-Host "  Admin    -> http://localhost:8000/admin"  -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173"        -ForegroundColor Green
