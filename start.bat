@echo off
setlocal EnableExtensions
cd /d "%~dp0"

powershell -NoProfile -Command "foreach ($p in 8000,5173) { Get-NetTCPConnection -LocalPort $p -State Listen -ErrorAction SilentlyContinue | ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue } }" >nul 2>&1

set "PY=%~dp0.venv\Scripts\python.exe"
if not exist "%PY%" set "PY=%~dp0venv\Scripts\python.exe"
if not exist "%PY%" set "PY=python"

echo kernel  http://127.0.0.1:8000
echo desk    http://127.0.0.1:5173

start "JAAL kernel" cmd /k "cd /d "%~dp0" && "%PY%" -m engine.serve"
start "JAAL desk" cmd /k "cd /d "%~dp0app" && npm run dev"

echo.
echo One double-click. Do not run npm again.
pause
