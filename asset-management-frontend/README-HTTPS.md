# Chạy frontend (HTTP và HTTPS)

## Cách nhanh nhất

| Muốn dùng | Cách chạy | URL mở |
|-----------|-----------|--------|
| **HTTP** (mặc định) | Double-click **`dev.bat`** hoặc `npm run dev` | http://localhost:3000 |
| **HTTPS** | Double-click **`dev-https.bat`** hoặc `npm run dev:https` | https://localhost:3000 |

Sau khi chạy, **trình duyệt sẽ tự mở** đúng địa chỉ. Nếu không, mở tay theo URL trong bảng trên.

---

## Dùng HTTPS – quan trọng

**Trước khi chạy HTTPS:** Tắt hết tiến trình `dev.bat` hoặc `npm run dev` (HTTP) đang chạy, để tránh trùng port.

**Khi trình duyệt báo "Kết nối không bảo mật":**
1. Bấm **Nâng cao** (Advanced)
2. Bấm **Truy cập localhost (không an toàn)** / **Proceed to localhost (unsafe)**
3. Chỉ cần chấp nhận **một lần** cho localhost

**Chrome – bỏ cảnh báo vĩnh viễn (tùy chọn):**
1. Mở `chrome://flags/#allow-insecure-localhost`
2. Đổi **Allow invalid certificates for resources loaded from localhost** thành **Enabled**
3. Khởi động lại Chrome

---

## Đổi mặc định (HTTP ↔ HTTPS)

Sửa file **`.env`** ở thư mục gốc `quanlytaisan`:

- **HTTP mặc định:** `VITE_HTTPS=false` (hoặc xóa dòng).
- **HTTPS mặc định:** `VITE_HTTPS=true`.

Sau đó chạy lại `npm run dev` (hoặc double-click `dev.bat` / `dev-https.bat`).

---

## Lưu ý

- Backend (port 5000) cần **chạy trước** để đăng nhập và API hoạt động.
- Cả HTTP và HTTPS đều dùng `VITE_API_BASE_URL=/api` (proxy qua Vite), không cần đổi khi chuyển giao thức.

---

## Xử lý khi HTTPS không mở được

| Triệu chứng | Cách xử lý |
|-------------|------------|
| **Không thấy `[vite] HTTPS mode` trong console** | Chạy bằng `npm run dev:https` (không dùng bat) hoặc kiểm tra file `.env` ở thư mục `quanlytaisan` có `VITE_HTTPS=false` → tạm xóa/đổi thành `true` khi chạy HTTPS. |
| **Port 3000 đã được dùng** | Tắt tiến trình HTTP (`dev.bat` hoặc `npm run dev`) đang chạy, hoặc đổi port trong `.env`: `FRONTEND_PORT=3001`. |
| **Trình duyệt báo "Kết nối bị từ chối"** | Đợi Vite khởi động xong (xem log), rồi mở thủ công `https://localhost:3000`. |
| **Trình duyệt chặn vì chứng chỉ không tin cậy** | Bấm **Nâng cao** → **Truy cập localhost (không an toàn)**. Chỉ cần làm 1 lần. |
| **Chạy từ thư mục khác** | Luôn double-click `dev-https.bat` trong `asset-management-frontend`, hoặc chạy `npm run dev:https` sau khi `cd` vào thư mục frontend. |
