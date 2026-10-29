const path = require('path');
const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

// Load .env tu thu muc backend hoac root project
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

const ADMIN_USERNAME = (process.env.ADMIN_USERNAME || 'admin').trim() || 'admin';
const ADMIN_PASSWORD = (process.env.ADMIN_PASSWORD || '').trim();

const isStrongPassword = (value) =>
  value.length >= 12 &&
  !/^(admin|admin123|admin@123|ctec@123|password|changeme)$/i.test(value) &&
  !/change[_-]?me/i.test(value);

async function resetPassword() {
  if (!isStrongPassword(ADMIN_PASSWORD)) {
    console.error(
      'ADMIN_PASSWORD chua duoc dat hoac qua yeu. Can >= 12 ky tu va khong phai mat khau mac dinh.'
    );
    process.exit(1);
  }

  const hash = await bcrypt.hash(ADMIN_PASSWORD, 10);

  const [rows] = await sequelize.query(
    `UPDATE users SET password_hash = :hash, role = 'admin', is_active = true,
       failed_login_attempts = 0, locked_until = NULL, updated_at = NOW()
     WHERE username = :username RETURNING id`,
    {
      replacements: { hash, username: ADMIN_USERNAME },
    }
  );

  if (!rows || rows.length === 0) {
    await sequelize.query(
      `INSERT INTO users (username, password_hash, fullname, role, is_active, created_at, updated_at)
       VALUES (:username, :hash, 'System Admin', 'admin', true, NOW(), NOW())`,
      { replacements: { hash, username: ADMIN_USERNAME } }
    );
    console.log('Chua co user admin - da tao moi.');
  }

  console.log('Da dat lai mat khau admin theo bien ADMIN_PASSWORD.');
  process.exit(0);
}

resetPassword().catch((err) => {
  console.error(err);
  process.exit(1);
});
