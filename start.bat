@echo off
setlocal EnableDelayedExpansion
cd /d "%~dp0"
title Grok Image Prompt Generator

echo.
echo  =============================================
echo   Grok Image Prompt Generator - Starting...
echo  =============================================
echo.

:: Check Python
python --version > /dev/null 2>&1
if errorlevel 1 (
    echo [ERROR] Python not found. Please install Python 3.10+
    pause
    exit /b 1
)

:: Check Node.js
node --version > /dev/null 2>&1
if errorlevel 1 (
    echo [ERROR] Node.js not found. Please install Node.js 18+
    pause
    exit /b 1
)

:: Copy .env if missing
if not exist "backend\.env" (
    echo [WARN] backend\.env not found. Copying from .env.example...
    copy ".env.example" "backend\.env" > /dev/null
    echo [WARN] Please edit backend\.env and fill in your API keys.
    echo.
)

:: Kill any processes already on port 5000 or 5173
echo [1/4] Cleaning up old processes on ports 5000 and 5173...
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " 2^>nul') do (
    taskkill /f /pid %%a > /dev/null 2>&1
)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " 2^>nul') do (
    taskkill /f /pid %%a > /dev/null 2>&1
)

:: Start Flask backend in a separate window
echo [2/4] Starting Flask backend  (http://localhost:5000) ...
start "GrokImage - Backend" cmd /k "cd /d "%~dp0backend" && python app.py"
timeout /t 3 /nobreak > /dev/null

:: Install frontend dependencies if node_modules is missing
if not exist "frontend\node_modules" (
    echo [3/4] Installing frontend dependencies (first run only)...
    cd /d "%~dp0frontend"
    call npm install
    cd /d "%~dp0"
) else (
    echo [3/4] Frontend dependencies OK
)

:: Start Vite dev server in a separate window
echo [4/4] Starting Vite frontend   (http://localhost:5173) ...
start "GrokImage - Frontend" cmd /k "cd /d "%~dp0frontend" && npm run dev"
timeout /t 4 /nobreak > /dev/null

:: Open browser
start http://localhost:5173

echo.
echo  =============================================
echo   All services started!
echo.
echo   Backend  : http://localhost:5000
echo   Frontend : http://localhost:5173
echo  =============================================
echo.
echo  Close the [GrokImage - Backend] and
echo  [GrokImage - Frontend] windows to stop.
echo.
pause
endlocal
