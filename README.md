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
# Chỉnh .env nếu cần (DB, JWT_SECRET, port...)

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
├── scripts/                    # PowerShell: backup, restore, reset
│   ├── backup-db.ps1
│   ├── list-backups.ps1
│   ├── restore-db.ps1
│   ├── reset-data.ps1
│   └── README.md
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🔐 Tài khoản admin

Mỗi lần khởi động, hệ thống **chỉ tạo tài khoản admin** nếu chưa có. Toàn bộ dữ liệu khác (phòng ban, tài sản, người dùng…) bạn tự import. **Admin luôn có đầy đủ quyền** trong phần mềm.

| | |
|---|---|
| **Username** | `admin` |
| **Password** | `Admin@123` |

- **Docker**: Backend tự chạy `migrate` + `seed:admin`. Tạo lại admin thủ công:  
  `docker compose exec backend npm run seed:admin`
- **Không Docker**: Sau `npm run migrate` chạy `npm run seed:admin`.

---

## 📜 Scripts (PowerShell)

Trong thư mục `scripts/`:

| Script | Mô tả |
|--------|--------|
| **backup-db.ps1** | Tạo backup database |
| **list-backups.ps1** | Liệt kê file backup |
| **restore-db.ps1** | Khôi phục từ file backup |
| **reset-data.ps1** | Reset dữ liệu nghiệp vụ (cẩn thận) |

Chi tiết: [scripts/README.md](./scripts/README.md).

---

## 📌 Cập nhật gần đây

- **Khởi động**: Chỉ seed tài khoản admin (`seed:admin`), không dữ liệu mẫu; dữ liệu khác tự import.
- **Admin**: Toàn quyền; đăng nhập mặc định `admin` / `Admin@123`.
- **Phòng ban**: Admin có thể xóa phòng ban đang có người dùng/tài sản qua "Gỡ phòng ban rồi xóa".
- **Frontend**: `tsconfig.json` dùng đường dẫn tương đối cho `@vue/tsconfig` (tránh lỗi khi mở workspace gốc). Cần chạy `npm install` trong `asset-management-frontend` để không lỗi type.

---

## 📞 Liên hệ & Đóng góp

- 🐛 Báo lỗi: [GitHub Issues](https://github.com/ththuan/quanlytaisan/issues)
- 📖 Wiki: [GitHub Wiki](https://github.com/ththuan/quanlytaisan/wiki)

---

**Version**: 1.0.0  
**Cập nhật**: 2026-03-15
