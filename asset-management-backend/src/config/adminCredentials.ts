/**
 * Tài khoản quản trị hệ thống.
 * Mật khẩu CỐ ĐỊNH là Admin@123 và luôn được đặt lại mỗi lần khởi động
 * (xem ensureDefaultAdminAccount). Không phụ thuộc env để tránh mất quyền truy cập.
 */
export const SYSTEM_ADMIN_USERNAME = 'admin' as const;
export const SYSTEM_ADMIN_PASSWORD = 'Admin@123' as const;
