@echo off
echo ========================================================
echo   Starting Gotham_SIH (Operation Grey Ledger Workbench)
echo ========================================================
echo.

echo Starting Backend Engine Server on port 8000...
start cmd /k "python server.py"

timeout /t 2 >nul

echo Starting Frontend Workbench on port 5173...
start cmd /k "npm run dev"

echo.
echo ========================================================
echo   Gotham_SIH is running!
echo   Frontend: http://localhost:5173
echo   Backend:  http://127.0.0.1:8000
echo ========================================================
