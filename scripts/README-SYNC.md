# Đồng bộ code khi làm việc 2 máy

## Quy trình gợi ý

| Khi nào           | Làm gì |
|-------------------|--------|
| **Bắt đầu** trên máy A | Chạy `sync-pull.ps1` (hoặc `git pull`) để kéo code mới từ GitHub. |
| **Kết thúc** trên máy A | Commit (nếu có), rồi chạy `sync-push.ps1` (hoặc `git push`). |
| **Bắt đầu** trên máy B | Lại chạy `sync-pull.ps1` để có đúng code vừa đẩy từ máy A. |

## Cách chạy script

**Cách 1 – Double-click (nhanh):** mở thư mục `quanlytaisan\scripts`, double-click:
- `sync-pull.bat` → kéo code mới từ GitHub
- `sync-push.bat` → đẩy code lên GitHub

**Cách 2 – Terminal** (trong thư mục `quanlytaisan`):

```powershell
# Kéo code mới (khi mở máy / bắt đầu làm)
.\scripts\sync-pull.ps1

# Đẩy code lên (khi xong việc / chuyển máy)
.\scripts\sync-push.ps1
```

## Mẹo thêm

- **Chưa xong việc mà phải đổi máy:** commit với message tạm (vd: `WIP: dang lam feature X`) rồi push; trên máy kia pull và tiếp tục.
- **Quên pull trước khi làm:** dễ bị conflict. Nên tạo thói quen: mở project → chạy `sync-pull.ps1` (hoặc pull) rồi mới code.
- **Cursor Settings Sync:** Bật Cursor Settings Sync (trong Cursor) để đồng bộ cài đặt, extension giữa 2 máy.
