# Hệ thống Quản lý Tài sản

[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14-blue.svg)](https://www.postgresql.org/)
[![Vue](https://img.shields.io/badge/vue-3-42b883.svg)](https://vuejs.org/)

Phần mềm quản lý tài sản dùng cho Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ, hỗ trợ quản lý tài sản theo đơn vị, danh mục, quy trình điều chuyển - kiểm kê - mua sắm - sửa chữa - thanh lý, tra cứu QR công khai và báo cáo phục vụ quản trị nội bộ.

- **Repository**: [github.com/ththuan/quanlytaisan2026](https://github.com/ththuan/quanlytaisan2026)
- **Domain production**: `https://quanlytaisanctec.io.vn`
- **Domain cũ (legacy)**: `https://quanlytaisanctec.dpdns.org` — chỉ dùng để redirect cho tem QR đã in.

> Tài liệu này là nguồn chuẩn cho việc cài đặt, triển khai trên Linux, cấu hình tên miền, vận hành và xử lý sự cố. Khi thay đổi hạ tầng hoặc domain, cập nhật lại README cùng lúc với `.env` trên server.

---

## 1. Tổng quan

Hệ thống gồm 3 phần chính:

- **Backend API**: Node.js + Express + TypeScript + Sequelize + PostgreSQL + Redis.
- **Frontend**: Vue 3 + TypeScript + Element Plus + Pinia + Vite + ECharts.
- **Hạ tầng**: Docker Compose + nginx + Cloudflare Tunnel (khuyến nghị), có thể chạy trực tiếp bằng DNS + Let's Encrypt.

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
- In phiếu/biên bản liên quan.
- Nhãn trạng thái, mức ưu tiên và trạng thái tài sản được chuẩn hóa tiếng Việt qua một nguồn chung (`src/utils/maintenanceLabels.ts`), tránh lọt mã trạng thái tiếng Anh ra giao diện.

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
- URL QR được sinh từ `FRONTEND_URL` tại thời điểm tạo QR; đổi domain cần đọc mục 8.4 và mục 10.

### 2.13 Trải nghiệm native trên mobile/tablet/PWA

Các cải tiến giao diện theo chuẩn native app (áp dụng khi `html.app-overlay`, tức mobile/tablet/PWA):

- Bottom sheet cho dialog trên điện thoại: tay nắm, kéo xuống để đóng, tôn trọng `before-close`, footer 44px + safe area.
- iPad dùng form-sheet căn giữa, form một cột, không tràn ngang.
- Tabbar native: pill active, `aria-current`, chạm lại tab để về đầu, khôi phục vị trí cuộn theo route.
- iPad dùng tabbar nổi kiểu iPadOS thay vì kéo dài hết chiều ngang.
- Tabbar tự ẩn khi bàn phím ảo mở (VisualViewport), trả lại diện tích nội dung.
- Header dùng chất liệu mờ, hairline border, safe area tai thỏ/home indicator.
- Nút back chỉ hiện ở màn hình con, không hiện ở tab gốc; back an toàn khi không có history.
- `el-descriptions` trên điện thoại chuyển thành label ở trên, giá trị ở dưới; không còn tràn ngang.
- Footer dialog tự xuống dòng: nút phụ 2 cột, nút chính full width.
- Một accent xanh duy nhất cho mobile/tablet; nút hành động phụ trong page header dùng neutral.
- Bỏ emoji khỏi menu/nút; dùng icon Element Plus.
- Chặn zoom iOS khi focus input, ẩn scrollbar web trên thiết bị cảm ứng, tôn trọng `prefers-reduced-motion`.
- Prompt cài PWA nằm trên tabbar, không đè điều hướng.

### 2.14 PWA và thông báo

- PWA: cài như ứng dụng, có cơ chế cập nhật phiên bản.
- Web Push khi app đóng; VAPID key lưu trong `storage/vapid-keys.json`.
- Thông báo trong hệ thống (notification bell).
- Sau khi đổi domain, người dùng cần cài lại PWA và bật lại thông báo đẩy.

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
| Giao diện động | CSS transitions, composables, tôn trọng reduced motion |
| Hạ tầng | Docker, Docker Compose, nginx, Cloudflare Tunnel (khuyến nghị) |
| CI | GitHub Actions (chạy thủ công) |

Luồng cơ bản:

```text
Trình duyệt / điện thoại
        |
        | HTTPS (Cloudflare edge)
        v
Cloudflare Tunnel (cloudflared)
        |
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

Với DNS trực tiếp (không Tunnel), thay lớp Cloudflare bằng DNS A record + Let's Encrypt; xem mục 8.3 phương án B.

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
│   ├── e2e/
│   │   ├── smoke.spec.ts
│   │   └── mobile-native.spec.ts
│   ├── src/
│   │   ├── components/      # layout, dialog, animate components
│   │   ├── composables/     # useMobileSheetDrag, useVisualKeyboard
│   │   ├── directives/      # stagger, tilt, ripple, reveal, tabs
│   │   ├── i18n/
│   │   ├── router/
│   │   ├── services/
│   │   ├── stores/
│   │   ├── styles/          # responsive, page-layout, native-mobile...
│   │   ├── types/
│   │   ├── utils/           # gồm maintenanceLabels.ts
│   │   └── views/
│   └── Dockerfile
├── nginx/
│   ├── nginx.conf
│   └── nginx.dev.conf
├── scripts/
├── .github/workflows/
│   └── ci.yml
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

- Debian 12/13 hoặc Ubuntu 22.04/24.04.
- Docker Engine 24+ và Docker Compose plugin.
- PostgreSQL 14 (container).
- Redis 7 (container).
- 2 GB RAM trở lên cho server nhỏ; 4 GB khuyến nghị.
- Domain đã trỏ về hệ thống.
- Nếu dùng Cloudflare Tunnel: tài khoản Cloudflare và domain nằm trong cùng tài khoản.
- Nếu dùng DNS trực tiếp: server có IP public, mở được port 80/443 (hoặc NAT forward).

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

Các biến quan trọng trong `.env` (root repo, Docker Compose đọc tự động):

| Biến | Mô tả | Ghi chú |
|---|---|---|
| `DB_USER`, `DB_PASSWORD`, `DB_NAME`, `DB_PORT` | Kết nối PostgreSQL | Production bắt buộc mật khẩu mạnh |
| `JWT_SECRET` | Khóa ký JWT | Bắt buộc >= 32 ký tự, không dùng placeholder |
| `JWT_ACCESS_EXPIRATION` | Thời hạn access token | Mặc định `1h` |
| `JWT_REFRESH_EXPIRATION` | Thời hạn refresh token | Mặc định `30d` |
| `DEFAULT_PASSWORD` | Mật khẩu khi tạo/import user | Production bắt buộc, không dùng `Ctec@123` |
| `ADMIN_USERNAME` | Username admin khởi tạo | Mặc định `admin` |
| `ADMIN_PASSWORD` | Mật khẩu admin khởi tạo | Production bắt buộc mạnh; chỉ dùng khi tạo admin lần đầu |
| `CORS_ORIGIN` | Origin frontend được phép gọi API | Có thể nhiều origin, phân tách bằng dấu phẩy. Production bắt buộc domain cụ thể |
| `FRONTEND_URL` | URL frontend | Dùng cho CORS và **sinh URL QR** |
| `ALLOW_PUBLIC_REGISTRATION` | Cho phép tự đăng ký | Mặc định `false` |
| `QR_REQUIRE_SIGNATURE` | Bắt buộc token QR hợp lệ | Mặc định `true` |
| `QR_ALLOW_LEGACY_NO_TOKEN` | Cho phép tem QR cũ không token | Mặc định `false` |
| `PUBLIC_SCAN_RATE_LIMIT_*` | Giới hạn tra cứu QR công khai | Mặc định 60/phút/IP |
| `SWAGGER_ENABLED` | Bật Swagger trong production | Mặc định `false` |
| `BODY_LIMIT` | Giới hạn body request | Mặc định `10mb` |
| `REDIS_URL` | Kết nối Redis | Mặc định `redis://redis:6379` trong Docker |
| `CF_TUNNEL_TOKEN` | Token Cloudflare Tunnel | Chỉ dùng khi public qua Cloudflare |
| `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY` | Web Push | Để trống: backend tự sinh và lưu `storage/vapid-keys.json` |
| `VAPID_SUBJECT` | Liên hệ Web Push | VD `mailto:admin@quanlytaisanctec.io.vn` |
| `VITE_API_BASE_URL` | URL API frontend gọi | Mặc định `/api` |

Ví dụ production:

```env
NODE_ENV=production
DB_PASSWORD=<mật-khẩu-mạnh>
JWT_SECRET=<chuỗi-ngẫu-nhiên->=32-ký-tự>
DEFAULT_PASSWORD=<mật-khẩu-mạnh>
ADMIN_PASSWORD=<mật-khẩu-admin-mạnh>

CORS_ORIGIN=https://quanlytaisanctec.io.vn
FRONTEND_URL=https://quanlytaisanctec.io.vn
VAPID_SUBJECT=mailto:admin@quanlytaisanctec.io.vn

CF_TUNNEL_TOKEN=<token-cloudflare-tunnel>
```

Tạo secret:

```bash
node scripts/generate-secrets.js
```

Production bắt buộc kiểm tra:

```bash
grep -E '^(DB_PASSWORD|JWT_SECRET|DEFAULT_PASSWORD|CORS_ORIGIN|FRONTEND_URL)=' .env
```

Thiếu các biến này, `docker-compose.prod.yml` sẽ dừng ngay để tránh chạy với cấu hình yếu.

> **Lưu ý:** Nếu `docker compose` báo `required variable JWT_SECRET is missing`, nghĩa là `.env` đang thiếu biến đó. Có thể lấy lại từ container backend đang chạy:
> ```bash
> docker exec asset-management-backend printenv JWT_SECRET
> ```
> rồi thêm lại vào `.env` bằng `nano`.

---

## 8. Triển khai production trên Debian/Linux

### 8.1 Chuẩn bị server

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y git curl openssl ca-certificates
# Cài Docker Engine + Docker Compose plugin theo hướng dẫn chính thức của Docker
sudo systemctl enable --now docker
```

Khuyến nghị tạo user riêng:

```bash
sudo adduser deploy
sudo usermod -aG docker deploy
```

### 8.2 Cài lần đầu

Có thể dùng `setup.sh`:

```bash
git clone https://github.com/ththuan/quanlytaisan2026.git
cd quanlytaisan2026
sudo bash setup.sh
```

`setup.sh` sẽ:

- Cài Docker/Compose nếu cần.
- Tạo `.env` với secret ngẫu nhiên.
- Tạo volume PostgreSQL/Redis/backup.
- Sinh SSL self-signed cho nginx (đủ dùng khi đi qua Cloudflare Tunnel).
- Khởi động hệ thống.

Nên đọc script trước khi chạy bằng quyền root.

Có thể ghi đè cấu hình:

```bash
sudo DOMAIN=quanlytaisanctec.io.vn \
     ADMIN_PASSWORD='mat-khau-manh' \
     CF_TUNNEL_TOKEN='<token>' \
     APP_DIR=/opt/quanlytaisan2026 \
     bash setup.sh
```

Sau khi cài:

```bash
docker compose -f docker-compose.prod.yml ps
curl -I http://localhost
```

### 8.3 Cấu hình tên miền

Có 2 phương án. **Khuyến nghị dùng Cloudflare Tunnel** vì không cần mở port, không cần certbot, HTTPS do Cloudflare quản lý.

#### Phương án A — Cloudflare Tunnel (khuyến nghị, đang dùng)

**A1. Thêm domain vào Cloudflare**

1. Vào cùng tài khoản Cloudflare đang chứa domain cũ → **Add a site** → `quanlytaisanctec.io.vn`.
2. Cloudflare quét và import các bản ghi DNS hiện có. Kiểm tra lại, đặc biệt MX/TXT nếu domain dùng email.
3. Ghi lại 2 nameserver Cloudflare cấp.

**A2. Đổi nameserver tại PAVietnam**

1. Đăng nhập `https://access.pavietnam.vn/` hoặc `https://access.dotvndns.vn/` bằng tên miền + mật khẩu tên miền.
2. Chọn domain → **THAY ĐỔI DNS**.
3. Với tên miền `.vn`, PAVietnam thường yêu cầu nhập **cả tên nameserver và IP**:

   | Ô | Nameserver | IP |
   |---|---|---|
   | DNS 1 | `chloe.ns.cloudflare.com` | `108.162.192.85` |
   | DNS 2 | `ricardo.ns.cloudflare.com` | `108.162.195.211` |

   Đây là ví dụ. Dùng đúng cặp nameserver Cloudflare cấp cho domain của bạn và tra IP hiện tại:

   ```bash
   nslookup chloe.ns.cloudflare.com 1.1.1.1
   nslookup ricardo.ns.cloudflare.com 1.1.1.1
   ```

   Có thể dùng bất kỳ IP anycast nào trả về. **Không điền IP server của bạn** vào ô IP nameserver.

4. Bấm **LƯU CẤU HÌNH**. Với `.vn`, thời gian có hiệu lực có thể tới 24 giờ.

5. Kiểm tra:

   ```bash
   nslookup -type=NS quanlytaisanctec.io.vn 1.1.1.1
   ```

   Kết quả phải là `*.ns.cloudflare.com`. Cloudflare sẽ chuyển site sang **Active**.

**A3. Dọn bản ghi DNS cũ**

Trong Cloudflare DNS, xóa bản ghi **A `@`** và **A `www`** đang trỏ về IP server cũ (nếu có), để tránh tranh chấp với CNAME của Tunnel.

**A4. Tạo hoặc dùng lại Tunnel**

Vị trí hiện tại (2026): **Cloudflare Dashboard → Networking → Tunnels**.

Đường dẫn nhanh:

```text
https://dash.cloudflare.com/?to=/:account/networks/tunnels
```

Hoặc Cloudflare One: **Zero Trust → Networks → Connectors → Cloudflare Tunnels**.

- Nếu đã có tunnel cũ: mở tunnel → tab **Routes** (hoặc Public Hostname) → thêm route:

  | Trường | Giá trị |
  |---|---|
  | Subdomain | để trống |
  | Domain | `quanlytaisanctec.io.vn` |
  | Path | để trống |
  | Service | `HTTP` → `nginx:80` |

- Nếu tạo tunnel mới: **Create a tunnel → Cloudflared**, đặt tên, lấy token ở bước cài connector.

**A5. Cấu hình `.env` trên server**

```bash
cd /root/quanlytaisan2026
nano .env
```

```env
CORS_ORIGIN=https://quanlytaisanctec.io.vn
FRONTEND_URL=https://quanlytaisanctec.io.vn
VAPID_SUBJECT=mailto:admin@quanlytaisanctec.io.vn
CF_TUNNEL_TOKEN=<token-cua-tunnel>
```

Nếu đang chuyển tiếp từ domain cũ, có thể giữ cả hai origin trong `CORS_ORIGIN`:

```env
CORS_ORIGIN=https://quanlytaisanctec.io.vn,https://quanlytaisanctec.dpdns.org
```

Áp dụng:

```bash
docker compose -f docker-compose.prod.yml up -d --force-recreate backend
```

**A6. Chạy cloudflared**

```bash
docker compose -f docker-compose.prod.yml --profile cloudflare up -d
docker logs -f asset-management-cloudflared
```

Log đúng phải có:

```text
Starting tunnel tunnelID=<tunnel-id>
Registered tunnel connection
```

Trong dashboard, tunnel phải **Healthy**, có route `quanlytaisanctec.io.vn`.

Kiểm tra cloudflared và nginx cùng network:

```bash
docker network inspect asset-management-network --format '{{range .Containers}}{{.Name}} {{end}}'
```

**A7. Kiểm tra**

```bash
curl -I https://quanlytaisanctec.io.vn
curl -s https://quanlytaisanctec.io.vn/api/health
```

Kết quả HTTPS phải có `server: cloudflare`, chứng chỉ do Cloudflare/Let's Encrypt cấp, không còn self-signed.

**A8. Redirect domain cũ cho tem QR**

Tem QR đã in chứa domain cũ. Trong Cloudflare của domain cũ, tạo **Redirect Rule 301** sang domain mới, giữ path + query string:

```text
concat("https://quanlytaisanctec.io.vn", http.request.uri.path)
```

Bật **Preserve query string** để giữ `?t=<token>`.

#### Phương án B — DNS trực tiếp + Let's Encrypt (không Cloudflare)

Chỉ dùng khi server có IP public và mở được 80/443. Nếu server nằm sau NAT không forward được, phương án này không hoạt động.

1. Tạo bản ghi tại nhà đăng ký:

   | Type | Name | Value |
   |---|---|---|
   | A | `@` | IP public của server |
   | A | `www` | IP public của server (hoặc CNAME `www` → `@`) |

2. Mở firewall/router: port 80 và 443 → server.
3. Tắt Tunnel nếu đang chạy:

   ```bash
   docker rm -f asset-management-cloudflared
   ```

4. Cấp chứng chỉ Let's Encrypt:

   ```bash
   cd /root/quanlytaisan2026
   docker compose -f docker-compose.prod.yml stop nginx

   sudo apt update && sudo apt install -y certbot
   sudo certbot certonly --standalone --agree-tos --no-eff-email \
     -m admin@quanlytaisanctec.io.vn \
     -d quanlytaisanctec.io.vn

   sudo cp /etc/letsencrypt/live/quanlytaisanctec.io.vn/fullchain.pem nginx/ssl/server.crt
   sudo cp /etc/letsencrypt/live/quanlytaisanctec.io.vn/privkey.pem nginx/ssl/server.key
   sudo chmod 600 nginx/ssl/server.key

   docker compose -f docker-compose.prod.yml up -d nginx
   ```

5. Nếu `certbot --standalone` báo `Timeout during connect` dù domain truy cập được từ ngoài:

   - Kiểm tra firewall host (Debian mặc định có thể không có `ufw`; kiểm tra `nft`/`iptables`).
   - Hoặc dùng DNS-01:

     ```bash
     sudo certbot certonly --manual --preferred-challenges dns \
       --agree-tos --no-eff-email \
       -m admin@quanlytaisanctec.io.vn \
       -d quanlytaisanctec.io.vn
     ```

     Thêm TXT `_acme-challenge.quanlytaisanctec.io.vn` tại nhà đăng ký, kiểm tra:

     ```bash
     nslookup -type=TXT _acme-challenge.quanlytaisanctec.io.vn 1.1.1.1
     ```

     Chỉ nhấn Enter sau khi thấy TXT. Sau khi cấp cert, copy như bước 4.

   - Để tự gia hạn ổn định, dùng webroot (nginx đang chạy) thay vì standalone.

6. Cập nhật `.env` và recreate backend như phương án A.

> Với Tunnel, **không cần certbot cho domain**. Nginx vẫn dùng self-signed ở origin, nhưng Cloudflare kết nối vào `http://nginx:80` qua tunnel nên trình duyệt chỉ thấy cert của Cloudflare.

### 8.4 Checklist khi đổi tên miền

- [ ] Thêm domain vào Cloudflare (hoặc tạo A record nếu DNS trực tiếp)
- [ ] Đổi nameserver tại nhà đăng ký, chờ Active
- [ ] Xóa A record cũ trỏ về IP server trong Cloudflare (nếu dùng Tunnel)
- [ ] Thêm Public Hostname/Route cho domain mới → `http://nginx:80`
- [ ] Cập nhật `CORS_ORIGIN` (có thể giữ domain cũ trong giai đoạn chuyển)
- [ ] Cập nhật `FRONTEND_URL` để QR mới sinh đúng domain
- [ ] Cập nhật `VAPID_SUBJECT`
- [ ] Recreate backend
- [ ] Kiểm tra `/api/health`, đăng nhập, quét QR
- [ ] Người dùng đăng nhập lại (cookie gắn domain)
- [ ] Gỡ PWA cũ, cài lại từ domain mới
- [ ] Bật lại thông báo đẩy
- [ ] Tạo redirect domain cũ → domain mới cho tem QR cũ
- [ ] Nếu muốn QR mới trỏ domain mới: regenerate QR `force=true` và in lại tem

### 8.5 Deploy khi có code mới

Thủ công:

```bash
cd /root/quanlytaisan2026
./deploy.sh
```

Nếu đặt repo ở đường dẫn khác:

```bash
REPO_PATH=/opt/quanlytaisan2026 ./deploy.sh
```

`deploy.sh` sẽ:

- `git fetch` + `git reset --hard origin/main`
- Build backend/frontend
- Recreate backend, frontend, nginx
- Chờ backend healthy, restart nginx

`deploy.sh` **không** quản lý container `cloudflared`. Nếu dùng Tunnel, container này được tạo một lần bằng:

```bash
docker compose -f docker-compose.prod.yml --profile cloudflare up -d
```

và tự chạy lại nhờ `restart: unless-stopped`. Nếu cần tạo lại sau khi đổi token:

```bash
docker compose -f docker-compose.prod.yml --profile cloudflare up -d --force-recreate cloudflared
```

### 8.6 Vận hành Cloudflare Tunnel

- Xem tunnel: **Networking → Tunnels** (dashboard chính) hoặc **Zero Trust → Networks → Connectors**.
- Chỉ nên có **một** connector cho mỗi tunnel. Nếu có nhiều container cloudflared (do trước đó chạy `docker run` thủ công), xóa bớt:

  ```bash
  docker ps -a --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}\t{{.Status}}' | grep -i cloudflared
  docker rm -f <container-thu-cong>
  ```

- Token trong `.env` phải thuộc đúng tunnel. Kiểm tra log:

  ```bash
  docker logs --tail=100 asset-management-cloudflared
  ```

  Nếu thấy `Unauthorized: Tunnel not found`, token đang trỏ tới tunnel đã xóa hoặc sai tài khoản. Lấy token mới từ tunnel Healthy → **Install connector** → cập nhật `.env` → recreate.

- Service trong Route phải là `http://nginx:80` (không phải `localhost`, không phải IP server, không phải `https`).

### 8.7 Backup, restore và chuyển server

Backup database:

```bash
docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_dump -U postgres -d asset_management -Fc > /tmp/quanlytaisan.dump
```

Backup thêm:

- `.env`
- `nginx/ssl/`
- `asset-management-backend/storage/`
- `asset-management-backend/logs/` (nếu cần)
- `backups/` (nếu có)

Restore:

```bash
cat /tmp/quanlytaisan.dump | docker compose -f docker-compose.prod.yml exec -T postgres \
  pg_restore -U postgres -d asset_management --clean --if-exists
```

Chuyển server mới:

1. Cài Docker + Compose.
2. Clone repo.
3. Copy `.env`, `nginx/ssl/`, `asset-management-backend/storage/`.
4. Restore database.
5. `docker compose -f docker-compose.prod.yml up -d --build`
6. Cập nhật DNS/Cloudflare Tunnel sang IP/server mới.
7. Chạy checklist mục 8.4 nếu domain thay đổi.

### 8.8 Reset dữ liệu nghiệp vụ

Chỉ dùng khi thật sự cần:

```bash
docker compose -f docker-compose.prod.yml exec backend npm run reset:business
```

---

## 9. Database, migration và tài khoản admin

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

---

## 10. QR code và tra cứu công khai

- QR chứa URL `/scan/<MÃ>?t=<token>`.
- Token được lưu cùng QR trong DB, không phụ thuộc JWT secret.
- Tạo lại QR khi cần đổi token hoặc in lại tem.
- Trang công khai chỉ hiển thị thông tin nhận diện cơ bản, không có giá trị tài chính.
- `QR_REQUIRE_SIGNATURE=true`: bắt buộc token hợp lệ.
- `QR_ALLOW_LEGACY_NO_TOKEN=false`: từ chối tem cũ không token.
- Nếu cần dùng tem cũ, bật tạm `QR_ALLOW_LEGACY_NO_TOKEN=true`, sau đó in lại QR mới.

### Đổi domain và QR cũ

URL QR được sinh từ `FRONTEND_URL` tại thời điểm tạo. Sau khi đổi domain:

- **Cách 1 (khuyến nghị):** giữ redirect domain cũ → domain mới, preserve path + query. Tem cũ vẫn hoạt động, không cần in lại.
- **Cách 2:** tạo lại QR hàng loạt với `force=true` rồi in lại toàn bộ tem. Tem cũ mất hiệu lực.

Ví dụ gọi API tạo lại QR (admin):

```bash
curl -X POST https://quanlytaisanctec.io.vn/api/assets/qrcode/generate-all \
  -H "Authorization: Bearer <access-token>" \
  -H "Content-Type: application/json" \
  -d '{"force": true}'
```

Sau đó dùng chức năng **In QR hàng loạt** để in tem mới.

---

## 11. PWA, Web Push và mobile

- PWA cài từ domain hiện tại; `manifest.start_url` là `/`.
- Đổi domain = đổi origin PWA:
  - Gỡ icon cũ trên màn hình chính.
  - Mở domain mới bằng Safari/Chrome.
  - **Thêm vào màn hình chính** lại.
- Service worker cache theo origin. Domain mới có cache riêng; domain cũ có thể vẫn cache bản cũ.
- Web Push subscription gắn với origin. Sau khi đổi domain, người dùng cần bật lại thông báo đẩy.
- Nếu giao diện còn bản cũ:
  - Hard refresh `Ctrl + Shift + R`.
  - DevTools → Application → Service Workers → Unregister.
  - Clear site data rồi tải lại.
- Trên iOS, camera/QR và PWA yêu cầu HTTPS.

---

## 12. Bảo mật

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
- CORS production chỉ cho phép origin cấu hình (hỗ trợ nhiều origin).
- Audit log, rate limit, validation bằng Joi.
- `docker.sock` không mount mặc định.
- Với Cloudflare Tunnel: không cần mở port 80/443 ra Internet; Edge TLS do Cloudflare quản lý.
- Với DNS trực tiếp: dùng Let's Encrypt, không dùng self-signed cho người dùng cuối.

Khuyến nghị trước khi đưa lên Internet:

1. Dùng HTTPS thật (Cloudflare hoặc Let's Encrypt), tránh truy cập HTTP trực tiếp.
2. Đặt `ADMIN_PASSWORD`, `DB_PASSWORD`, `JWT_SECRET`, `DEFAULT_PASSWORD` mạnh.
3. Đổi mật khẩu admin nếu vẫn dùng `Admin@123`.
4. Giới hạn firewall, chỉ mở cổng cần thiết.
5. Chạy GitHub runner bằng user riêng, không dùng root.
6. Sao lưu database và thư mục `storage` định kỳ.
7. Kiểm tra `npm audit` định kỳ.
8. Cân nhắc nâng Node.js lên bản còn hỗ trợ (20/22).
9. Không commit `.env`, token Cloudflare, VAPID private key.

---

## 13. Scripts

| Script | Mục đích |
|---|---|
| `setup.sh` | Cài đặt lần đầu trên server Debian |
| `deploy.sh` | Pull code mới và rebuild container |
| `scripts/setup-github-runner.sh` | Cài GitHub self-hosted runner (tùy chọn) |
| `scripts/fix-env-secrets.sh` | Kiểm tra/sửa secret yếu trong `.env` |
| `scripts/generate-secrets.js` | Sinh JWT_SECRET/DEFAULT_PASSWORD |
| `scripts/backup-db.ps1` | Sao lưu database (Windows) |
| `scripts/list-backups.ps1` | Liệt kê backup |
| `scripts/restore-db.ps1` | Khôi phục database |
| `scripts/reset-data.ps1` | Reset dữ liệu nghiệp vụ |
| `scripts/generate-ssl.ps1` | Sinh SSL tự ký cho development |
| `scripts/sync-push.*`, `scripts/sync-pull.*` | Đồng bộ code giữa nhiều máy |

---

## 14. Kiểm thử và chất lượng mã

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
npm run test:e2e        # build + Playwright smoke tests (mock API, không cần backend/DB)
```

E2E hiện có 15 test, gồm:

- Đăng nhập, phân quyền, tra cứu QR công khai, PWA/robots/404.
- Mobile: tabbar native, bottom sheet, drag-to-dismiss.
- Mobile: chi tiết sửa chữa không tràn ngang, trạng thái tiếng Việt.
- Tablet: tabbar nổi và form-sheet căn giữa.

CI: `.github/workflows/ci.yml` chạy thủ công (`workflow_dispatch`):

- Backend: lint → typecheck → test.
- Frontend: lint:ci → typecheck → build → Playwright E2E.
- Deploy production: chạy `./deploy.sh` trên server (không auto-deploy khi push).

---

## 15. API và tài liệu

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

Kiểm tra nhanh production:

```bash
curl -I https://quanlytaisanctec.io.vn
curl -s https://quanlytaisanctec.io.vn/api/health
```

---

## 16. Xử lý sự cố

### 16.1 Domain và DNS

**Domain chưa resolve / sai IP**

```bash
nslookup quanlytaisanctec.io.vn 1.1.1.1
nslookup -type=NS quanlytaisanctec.io.vn 1.1.1.1
```

- NS phải là `*.ns.cloudflare.com` nếu dùng Cloudflare.
- Nếu vẫn là `*.pavietnam.vn`, thay đổi nameserver chưa có hiệu lực; chờ thêm hoặc kiểm tra lại form PAVietnam.

**PAVietnam `.vn` yêu cầu IP nameserver**

- Điền IP của nameserver Cloudflare, **không phải IP server**.
- Tra IP:

  ```bash
  nslookup <ns-name>.ns.cloudflare.com 1.1.1.1
  ```

**Máy vẫn vào IP cũ / chứng chỉ cũ**

- DNS còn cache. Kiểm tra bằng DNS công cộng, dùng:

  ```bash
  curl -I --resolve quanlytaisanctec.io.vn:443:172.67.197.235 https://quanlytaisanctec.io.vn
  ```

- Trên điện thoại: bật/tắt Wi-Fi hoặc dùng 4G để kiểm tra; xóa cache DNS của router nếu cần.

**Lỗi CORS**

- `CORS_ORIGIN` phải khớp chính xác scheme + host, không có dấu `/` cuối.
- Nhiều origin phân tách bằng dấu phẩy.
- Sau khi sửa `.env`, phải recreate backend:

  ```bash
  docker compose -f docker-compose.prod.yml up -d --force-recreate backend
  ```

### 16.2 Cloudflare Tunnel

**`Unauthorized: Tunnel not found`**

- Token trong `.env` không thuộc tunnel đang tồn tại (hoặc đã bị xóa).
- Xem tunnel ID trong log `Starting tunnel tunnelID=...`, so với tunnel Healthy trên dashboard.
- Lấy token mới từ tunnel → **Install connector**, cập nhật `.env`, recreate:

  ```bash
  docker compose -f docker-compose.prod.yml --profile cloudflare up -d --force-recreate cloudflared
  docker logs -f asset-management-cloudflared
  ```

**502 Bad Gateway**

- Tunnel Healthy nhưng origin lỗi.
- Kiểm tra route:

  | Hostname | Service |
  |---|---|
  | `quanlytaisanctec.io.vn` | `http://nginx:80` |

- Sai `localhost` hoặc `https` → sửa thành `http://nginx:80`.
- Kiểm tra log:

  ```bash
  docker logs --tail=100 asset-management-cloudflared
  ```

  Nếu có `lookup nginx ... no such host`, cloudflared không cùng network với nginx. Chạy lại bằng compose, không dùng `docker run` thủ công:

  ```bash
  docker ps -a --format 'table {{.ID}}\t{{.Names}}\t{{.Image}}' | grep -i cloudflared
  docker rm -f <container-thu-cong>
  docker compose -f docker-compose.prod.yml --profile cloudflare up -d --force-recreate cloudflared
  docker network inspect asset-management-network --format '{{range .Containers}}{{.Name}} {{end}}'
  ```

- Kiểm tra nginx còn chạy:

  ```bash
  docker compose -f docker-compose.prod.yml ps
  docker logs --tail=50 asset-management-nginx
  ```

**Có nhiều connector cho cùng tunnel**

- Chỉ giữ container `asset-management-cloudflared`. Xóa container `docker run` thủ công.
- Token trong `.env` phải là token của tunnel đang Healthy.

### 16.3 Docker Compose

**`required variable JWT_SECRET is missing`**

`.env` thiếu biến. Lấy lại từ backend đang chạy:

```bash
docker exec asset-management-backend printenv JWT_SECRET
```

Thêm vào `.env` rồi chạy lại compose. Kiểm tra đủ các biến bắt buộc:

```bash
grep -E '^(DB_PASSWORD|JWT_SECRET|DEFAULT_PASSWORD|CORS_ORIGIN|FRONTEND_URL)=' .env
```

**Cảnh báo volume `quanlytaisan2026_backend_backups`**

Đây là volume cũ còn sót, không ảnh hưởng hoạt động. Sau khi đã backup, có thể xóa:

```bash
docker volume ls | grep backend_backups
docker volume rm quanlytaisan2026_backend_backups
```

**Backend không kết nối database/redis**

```bash
docker compose -f docker-compose.prod.yml logs postgres redis backend
```

Kiểm tra `DB_PASSWORD`, `REDIS_URL`, volume và healthcheck.

### 16.4 HTTPS / chứng chỉ

**HTTPS vẫn báo self-signed**

- Với Cloudflare Tunnel: bình thường nếu kiểm tra trực tiếp origin, vì Cloudflare kết nối `http://nginx:80`. Trình duyệt phải thấy cert Cloudflare khi truy cập domain qua Cloudflare.
- Với DNS trực tiếp: bạn chưa thay cert self-signed bằng Let's Encrypt. Làm theo mục 8.3 phương án B.

Kiểm tra cert domain:

```bash
echo | openssl s_client -connect quanlytaisanctec.io.vn:443 \
  -servername quanlytaisanctec.io.vn 2>/dev/null \
  | openssl x509 -noout -subject -issuer -dates
```

**Certbot HTTP-01 timeout**

- Let's Encrypt không vào được port 80. Kiểm tra firewall/NAT/ISP.
- Dùng DNS-01:

  ```bash
  sudo certbot certonly --manual --preferred-challenges dns \
    --agree-tos --no-eff-email \
    -m admin@quanlytaisanctec.io.vn \
    -d quanlytaisanctec.io.vn
  ```

  Thêm TXT `_acme-challenge.quanlytaisanctec.io.vn`, kiểm tra bằng `nslookup` trước khi nhấn Enter.

**Certbot báo NXDOMAIN TXT**

- Bản ghi TXT chưa được lưu hoặc lưu sai tên.
- Vào PAVietnam → **CẤU HÌNH** → thêm TXT:
  - Host: `_acme-challenge`
  - Type: `TXT`
  - Value: chuỗi certbot in ra
- Bấm **LƯU CẤU HÌNH**, kiểm tra:

  ```bash
  nslookup -type=TXT _acme-challenge.quanlytaisanctec.io.vn ns1.pavietnam.vn
  nslookup -type=TXT _acme-challenge.quanlytaisanctec.io.vn 1.1.1.1
  ```

  Chỉ nhấn Enter trong certbot khi đã thấy TXT.

### 16.5 QR, PWA và đăng nhập

**QR cũ không tra cứu được**

- Tem cũ chứa domain cũ. Tạo redirect domain cũ → domain mới (giữ path + query), hoặc tạo lại QR và in lại tem.
- Kiểm tra `QR_ALLOW_LEGACY_NO_TOKEN` nếu tem không có token.

**PWA vẫn mở bản cũ**

- Gỡ PWA cũ, xóa site data, mở domain mới, cài lại.
- Hard refresh trên desktop.

**Đăng nhập bị đăng xuất sau deploy/đổi domain**

- Access token chỉ nằm trong bộ nhớ; refresh token nằm trong cookie.
- Đổi domain = cookie cũ không dùng được. Đăng nhập lại.
- Nếu đổi `JWT_SECRET`, toàn bộ phiên cũ bị thu hồi.

**Không xem được ảnh/tài liệu trong `/storage`**

- Các thư mục nội bộ yêu cầu đăng nhập và đúng quyền.
- Đăng nhập lại để nhận cookie storage mới.
- Ảnh tài sản công khai vẫn nằm dưới `/storage/assets/...`.

---

## 17. Giấy phép và liên hệ

- Mã nguồn phục vụ nội bộ Trường Cao đẳng Kinh tế - Kỹ thuật Cần Thơ.
- Báo lỗi/góp ý: [GitHub Issues](https://github.com/ththuan/quanlytaisan2026/issues).
