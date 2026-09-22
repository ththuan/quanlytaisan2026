# 🛠️ Scripts – Backup, Restore, Reset Database

Các script PowerShell để backup, khôi phục và reset dữ liệu database (chạy với Docker).

**Yêu cầu:** Docker đang chạy, container `asset-management-postgres` đã được khởi động (ví dụ: `docker compose up -d`).

---

## 📋 Danh sách Scripts

| Script | Mô tả |
|--------|--------|
| **backup-db.ps1** | Tạo file backup database (.sql) vào thư mục `backups/` |
| **list-backups.ps1** | Xem thống kê DB hiện tại + danh sách file backup |
| **restore-db.ps1** | Khôi phục database từ một file backup |
| **reset-data.ps1** | Xóa toàn bộ dữ liệu nghiệp vụ và phòng ban (giữ users, asset_categories) |

---

## 1. backup-db.ps1

Tạo bản sao lưu toàn bộ database PostgreSQL ra file `.sql` trong thư mục `backups/` (tạo thư mục nếu chưa có). File backup cũng có thể copy ra ngoài để lưu trữ.

**Cách chạy:**

```powershell
# Chạy từ thư mục gốc dự án (Quanlytaisan)
.\scripts\backup-db.ps1
```

**Backup kèm tên gợi nhớ:**

```powershell
.\scripts\backup-db.ps1 -Name "truoc-import"
# Tạo file dạng: backup_20260315_143022_truoc-import.sql
```

**Kết quả:** File lưu tại `backups\backup_yyyyMMdd_HHmmss.sql` (hoặc có hậu tố `_Name` nếu dùng `-Name`). Script in ra kích thước file và danh sách 10 backup gần nhất.

---

## 2. list-backups.ps1

- In ra **thống kê database hiện tại**: số bản ghi các bảng `assets`, `users`, `departments`, `maintenance_requests`, `asset_transfers`, `inventory_reports`, `procurements`.
- Liệt kê **các file backup** trong `backups/` (tên file, kích thước, ngày tạo) và gợi ý lệnh backup/restore/reset.

**Cách chạy:**

```powershell
.\scripts\list-backups.ps1
```

---

## 3. restore-db.ps1

Khôi phục database từ một file backup `.sql`. **Toàn bộ dữ liệu hiện tại sẽ bị thay thế** (drop schema public, tạo lại rồi restore từ file).

**Cách chạy:**

```powershell
# Chạy và chọn file từ menu (hiện tối đa 15 file mới nhất)
.\scripts\restore-db.ps1

# Chỉ định sẵn file (tên file, nằm trong thư mục backups)
.\scripts\restore-db.ps1 -File "backup_20260315_120000.sql"

# Bỏ qua bước xác nhận (yes/no)
.\scripts\restore-db.ps1 -File "backup_20260315_120000.sql" -Force
```

Script sẽ hỏi xác nhận trước khi restore (trừ khi dùng `-Force`).

---

## 4. reset-data.ps1

Xóa **toàn bộ dữ liệu nghiệp vụ và phòng ban** bằng `TRUNCATE ... CASCADE` trên các bảng: assets, maintenance_requests, asset_transfers, procurements, inventory_*, stock_*, audit_logs, asset_disposal_*, **departments**, …

**Giữ nguyên:** `users`, `asset_categories`.

Sau khi xóa dữ liệu, script cố gắng gọi `npm run reset-admin` trong container **`asset-management-backend`** để đặt lại đăng nhập **`admin` / giá trị `ADMIN_PASSWORD` trong `.env`** (nếu backend đang chạy). Nếu container không chạy, chạy tay: `docker compose exec backend npm run reset-admin` hoặc trong thư mục backend: `npm run reset-admin`.

Dùng khi muốn làm sạch dữ liệu để import lại hoặc test từ đầu mà không xóa user và danh mục tài sản.

**Cách chạy:**

```powershell
# Có hỏi xác nhận (yes/no)
.\scripts\reset-data.ps1

# Bỏ qua xác nhận
.\scripts\reset-data.ps1 -Force
```

---

## 📁 Thư mục backups/

- **backup-db.ps1** ghi file vào `backups/` (nằm cạnh thư mục `scripts/`, tức `Quanlytaisan/backups/`).
- **restore-db.ps1** và **list-backups.ps1** đọc file từ cùng thư mục đó.
- Nên thêm `backups/` vào `.gitignore` (hoặc không commit file `.sql`) để tránh đẩy backup lên Git.

---

## 🐛 Lỗi thường gặp

**“Container asset-management-postgres không chạy”**  
→ Khởi động stack: `docker compose up -d` từ thư mục gốc dự án.

**“Không tìm thấy thư mục backups/” khi restore/list**  
→ Chạy ít nhất một lần `.\scripts\backup-db.ps1` để tạo thư mục và có file backup.

**PowerShell không cho chạy script**  
→ Mở PowerShell với quyền phù hợp và chạy:  
`Set-ExecutionPolicy -Scope CurrentUser -ExecutionPolicy RemoteSigned`  
(nếu bạn chấp nhận chạy script local).

---

**Cập nhật:** 2026-03-15
