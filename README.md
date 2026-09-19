# 🏢 Hệ thống Quản lý Tài sản

[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14-blue.svg)](https://www.postgresql.org/)

Hệ thống quản lý tài sản cho các tổ chức, trường học, doanh nghiệp.

**Repository**: [github.com/ththuan/quanlytaisan](https://github.com/ththuan/quanlytaisan)

---

## ✨ Tính năng chính

### 📦 Quản lý Tài sản
- Thêm, sửa, xóa tài sản
- Phân loại theo danh mục (theo Thông tư 141/2025/TT-BTC)
- Quản lý theo phòng ban
- QR Code cho mỗi tài sản
- Theo dõi khấu hao, lịch sử thay đổi

### 🔄 Điều chuyển Tài sản
- Đề nghị điều chuyển, quy trình phê duyệt
- Lịch sử điều chuyển, thông báo

### 🛠️ Sửa chữa & Bảo trì
- Đề nghị sửa chữa, theo dõi tiến độ
- Quản lý chi phí, lịch sử bảo trì
- Mua sắm, kho vật tư, cấp phát

### 📋 Kiểm kê Tài sản
- Tạo đợt kiểm kê, quét QR Code
- Báo cáo chi tiết, phê duyệt, xuất Excel

### 🗑️ Thanh lý Tài sản
- Đề nghị thanh lý, hồ sơ thanh lý, biên bản tiêu hủy

### 📊 Báo cáo & Thống kê
- Dashboard tổng quan, báo cáo theo phòng ban/danh mục
- Xuất Excel/PDF, biểu đồ

### 👥 Quản lý Người dùng
- Phân quyền (Admin, Director, Department Head, Staff)
- Xác thực 2 bước (TOTP), Audit logs

---

## 🛠️ Tech Stack

| Thành phần | Công nghệ |
|------------|-----------|
| **Backend** | Node.js 18+, Express, TypeScript, PostgreSQL 14, Sequelize, JWT + TOTP |
| **Frontend** | Vue 3, Element Plus, Pinia, Vite, TypeScript, ECharts, html5-qrcode, Vue I18n |
| **DevOps** | Docker, Docker Compose. Tùy chọn: Cloudflare Quick Tunnel (profile `cloudflare`) |

---

## 🚀 Quick Start

### Yêu cầu
- **Docker**: Docker và Docker Compose (khuyến nghị)
- **Không Docker**: Node.js 18+, PostgreSQL 14, npm

### Chạy bằng Docker (khuyến nghị)

```bash
# Clone
git clone https://github.com/ththuan/quanlytaisan.git
cd quanlytaisan

# Cấu hình
cp .env.example .env
# Chỉnh .env nếu cần (DB, JWT_SECRET, CORS_ORIGIN, port...)

# Tạo volume (bắt buộc lần đầu)
docker volume create quanlytaisan_postgres_data

# Khởi động (development — hot-reload)
docker compose up -d

# Xem log
docker compose logs -f
```

**Truy cập:**
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000

**Cloudflare tunnel** (link public tạm thời):
```bash
docker compose --profile cloudflare up -d
```

**Các file docker-compose:**

| File | Mô tả |
|------|-------|
| `docker-compose.yml` | Development (hot-reload, mount source code, HTTPS qua nginx port 80/443) |
| `docker-compose.dev.yml` | Development nâng cao (healthcheck, không mount node_modules, HTTP port 3000) |
| `docker-compose.prod.yml` | Production (nginx port 80/443, build tối ưu, không expose port trực tiếp) |

---

## 🔐 Chạy với HTTPS / SSL

`docker-compose.yml` (dev) và `docker-compose.prod.yml` (production) đều dùng **nginx** làm reverse proxy với HTTPS trên cổng 443. HTTP (port 80) tự redirect sang HTTPS, ngoại trừ các đường dẫn công khai như `/scan/` và `/api/public/` (dành cho quét QR trên điện thoại không cần cert).

### 1. Tạo SSL certificate tự ký (lần đầu)

```powershell
# Tự động phát hiện IP mạng nội bộ và tạo cert vào nginx/ssl/
powershell -ExecutionPolicy Bypass -File scripts\generate-ssl.ps1

# Hoặc chỉ định IP cụ thể:
powershell -ExecutionPolicy Bypass -File scripts\generate-ssl.ps1 -IP 192.168.1.100
```

Script tạo ra `nginx/ssl/server.crt` và `nginx/ssl/server.key`. Certificate có thời hạn **10 năm**, bao gồm SAN cho cả IP và `localhost`.

> **Đã có cert sẵn?** Đặt file vào `nginx/ssl/server.crt` và `nginx/ssl/server.key` là xong.

### 2. Chạy development với HTTPS

```bash
# Tạo volume (bắt buộc lần đầu)
docker volume create quanlytaisan_postgres_data

docker compose up -d
```

Truy cập: **`https://<IP-máy-chủ>`** (ví dụ `https://172.16.116.67`)

Trình duyệt sẽ báo **"Không bảo mật"** (cert tự ký) → bấm **Nâng cao → Vẫn tiếp tục**.

> **Lưu ý:** `VITE_HTTPS` trong `.env` không cần bật khi dùng Docker — HTTPS do nginx xử lý, không phải Vite.

### 3. Chạy production với HTTPS

```bash
# Tạo volume lần đầu
docker volume create quanlytaisan_postgres_data
docker volume create quanlytaisan_backend_backups

# Tạo cert nếu chưa có
powershell -ExecutionPolicy Bypass -File scripts\generate-ssl.ps1

docker compose -f docker-compose.prod.yml up -d
```

Truy cập: **`https://<IP-hoặc-domain>`**

### 4. Cấu hình `.env` cho HTTPS

Khi chạy với HTTPS, cập nhật `FRONTEND_URL` để CORS và redirect đúng:

```env
FRONTEND_URL=https://172.16.116.67
CORS_ORIGIN=https://172.16.116.67
```

### 5. (Tuỳ chọn) Chạy Vite dev server HTTPS trực tiếp trên Windows

Nếu không dùng Docker mà chạy Vite trực tiếp trên máy Windows:

```batch
cd asset-management-frontend
dev-https.bat
```

Hoặc set biến môi trường rồi chạy:
```powershell
$env:VITE_HTTPS = "true"
npx vite
```

Vite dùng `@vitejs/plugin-basic-ssl` để tạo cert tạm thời. Mở: **`https://localhost:3000`** → chấp nhận cảnh báo cert 1 lần.

> **Lưu ý khi dùng Vite HTTPS trực tiếp:** `host` bị giới hạn về `localhost` (không bind `0.0.0.0`) để tránh lỗi `ERR_SSL_PROTOCOL_ERROR` trên Windows. Các máy khác trong mạng nội bộ **không truy cập được** qua IP — dùng Docker + nginx nếu cần truy cập từ nhiều máy.

---

Chạy production (cũ, giữ lại để tham khảo):
```bash
docker compose -f docker-compose.prod.yml up -d
```

### Chạy không Docker (phát triển)

**1. Backend**
```bash
cd quanlytaisan

# Copy .env vào thư mục backend (backend đọc .env từ thư mục của nó)
cp .env.example asset-management-backend/.env
# Chỉnh asset-management-backend/.env: DB_HOST=localhost, các thông số DB...

cd asset-management-backend
npm install
npm run migrate
npm run seed:admin
npm run dev
```

**2. Frontend** (terminal mới)
```bash
cd asset-management-frontend
npm install
npm run dev
```

Frontend chạy tại http://localhost:3000, backend tại http://localhost:5000 (hoặc port trong `.env`).

---

## 📁 Cấu trúc dự án

```
quanlytaisan/
├── asset-management-backend/   # API Express + Sequelize
│   ├── src/
│   │   ├── controllers/
│   │   ├── services/
│   │   ├── models/
│   │   ├── routes/
│   │   ├── middleware/
│   │   ├── migrations/         # Sequelize migrations
│   │   └── config/
│   ├── seeders/                # Sequelize seeders
│   ├── scripts/                # Node scripts (reset-admin-password...)
│   └── Dockerfile
├── asset-management-frontend/  # Vue 3 + Vite + Element Plus
│   ├── src/
│   │   ├── views/
│   │   ├── components/
│   │   ├── services/
│   │   ├── stores/
│   │   └── styles/
│   └── Dockerfile
├── nginx/                      # Cấu hình nginx (production)
│   └── nginx.conf
├── scripts/                    # PowerShell: backup, restore, reset, sync; Node: generate-secrets
│   ├── backup-db.ps1
│   ├── list-backups.ps1
│   ├── restore-db.ps1
│   ├── reset-data.ps1
│   ├── generate-secrets.js
│   ├── generate-ssl.ps1
│   ├── sync-push.ps1 / sync-push.bat
│   ├── sync-pull.ps1 / sync-pull.bat
│   └── README.md
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── .env.example
└── README.md
```

---

## ⚙️ Cấu hình (.env)

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | Kết nối PostgreSQL | postgres / postgres / asset_management / 5432 |
| `BACKEND_PORT` | Port backend expose ra host | `5000` |
| `FRONTEND_PORT` | Port frontend expose ra host | `3000` |
| `JWT_SECRET` | Secret ký JWT. **Production**: dùng secret mạnh | `your-secret-key-change-in-production` |
| `DEFAULT_PASSWORD` | Mật khẩu mặc định khi tạo user mới / import user (không áp dụng cho `admin`) | `Ctec@123` |
| `CORS_ORIGIN` | Origin cho phép. **Production**: domain cụ thể (vd: `https://yourdomain.com`) | `http://localhost:3000` |
| `LOG_LEVEL` | Mức log của backend (`error`, `warn`, `info`, `debug`) | `info` |
| `VITE_API_BASE_URL` | URL API backend mà frontend gọi | `/api` (Docker) / `http://localhost:5000/api` (dev) |
| `BODY_LIMIT` | Giới hạn kích thước body request của backend | `10mb` (nếu cần ảnh base64 lớn: `50mb`) |

**Tạo secret cho production:**
```bash
node scripts/generate-secrets.js
```
Copy `JWT_SECRET` và `DEFAULT_PASSWORD` vào `.env`.

---

## 🔐 Tài khoản admin

Mỗi lần khởi động, hệ thống **chỉ tạo tài khoản admin** nếu chưa có. Toàn bộ dữ liệu khác (phòng ban, tài sản, người dùng…) bạn tự import. **Admin luôn có đầy đủ quyền** trong phần mềm.

| | |
|---|---|
| **Username** | `admin` (cố định) |
| **Password** | **`Admin@123`** (cố định trong mã nguồn — không phụ thuộc `DEFAULT_PASSWORD` trong `.env`) |

- **`DEFAULT_PASSWORD` trong `.env`** chỉ dùng cho **tạo user mới / import user** (không áp dụng cho tài khoản `admin`).
- **Sau “Reset dữ liệu nghiệp vụ”** (trong System Admin hoặc API): hệ thống **tự đặt lại** `admin` / `Admin@123` và **tắt 2FA** cho admin.
- **Docker**: Backend tự chạy `migrate` + `seed:admin`. Tạo admin lần đầu: `docker compose exec backend npm run seed:admin`
- **Không Docker**: Sau `npm run migrate` chạy `npm run seed:admin`.
- **Không đăng nhập được?** Trong `asset-management-backend` chạy **`npm run reset-admin`** → luôn về **`admin` / `Admin@123`**.

---

## 📜 Scripts

Trong thư mục `scripts/`:

| Script | Mô tả |
|--------|--------|
| **backup-db.ps1** | Tạo backup database |
| **list-backups.ps1** | Liệt kê file backup + thống kê DB hiện tại |
| **restore-db.ps1** | Khôi phục từ file backup |
| **reset-data.ps1** | Reset dữ liệu nghiệp vụ (cẩn thận) |
| **generate-secrets.js** | Tạo `JWT_SECRET`, `DEFAULT_PASSWORD` ngẫu nhiên cho production |
| **generate-ssl.ps1** | Tạo SSL certificate tự ký cho nginx (production trên mạng nội bộ) |
| **sync-push.ps1** / **sync-push.bat** | Đẩy code lên GitHub (dùng khi làm việc trên nhiều máy) |
| **sync-pull.ps1** / **sync-pull.bat** | Kéo code mới nhất từ GitHub |

Chi tiết: [scripts/README.md](./scripts/README.md).

---

## � Deploy lên Debian home server (production)

Máy Windows chỉ dùng để code/test (`docker compose up -d` với `docker-compose.yml`). Chạy thực tế trên **Debian home server** bằng `docker-compose.prod.yml`.

**Lần đầu trên server Debian:**

```bash
git clone https://github.com/ththuan/quanlytaisan2026.git /root/quanlytaisan2026
cd /root/quanlytaisan2026
cp .env.prod.example .env   # chỉnh JWT_SECRET, DB_PASSWORD, CORS_ORIGIN...

docker volume create quanlytaisan_postgres_data
docker volume create quanlytaisan_redis_data
docker volume create quanlytaisan_backend_backups

docker compose -f docker-compose.prod.yml up -d --build
chmod +x deploy.sh
```

**Mỗi khi có thay đổi mới trên GitHub**, SSH vào server và chạy:

```bash
./deploy.sh
```

[deploy.sh](./deploy.sh) tự `git pull` (nếu có commit mới) rồi rebuild lại 2 container `backend`/`frontend` bằng `docker-compose.prod.yml` — không cần thao tác Docker thủ công. Nếu không có thay đổi, script thoát ngay mà không làm gì.

> `deploy.ps1` / `watchdog.ps1` (PowerShell) chỉ dùng cho máy Windows, không áp dụng cho server Debian.

---

## �🔒 Bảo mật & Triển khai production

**Trước khi triển khai production, cần:**

1. Chạy `node scripts/generate-secrets.js` và cập nhật `JWT_SECRET`, `DEFAULT_PASSWORD` trong `.env`
2. Cấu hình `CORS_ORIGIN` đúng domain (vd: `https://yourdomain.com`)
3. Đổi `DB_PASSWORD` mạnh
4. Dùng HTTPS (SSL/TLS)
5. Nếu cần upload ảnh base64 lớn: đặt `BODY_LIMIT=50mb` trong `.env`

**Đã có sẵn:** Helmet, rate limiting, JWT (HS256, hết hạn sau 15 phút, refresh token 7 ngày), phân quyền theo role, 2FA (TOTP), bcrypt, CORS, SQL parameterized. Token không truyền qua URL (download chứng từ dùng Authorization header). MIME filter kiểm tra file upload. Audit log chống giả mạo. Docker: các file `docker-compose*.yml` truyền `DEFAULT_PASSWORD`, `BODY_LIMIT` vào backend.

**Lưu ý:** Một số dependency (vd: xlsx, minimatch) có báo audit; chạy `npm audit fix` trong backend. Token lưu trong localStorage (cân nhắc cookie HttpOnly sau).

---

## 📌 Cập nhật gần đây

### v1.1.0 — 2026-04-04

**Bảo mật**
- JWT token bây giờ có thời hạn (access: 15 phút, refresh: 7 ngày) với `issuer` và `algorithm` được xác thực — trước đây token không hết hạn (infinite lifetime).
- Thêm MIME type filter cho upload file thanh lý: chỉ cho phép PDF, Word, ảnh; từ chối file thực thi và các định dạng nguy hiểm.
- Audit log không còn đọc `old_value` từ request body người dùng (chống giả mạo log).
- Endpoint upload ảnh tài sản (`POST /assets/:id/image`) yêu cầu quyền Admin hoặc Manager (trước đây bỏ sót middleware phân quyền).
- Trang System Admin bị chặn với Director ở frontend (trước đây Director truy cập được, backend từ chối gây trải nghiệm lỗi).

**Token Refresh**
- Backend: thêm endpoint `POST /api/auth/refresh` để cấp lại access token từ refresh token hợp lệ.
- Frontend: interceptor Axios tự động gọi `/auth/refresh` khi nhận 401, xếp hàng các request chờ, rồi thử lại toàn bộ — người dùng không bị đăng xuất đột ngột khi token hết hạn.

**Kho vật tư**
- Phiếu cấp phát (`stock_issues`) lưu thêm trường `department_id`: ghi nhận đơn vị nhận cấp phát.
- Form cấp phát trong Dashboard Kho hiển thị dropdown chọn phòng ban.
- Lịch sử cấp phát hiển thị cột "Đơn vị" tương ứng.

**Sửa lỗi Backend**
- `getHierarchyStats`: lỗi không còn bị nuốt im lặng, chuyển sang Express error handler đúng cách.
- `refreshAccessToken`: sửa lỗi nghiêm trọng — hàm trước đây dùng chuỗi refresh token làm payload thay vì decode ra claims.

**Sửa lỗi Frontend**
- Dashboard: bộ lọc thời gian (`timeRange`) trước đây không trigger reload dữ liệu — đã thêm `watch`.
- Dashboard: thống kê "Tổng tài sản" hiển thị đúng (`assets_total`) thay vì số tài sản mới trong kỳ.
- Dashboard: bỏ API call thừa `getProcurementStats` (kết quả không được dùng đến).
- Dashboard: hiển thị skeleton loading trên 6 thẻ thống kê khi đang tải dữ liệu.
- Trang 404: hiển thị tiếng Việt với nút "Quay lại" và "Về trang chủ".
- Thông báo đăng nhập thành công chuyển sang tiếng Việt.

**Chất lượng code**
- Xóa file `middleware/cache.ts` (class `MemoryCache` không được import ở đâu — dead code).
- Thêm khai báo TypeScript cho `RouteMeta` (`requiresAuth`, `requiresAdmin`, `requiresSystemAdmin`, `titleKey`, `breadcrumbParent`).

**Trang mới**
- **Nhật ký hoạt động** (`/audit-logs`, Admin): xem toàn bộ audit log với bộ lọc (hành động, bảng, khoảng thời gian, user_id), phân trang, xem chi tiết thay đổi old/new value.
- **Danh mục tài sản** (`/asset-categories`, Admin): quản lý danh mục CRUD đầy đủ theo Thông tư 141, toggle chế độ cây/bảng, trường khấu hao.
- **Hộp thư thông báo** (`/notifications`): trang inbox đầy đủ — xem tất cả thông báo, đánh dấu đã đọc, điều hướng đến phiếu liên quan theo loại. Nút "Xem tất cả" trên chuông thông báo dẫn thẳng vào trang này.

---

### v1.0.x — trước 2026-04-04

- **Bảo mật**: JWT_SECRET/DEFAULT_PASSWORD cấu hình qua `.env`; token không truyền qua URL; CORS production; body limit cấu hình được; script `generate-secrets.js`; Docker truyền đủ biến env cho backend.
- **Backend**: Sửa lỗi build TypeScript (`setupSwagger`); thêm `tests/setup.test.ts` để Jest chạy được; `test_e2e_images.js` đọc mật khẩu từ `E2E_PASSWORD`/`DEFAULT_PASSWORD`.
- **Khởi động**: Chỉ seed tài khoản admin (`seed:admin`), không dữ liệu mẫu; dữ liệu khác tự import.
- **Admin**: Toàn quyền; đăng nhập mặc định `admin` / `Admin@123`.
- **Phòng ban**: Admin có thể xóa phòng ban đang có người dùng/tài sản qua "Gỡ phòng ban rồi xóa".
- **Frontend**: `tsconfig.json` dùng đường dẫn tương đối cho `@vue/tsconfig` (tránh lỗi khi mở workspace gốc). Cần chạy `npm install` trong `asset-management-frontend` để không lỗi type.

---

## 💡 Tính năng có thể bổ sung (đề xuất)

Các tính năng sau **chưa có** hoặc mới có một phần, **khả thi** và **rất hữu ích** nếu bổ sung:

| Ưu tiên | Tính năng | Lý do |
|--------|------------|--------|
| **1** | **Quên mật khẩu qua email** | Trang đăng nhập có link "Quên mật khẩu?" nhưng chưa có luồng gửi link đặt lại qua email. Hiện chỉ Admin mới reset được. Người dùng quên mật khẩu cần tự liên hệ admin. |
| **2** | **Gửi email thông báo** | Backend chưa tích hợp SMTP. Nên gửi email khi: có việc cần phê duyệt (điều chuyển, sửa chữa, thanh lý…), đã phê duyệt/từ chối, hoặc nhắc bảo trì đến hạn. |
| **3** | **Tìm kiếm toàn cục** | ✅ Đã có: ô tìm trên header (Tài sản, Người dùng, Phiếu mua sắm), debounce, phân quyền theo role. |
| **4** | **Refresh token rotation** | ✅ Đã có refresh token và endpoint `/auth/refresh`. Có thể nâng cao thêm: rotate token — mỗi lần dùng refresh token thì vô hiệu hóa token cũ và cấp cặp token mới, giảm rủi ro token bị lộ dùng lâu dài. |
| **5** | **Xuất báo cáo định kỳ (lưu lịch sử)** | Đã có backup DB và xuất Excel theo yêu cầu. Có thể thêm: lập lịch xuất báo cáo theo tháng/năm (tài sản, điều chuyển, bảo trì) lưu file hoặc gửi email cho lãnh đạo. |

Hệ thống **đã có**: audit log (trang đầy đủ + API), thông báo in-app (chuông popup + trang inbox /notifications), workflow phê duyệt nhiều cấp, 2FA, phân quyền, dashboard tổng quan, quản lý danh mục tài sản.

---

## 📞 Liên hệ & Đóng góp

- 🐛 Báo lỗi: [GitHub Issues](https://github.com/ththuan/quanlytaisan/issues)
- 📖 Wiki: [GitHub Wiki](https://github.com/ththuan/quanlytaisan/wiki)

---

**Version**: 1.1.0  
**Cập nhật**: 2026-04-04
