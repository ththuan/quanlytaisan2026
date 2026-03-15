# Asset Management System - Backend API

Backend API cho hệ thống Quản lý Tài sản, được xây dựng với Node.js, Express và PostgreSQL.

## 🚀 Công Nghệ Sử Dụng

- **Runtime**: Node.js 18+ LTS
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 12+
- **ORM**: Sequelize
- **Authentication**: JWT + bcrypt
- **Validation**: Joi
- **Logging**: Winston
- **Testing**: Jest + Supertest

## 📋 Yêu Cầu Hệ Thống

- Node.js >= 18.0.0
- PostgreSQL >= 12
- npm >= 9.0.0

## ⚙️ Cài Đặt

1. **Clone repository và cài đặt dependencies:**

```bash
cd asset-management-backend
npm install
```

2. **Cấu hình môi trường:**

```bash
cp .env.example .env
# Chỉnh sửa file .env với thông tin cấu hình của bạn
```

3. **Tạo database PostgreSQL:**

```bash
createdb asset_management
```

4. **Chạy migrations:**

```bash
npm run migrate
```

5. **Seed dữ liệu mẫu (optional):**

```bash
npm run seed
```

## 🏃 Chạy Ứng Dụng

### Development Mode
```bash
npm run dev
```

### Production Build
```bash
npm run build
npm start
```

### Run Tests
```bash
npm test
```

### Run Tests with Watch Mode
```bash
npm run test:watch
```

## 📁 Cấu Trúc Thư Mục

```
src/
├── config/          # Cấu hình database, JWT, bcrypt
├── controllers/     # Request handlers
├── services/        # Business logic
├── models/          # Database models
├── middleware/      # Express middleware
├── routes/          # API routes
├── utils/           # Utility functions
├── migrations/      # Database migrations
├── app.ts           # Express app setup
└── server.ts        # Entry point
```

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - Đăng ký người dùng
- `POST /api/auth/login` - Đăng nhập
- `POST /api/auth/logout` - Đăng xuất
- `GET /api/auth/me` - Lấy thông tin user hiện tại
- `POST /api/auth/change-password` - Đổi mật khẩu

### Users
- `GET /api/users` - Danh sách người dùng
- `POST /api/users` - Tạo người dùng
- `GET /api/users/:id` - Chi tiết người dùng
- `PUT /api/users/:id` - Cập nhật người dùng
- `DELETE /api/users/:id` - Xóa người dùng

### Assets
- `GET /api/assets` - Danh sách tài sản
- `POST /api/assets` - Tạo tài sản
- `GET /api/assets/:id` - Chi tiết tài sản
- `PUT /api/assets/:id` - Cập nhật tài sản
- `DELETE /api/assets/:id` - Xóa tài sản
- `GET /api/assets/:id/history` - Lịch sử chuyển giao
- `POST /api/assets/import` - Import từ Excel
- `GET /api/assets/export` - Export ra Excel

### Transfers
- `GET /api/transfers` - Danh sách yêu cầu chuyển giao
- `POST /api/transfers` - Tạo yêu cầu chuyển giao
- `GET /api/transfers/:id` - Chi tiết chuyển giao
- `PUT /api/transfers/:id/approve` - Phê duyệt
- `PUT /api/transfers/:id/reject` - Từ chối

### Maintenance
- `GET /api/maintenance` - Danh sách yêu cầu bảo trì
- `POST /api/maintenance` - Tạo yêu cầu
- `GET /api/maintenance/:id` - Chi tiết yêu cầu
- `PUT /api/maintenance/:id` - Cập nhật yêu cầu
- `PUT /api/maintenance/:id/approve` - Phê duyệt

### Reports
- `GET /api/reports/annual` - Báo cáo hàng năm
- `POST /api/reports/annual` - Tạo báo cáo
- `GET /api/reports/statistics` - Thống kê
- `GET /api/reports/export` - Export báo cáo

## 🔒 Security Features

- Password hashing với bcrypt (10 rounds)
- JWT token authentication
- Rate limiting (100 requests/10 minutes)
- Helmet security headers
- CORS protection
- Input validation
- SQL injection prevention
- XSS protection
- Audit logging

## 📊 Database Schema

Xem chi tiết schema trong file `architecture_guide.md`

## 🧪 Testing

```bash
# Run all tests
npm test

# Run tests with coverage
npm test -- --coverage

# Run specific test file
npm test -- auth.test.ts
```

## 📝 Environment Variables

Xem file `.env.example` để biết danh sách đầy đủ các biến môi trường.

## 🚀 Deployment

### Using PM2

```bash
npm run build
pm2 start ecosystem.config.js
pm2 save
pm2 startup
```

### Using Docker

```bash
docker-compose up -d
```

## 📄 License

MIT

## 👥 Team

Asset Management Development Team - 2026
