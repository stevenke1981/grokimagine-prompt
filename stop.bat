@echo off
setlocal
cd /d "%~dp0"
title Stopping Grok Image...

echo Stopping Grok Image Prompt Generator...

:: Kill by port 5000 (Flask)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5000 " 2^>nul') do (
    echo Killing backend PID %%a
    taskkill /f /pid %%a > /dev/null 2>&1
)

:: Kill by port 5173 (Vite)
for /f "tokens=5" %%a in ('netstat -aon ^| findstr ":5173 " 2^>nul') do (
    echo Killing frontend PID %%a
    taskkill /f /pid %%a > /dev/null 2>&1
)

echo Done. All servers stopped.
timeout /t 2 /nobreak > /dev/null
endlocal
