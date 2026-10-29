/**
 * Tài khoản quản trị hệ thống khởi tạo.
 *
 * Không dùng mật khẩu cố định trong production. Mật khẩu ban đầu phải được
 * cung cấp qua biến môi trường ADMIN_PASSWORD (tối thiểu 12 ký tự, không nằm
 * trong danh sách mật khẩu yếu). Tài khoản admin đã tồn tại sẽ KHÔNG bị đặt
 * lại mật khẩu / tắt 2FA / mở khóa mỗi lần khởi động.
 */
const rawUsername = (process.env.ADMIN_USERNAME || 'admin').trim();
const rawPassword = (process.env.ADMIN_PASSWORD || '').trim();

const WEAK_ADMIN_PASSWORDS = new Set([
  'admin',
  'admin123',
  'admin@123',
  'ctec@123',
  'password',
  'changeme',
  'change_me',
  'change_me_strong_admin_password',
]);

export const SYSTEM_ADMIN_USERNAME = rawUsername || 'admin';

/** Mật khẩu cấu hình trong env (rỗng nếu chưa đặt). */
export const SYSTEM_ADMIN_PASSWORD = rawPassword;

export function isStrongAdminPassword(password: string): boolean {
  return (
    password.length >= 12 &&
    !WEAK_ADMIN_PASSWORDS.has(password.toLowerCase()) &&
    !/change[_-]?me/i.test(password)
  );
}

/** Mật khẩu dùng khi tạo admin lần đầu; production bắt buộc phải cấu hình. */
export function getBootstrapAdminPassword(): string {
  if (isStrongAdminPassword(rawPassword)) return rawPassword;

  if (process.env.NODE_ENV === 'production') {
    throw new Error(
      'ADMIN_PASSWORD phải được đặt thành mật khẩu mạnh (>= 12 ký tự, không phải mật khẩu mặc định) trước khi tạo tài khoản admin hệ thống.',
    );
  }

  // Chỉ dùng cho môi trường development.
  return 'Admin@123';
}
