/**
 * Tài khoản quản trị hệ thống.
 * Mật khẩu đọc từ env ADMIN_PASSWORD (hoặc SYSTEM_ADMIN_PASSWORD).
 * Production bắt buộc đặt mật khẩu mạnh — không dùng mặc định.
 */
const rawPassword =
  process.env.ADMIN_PASSWORD ||
  process.env.SYSTEM_ADMIN_PASSWORD ||
  'Admin@123';

if (process.env.NODE_ENV === 'production' && rawPassword === 'Admin@123') {
  throw new Error(
    '⚠️  ADMIN_PASSWORD phải được đặt (mật khẩu mạnh) trong môi trường production. ' +
    'Không dùng mật khẩu mặc định Admin@123.'
  );
}

export const SYSTEM_ADMIN_USERNAME = 'admin' as const;
export const SYSTEM_ADMIN_PASSWORD = rawPassword as string;
