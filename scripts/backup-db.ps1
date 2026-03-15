# ============================================================
# backup-db.ps1
# Backup toàn bộ database ra file .sql trong thư mục backups/
# ============================================================

param(
    [string]$Name = ""   # Tên tùy chọn để phân biệt backup, VD: -Name "truoc-import"
)

$CONTAINER = "asset-management-postgres"
$DB_USER   = "postgres"
$DB_NAME   = "asset_management"
$BACKUP_DIR = "$PSScriptRoot\..\backups"

# Tạo thư mục backups nếu chưa có
if (-not (Test-Path $BACKUP_DIR)) {
    New-Item -ItemType Directory -Path $BACKUP_DIR | Out-Null
    Write-Host "Da tao thu muc backups/" -ForegroundColor Gray
}

# Tạo tên file với timestamp
$timestamp = Get-Date -Format "yyyyMMdd_HHmmss"
if ($Name -ne "") {
    $fileName = "backup_${timestamp}_${Name}.sql"
} else {
    $fileName = "backup_${timestamp}.sql"
}

$backupPath = Join-Path (Resolve-Path $BACKUP_DIR) $fileName
$containerBackupPath = "/tmp/$fileName"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  BACKUP DATABASE" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Database : $DB_NAME" -ForegroundColor Yellow
Write-Host "File     : backups\$fileName" -ForegroundColor Yellow
Write-Host ""
Write-Host "Dang backup..." -ForegroundColor Yellow

# Chạy pg_dump trong container
docker exec $CONTAINER pg_dump -U $DB_USER -d $DB_NAME -F p -f $containerBackupPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Loi khi chay pg_dump!" -ForegroundColor Red
    exit 1
}

# Copy file ra ngoài container
docker cp "${CONTAINER}:${containerBackupPath}" $backupPath

if ($LASTEXITCODE -ne 0) {
    Write-Host "❌ Loi khi copy file ra ngoai container!" -ForegroundColor Red
    exit 1
}

# Xóa file tạm trong container
docker exec $CONTAINER rm -f $containerBackupPath

# Kiểm tra kích thước file
$fileSize = (Get-Item $backupPath).Length
$fileSizeKB = [math]::Round($fileSize / 1KB, 1)

Write-Host ""
Write-Host "✅ Backup thanh cong!" -ForegroundColor Green
Write-Host "   File  : backups\$fileName" -ForegroundColor Green
Write-Host "   Size  : ${fileSizeKB} KB" -ForegroundColor Green
Write-Host ""

# Hiển thị danh sách backup hiện có
Write-Host "Danh sach backup hien co:" -ForegroundColor Cyan
Get-ChildItem "$BACKUP_DIR\*.sql" | Sort-Object LastWriteTime -Descending | Select-Object -First 10 | ForEach-Object {
    $sz = [math]::Round($_.Length / 1KB, 1)
    Write-Host "  $($_.Name)  ($sz KB)" -ForegroundColor Gray
}
Write-Host ""
