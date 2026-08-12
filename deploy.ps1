# Auto-deploy script: check GitHub every 30 minutes, deploy if changes detected
# Usage: powershell -ExecutionPolicy Bypass -File deploy.ps1

$repoPath = "D:\QLTS\quanlytaisan"
Set-Location $repoPath

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Checking for updates..."

# Fetch latest
git fetch origin main 2>&1 | Out-Null

# Compare local vs remote
$localCommit = git rev-parse HEAD
$remoteCommit = git rev-parse origin/main

if ($localCommit -eq $remoteCommit) {
    Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] No changes. Skipping."
    exit 0
}

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] NEW CHANGES DETECTED! Deploying..."

# Pull changes
git pull origin main
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Git pull failed!"
    exit 1
}

# Rebuild app containers, force recreate cloudflared (uses external image)
docker compose up -d --build backend frontend
docker compose --profile cloudflare up -d --force-recreate cloudflared
if ($LASTEXITCODE -ne 0) {
    Write-Host "ERROR: Docker compose failed!"
    exit 1
}

# Clean up old images
docker image prune -f

Write-Host "[$(Get-Date -Format 'yyyy-MM-dd HH:mm:ss')] Deploy complete!"
