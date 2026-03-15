const bcrypt = require('bcryptjs');
const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(
  process.env.DB_NAME || 'asset_management',
  process.env.DB_USER || 'postgres',
  process.env.DB_PASSWORD || 'postgres',
  {
    host: process.env.DB_HOST || 'localhost',
    port: process.env.DB_PORT || 5432,
    dialect: 'postgres',
  }
);

async function resetPassword() {
  const newPassword = 'Admin@123';
  const hash = await bcrypt.hash(newPassword, 10);

  await sequelize.query(
    'UPDATE users SET password_hash = :hash WHERE username = :username',
    {
      replacements: { hash, username: 'admin' },
    }
  );

  console.log('Password reset successfully. Use: admin / Admin@123');
  process.exit(0);
}

resetPassword().catch((err) => {
  console.error(err);
  process.exit(1);
});
