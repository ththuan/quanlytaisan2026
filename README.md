# 🏢 Hệ thống Quản lý Tài sản

[![License](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![PostgreSQL](https://img.shields.io/badge/postgresql-14-blue.svg)](https://www.postgresql.org/)

Hệ thống quản lý tài sản chuyên nghiệp cho các tổ chức, trường học, doanh nghiệp.

## ✨ Tính năng chính

### 📦 Quản lý Tài sản
- ✅ Thêm, sửa, xóa tài sản
- ✅ Phân loại theo danh mục
- ✅ Quản lý theo phòng ban
- ✅ QR Code cho mỗi tài sản
- ✅ Theo dõi khấu hao
- ✅ Lịch sử thay đổi

### 🔄 Điều chuyển Tài sản
- ✅ Đề nghị điều chuyển
- ✅ Quy trình phê duyệt
- ✅ Lịch sử điều chuyển
- ✅ Thông báo real-time

### 🛠️ Sửa chữa & Bảo trì
- ✅ Đề nghị sửa chữa
- ✅ Theo dõi tiến độ
- ✅ Quản lý chi phí
- ✅ Lịch sử bảo trì

### 📋 Kiểm kê Tài sản
- ✅ Tạo đợt kiểm kê
- ✅ Quét QR Code
- ✅ Báo cáo chi tiết
- ✅ Quy trình phê duyệt
- ✅ Xuất báo cáo Excel

### 🗑️ Thanh lý Tài sản
- ✅ Đề nghị thanh lý
- ✅ Hồ sơ thanh lý
- ✅ Biên bản tiêu hủy
- ✅ Quy trình phê duyệt

### 🛒 Mua sắm & Cấp phát
- ✅ Đề nghị mua sắm
- ✅ Quản lý kho vật tư
- ✅ Cấp phát thiết bị
- ✅ Theo dõi ngân sách

### 📊 Báo cáo & Thống kê
- ✅ Dashboard tổng quan
- ✅ Báo cáo theo phòng ban
- ✅ Báo cáo theo danh mục
- ✅ Xuất Excel/PDF
- ✅ Charts và biểu đồ

### 👥 Quản lý Người dùng
- ✅ Phân quyền chi tiết (Admin, Director, Department Head, Staff)
- ✅ Xác thực 2 bước (TOTP)
- ✅ Audit logs
- ✅ Thông báo real-time

## 🛠️ Tech Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL 14
- **ORM**: Sequelize
- **Authentication**: JWT + TOTP
- **Testing**: Jest
- **Process Manager**: PM2

### Frontend
- **Framework**: Vue 3
- **UI Library**: Element Plus
- **State Management**: Pinia
- **Build Tool**: Vite
- **Language**: TypeScript
- **Charts**: ECharts
- **QR Scanner**: html5-qrcode
- **i18n**: Vue I18n

### DevOps
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Reverse Proxy**: Traefik
- **SSL/TLS**: Let's Encrypt
- **Process Manager**: PM2
- **Monitoring**: PM2, Docker Stats

## 🚀 Quick Start

### Option 1: Traefik + Docker with Free SSL (Recommended for Production) ⭐

**Perfect for:**
- ✅ Production deployment with HTTPS
- ✅ Automatic SSL certificate management
- ✅ Professional setup with domain name

**Requirements:**
- Real domain name (e.g., `quanlytaisan.vn`)
- Server with public IP
- Ports 80, 443 open to internet

**Quick Start:**
```bash
# 1. Copy environment file
cp .env.traefik.example .env

# 2. Edit configuration
nano .env
# Update DOMAIN, ACME_EMAIL, passwords

# 3. Run setup script
chmod +x scripts/setup-traefik.sh
./scripts/setup-traefik.sh

# 4. Access at https://your-domain.com
```

**Documentation:**
- 📖 [Traefik Quick Start](./TRAEFIK_QUICK_START.md) - 15 minutes setup
- 📖 [Traefik SSL Guide](./TRAEFIK_SSL_GUIDE.md) - Complete guide

### Option 2: Docker Compose (Simple Local/Internal)

### Prerequisites
- Node.js 18+
- PostgreSQL 14+
- npm hoặc yarn

### Installation

```bash
# Clone repository
git clone https://github.com/ththuan/quanlytaisan.git
cd quanlytaisan

# Setup environment
cp .env.example .env
# Edit .env với thông tin của bạn

# Install dependencies
cd asset-management-backend
npm install

cd ../asset-management-frontend
npm install

# Setup database
cd ../asset-management-backend
npm run migrate
npm run seed

# Start development
npm run dev # Backend

cd ../asset-management-frontend
npm run dev # Frontend
```

### Docker (Recommended)

```bash
# Clone repository
git clone https://github.com/ththuan/quanlytaisan.git
cd quanlytaisan

# Copy environment
cp .env.example .env

# Create Docker volume
docker volume create quanlytaisan_postgres_data

# Start all services
docker-compose up -d

# Check logs
docker-compose logs -f

# Access
# Frontend: http://localhost:3000
# Backend: http://localhost:5000
```

## 📚 Documentation

- 🚀 [DEPLOYMENT_SIMPLE.md](./DEPLOYMENT_SIMPLE.md) - Hướng dẫn triển khai đơn giản
- 📖 [DEPLOYMENT.md](./DEPLOYMENT.md) - Hướng dẫn deployment chi tiết
- 💻 [CLAUDE.md](./CLAUDE.md) - Hướng dẫn development
- 📋 [INVENTORY_LOGIC.md](./INVENTORY_LOGIC.md) - Logic kiểm kê
- 📱 [RESPONSIVE_GUIDE.md](./RESPONSIVE_GUIDE.md) - Responsive design
- 📊 [INVENTORY_REPORT_GUIDE.md](./INVENTORY_REPORT_GUIDE.md) - Báo cáo kiểm kê

## 🔐 Default Credentials

**Admin Account**:
- Username: `admin`
- Password: `admin123`

⚠️ **Quan trọng**: Đổi mật khẩu ngay sau khi đăng nhập lần đầu!

## 📊 Project Structure

```
quanlytaisan/
├── .github/
│   ├── workflows/          # GitHub Actions
│   └── dependabot.yml      # Dependency updates
├── asset-management-backend/
│   ├── src/
│   │   ├── controllers/    # Request handlers
│   │   ├── services/       # Business logic
│   │   ├── models/         # Database models
│   │   ├── routes/         # API routes
│   │   ├── middleware/     # Express middleware
│   │   └── config/         # Configuration
│   ├── tests/              # Jest tests
│   ├── Dockerfile          # Docker config
│   └── ecosystem.config.js # PM2 config
├── asset-management-frontend/
│   ├── src/
│   │   ├── views/          # Pages
│   │   ├── components/     # Vue components
│   │   ├── services/       # API services
│   │   ├── stores/         # Pinia stores
│   │   └── styles/         # Global styles
│   └── Dockerfile          # Docker config
├── k8s/                    # Kubernetes manifests
├── scripts/                # Deployment scripts
├── docker-compose.yml      # Docker Compose config
└── docs/                   # Documentation
```

## 🤝 Contributing

1. Fork repository
2. Create feature branch (`git checkout -b feature/amazing-feature`)
3. Commit changes (`git commit -m 'feat: add amazing feature'`)
4. Push to branch (`git push origin feature/amazing-feature`)
5. Create Pull Request

### Commit Convention

```
feat: Thêm tính năng mới
fix: Sửa bug
docs: Cập nhật documentation
style: Format code
refactor: Refactor code
test: Thêm tests
chore: Maintenance tasks
```

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 👥 Team

- **Project Manager**: Your Name
- **Lead Developer**: Your Name
- **DevOps Engineer**: Your Name

## 📞 Support

- 📧 Email: support@example.com
- 🐛 Issues: [GitHub Issues](https://github.com/ththuan/quanlytaisan/issues)
- 📖 Wiki: [GitHub Wiki](https://github.com/ththuan/quanlytaisan/wiki)

## 🙏 Acknowledgments

- [Element Plus](https://element-plus.org/) - UI Framework
- [Vue.js](https://vuejs.org/) - Frontend Framework
- [Express.js](https://expressjs.com/) - Backend Framework
- [PostgreSQL](https://www.postgresql.org/) - Database

---

**Version**: 1.0.0  
**Last Updated**: 2026-03-15  
**Repository**: [github.com/ththuan/quanlytaisan](https://github.com/ththuan/quanlytaisan)  
**Status**: Production Ready ✅
