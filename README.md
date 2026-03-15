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

- **Backend**: Node.js 18+, Express, TypeScript, PostgreSQL 14, Sequelize, JWT + TOTP
- **Frontend**: Vue 3, Element Plus, Pinia, Vite, TypeScript, ECharts, html5-qrcode, Vue I18n
- **DevOps**: Docker, Docker Compose. Tùy chọn: Cloudflare Quick Tunnel (profile `cloudflare`) để chia sẻ link public.

---

## 🚀 Quick Start

### Yêu cầu
- Docker và Docker Compose
- (Nếu chạy không Docker: Node.js 18+, PostgreSQL 14, npm)

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
- Frontend: http://localhost:3000
- Backend API: http://localhost:5000

**Chạy thêm Cloudflare tunnel** (để có link public tạm thời):
```bash
docker compose --profile cloudflare up -d
```

### Chạy không Docker (dev)

```bash
git clone https://github.com/ththuan/quanlytaisan.git
cd quanlytaisan
cp .env.example .env

# Backend
cd asset-management-backend
npm install
npm run migrate
npm run seed:admin
npm run dev

# Frontend (terminal khác)
cd asset-management-frontend
npm install
npm run dev
```

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
├── scripts/                    # Scripts PowerShell (backup, restore, reset)
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

## 🔐 Tài khoản admin (tự tạo mỗi lần chạy hệ thống)

Mỗi lần khởi động, hệ thống **chỉ tạo tài khoản admin** nếu chưa có. Toàn bộ dữ liệu khác (phòng ban, tài sản, người dùng…) bạn tự import theo nhu cầu. Admin luôn có đầy đủ quyền trong phần mềm.

- **Username**: `admin`
- **Password**: `Admin@123`

⚠️ Docker: khi backend khởi động sẽ tự chạy `migrate` + `seed:admin`. Nếu cần tạo lại admin thủ công: `docker compose exec backend npm run seed:admin`.

---

## 📜 Scripts (PowerShell)

Trong thư mục `scripts/`:

- **backup-db.ps1** – Tạo backup database
- **list-backups.ps1** – Liệt kê file backup
- **restore-db.ps1** – Khôi phục từ file backup
- **reset-data.ps1** – Reset dữ liệu nghiệp vụ (cẩn thận)

Chi tiết: [scripts/README.md](./scripts/README.md).

---

## 📞 Liên hệ & Đóng góp

- 🐛 Báo lỗi: [GitHub Issues](https://github.com/ththuan/quanlytaisan/issues)
- 📖 Wiki: [GitHub Wiki](https://github.com/ththuan/quanlytaisan/wiki)

---

## 📌 Cập nhật gần đây

- **Khởi động hệ thống**: Chỉ seed tài khoản admin (`seed:admin`), không tạo dữ liệu mẫu; dữ liệu khác tự import.
- **Admin**: Luôn có toàn quyền; đăng nhập mặc định `admin` / `Admin@123`.
- **Phòng ban**: Admin có thể xóa phòng ban đang có người dùng/tài sản bằng tùy chọn "Gỡ phòng ban rồi xóa" (gỡ liên kết rồi xóa).

---

**Version**: 1.0.0  
**Cập nhật**: 2026-03-15
