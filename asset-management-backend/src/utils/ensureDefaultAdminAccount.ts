import bcrypt from 'bcryptjs';
import bcryptConfig from '../config/bcrypt';
import { getBootstrapAdminPassword, SYSTEM_ADMIN_USERNAME } from '../config/adminCredentials';
import User from '../models/User';
import logger from './logger';

/**
 * Chỉ tạo tài khoản admin hệ thống khi CHƯA tồn tại.
 *
 * Không đặt lại mật khẩu, không bật lại tài khoản, không xóa 2FA và không mở
 * khóa cho admin đã tồn tại: những thay đổi đó phải do quản trị viên chủ động
 * thực hiện qua chức năng đổi mật khẩu / quản trị người dùng.
 */
export async function ensureDefaultAdminAccount(): Promise<void> {
  const existing = await User.findOne({ where: { username: SYSTEM_ADMIN_USERNAME } });

  if (existing) {
    logger.info(`[admin] Tài khoản "${SYSTEM_ADMIN_USERNAME}" đã tồn tại; giữ nguyên thông tin đăng nhập.`);

    if (existing.password_hash && (await bcrypt.compare('Admin@123', existing.password_hash))) {
      logger.warn(
        `[SECURITY] Tài khoản "${SYSTEM_ADMIN_USERNAME}" vẫn đang dùng mật khẩu mặc định. Hãy đăng nhập và đổi mật khẩu ngay.`,
      );
    }
    return;
  }

  const bootstrapPassword = getBootstrapAdminPassword();
  const hash = await bcrypt.hash(bootstrapPassword, bcryptConfig.saltRounds);

  await User.create({
    username: SYSTEM_ADMIN_USERNAME,
    password_hash: hash,
    fullname: 'System Admin',
    role: 'admin',
    is_active: true,
  });

  logger.info(`[admin] Đã tạo tài khoản quản trị ban đầu "${SYSTEM_ADMIN_USERNAME}".`);
}
