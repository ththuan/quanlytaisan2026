# Asset Management System - Frontend

Giao diện quản lý tài sản, xây dựng bằng Vue 3 + TypeScript + Element Plus.

- **Backend API**: `asset-management-backend`
- **Domain production**: `https://quanlytaisanctec.io.vn`
- **Tài liệu triển khai đầy đủ**: xem `README.md` ở thư mục gốc repo.

## Công nghệ

- Vue 3, TypeScript, Vite
- Element Plus
- Pinia
- Vue Router
- Vue I18n
- ECharts + vue-echarts
- ExcelJS
- html5-qrcode
- Playwright (E2E)

## Yêu cầu

- Node.js >= 18 (khuyến nghị 20/22)
- npm >= 9

## Cài đặt và chạy development

```bash
cd asset-management-frontend
npm install
cp .env.example .env
npm run dev
```

Mặc định Vite chạy tại `http://localhost:4000`. Có thể bật HTTPS cho development:

```bash
npm run dev:https
```

## Scripts

| Script | Mục đích |
|---|---|
| `npm run dev` | Chạy Vite development |
| `npm run dev:https` | Chạy development với HTTPS tự ký |
| `npm run build` | Build production |
| `npm run preview` | Xem thử bản build |
| `npm run typecheck` | Kiểm tra TypeScript bằng vue-tsc |
| `npm run lint` | ESLint + tự sửa |
| `npm run lint:ci` | ESLint không sửa, fail nếu có warning |
| `npm run test:e2e` | Build + Playwright E2E (mock API) |
| `npm run test:e2e:ui` | Playwright UI mode |
| `npm run format` | Prettier |

## Tính năng giao diện

- Đăng nhập, phân quyền theo vai trò, 2FA, đổi mật khẩu.
- Dashboard thống kê, biểu đồ, audit log gần đây.
- Quản lý tài sản, danh mục, đơn vị, người dùng, định mức, kho vật tư.
- Điều chuyển, kiểm kê, mua sắm, sửa chữa, thanh lý.
- Báo cáo, import/export Excel.
- Tra cứu QR công khai.
- Thông báo trong hệ thống và Web Push.
- PWA: cài như ứng dụng, có cơ chế cập nhật phiên bản.

## Trải nghiệm mobile/tablet/PWA

- Bottom sheet cho dialog trên điện thoại, có tay nắm và kéo xuống để đóng.
- Tabbar native: pill active, chạm lại tab để về đầu, khôi phục vị trí cuộn.
- iPad dùng form-sheet căn giữa và tabbar nổi kiểu iPadOS.
- Ẩn tabbar khi bàn phím ảo mở.
- Safe area tai thỏ/home indicator, header chất liệu mờ.
- `el-descriptions` trên điện thoại xếp label trên / giá trị dưới, không tràn ngang.
- Footer dialog tự xuống dòng: nút phụ 2 cột, nút chính full width.
- Một accent xanh duy nhất, bỏ emoji khỏi chrome, tôn trọng `prefers-reduced-motion`.

## Kiểm thử

```bash
npm run typecheck
npm run lint:ci
npm run build
npm run test:e2e
```

E2E dùng mock API, không cần backend/DB. Bộ test hiện có 15 test, gồm desktop smoke, mobile native và tablet.

## Ghi chú triển khai

- Frontend production được serve bởi nginx trong Docker Compose.
- Domain/HTTPS và Cloudflare Tunnel được cấu hình ở hạ tầng, xem `README.md` mục 8.
- Sau khi đổi domain, người dùng cần gỡ PWA cũ và cài lại từ domain mới.
