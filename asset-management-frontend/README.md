# Asset Management System - Frontend

Frontend ứng dụng Quản lý Tài sản, được xây dựng với Vue.js 3, TypeScript, và Element Plus.

## 🚀 Công Nghệ Sử Dụng

- **Framework**: Vue.js 3
- **Language**: TypeScript
- **Build Tool**: Vite
- **State Management**: Pinia
- **UI Framework**: Element Plus
- **HTTP Client**: Axios
- **Router**: Vue Router

## 📋 Yêu Cầu Hệ Thống

- Node.js >= 18.0.0
- npm >= 9.0.0

## ⚙️ Cài Đặt

1. **Cài đặt dependencies:**

```bash
cd asset-management-frontend
npm install
```

2. **Cấu hình môi trường:**

```bash
cp .env.example .env
# Chỉnh sửa file .env với thông tin cấu hình của bạn
```

## 🏃 Chạy Ứng Dụng

### Development Mode
```bash
npm run dev
```

Ứng dụng sẽ chạy tại `http://localhost:3000`

### Production Build
```bash
npm run build
```

### Preview Production Build
```bash
npm run preview
```

## 📁 Cấu Trúc Thư Mục

```
src/
├── components/      # Reusable components
├── views/           # Page components
├── stores/          # Pinia stores
├── services/        # API services
├── router/          # Vue Router configuration
├── types/           # TypeScript interfaces
├── utils/           # Utility functions
├── styles/          # Global styles
├── App.vue          # Root component
└── main.ts          # Entry point
```

## 🔑 Features

- ✅ Authentication & Authorization
- ✅ Asset Management
- ✅ Responsive Design
- ✅ Dark Mode Support (Coming soon)
- ✅ Excel Export/Import (Coming soon)
- ✅ Real-time Updates (Coming soon)

## 📄 License

MIT

## 👥 Team

Asset Management Development Team - 2026
