import bcrypt from 'bcryptjs';
import bcryptConfig from '../config/bcrypt';
import { SYSTEM_ADMIN_PASSWORD, SYSTEM_ADMIN_USERNAME } from '../config/adminCredentials';
import User from '../models/User';

/**
 * Đặt lại mật khẩu admin về SYSTEM_ADMIN_PASSWORD, bật tài khoản, gỡ 2FA.
 * Nếu chưa có user admin thì tạo mới.
 */
export async function ensureDefaultAdminAccount(): Promise<void> {
  const hash = await bcrypt.hash(SYSTEM_ADMIN_PASSWORD, bcryptConfig.saltRounds);
  const existing = await User.findOne({ where: { username: SYSTEM_ADMIN_USERNAME } });

  if (existing) {
    await existing.update({
      password_hash: hash,
      is_active: true,
      role: 'admin',
      department_id: null,
      totp_enabled: false,
      totp_secret: null,
    });
    return;
  }

  await User.create({
    username: SYSTEM_ADMIN_USERNAME,
    email: 'admin@example.com',
    password_hash: hash,
    fullname: 'System Admin',
    role: 'admin',
    is_active: true,
  });
}
