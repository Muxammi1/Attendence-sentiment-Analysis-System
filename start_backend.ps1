# AASAS Backend Starter
# Right-click → "Run with PowerShell"  OR  run from terminal: .\start_backend.ps1

$Root = Split-Path -Parent $MyInvocation.MyCommand.Path
$Python = Join-Path $Root ".venv\Scripts\python.exe"
$BackendDir = Join-Path $Root "backend"

Write-Host ""
Write-Host "╔════════════════════════════════════════════╗" -ForegroundColor Cyan
Write-Host "║   AASAS — Backend Startup                  ║" -ForegroundColor Cyan
Write-Host "╚════════════════════════════════════════════╝" -ForegroundColor Cyan
Write-Host ""

if (-not (Test-Path $Python)) {
    Write-Host "ERROR: .venv not found at: $Python" -ForegroundColor Red
    Write-Host "Create it with:" -ForegroundColor Yellow
    Write-Host "  python -m venv .venv" -ForegroundColor Yellow
    Write-Host "  .\.venv\Scripts\pip install -r backend\requirements-web.txt" -ForegroundColor Yellow
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host "Python: $Python" -ForegroundColor Gray
Set-Location $BackendDir
$env:DJANGO_SETTINGS_MODULE = "core.settings_local"

Write-Host "[1/3] Running migrations (SQLite)..." -ForegroundColor Yellow
& $Python manage.py migrate --settings=core.settings_local --run-syncdb
if ($LASTEXITCODE -ne 0) {
    Write-Host "Migration failed!" -ForegroundColor Red
    Read-Host "Press Enter to exit"
    exit 1
}

Write-Host ""
Write-Host "[2/3] Creating/resetting admin user..." -ForegroundColor Yellow
& $Python reset_admin.py

Write-Host ""
Write-Host "[3/3] Starting Django on http://localhost:8000 ..." -ForegroundColor Green
Write-Host ""
Write-Host "  Frontend : http://localhost:5173  <- open this in browser" -ForegroundColor Cyan
Write-Host "  Admin UI : http://localhost:8000/admin" -ForegroundColor Cyan
Write-Host "  Login    : admin / admin123" -ForegroundColor Cyan
Write-Host ""

& $Python manage.py runserver 8000 --settings=core.settings_local
