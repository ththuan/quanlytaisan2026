# 🏢 Hệ thống Quản lý Tài sản

[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14-blue.svg)](https://www.postgresql.org/)

Hệ thống quản lý tài sản cho các tổ chức, trường học, doanh nghiệp.

**Repository**: [github.com/ththuan/quanlytaisan2026](https://github.com/ththuan/quanlytaisan2026)

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
| **Backend** | Node.js 18+, Express, TypeScript, PostgreSQL 14, Sequelize, Redis, JWT + TOTP |
| **Frontend** | Vue 3, Element Plus, Pinia, Vite, TypeScript, ECharts, html5-qrcode, Vue I18n |
| **DevOps** | Docker, Docker Compose, nginx, GitHub Actions (self-hosted runner), Cloudflare Tunnel |

---

## 🚀 Chạy development (Windows + Docker Desktop)

### Yêu cầu
- **Docker** + Docker Compose (khuyến nghị)
- **Không Docker**: Node.js 18+, PostgreSQL 14, npm

### Chạy bằng Docker

```bash
# Clone
git clone https://github.com/ththuan/quanlytaisan2026.git
cd quanlytaisan2026

# Cấu hình (lần đầu)
cp .env.example .env

# Tạo volume (bắt buộc lần đầu)
docker volume create quanlytaisan_postgres_data
docker volume create quanlytaisan_redis_data

# Khởi động (development — hot-reload)
docker compose up -d

# Xem log
docker compose logs -f
```

**Truy cập (development):**
- **Frontend (Vite)**: http://localhost:4000 — Vite tự proxy `/api` về backend
- **Backend API**: http://localhost:5000
- **nginx (tuỳ chọn)**: http://localhost:8080 / https://localhost:8443

**Các file docker-compose:**

| File | Mô tả |
|------|-------|
| `docker-compose.yml` | Development (hot-reload, mount source code, nginx proxy) |
| `docker-compose.dev.yml` | Development nâng cao (healthcheck, không mount node_modules) |
| `docker-compose.prod.yml` | Production (build tối ưu, nginx 80/443, Cloudflare Tunnel) |

### Chạy không Docker (phát triển)

**1. Backend**
```bash
cd asset-management-backend
cp ../.env.example .env      # chỉnh DB_HOST=localhost, DB_PORT...
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

---

## 🔐 HTTPS / SSL (mạng nội bộ)

Development và production đều dùng **nginx** làm reverse proxy với HTTPS. Để tạo SSL certificate tự ký (10 năm, bao gồm SAN cho IP nội bộ + `localhost`):

```powershell
# Tự động phát hiện IP nội bộ và tạo cert vào nginx/ssl/
powershell -ExecutionPolicy Bypass -File scripts\generate-ssl.ps1

# Hoặc chỉ định IP cụ thể
powershell -ExecutionPolicy Bypass -File scripts\generate-ssl.ps1 -IP 192.168.1.100
```

> Trên server Debian, `setup.sh` tự sinh cert này bằng `openssl`. Trình duyệt sẽ báo "Không bảo mật" (cert tự ký) → bấm **Nâng cao → Vẫn tiếp tục**.

---

## 🚀 Triển khai production (Debian home server)

Máy Windows chỉ dùng để code/test. Chạy thực tế trên **Debian home server** bằng `docker-compose.prod.yml` + **Cloudflare Tunnel** (public ra internet không cần mở cổng).

### 1. Cài đặt 1 lần duy nhất (tự động)

Trên server Debian mới chỉ cần chạy:

```bash
curl -fsSL https://raw.githubusercontent.com/ththuan/quanlytaisan2026/main/setup.sh -o setup.sh
sudo bash setup.sh
```

[`setup.sh`](./setup.sh) tự động: cài Docker + Compose → clone repo → tạo `.env` với secret sinh ngẫu nhiên → tạo volume → sinh SSL cert → khởi động toàn bộ. Có thể ghi đè cấu hình qua biến môi trường:

```bash
sudo DOMAIN=quanlytaisanctec.dpdns.org \
     CF_TUNNEL_TOKEN=<token> \
     ADMIN_PASSWORD=MatKhauManh@123 \
     bash setup.sh
```

> Các file quan trọng (`.env`, `nginx/ssl/`, `storage/`, `backups/`) nằm **ngoài git** nên mọi lần `git pull`/deploy **không bao giờ ghi đè** — không phải cấu hình lại từ đầu.

### 2. Tự động deploy khi push code lên GitHub

**Cách 1 — Tự động hoàn toàn (khuyến nghị):** cài **GitHub Actions self-hosted runner** ngay trên server. Runner tự kết nối *ra ngoài* tới GitHub nên **không cần mở cổng vào**. Sau khi cài, mỗi lần push lên `main` là server tự pull + rebuild.

```bash
# GitHub repo -> Settings -> Actions -> Runners -> New self-hosted runner (Linux x64) -> copy TOKEN
RUNNER_TOKEN=<TOKEN> bash scripts/setup-github-runner.sh
```

Workflow nằm tại [`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

**Cách 2 — Thủ công (khi chưa cài runner):** SSH vào server rồi chạy:

```bash
cd /root/quanlytaisan2026 && ./deploy.sh
```

[`deploy.sh`](./deploy.sh) tự `git fetch` + `reset --hard origin/main` (tránh merge conflict) rồi rebuild `backend`/`frontend`. Container `cloudflared` không bị động tới nên tunnel không gián đoạn khi deploy.

### 3. Public ra internet với Cloudflare Tunnel

Không cần mở port trên router/firewall — Cloudflare tạo kết nối outbound từ server ra Cloudflare edge.

1. Vào [Cloudflare Zero Trust](https://one.dash.cloudflare.com/) → **Networks → Tunnels → Create a tunnel** (loại **Cloudflared**).
2. Copy giá trị token ở bước cài đặt connector, dán vào `.env`: `CF_TUNNEL_TOKEN=<token>`.
3. Tab **Public Hostname** → Add a public hostname:
   - Hostname: `quanlytaisanctec.dpdns.org`
   - Service: `HTTP` → `nginx:80` (tên service trong Docker network nội bộ, **không phải** localhost)
4. Trong `.env` đặt `CORS_ORIGIN` và `FRONTEND_URL` = `https://quanlytaisanctec.dpdns.org`.
5. Khởi động tunnel:
   ```bash
   docker compose -f docker-compose.prod.yml --profile cloudflare up -d
   ```
6. Kiểm tra: `docker logs asset-management-cloudflared -f` phải thấy `Registered tunnel connection`.

> **Lưu ý:** Cloudflare Tunnel dạng "Public Hostname" yêu cầu domain nằm trong **tài khoản Cloudflare của bạn**. Nếu `dpdns.org` không cho quản lý zone trên Cloudflare, hãy dùng domain riêng hoặc dùng DDNS + mở cổng.

---

## ⚙️ Cấu hình (.env)

| Biến | Mô tả | Mặc định |
|------|-------|----------|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | Kết nối PostgreSQL | postgres / postgres / asset_management / 5432 |
| `BACKEND_PORT` | Port backend expose ra host | `5000` |
| `FRONTEND_PORT` | Port frontend expose ra host | `4000` |
| `JWT_SECRET` | Secret ký JWT. **Production bắt buộc ≥32 ký tự** | `your-secret-key-change-in-production` |
| `DEFAULT_PASSWORD` | Mật khẩu mặc định khi tạo user mới / import user | `Ctec@123` |
| `ADMIN_PASSWORD` | Mật khẩu tài khoản `admin` | `Admin@123` |
| `CORS_ORIGIN` | Origin cho phép. **Production**: domain cụ thể | `*` |
| `FRONTEND_URL` | URL frontend (CORS/redirect) | `http://localhost:4000` |
| `LOG_LEVEL` | Mức log backend | `info` |
| `BODY_LIMIT` | Giới hạn body request | `10mb` |
| `VITE_API_BASE_URL` | URL API backend mà frontend gọi | `/api` |
| `CF_TUNNEL_TOKEN` | Token Cloudflare Tunnel (public ra internet) | *(trống)* |

> ⚠️ **Production bắt buộc:** `JWT_SECRET` ≥32 ký tự, `DEFAULT_PASSWORD` ≠ `Ctec@123`, `ADMIN_PASSWORD` ≠ `Admin@123`. Backend sẽ **từ chối khởi động** nếu dùng giá trị yếu. `setup.sh` và `scripts/fix-env-secrets.sh` tự sinh/xử lý việc này.

**Tạo secret ngẫu nhiên:**
```bash
node scripts/generate-secrets.js
```

---

## 🔐 Tài khoản admin

| | |
|---|---|
| **Username** | `admin` (cố định) |
| **Password** | giá trị `ADMIN_PASSWORD` trong `.env` (mặc định `Admin@123`) |

- Hệ thống **chỉ tạo admin khi chưa có** (seed `seed:admin` chạy khi khởi động) với mật khẩu = `ADMIN_PASSWORD`.
- **Đặt lại mật khẩu admin** (về đúng `ADMIN_PASSWORD` trong `.env`, đồng thời mở khoá + tắt 2FA):
  ```bash
  docker compose exec backend npm run reset-admin
  ```
- **`DEFAULT_PASSWORD`** chỉ dùng cho **tạo user mới / import user**, không áp dụng cho `admin`.
- **Không đăng nhập được?** Chạy `npm run reset-admin` trong thư mục `asset-management-backend` (hoặc `docker compose exec backend npm run reset-admin`).

---

## 📜 Scripts

| Script | Mô tả |
|--------|--------|
| **setup.sh** | Cài đặt 1 lần toàn bộ hệ thống trên server Debian |
| **deploy.sh** | Pull code mới + rebuild container trên server (gọi bởi runner) |
| **scripts/setup-github-runner.sh** | Cài GitHub self-hosted runner (push là tự deploy) |
| **scripts/fix-env-secrets.sh** | Tự sửa secret yếu trong `.env` (JWT/DEFAULT/ADMIN) |
| **backup-db.ps1** | Tạo backup database |
| **list-backups.ps1** | Liệt kê file backup + thống kê DB |
| **restore-db.ps1** | Khôi phục từ file backup |
| **reset-data.ps1** | Reset dữ liệu nghiệp vụ |
| **generate-secrets.js** | Tạo `JWT_SECRET`/`DEFAULT_PASSWORD` ngẫu nhiên |
| **generate-ssl.ps1** | Tạo SSL cert tự ký cho nginx |
| **sync-push / sync-pull** | Đẩy/kéo code GitHub khi làm việc nhiều máy |

Chi tiết: [scripts/README.md](./scripts/README.md).

---

## 📁 Cấu trúc dự án

```
quanlytaisan2026/
├── asset-management-backend/   # API Express + Sequelize
│   ├── src/                    # controllers, services, models, routes, middleware, migrations, config
│   ├── seeders/                # Sequelize seeders (admin)
│   ├── scripts/                # reset-admin-password.js...
│   └── Dockerfile
├── asset-management-frontend/  # Vue 3 + Vite + Element Plus
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf              # Cấu hình nginx production
│   └── nginx.dev.conf          # Cấu hình nginx development
├── scripts/                    # setup/deploy/backup/reset/sync scripts
├── .github/workflows/
│   ├── ci.yml                  # Typecheck trên mỗi push/PR
│   └── deploy.yml              # Auto-deploy production (self-hosted runner)
├── docker-compose.yml          # Development
├── docker-compose.dev.yml      # Development nâng cao
├── docker-compose.prod.yml     # Production
├── setup.sh                    # Cài đặt 1 lần cho server Debian
├── deploy.sh                   # Pull + rebuild trên server
├── .env.example
└── README.md
```

---

## 🔒 Bảo mật

**Đã có sẵn:** Helmet, rate limiting, JWT (HS256, access 15 phút + refresh 7 ngày, có issuer/algorithm xác thực), phân quyền theo role, 2FA (TOTP), bcrypt, CORS, SQL parameterized, MIME filter cho file upload, audit log chống giả mạo, session-bound token (lưu theo thiết bị/IP).

**Trước khi triển khai production:**
1. `JWT_SECRET`, `DEFAULT_PASSWORD`, `ADMIN_PASSWORD` phải là giá trị mạnh (backend tự chặn nếu yếu).
2. Cấu hình `CORS_ORIGIN`/`FRONTEND_URL` đúng domain.
3. `DB_PASSWORD` mạnh.
4. Nếu upload ảnh base64 lớn: `BODY_LIMIT=50mb`.

---

## 💡 Tính năng đề xuất (chưa có)

| Ưu tiên | Tính năng | Lý do |
|--------|------------|--------|
| **1** | **Quên mật khẩu qua email** | Trang đăng nhập có link "Quên mật khẩu?" nhưng chưa có luồng gửi link đặt lại qua email. |
| **2** | **Gửi email thông báo** | Backend chưa tích hợp SMTP — gửi email khi có việc cần phê duyệt, nhắc bảo trì đến hạn... |
| **3** | **Refresh token rotation** | Đã có refresh token; có thể nâng cao thêm rotation để giảm rủi ro token lộ. |
| **4** | **Xuất báo cáo định kỳ** | Lập lịch xuất báo cáo tháng/năm, lưu file hoặc gửi email. |

---

## 📞 Liên hệ & Đóng góp

- 🐛 Báo lỗi: [GitHub Issues](https://github.com/ththuan/quanlytaisan2026/issues)
