'use strict';

const path = require('path');
const bcrypt = require('bcryptjs');

// Load .env từ thư mục backend (khi chạy từ backend) hoặc root project
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

/** Đồng bộ với src/config/adminCredentials.ts */
const ADMIN_PASSWORD = 'Admin@123';

/** Chỉ tạo tài khoản admin nếu chưa có (idempotent). Mật khẩu cố định Admin@123. */
module.exports = {
  async up(queryInterface) {
    const [existing] = await queryInterface.sequelize.query(
      "SELECT id FROM users WHERE username = 'admin' LIMIT 1;"
    );
    if (existing && existing.length > 0) {
      return; // Admin đã tồn tại, không ghi đè
    }
    const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 10);
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
