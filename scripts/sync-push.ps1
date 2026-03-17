# ============================================================
# sync-push.ps1
# Đẩy code lên GitHub (chạy khi KẾT THÚC làm việc / chuyển sang máy kia)
# ============================================================

$RepoRoot = "$PSScriptRoot\.."
Set-Location $RepoRoot

$status = git status
if ($status -match "nothing to commit, working tree clean") {
    $behind = git status -sb
    if ($behind -match "ahead") {
        Write-Host "Dang day commit len GitHub..." -ForegroundColor Cyan
        git push origin main
        Write-Host "Da day xong." -ForegroundColor Green
    } else {
        Write-Host "Khong co thay doi de day. San sang chuyen sang may khac." -ForegroundColor Green
    }
} else {
    Write-Host "Ban co thay doi chua commit. Hay commit truoc roi chay lai script nay." -ForegroundColor Yellow
    git status -sb
}
