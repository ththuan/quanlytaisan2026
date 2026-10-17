'use strict';

const bcrypt = require('bcryptjs');

/** Mật khẩu admin CỐ ĐỊNH — đồng bộ với src/config/adminCredentials.ts */
const ADMIN_PASSWORD = 'Admin@123';

/**
 * Luôn đảm bảo tài khoản admin tồn tại với mật khẩu cố định Admin@123.
 * Idempotent: nếu đã có thì đặt lại mật khẩu + bật tài khoản + tắt 2FA.
 */
module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
    const [existing] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE username = 'admin' LIMIT 1;"
    );

    if (existing && existing.length > 0) {
      await queryInterface.sequelize.query(
        `UPDATE users
           SET password_hash = :hash,
               role = 'admin',
               is_active = true,
               department_id = NULL,
               totp_enabled = false,
               totp_secret = NULL,
               failed_login_attempts = 0,
               locked_until = NULL,
               updated_at = :now
         WHERE username = 'admin'`,
        {
          replacements: { hash: passwordHash, now: new Date() },
        }
      );
      return;
    }

    await queryInterface.bulkInsert(
      'users',
      [
        {
          username: 'admin',
          password_hash: passwordHash,
          fullname: 'System Admin',
          role: 'admin',
          department_id: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
  },
};
