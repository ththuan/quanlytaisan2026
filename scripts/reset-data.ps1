# ============================================================
# reset-data.ps1
# Xóa dữ liệu nghiệp vụ (tài sản, bảo trì, điều chuyển, ...)
# GIỮ NGUYÊN: users, departments, asset_categories
# ============================================================

param(
    [switch]$Force  # Bỏ qua xác nhận nếu dùng -Force
)

$CONTAINER = "asset-management-postgres"
$DB_USER   = "postgres"
$DB_NAME   = "asset_management"

Write-Host ""
Write-Host "========================================" -ForegroundColor Cyan
Write-Host "  XOA DU LIEU NGHIEP VU" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Se xoa cac bang:" -ForegroundColor Yellow
Write-Host "  - assets, maintenance_requests, asset_transfers"
Write-Host "  - procurements, inventory_*, stock_*, audit_logs ..."
Write-Host ""
Write-Host "GIU NGUYEN: users, departments, asset_categories" -ForegroundColor Green
Write-Host ""

if (-not $Force) {
    $confirm = Read-Host "Ban co chac chan khong? (yes/no)"
    if ($confirm -ne "yes") {
        Write-Host "Da huy." -ForegroundColor Red
        exit 0
    }
}

Write-Host ""
Write-Host "Dang xoa du lieu..." -ForegroundColor Yellow

$sql = @"
TRUNCATE TABLE
  asset_disposal_items,
  asset_disposal_cases,
  inventory_report_details,
  inventory_reports,
  inventory_rounds,
  request_approvals,
  audit_logs,
  maintenance_damage_images,
  maintenance_requests,
  asset_transfers,
  procurement_documents,
  procurement_items,
  procurements,
  stock_issue_lines,
  stock_issues,
  stock_receipt_lines,
  stock_receipts,
  stock_items,
  annual_reports,
  assets
RESTART IDENTITY CASCADE;
SELECT 'Reset thanh cong!' as result;
"@

docker exec $CONTAINER psql -U $DB_USER -d $DB_NAME -c $sql

if ($LASTEXITCODE -eq 0) {
    Write-Host ""
    Write-Host "✅ Xoa du lieu thanh cong!" -ForegroundColor Green
    Write-Host "   Co the import tai san moi ngay bay gio." -ForegroundColor Green
} else {
    Write-Host ""
    Write-Host "❌ Co loi xay ra!" -ForegroundColor Red
}
Write-Host ""
