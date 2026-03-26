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

# Tạo volume cho PostgreSQL (bắt buộc lần đầu)
docker volume create quanlytaisan_postgres_data

# Khởi động
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

### Chạy không Docker (phát triển)

**1. Backend**
```bash
cd quanlytaisan
cp .env.example .env

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
│   │   └── config/
│   ├── migrations/
│   ├── seeders/
│   └── Dockerfile
├── asset-management-frontend/ # Vue 3 + Vite + Element Plus
│   ├── src/
│   │   ├── views/
│   │   ├── components/
│   │   ├── services/
│   │   ├── stores/
│   │   └── styles/
│   └── Dockerfile
├── scripts/                    # PowerShell: backup, restore, reset; Node: generate-secrets
│   ├── backup-db.ps1
│   ├── list-backups.ps1
│   ├── restore-db.ps1
│   ├── reset-data.ps1
│   ├── generate-secrets.js     # Tạo JWT_SECRET, DEFAULT_PASSWORD cho production
│   └── README.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## ⚙️ Cấu hình (.env)

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | Kết nối PostgreSQL | postgres / postgres / asset_management / 5432 |
| `JWT_SECRET` | Secret ký JWT. **Production**: dùng secret mạnh | `your-secret-key-change-in-production` |
| `DEFAULT_PASSWORD` | Mật khẩu mặc định cho user mới / reset | `Ctec@123` |
| `CORS_ORIGIN` | Origin cho phép. **Production**: domain cụ thể (vd: `https://yourdomain.com`) | `*` |
| `BODY_LIMIT` | Giới hạn kích thước body request | `10mb` (nếu cần ảnh base64 lớn: `50mb`) |
| `VITE_HTTPS` | Frontend chạy HTTPS local | `false` |
| `VITE_PROXY_TARGET` | URL backend khi dev | `http://localhost:5000` |

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
| **list-backups.ps1** | Liệt kê file backup |
| **restore-db.ps1** | Khôi phục từ file backup |
| **reset-data.ps1** | Reset dữ liệu nghiệp vụ (cẩn thận) |
| **generate-secrets.js** | Tạo `JWT_SECRET`, `DEFAULT_PASSWORD` ngẫu nhiên cho production |

Chi tiết: [scripts/README.md](./scripts/README.md).

---

## 🔒 Bảo mật & Triển khai production

**Trước khi triển khai production, cần:**

1. Chạy `node scripts/generate-secrets.js` và cập nhật `JWT_SECRET`, `DEFAULT_PASSWORD` trong `.env`
2. Cấu hình `CORS_ORIGIN` đúng domain (vd: `https://yourdomain.com`)
3. Đổi `DB_PASSWORD` mạnh
4. Dùng HTTPS (SSL/TLS)
5. Nếu cần upload ảnh base64 lớn: đặt `BODY_LIMIT=50mb` trong `.env`

**Đã có sẵn:** Helmet, rate limiting, JWT, phân quyền theo role, 2FA (TOTP), bcrypt, CORS, SQL parameterized. Token không truyền qua URL (download chứng từ dùng Authorization header). Docker: `docker-compose.yml` truyền `DEFAULT_PASSWORD`, `BODY_LIMIT` vào backend.

**Lưu ý:** Một số dependency (vd: xlsx, minimatch) có báo audit; chạy `npm audit fix` trong backend. Token lưu trong localStorage (cân nhắc cookie HttpOnly sau).

---

## 📌 Cập nhật gần đây

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
| **2** | **Gửi email thông báo** | Backend có biến SMTP trong `.env.example` nhưng chưa dùng. Nên gửi email khi: có việc cần phê duyệt (điều chuyển, sửa chữa, thanh lý…), đã phê duyệt/từ chối, hoặc nhắc bảo trì đến hạn. |
| **3** | **Tìm kiếm toàn cục** | ✅ Đã có: ô tìm trên header (Tài sản, Người dùng, Phiếu mua sắm), debounce, phân quyền theo role. |
| **4** | **Refresh token rotation** | Đã có refresh token; nên rotate: mỗi lần dùng refresh token thì vô hiệu hóa token cũ và cấp cặp token mới, giảm rủi ro token bị lộ dùng lâu dài. |
| **5** | **Xuất báo cáo định kỳ (lưu lịch sử)** | Đã có backup DB và xuất Excel theo yêu cầu. Có thể thêm: lập lịch xuất báo cáo theo tháng/năm (tài sản, điều chuyển, bảo trì) lưu file hoặc gửi email cho lãnh đạo. |

Hệ thống **đã có**: audit log, thông báo in-app (chuông), workflow phê duyệt nhiều cấp, 2FA, phân quyền, dashboard tổng quan.

---

## 📞 Liên hệ & Đóng góp

- 🐛 Báo lỗi: [GitHub Issues](https://github.com/ththuan/quanlytaisan/issues)
- 📖 Wiki: [GitHub Wiki](https://github.com/ththuan/quanlytaisan/wiki)

---

**Version**: 1.0.0  
**Cập nhật**: 2026-03-17
