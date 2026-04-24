# ============================================================
#  AASAS – Backend Dev Server (No Docker / No PostgreSQL)
# ============================================================

$ROOT    = Split-Path $PSScriptRoot -Parent
$BACKEND = Join-Path $ROOT "backend"
$VENV    = Join-Path $ROOT ".venv"

# Point Django at the local settings (SQLite + in-memory cache)
$env:DJANGO_SETTINGS_MODULE = "core.settings_local"
$env:SECRET_KEY = "django-insecure-local-dev-only"
$env:DEBUG = "True"

# Activate virtual environment
$activate = Join-Path $VENV "Scripts\Activate.ps1"
if (Test-Path $activate) {
    Write-Host "==> Activating virtual environment" -ForegroundColor Cyan
    & $activate
} else {
    Write-Host "[WARN] No .venv found – using system Python. Run setup-backend.ps1 first." -ForegroundColor Yellow
}

Set-Location $BACKEND

Write-Host "==> Running migrations (SQLite)" -ForegroundColor Cyan
python manage.py migrate

Write-Host "==> Starting Django development server on http://localhost:8000" -ForegroundColor Green
python manage.py runserver 0.0.0.0:8000
