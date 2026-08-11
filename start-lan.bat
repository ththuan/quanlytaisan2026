@echo off
:: Run as Administrator automatically
>nul 2>&1 "%SYSTEMROOT%\system32\cacls.exe" "%SYSTEMROOT%\system32\config\system"
if '%errorlevel%' NEQ '0' (
    echo Dang yeu cau quyen Administrator...
    powershell -Command "Start-Process '%~f0' -Verb RunAs"
    exit /b
)

cd /d D:\QLTS\quanlytaisan

echo ============================================
echo  QLTS - Tao firewall rule + Start
echo ============================================

echo.
echo [1/3] Tao firewall rule port 4000...
netsh advfirewall firewall add rule name="QLTS Port 4000" dir=in action=allow protocol=TCP localport=4000 2>nul
netsh advfirewall firewall add rule name="QLTS Port 8443" dir=in action=allow protocol=TCP localport=8443 2>nul
netsh advfirewall firewall add rule name="QLTS Port 5000" dir=in action=allow protocol=TCP localport=5000 2>nul
echo OK

echo.
echo [2/3] Cap nhat SSL certificate voi IP hien tai...
powershell -ExecutionPolicy Bypass -File "generate-cert.ps1"

echo.
echo [3/3] Khoi dong Docker...
docker-compose down 2>nul
docker-compose up -d

echo.
echo ============================================
echo  Truy cap tu dien thoai qua LAN:
echo    https://172.16.116.33:4000/
echo  Hoac dung hostname:
echo    https://DESKTOP-PRUT8V6:4000/
echo ============================================
pause
