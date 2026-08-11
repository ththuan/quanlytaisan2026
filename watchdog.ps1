# Watchdog: auto-deploy every 30 minutes
# Run once: powershell -ExecutionPolicy Bypass -File watchdog.ps1
# Runs indefinitely until Ctrl+C

$repoPath = "D:\QLTS\quanlytaisan"
$deployScript = Join-Path $repoPath "deploy.ps1"

Write-Host "========================================="
Write-Host " QLTS Auto-Deploy Watchdog"
Write-Host " Checks every 30 minutes for GitHub updates"
Write-Host " Press Ctrl+C to stop"
Write-Host "========================================="

while ($true) {
    try {
        & powershell -ExecutionPolicy Bypass -File $deployScript
    } catch {
        Write-Host "[ERROR] $_"
    }
    
    Write-Host "Next check in 30 minutes..."
    Start-Sleep -Seconds 1800
}
