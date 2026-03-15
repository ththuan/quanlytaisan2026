# ============================================================
# restore-db.ps1
# Restore database từ file backup .sql
# Dùng: .\restore-db.ps1                   (chọn từ menu)
#       .\restore-db.ps1 -File "backup_xxx.sql"  (chỉ định file)
# ============================================================

param(
    [string]$File = "",  # Tên file backup (chỉ tên, không cần đường dẫn đầy đủ)
    [switch]$Force       # Bỏ qua xác nhận
)

$CONTAINER = "asset-management-postgres"
$DB_USER   = "postgres"
$DB_NAME   = "asset_management"
$BACKUP_DIR = "$PSScriptRoot\..\backups"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  RESTORE DATABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Kiểm tra thư mục backups
if (-not (Test-Path $BACKUP_DIR)) {
    Write-Host "❌ Khong tim thay thu muc backups/" -ForegroundColor Red
    Write-Host "   Chay backup-db.ps1 truoc de tao backup." -ForegroundColor Yellow
    exit 1
}

# Lấy danh sách file backup
$backupFiles = Get-ChildItem "$BACKUP_DIR\*.sql" | Sort-Object LastWriteTime -Descending

if ($backupFiles.Count -eq 0) {
    Write-Host "❌ Khong co file backup nao trong thu muc backups/" -ForegroundColor Red
    exit 1
}

# Nếu không chỉ định file, hiện menu chọn
if ($File -eq "") {
    Write-Host "Chon file backup de restore:" -ForegroundColor Yellow
    Write-Host ""
    for ($i = 0; $i -lt [Math]::Min($backupFiles.Count, 15); $i++) {
        $f = $backupFiles[$i]
        $sz = [math]::Round($f.Length / 1KB, 1)
        $dt = $f.LastWriteTime.ToString("dd/MM/yyyy HH:mm")
        Write-Host "  [$($i+1)] $($f.Name)  ($sz KB) - $dt"
    }
    Write-Host ""
    $choice = Read-Host "Nhap so thu tu (1-$([Math]::Min($backupFiles.Count, 15)))"

    if ($choice -notmatch '^\d+$' -or [int]$choice -lt 1 -or [int]$choice -gt $backupFiles.Count) {
        Write-Host "❌ Lua chon khong hop le." -ForegroundColor Red
        exit 1
    }
    $selectedFile = $backupFiles[[int]$choice - 1]
} else {
    $selectedFile = Get-Item (Join-Path $BACKUP_DIR $File) -ErrorAction SilentlyContinue
    if (-not $selectedFile) {
        Write-Host "❌ Khong tim thay file: $File" -ForegroundColor Red
        exit 1
    }
}

Write-Host ""
Write-Host "File se restore: $($selectedFile.Name)" -ForegroundColor Yellow
Write-Host ""
Write-Host "⚠️  CANH BAO: Thao tac nay se XOA TOAN BO du lieu hien tai!" -ForegroundColor Red
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "Ban co chac chan khong? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Da huy." -ForegroundColor Yellow
        exit 0
    }
}

Write-Host ""
Write-Host "Dang restore..." -ForegroundColor Yellow

$containerPath = "/tmp/$($selectedFile.Name)"

# Copy file vào container
docker cp $selectedFile.FullName "${CONTAINER}:${containerPath}"
if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Loi khi copy file vao container!" -ForegroundColor Red
    exit 1
}

# Drop và recreate database, sau đó restore
$restoreSql = @"
DROP SCHEMA public CASCADE;
CREATE SCHEMA public;
GRANT ALL ON SCHEMA public TO postgres;
GRANT ALL ON SCHEMA public TO public;
"@

docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c $restoreSql
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -f $containerPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Loi khi restore database!" -ForegroundColor Red
    docker exec $CONTAINER rm -f $containerPath
    exit 1
}

# Xóa file tạm trong container
docker exec $CONTAINER rm -f $containerPath

Write-Host ""
Write-Host "✅ Restore thanh cong!" -ForegroundColor Green
Write-Host "   Database da duoc phuc hoi tu: $($selectedFile.Name)" -ForegroundColor Green
Write-Host ""

# Hiển thị thống kê nhanh
docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c `
    "SELECT 'assets' as bang, COUNT(*) as so_luong FROM assets UNION ALL SELECT 'users', COUNT(*) FROM users UNION ALL SELECT 'departments', COUNT(*) FROM departments;"
Write-Host ""
