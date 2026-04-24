# ============================================================
#  AASAS – Celery Worker (No Docker)
# ============================================================
#  Prerequisites:  .venv created by setup-backend.ps1
#                  Redis running on localhost:6379
# ============================================================

$ROOT    = Split-Path $PSScriptRoot -Parent
$BACKEND = Join-Path $ROOT "backend"
$VENV    = Join-Path $ROOT ".venv"
$ENV_FILE = Join-Path $ROOT ".env.local"

Write-Host "==> Loading environment from .env.local" -ForegroundColor Cyan
Get-Content $ENV_FILE | ForEach-Object {
    if ($_ -match '^\s*([^#][^=]*)=(.*)$') {
        [System.Environment]::SetEnvironmentVariable($Matches[1].Trim(), $Matches[2].Trim(), 'Process')
    }
}
$env:DEBUG = "True"
$env:POSTGRES_HOST = "localhost"
$env:REDIS_URL = "redis://localhost:6379/1"

$activate = Join-Path $VENV "Scripts\Activate.ps1"
if (Test-Path $activate) { & $activate }

Set-Location $BACKEND

Write-Host "==> Starting Celery worker" -ForegroundColor Green
celery -A core worker -l info --pool=solo
