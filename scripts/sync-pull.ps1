# ============================================================
# sync-pull.ps1
# Kéo code mới nhất từ GitHub (chạy khi BẮT ĐẦU làm việc trên máy này)
# ============================================================

$RepoRoot = "$PSScriptRoot\.."
Set-Location $RepoRoot

Write-Host "Dang lay code moi nhat tu GitHub..." -ForegroundColor Cyan
git fetch origin

$status = git status
if ($status -match "Your branch is behind") {
    git pull origin main
    Write-Host "Da cap nhat xong." -ForegroundColor Green
} else {
    Write-Host "Ban dang o phien ban moi nhat, khong can pull." -ForegroundColor Green
}

Write-Host ""
git status -sb
