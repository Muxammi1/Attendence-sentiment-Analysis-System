# ============================================================
#  AASAS – One-time Backend Setup (No Docker)
# ============================================================
#  Run this once before starting the servers.
#  It will:
#    1. Create a Python virtual environment (.venv)
#    2. Install all pip dependencies
#    3. Create the PostgreSQL database & user (requires psql in PATH)
#    4. Apply Django migrations
#    5. Create a default superuser  (admin / admin123)
# ============================================================

param(
    [switch]$SkipDB,      # skip PostgreSQL setup (if DB already exists)
    [switch]$SkipVenv     # skip venv creation (if already exists)
)

$ROOT     = Split-Path $PSScriptRoot -Parent
$BACKEND  = Join-Path $ROOT "backend"
$VENV     = Join-Path $ROOT ".venv"
$ENV_FILE = Join-Path $ROOT ".env.local"

# ── Load env ──────────────────────────────────────────────
Write-Host "`n[1/5] Loading .env.local" -ForegroundColor Cyan
Get-Content $ENV_FILE | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), 'Process')
    }
}
$env:DEBUG         = "True"
$env:POSTGRES_HOST = "localhost"
$env:REDIS_URL     = "redis://localhost:6379/1"

# ── Virtual environment ───────────────────────────────────
if (-not $SkipVenv) {
    Write-Host "`n[2/5] Creating virtual environment at .venv" -ForegroundColor Cyan
    if (-not (Test-Path $VENV)) {
        python -m venv $VENV
    } else {
        Write-Host "      .venv already exists, skipping." -ForegroundColor DarkGray
    }
}

$activate = Join-Path $VENV "Scripts\Activate.ps1"
if (Test-Path $activate) { & $activate } else {
    Write-Error "Virtual environment activation failed. Is Python 3.10+ installed?"
    exit 1
}

# ── Pip install ───────────────────────────────────────────
Write-Host "`n[3/5] Installing Python dependencies (Web Only)" -ForegroundColor Cyan
pip install --upgrade pip
pip install -r (Join-Path $BACKEND "requirements-web.txt")

# ── PostgreSQL setup ──────────────────────────────────────
if (-not $SkipDB) {
    Write-Host "`n[4/5] Setting up PostgreSQL database" -ForegroundColor Cyan

    $pgDB   = $env:POSTGRES_DB
    $pgUser = $env:POSTGRES_USER
    $pgPass = $env:POSTGRES_PASSWORD

    $psqlCmd = "psql"
    if (-not (Get-Command $psqlCmd -ErrorAction SilentlyContinue)) {
        Write-Warning "psql not found in PATH. Skipping database creation."
        Write-Warning "Please create the DB manually:"
        Write-Warning "  CREATE USER $pgUser WITH PASSWORD '$pgPass';"
        Write-Warning "  CREATE DATABASE $pgDB OWNER $pgUser;"
    } else {
        # Connect as postgres superuser to create role + database
        $sql = @"
DO `$`$
BEGIN
  IF NOT EXISTS (SELECT FROM pg_catalog.pg_roles WHERE rolname = '$pgUser') THEN
    CREATE ROLE $pgUser LOGIN PASSWORD '$pgPass';
  END IF;
END
`$`$;

SELECT 'CREATE DATABASE $pgDB OWNER $pgUser'
WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = '$pgDB')\gexec
"@
        $sql | psql -U postgres -c $sql 2>&1 | Write-Host
        Write-Host "      Database ready." -ForegroundColor Green
    }
} else {
    Write-Host "`n[4/5] Skipping DB setup (-SkipDB flag set)" -ForegroundColor DarkGray
}

# ── Migrations + superuser ────────────────────────────────
Write-Host "`n[5/5] Running Django migrations (SQLite)" -ForegroundColor Cyan
$env:DJANGO_SETTINGS_MODULE = "core.settings_local"
Set-Location $BACKEND
python manage.py migrate

Write-Host "`n==> Creating default superuser (admin / admin123)" -ForegroundColor Cyan
$createSuperUser = @"
import os
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings_local')
from django.contrib.auth import get_user_model
User = get_user_model()
if not User.objects.filter(username='admin').exists():
    User.objects.create_superuser('admin', 'admin@aasas.local', 'admin123')
    print('Superuser created.')
else:
    print('Superuser already exists.')
"@
$createSuperUser | python manage.py shell

Write-Host "`n============================================================" -ForegroundColor Green
Write-Host "  Setup complete!  Next steps:" -ForegroundColor Green
Write-Host "  1.  Open Terminal 1:  .\scripts\start-backend.ps1" -ForegroundColor Green
Write-Host "  2.  Open Terminal 2:  .\scripts\start-celery.ps1" -ForegroundColor Green
Write-Host "  3.  Open Terminal 3:  .\scripts\start-frontend.ps1" -ForegroundColor Green
Write-Host "  Backend  -> http://localhost:8000" -ForegroundColor Green
Write-Host "  Frontend -> http://localhost:5173" -ForegroundColor Green
Write-Host "============================================================`n" -ForegroundColor Green
