# Hệ thống Quản lý Tài sản

[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14-blue.svg)](https://www.postgresql.org/)
[![Vue](https://img.shields.io/badge/vue-3-42b883.svg)](https://vuejs.org/)

Phần mềm quản lý tài sản dùng cho Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ, hỗ trợ quản lý tài sản theo đơn vị, danh mục, quy trình điều chuyển - kiểm kê - mua sắm - sửa chữa - thanh lý, tra cứu QR công khai và báo cáo phục vụ quản trị nội bộ.

**Repository**: [github.com/ththuan/quanlytaisan2026](https://github.com/ththuan/quanlytaisan2026)

---

## 1. Tổng quan

Hệ thống gồm 3 phần chính:

- **Backend API**: Node.js + Express + TypeScript + Sequelize + PostgreSQL + Redis.
- **Frontend**: Vue 3 + TypeScript + Element Plus + Pinia + Vite + ECharts.
- **Hạ tầng**: Docker Compose + nginx + Cloudflare Tunnel (tùy chọn), có thể chạy trên Debian/Linux.

Đối tượng sử dụng:

| Vai trò | Phạm vi chính |
|---|---|
| `admin` | Quản trị toàn hệ thống, người dùng, danh mục, cấu hình, sao lưu |
| `director` | Xem toàn trường, duyệt các quy trình ở cấp giám hiệu |
| `department_head` | Quản lý tài sản và quy trình thuộc đơn vị được gán |
| `staff` | Xem/khai báo tài sản, tạo đề nghị, kiểm kê trong phạm vi đơn vị |

Người dùng không có `department_id` sẽ bị từ chối ở các chức năng yêu cầu phạm vi đơn vị (fail-closed).

---

## 2. Chức năng theo phân hệ

### 2.1 Xác thực và phân quyền

- Đăng nhập bằng username/password, phân quyền theo 4 vai trò.
- Access token ngắn hạn (mặc định 1 giờ) chỉ giữ trong bộ nhớ trình duyệt.
- Refresh token lưu trong cookie `HttpOnly`, `SameSite=Strict`, tự động xoay vòng khi hết hạn.
- Xác thực 2 lớp TOTP (Google Authenticator):
  - Bật/tắt 2FA, quét QR để thêm thiết bị.
  - Chống dùng lại cùng một mã TOTP.
  - Giới hạn số lần thử và thu hồi phiên khi thay đổi 2FA.
- Khóa tài khoản tạm thời sau nhiều lần nhập sai mật khẩu.
- Đổi mật khẩu, thu hồi toàn bộ phiên cũ.
- Quản trị viên có thể đặt lại mật khẩu người dùng; phiên cũ bị thu hồi.
- Tự đăng ký công khai **tắt mặc định** (`ALLOW_PUBLIC_REGISTRATION=false`).
- Audit log cho đăng nhập, thao tác quản trị và các thay đổi quan trọng.

### 2.2 Bảng điều khiển

- Thống kê tổng quan: tổng tài sản, mua sắm, sửa chữa, điều chuyển, kiểm kê, thanh lý, tài sản mất/hư hỏng.
- Biểu đồ mạng lưới tài sản theo đơn vị và danh mục.
- Danh sách hoạt động gần đây (audit log).
- Số liệu động, hiệu ứng xuất hiện, tiêu đề gradient.
- Chế độ **giảm hiệu ứng** (Effects Lite) để chạy nhẹ hơn trên máy yếu.

### 2.3 Quản lý tài sản

- Thêm, sửa, xóa, xem chi tiết tài sản.
- Danh mục tài sản theo Thông tư 141/2025/TT-BTC và danh mục bổ sung của trường.
- Quản lý theo đơn vị, campus, vị trí, người sử dụng, chức danh.
- Tính khấu hao, giá trị còn lại, thời gian sử dụng hữu ích.
- QR code cho từng tài sản.
- Hình ảnh tài sản: chụp từ camera, tải lên, xem và zoom ảnh.
- Lịch sử thay đổi, lịch sử bàn giao, lịch sử sửa chữa, lịch sử điều chuyển.
- Import/Export Excel:
  - Import có kiểm tra dữ liệu trước khi ghi DB.
  - Giới hạn 20.000 dòng và 100 cột mỗi file.
  - Export danh sách tài sản, báo cáo mất/hư hỏng.

### 2.4 Điều chuyển tài sản

- Tạo đề nghị điều chuyển kèm chữ ký sống.
- Kiểm tra tài sản thuộc đơn vị nguồn, không tin `from_department_id` do client gửi.
- Quy trình duyệt nhiều cấp: trưởng đơn vị nguồn/đơn vị nhận, admin/giám hiệu.
- Thông báo cho đơn vị nhận.
- Xem lịch sử điều chuyển theo tài sản, có kiểm tra phạm vi đơn vị.
- In biên bản điều chuyển.

### 2.5 Kiểm kê tài sản

- Tạo đợt kiểm kê, báo cáo kiểm kê theo đơn vị.
- Kiểm kê bằng quét QR, nhập tay hoặc theo khu vực.
- Ghi nhận số lượng thực tế, tình trạng, chênh lệch, đề xuất sửa chữa/thanh lý.
- Đính kèm hình ảnh kiểm kê.
- Duyệt nhiều cấp: trưởng đơn vị → admin.
- Chặn thêm tài sản ngoài đơn vị vào báo cáo kiểm kê.
- Xuất báo cáo kiểm kê Excel nhiều sheet.

### 2.6 Mua sắm và sửa chữa

- Đề nghị mua sắm/cấp phát, đề nghị sửa chữa.
- Quy trình duyệt theo cấp, ghi nhận lịch sử duyệt.
- Theo dõi trạng thái, chi phí, nhà cung cấp, chứng từ.
- Khi hoàn tất mua sắm có thể tạo tài sản mới từ danh sách hàng hóa.
- Quản lý chứng từ PDF của gói mua sắm.
- In phiếu/ biên bản liên quan.

### 2.7 Thanh lý và tiêu hủy

- Tạo hồ sơ thanh lý/tiêu hủy từ tài sản hoặc từ kết quả kiểm kê.
- Quy trình duyệt, ngày quyết định, số quyết định, đơn vị gốc.
- Đính kèm quyết định thanh lý (PDF/Word/ảnh).
- Chữ ký sống của các bên liên quan.
- In biên bản thanh lý/tiêu hủy.

### 2.8 Kho vật tư

- Quản lý vật tư, nhóm vật tư, đơn vị tính.
- Nhập kho, xuất kho, theo dõi tồn kho.
- Lịch sử nhập/xuất, báo cáo kho.
- Dashboard kho vật tư.

### 2.9 Định mức tài sản

- Danh mục định mức theo chức danh, nhóm chức danh.
- Định mức diện tích, số lượng, giá trị.
- Cảnh báo vượt định mức.
- Nạp định mức theo Quy chế 188 của trường.

### 2.10 Báo cáo

- Báo cáo thường niên theo đơn vị.
- Báo cáo tài sản mất/hư hỏng.
- Báo cáo kiểm kê.
- Xuất Excel theo mẫu TT120 và báo cáo nội bộ.
- Xuất báo cáo trực tiếp trên trình duyệt bằng ExcelJS.

### 2.11 Quản trị hệ thống

- Quản lý phòng ban/đơn vị theo cây, campus, loại đơn vị.
- Quản lý người dùng, vai trò, chức danh, trạng thái hoạt động.
- Nhật ký hoạt động (audit log).
- Thông báo trong hệ thống.
- Sao lưu/khôi phục database.
- Chạy migration, seed dữ liệu.
- Kiểm tra sức khỏe hệ thống (database, Docker nếu có).
- Điều khiển container chỉ khi được cấu hình Docker socket (mặc định không bật vì lý do bảo mật).

### 2.12 Tra cứu QR công khai

- Mỗi tài sản có QR chứa URL: `https://<domain>/scan/<MÃ>?t=<token>`.
- Trang tra cứu công khai không cần đăng nhập, hiển thị thông tin cơ bản:
  - Mã tài sản, tên, loại, đơn vị, vị trí, trạng thái, tình trạng, năm sử dụng, số lượng, ảnh.
- Không hiển thị giá trị, serial, bảo hành, mô tả nội bộ.
- Token QR bắt buộc mặc định (`QR_REQUIRE_SIGNATURE=true`).
- Tem QR cũ không token bị từ chối mặc định; có thể bật `QR_ALLOW_LEGACY_NO_TOKEN=true` nếu cần tương thích.
- Giới hạn tần suất tra cứu công khai.

### 2.13 Giao diện và hiệu ứng

- Giao diện tiếng Việt, responsive cho máy tính, tablet, điện thoại.
- Hiệu ứng bằng `motion-v` (số liệu động, chuyển trang, sidebar, thông báo, ảnh, form).
- Nút **MagicStick** trên header bật/tắt chế độ giảm hiệu ứng.
- Tự động giảm hiệu ứng trên thiết bị yếu hoặc khi FPS thấp.
- Tôn trọng `prefers-reduced-motion`.
- PWA: cài như ứng dụng, có cơ chế cập nhật phiên bản.

---

## 3. Kiến trúc và công nghệ

| Thành phần | Công nghệ |
|---|---|
| Backend | Node.js 18+, Express, TypeScript, Sequelize, PostgreSQL 14, Redis 7 |
| Xác thực | JWT HS256, refresh token cookie HttpOnly, TOTP (speakeasy), bcrypt |
| Frontend | Vue 3, TypeScript, Vite, Element Plus, Pinia, Vue Router, Vue I18n |
| Biểu đồ | ECharts + vue-echarts |
| Excel | ExcelJS (backend và frontend) |
| QR | qrcode, html5-qrcode |
| Giao diện động | motion-v, @vueuse/core |
| Hạ tầng | Docker, Docker Compose, nginx, Cloudflare Tunnel |
| CI/CD | GitHub Actions, self-hosted runner (tùy chọn) |

Luồng cơ bản:

```text
Trình duyệt (Vue SPA)
        |
        | HTTPS / Cloudflare Tunnel
        v
      nginx
      /    \
     /      \
frontend   backend (Express API)
              |
       +------+------+
       |             |
  PostgreSQL      Redis
```

---

## 4. Cấu trúc thư mục

```text
quanlytaisan2026/
├── asset-management-backend/
│   ├── src/
│   │   ├── config/          # env, database, redis, jwt, rate limit
│   │   ├── controllers/     # xử lý HTTP
│   │   ├── middleware/      # auth, authorization, validation, storage auth
│   │   ├── migrations/      # Sequelize migrations
│   │   ├── models/          # Sequelize models
│   │   ├── routes/          # khai báo API
│   │   ├── services/        # nghiệp vụ
│   │   └── utils/           # excel, file, jwt, qr, logger...
│   ├── seeders/
│   ├── scripts/
│   └── Dockerfile
├── asset-management-frontend/
│   ├── src/
│   │   ├── components/      # layout, dialog, animate components
│   │   ├── composables/
│   │   ├── directives/      # stagger, tilt, ripple, reveal, tabs
│   │   ├── i18n/
│   │   ├── router/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── styles/
│   │   ├── types/
│   │   ├── utils/
│   │   └── views/
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf
│   └── nginx.dev.conf
├── scripts/
├── .github/workflows/
│   ├── ci.yml
│   └── deploy.yml
├── docker-compose.yml
├── docker-compose.dev.yml
├── docker-compose.prod.yml
├── setup.sh
├── deploy.sh
├── .env.example
├── .env.prod.example
└── README.md
```

---

## 5. Yêu cầu hệ thống

### Khuyến nghị

- Docker Engine 24+ và Docker Compose plugin.
- PostgreSQL 14 (container).
- Redis 7 (container).
- 2 GB RAM trở lên cho server nhỏ; 4 GB khuyến nghị.
- HTTPS nếu dùng camera quét QR hoặc cài PWA.

### Chạy không Docker

- Node.js 18+ (khuyến nghị Node 20/22).
- PostgreSQL 14.
- Redis 7.
- npm 9+.

---

## 6. Chạy development

### 6.1 Bằng Docker

```bash
git clone https://github.com/ththuan/quanlytaisan2026.git
cd quanlytaisan2026

cp .env.example .env
# Chỉnh DB_PASSWORD, JWT_SECRET, ADMIN_PASSWORD, DEFAULT_PASSWORD...

docker volume create quanlytaisan_postgres_data
docker volume create quanlytaisan_redis_data

docker compose up -d
docker compose logs -f
```

Truy cập:

- Frontend Vite: `http://localhost:4000` hoặc `https://localhost:4000` nếu bật `VITE_HTTPS=true`.
- Backend API: `http://localhost:5000`.
- nginx (nếu dùng): `http://localhost:8080` / `https://localhost:8443`.

Các file compose:

| File | Mục đích |
|---|---|
| `docker-compose.yml` | Development, mount source, hot-reload |
| `docker-compose.dev.yml` | Development nâng cao, healthcheck |
| `docker-compose.prod.yml` | Production, build tối ưu, nginx, Cloudflare Tunnel |

### 6.2 Không dùng Docker

Backend:

```bash
cd asset-management-backend
cp ../.env.example .env
# Sửa DB_HOST=localhost, DB_PORT=5432, REDIS_URL=redis://localhost:6379
npm install
npm run migrate
npm run dev
```

Frontend:

```bash
cd asset-management-frontend
npm install
npm run dev
```

Lưu ý:

- Không cần chạy `seed:admin`; backend tự tạo admin lần đầu nếu chưa tồn tại.
- Nếu chưa đặt `ADMIN_PASSWORD`, môi trường development dùng mặc định `admin / Admin@123`.
- Production **bắt buộc** đặt `ADMIN_PASSWORD` mạnh.

---

## 7. Cấu hình môi trường

Các biến quan trọng:

| Biến | Mô tả | Ghi chú |
|---|---|---|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | Kết nối PostgreSQL | Production bắt buộc mật khẩu mạnh |
| `JWT_SECRET` | Khóa ký JWT | Bắt buộc >= 32 ký tự, không dùng placeholder |
| `JWT_ACCESS_EXPIRATION` | Thời hạn access token | Mặc định `1h` |
| `JWT_REFRESH_EXPIRATION` | Thời hạn refresh token | Mặc định `30d` |
| `DEFAULT_PASSWORD` | Mật khẩu khi tạo/import user | Production bắt buộc, không dùng `Ctec@123` |
| `ADMIN_USERNAME` | Username admin khởi tạo | Mặc định `admin` |
| `ADMIN_PASSWORD` | Mật khẩu admin khởi tạo | Production bắt buộc mạnh; chỉ dùng khi tạo admin lần đầu |
| `CORS_ORIGIN` | Domain frontend được phép gọi API | Production bắt buộc domain cụ thể |
| `FRONTEND_URL` | URL frontend | Dùng cho CORS và link công khai |
| `ALLOW_PUBLIC_REGISTRATION` | Cho phép tự đăng ký | Mặc định `false` |
| `QR_REQUIRE_SIGNATURE` | Bắt buộc token QR hợp lệ | Mặc định `true` |
| `QR_ALLOW_LEGACY_NO_TOKEN` | Cho phép tem QR cũ không token | Mặc định `false` |
| `PUBLIC_SCAN_RATE_LIMIT_*` | Giới hạn tra cứu QR công khai | Mặc định 60/phút/IP |
| `SWAGGER_ENABLED` | Bật Swagger trong production | Mặc định `false` |
| `BODY_LIMIT` | Giới hạn body request | Mặc định `10mb` |
| `REDIS_URL` | Kết nối Redis | Mặc định `redis://redis:6379` trong Docker |
| `CF_TUNNEL_TOKEN` | Token Cloudflare Tunnel | Chỉ dùng khi public qua Cloudflare |
| `VITE_API_BASE_URL` | URL API frontend gọi | Mặc định `/api` |

Tạo secret:

```bash
node scripts/generate-secrets.js
```

Production bắt buộc kiểm tra:

```bash
grep -E '^(DB_PASSWORD|JWT_SECRET|DEFAULT_PASSWORD|CORS_ORIGIN|FRONTEND_URL)=' .env
```

Thiếu các biến này, `docker-compose.prod.yml` sẽ dừng ngay để tránh chạy với cấu hình yếu.

---

## 8. Database, migration và tài khoản admin

### Migration

Production tự chạy migration khi backend khởi động:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run migrate
```

Hoặc chạy thủ công trong thư mục backend:

```bash
npm run migrate
npm run migrate:undo
```

### Tạo admin lần đầu

- Chỉ tạo khi username admin **chưa tồn tại**.
- Không đặt lại mật khẩu, không tắt 2FA, không mở khóa admin mỗi lần khởi động.
- Production yêu cầu `ADMIN_PASSWORD` mạnh (>= 12 ký tự, không phải mật khẩu mặc định).

### Quên mật khẩu admin

Đặt `ADMIN_PASSWORD` mới trong `.env`, sau đó:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run reset-admin
```

Script sẽ cập nhật mật khẩu admin theo `ADMIN_PASSWORD`; không tự tắt 2FA.

Nếu mất luôn thiết bị 2FA:

```bash
docker compose -f docker-compose.prod.yml exec postgres \
  psql -U postgres -d asset_management \
  -c "UPDATE users SET totp_enabled=false, totp_secret=NULL WHERE username='admin';"
```

Sau đó đăng nhập lại và bật 2FA mới.

### Reset dữ liệu nghiệp vụ

```bash
docker compose -f docker-compose.prod.yml exec backend npm run reset:business
```

Chỉ dùng khi thật sự cần; thao tác này xóa dữ liệu nghiệp vụ và có thể yêu cầu biến xác nhận.

---

## 9. Triển khai production trên Debian/Linux

### 9.1 Chuẩn bị server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl openssl ufw
# Cài Docker Engine + Docker Compose plugin theo hướng dẫn chính thức của Docker
sudo systemctl enable --now docker
```

Khuyến nghị tạo user riêng:

```bash
sudo adduser deploy
sudo usermod -aG docker deploy
```

### 9.2 Cài lần đầu

Có thể dùng `setup.sh`:

```bash
git clone https://github.com/ththuan/quanlytaisan2026.git
cd quanlytaisan2026
sudo bash setup.sh
```

`setup.sh` sẽ:

- Cài Docker/Compose nếu cần.
- Tạo `.env` với secret ngẫu nhiên.
- Tạo volume PostgreSQL/Redis.
- Sinh SSL tự ký cho nginx.
- Khởi động hệ thống.

Nên đọc script trước khi chạy bằng quyền root.

Có thể ghi đè cấu hình:

```bash
sudo DOMAIN=quanlytaisanctec.dpdns.org \
     ADMIN_PASSWORD='mat-khau-manh' \
     CF_TUNNEL_TOKEN='<token>' \
     APP_DIR=/opt/quanlytaisan2026 \
     bash setup.sh
```

### 9.3 Deploy khi có code mới

Thủ công:

```bash
cd /root/quanlytaisan2026
./deploy.sh
```

Nếu đặt repo ở đường dẫn khác:

```bash
REPO_PATH=/opt/quanlytaisan2026 ./deploy.sh
```

Tự động: cài GitHub self-hosted runner:

```bash
RUNNER_TOKEN=<TOKEN> bash scripts/setup-github-runner.sh
```

Workflow: `.github/workflows/deploy.yml`.

### 9.4 Cloudflare Tunnel

1. Vào Cloudflare Zero Trust → Networks → Tunnels → Create tunnel (Cloudflared).
2. Copy token vào `.env`: `CF_TUNNEL_TOKEN=<token>`.
3. Public Hostname:
   - Hostname: domain của bạn.
   - Service: `http://nginx:80`.
4. Đặt `CORS_ORIGIN` và `FRONTEND_URL` đúng domain.
5. Khởi động:

```bash
docker compose -f docker-compose.prod.yml --profile cloudflare up -d
docker logs -f asset-management-cloudflared
```

### 9.5 Chuyển sang server mới

1. Cài Docker + Compose trên server mới.
2. Clone repo.
3. Copy từ server cũ:
   - `.env`
   - `nginx/ssl/`
   - `asset-management-backend/storage/`
   - `asset-management-backend/logs/` (nếu cần)
   - `backups/` (nếu có)
4. Backup database server cũ:

```bash
cd /root/quanlytaisan2026
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres -d asset_management -Fc > /tmp/quanlytaisan.dump
```

5. Copy file dump sang server mới, khởi động PostgreSQL rồi restore:

```bash
cd /opt/quanlytaisan2026
docker compose -f docker-compose.prod.yml up -d postgres
cat /tmp/quanlytaisan.dump | docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U postgres -d asset_management --clean --if-exists
```

6. Build và chạy:

```bash
docker compose -f docker-compose.prod.yml up -d --build
```

7. Cấu hình lại Cloudflare Tunnel/domain nếu đổi domain.
8. Kiểm tra:

```bash
docker compose -f docker-compose.prod.yml ps
docker compose -f docker-compose.prod.yml logs -f backend nginx
```

9. Cập nhật firewall:
   - Dùng Cloudflare Tunnel: chỉ mở SSH, không mở 80/443 ra Internet.
   - Truy cập trực tiếp: mở 80/443 và giới hạn IP nếu có thể.

---

## 10. QR code và tra cứu công khai

- QR chứa URL `/scan/<MÃ>?t=<token>`.
- Token được lưu cùng QR trong DB, không phụ thuộc domain hay JWT secret.
- Tạo lại QR khi cần đổi token hoặc in lại tem.
- Trang công khai chỉ hiển thị thông tin nhận diện cơ bản, không có giá trị tài chính.
- `QR_REQUIRE_SIGNATURE=true`: bắt buộc token hợp lệ.
- `QR_ALLOW_LEGACY_NO_TOKEN=false`: từ chối tem cũ không token.
- Nếu cần dùng tem cũ, bật tạm `QR_ALLOW_LEGACY_NO_TOKEN=true`, sau đó in lại QR mới.

---

## 11. Bảo mật

Đã triển khai:

- Helmet, CSP và security headers tại nginx.
- JWT HS256, kiểm tra issuer/algorithm; access token ngắn hạn.
- Refresh token trong cookie HttpOnly, SameSite=Strict.
- Access token không lưu localStorage; chỉ giữ trong bộ nhớ.
- TOTP chống phát lại mã, giới hạn số lần thử.
- Khóa tài khoản sau nhiều lần sai mật khẩu.
- Thu hồi phiên khi đổi mật khẩu, đổi 2FA, đăng xuất.
- Phân quyền theo vai trò và phạm vi đơn vị; fail-closed khi thiếu đơn vị.
- Kiểm tra quyền truy cập tài sản, chứng từ, chữ ký, kiểm kê, điều chuyển.
- File nội bộ trong `/storage` yêu cầu đăng nhập; ảnh tài sản công khai được tách riêng.
- Upload giới hạn MIME/extension; chặn HTML/SVG độc hại.
- Chữ ký sống được kiểm tra allowlist data URL khi lưu và khi in.
- QR công khai yêu cầu token, giới hạn tần suất.
- Excel import dùng ExcelJS, giới hạn số dòng/cột.
- Swagger tắt mặc định trong production.
- Tự đăng ký công khai tắt mặc định.
- CORS production chỉ cho phép domain cấu hình.
- Audit log, rate limit, validation bằng Joi.
- `docker.sock` không mount mặc định.

Khuyến nghị trước khi đưa lên Internet:

1. Dùng HTTPS thật (Cloudflare/Let's Encrypt), tránh truy cập HTTP trực tiếp.
2. Đặt `ADMIN_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, `DEFAULT_PASSWORD` mạnh.
3. Đổi mật khẩu admin nếu vẫn dùng `Admin@123`.
4. Giới hạn firewall, chỉ mở cổng cần thiết.
5. Chạy GitHub runner bằng user riêng, không dùng root.
6. Sao lưu database và thư mục `storage` định kỳ.
7. Kiểm tra `npm audit` định kỳ.
8. Cân nhắc nâng Node.js lên bản còn hỗ trợ (20/22).

---

## 12. Scripts

| Script | Mục đích |
|---|---|
| `setup.sh` | Cài đặt lần đầu trên server Debian |
| `deploy.sh` | Pull code mới và rebuild container |
| `scripts/setup-github-runner.sh` | Cài GitHub self-hosted runner |
| `scripts/fix-env-secrets.sh` | Kiểm tra/sửa secret yếu trong `.env` |
| `scripts/generate-secrets.js` | Sinh JWT_SECRET/DEFAULT_PASSWORD |
| `scripts/backup-db.ps1` | Sao lưu database (Windows) |
| `scripts/list-backups.ps1` | Liệt kê backup |
| `scripts/restore-db.ps1` | Khôi phục database |
| `scripts/reset-data.ps1` | Reset dữ liệu nghiệp vụ |
| `scripts/generate-ssl.ps1` | Sinh SSL tự ký cho development |
| `scripts/sync-push.*`, `scripts/sync-pull.*` | Đồng bộ code giữa nhiều máy |

---

## 13. Kiểm thử và chất lượng mã

Backend:

```bash
cd asset-management-backend
npm run typecheck
npm run build
npm run test
npm run lint
```

Frontend:

```bash
cd asset-management-frontend
npm run typecheck
npm run build
npm run lint:ci
```

CI:

- `.github/workflows/ci.yml`: typecheck/build khi push hoặc pull request.
- `.github/workflows/deploy.yml`: deploy production qua self-hosted runner.

---

## 14. API và tài liệu

- Health check: `GET /api/health`.
- Swagger:
  - Development: `http://localhost:5000/api-docs`.
  - Production: tắt mặc định; bật bằng `SWAGGER_ENABLED=true`.
- Các nhóm API chính:
  - `/api/auth`
  - `/api/assets`
  - `/api/transfers`
  - `/api/inventory`
  - `/api/procurements`
  - `/api/maintenance`
  - `/api/asset-disposals`
  - `/api/stock`
  - `/api/reports`
  - `/api/departments`
  - `/api/users`
  - `/api/dashboard`
  - `/api/notifications`
  - `/api/system-admin`
  - `/api/public`, `/scan`

---

## 15. Xử lý sự cố thường gặp

### Đăng nhập bị đăng xuất sau deploy

- Access token chỉ nằm trong bộ nhớ; refresh token nằm trong cookie.
- Đăng xuất rồi đăng nhập lại sau khi đổi domain hoặc deploy bản mới.

### Không xem được ảnh/tài liệu trong `/storage`

- Các thư mục nội bộ yêu cầu đăng nhập và đúng quyền.
- Đăng nhập lại để nhận cookie storage mới.
- Ảnh tài sản công khai vẫn nằm dưới `/storage/assets/...`.

### QR cũ không tra cứu được

- Mặc định tem không token bị từ chối.
- Bật `QR_ALLOW_LEGACY_NO_TOKEN=true` nếu cần tương thích, hoặc tạo lại QR.

### Deploy báo thiếu biến môi trường

- Kiểm tra `.env` có `DB_PASSWORD`, `JWT_SECRET`, `DEFAULT_PASSWORD`, `CORS_ORIGIN`, `FRONTEND_URL`.
- Thiếu biến, compose sẽ dừng để tránh cấu hình yếu.

### Giao diện còn bản cũ

- Hard refresh `Ctrl + Shift + R`.
- Gỡ service worker: DevTools → Application → Service Workers → Unregister.
- Clear site data rồi tải lại.

### Backend không kết nối database/redis

```bash
docker compose -f docker-compose.prod.yml logs postgres redis backend
```

Kiểm tra `DB_PASSWORD`, `REDIS_URL`, volume và healthcheck.

---

## 16. Giấy phép và liên hệ

- Mã nguồn phục vụ nội bộ Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ.
- Báo lỗi/góp ý: [GitHub Issues](https://github.com/ththuan/quanlytaisan2026/issues).
