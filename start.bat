@echo off
chcp 65001 >nul
cd /d D:\QLTS\quanlytaisan

echo ========================================
echo  Quan ly tai san - Start with HTTPS
echo ========================================
echo.

echo [1/3] Auto-generating SSL certificate with current IPs...
powershell -ExecutionPolicy Bypass -File "generate-cert.ps1"
if %errorlevel% neq 0 (
    echo CERT GENERATION FAILED! Using existing cert...
)

echo.
echo [2/3] Stopping old containers...
docker-compose down 2>nul

echo.
echo [3/3] Starting services (rebuild)...
docker-compose up --build -d

echo.
echo ========================================
echo  Services starting...
echo  Run "docker-compose logs -f" to watch
echo ========================================
echo.
pause
