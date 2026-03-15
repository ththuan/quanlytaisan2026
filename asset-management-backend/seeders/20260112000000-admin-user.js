'use strict';

const bcrypt = require('bcryptjs');

/** Chỉ tạo tài khoản admin nếu chưa có (idempotent). Mỗi lần chạy hệ thống chỉ cần admin, dữ liệu khác user tự import. */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE username = 'admin' LIMIT 1;"
    );
    if (existing && existing.length > 0) {
      return; // Admin đã tồn tại, không ghi đè
    }
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await queryInterface.bulkInsert(
      'users',
      [
        {
          username: 'admin',
          email: 'admin@example.com',
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
