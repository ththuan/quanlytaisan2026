@echo off
chcp 65001 >nul
cd /d D:\QLTS\quanlytaisan

echo ========================================
echo  Quan ly tai san - Start Full Stack
echo ========================================
echo.

echo [1/5] Auto-generating SSL certificate with current IPs...
powershell -ExecutionPolicy Bypass -File "generate-cert.ps1"
if %errorlevel% neq 0 (
    echo CERT GENERATION FAILED! Using existing cert...
)

echo.
echo [2/5] Creating Docker volumes (skip if exists)...
docker volume create quanlytaisan_postgres_data 2>nul
docker volume create quanlytaisan_redis_data 2>nul

echo.
echo [3/5] Starting services...
docker compose --profile cloudflare up -d --build

echo.
echo [4/5] Starting auto-deploy watchdog (checks GitHub every 30 min)...
start "QLTS-Watchdog" powershell -ExecutionPolicy Bypass -File "watchdog.ps1"

echo.
echo [5/5] Services:
echo   - Frontend  : https://localhost:8443 (LAN)
echo   - Backend   : http://localhost:5000
echo   - Cloudflare: https://quanlytaisanctec.dpdns.org (public)
echo   - Watchdog  : auto-deploy every 30 min
echo.
echo Run "docker compose logs -f" to watch logs
echo ========================================
