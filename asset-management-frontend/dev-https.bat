@echo off
title Frontend - HTTPS
cd /d "%~dp0"
set "VITE_HTTPS=true"
echo.
echo  Dang chay frontend voi HTTPS...
echo  Trinh duyet se tu mo: https://localhost:3000
echo  Neu bao "Khong bao mat" - bam Nang cao ^> Truy cap localhost
echo.
call npx vite
pause
