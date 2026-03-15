# ============================================================
# list-backups.ps1
# Hiển thị danh sách file backup và thống kê database hiện tại
# ============================================================

$CONTAINER = "asset-management-postgres"
$DB_USER   = "postgres"
$DB_NAME   = "asset_management"
$BACKUP_DIR = "$PSScriptRoot\..\backups"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  THONG KE DATABASE HIEN TAI" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c @"
SELECT
  'assets'               AS bang, COUNT(*) AS so_luong FROM assets
UNION ALL SELECT 'users',               COUNT(*) FROM users
UNION ALL SELECT 'departments',         COUNT(*) FROM departments
UNION ALL SELECT 'maintenance_requests',COUNT(*) FROM maintenance_requests
UNION ALL SELECT 'asset_transfers',     COUNT(*) FROM asset_transfers
UNION ALL SELECT 'inventory_reports',   COUNT(*) FROM inventory_reports
UNION ALL SELECT 'procurements',        COUNT(*) FROM procurements
ORDER BY bang;
"@

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  DANH SACH FILE BACKUP" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan

if (-not (Test-Path $BACKUP_DIR)) {
    Write-Host "  (Chua co backup nao - thu muc backups/ chua ton tai)" -ForegroundColor Gray
} else {
    $files = Get-ChildItem "$BACKUP_DIR\*.sql" -ErrorAction SilentlyContinue | Sort-Object LastWriteTime -Descending
    if ($files.Count -eq 0) {
        Write-Host "  (Chua co file backup nao)" -ForegroundColor Gray
    } else {
        Write-Host ""
        Write-Host ("  {0,-45} {1,8}  {2}" -f "Ten file", "Size", "Ngay tao") -ForegroundColor Yellow
        Write-Host ("  " + "-" * 70)
        foreach ($f in $files) {
            $sz = [math]::Round($f.Length / 1KB, 1)
            $dt = $f.LastWriteTime.ToString("dd/MM/yyyy HH:mm:ss")
            Write-Host ("  {0,-45} {1,6} KB  {2}" -f $f.Name, $sz, $dt)
        }
        Write-Host ""
        Write-Host "  Tong: $($files.Count) file backup" -ForegroundColor Green
    }
}

Write-Host ""
Write-Host "Cac lenh co san:" -ForegroundColor Cyan
Write-Host "  .\scripts\backup-db.ps1                       # Backup ngay bay gio"
Write-Host "  .\scripts\backup-db.ps1 -Name 'truoc-import'  # Backup voi ten goi nho"
Write-Host "  .\scripts\restore-db.ps1                      # Restore (chon tu menu)"
Write-Host "  .\scripts\reset-data.ps1                      # Xoa du lieu nghiep vu"
Write-Host ""
