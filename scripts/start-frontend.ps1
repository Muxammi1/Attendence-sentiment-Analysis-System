# ============================================================
#  AASAS – Frontend Dev Server (No Docker)
# ============================================================
#  Prerequisites:  Node.js 18+ in PATH
# ============================================================

$ROOT     = Split-Path $PSScriptRoot -Parent
$FRONTEND = Join-Path $ROOT "frontend"

Set-Location $FRONTEND

if (-not (Test-Path "node_modules")) {
    Write-Host "==> Installing npm dependencies..." -ForegroundColor Cyan
    npm install
}

Write-Host "==> Starting Vite dev server on http://localhost:5173" -ForegroundColor Green
npm run dev
