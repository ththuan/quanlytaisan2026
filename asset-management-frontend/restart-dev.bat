@echo off
REM Restart Vite Dev Server
REM Kills existing node processes and starts fresh

echo Stopping existing Vite dev server...
taskkill /F /IM node.exe 2>nul

echo Waiting 2 seconds...
timeout /t 2 /nobreak >nul

echo Starting Vite dev server...
cd /d "%~dp0"
npm run dev
