'use strict';

const bcrypt = require('bcryptjs');

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim() || 'admin';
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();

const isStrongPassword = (value) =>
  value.length >= 12 &&
  !/^(admin|admin123|admin@123|ctec@123|password|changeme)$/i.test(value) &&
  !/change[_-]?me/i.test(value);

/**
 * Chỉ tạo admin khi tài khoản CHƯA tồn tại.
 * Không bao giờ đặt lại mật khẩu / tắt 2FA / mở khóa của admin hiện có.
 */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      'SELECT id FROM users WHERE username = :username LIMIT 1;',
      { replacements: { username: ADMIN_USERNAME } },
    );

    if (existing && existing.length > 0) {
      console.warn(`[seed:admin] Tài khoản "${ADMIN_USERNAME}" đã tồn tại; giữ nguyên thông tin đăng nhập.`);
      return;
    }

    if (!isStrongPassword(ADMIN_PASSWORD)) {
      console.warn(
        '[seed:admin] Bỏ qua tạo admin: ADMIN_PASSWORD chưa được đặt hoặc quá yếu (cần >= 12 ký tự).',
      );
      return;
    }

    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);

    await queryInterface.bulkInsert(
      'users',
      [
        {
          username: ADMIN_USERNAME,
          password_hash: passwordHash,
          fullname: 'System Admin',
          role: 'admin',
          department_id: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {},
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { username: ADMIN_USERNAME }, {});
  },
};
