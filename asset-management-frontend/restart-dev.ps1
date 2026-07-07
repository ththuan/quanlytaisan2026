# Restart Vite Dev Server
# PowerShell script to cleanly restart the dev server

Write-Host "Stopping existing Vite dev server..." -ForegroundColor Yellow

# Find and kill node processes running vite
Get-Process | Where-Object { $_.ProcessName -eq "node" -and $_.CommandLine -like "*vite*" } | Stop-Process -Force -ErrorAction SilentlyContinue

# Alternative: kill all node processes (more aggressive)
# Get-Process -Name node -ErrorAction SilentlyContinue | Stop-Process -Force

Write-Host "Waiting 2 seconds..." -ForegroundColor Gray
Start-Sleep -Seconds 2

Write-Host "Starting Vite dev server..." -ForegroundColor Green
Set-Location $PSScriptRoot
npm run dev
