/**
 * Tài khoản quản trị hệ thống — luôn cố định (kể cả sau reset dữ liệu nghiệp vụ).
 * Không đọc từ .env để tránh lệch với mật khẩu đang dùng khi reset.
 */
export const SYSTEM_ADMIN_USERNAME = 'admin' as const;
export const SYSTEM_ADMIN_PASSWORD = 'Admin@123' as const;
