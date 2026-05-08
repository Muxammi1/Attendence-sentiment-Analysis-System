@echo off
title AASAS Backend
color 0A
cd /d "%~dp0backend"

echo.
echo Starting AASAS backend...
echo.

echo [1/3] Running migrations...
".venv\Scripts\python.exe" manage.py migrate --settings=core.settings_local --run-syncdb
if errorlevel 1 ( echo Migration failed & pause & exit /b 1 )

echo.
echo [2/3] Creating admin user...
".venv\Scripts\python.exe" reset_admin.py

echo.
echo [3/3] Starting server on http://localhost:8000
echo        Login: admin / admin123
echo        Frontend: http://localhost:5173
echo.
".venv\Scripts\python.exe" manage.py runserver 8000 --settings=core.settings_local
pause
