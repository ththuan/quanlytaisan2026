const path = require('path');
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

// Load .env từ thư mục backend hoặc root project
require('dotenv').config({ path: path.join(__dirname, '../.env') });
require('dotenv').config({ path: path.join(__dirname, '../../.env') });

const sequelize = new Sequelize(
  process.env.DB_NAME || 'asset_management',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: parseInt(process.env.DB_PORT || '5432', 10),
    dialect: 'postgres',
  }
);

/** Đồng bộ với src/config/adminCredentials.ts — luôn Admin@123 (không đọc .env). */
const ADMIN_PASSWORD = 'Admin@123';

async function resetPassword() {
  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const [rows] = await sequelize.query(
    `UPDATE users SET password_hash = :hash, totp_enabled = false, totp_secret = NULL, updated_at = NOW()
     WHERE username = :username RETURNING id`,
    {
      replacements: { hash, username: 'admin' },
    }
  );

  if (!rows || rows.length === 0) {
    console.error('Không tìm thấy user admin. Chạy: npm run seed:admin');
    process.exit(1);
  }

  console.log('Đã đặt lại mật khẩu admin. Đăng nhập: admin / ' + ADMIN_PASSWORD);
  process.exit(0);
}

resetPassword().catch((err) => {
  console.error(err);
  process.exit(1);
});
