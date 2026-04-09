'use strict';

/**
 * Migration: Add Google OAuth fields to users table
 * - google_id: Google subject ID (unique)
 * - auth_provider: 'local' | 'google'
 * - password_hash: make nullable (Google users have no password)
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS google_id VARCHAR(255);`
    );
    await queryInterface.sequelize.query(
      `CREATE UNIQUE INDEX IF NOT EXISTS users_google_id_unique ON users(google_id) WHERE google_id IS NOT NULL;`
    );
    await queryInterface.sequelize.query(
      `ALTER TABLE users ADD COLUMN IF NOT EXISTS auth_provider VARCHAR(20) NOT NULL DEFAULT 'local';`
    );
    // Make password_hash nullable for Google-only accounts
    await queryInterface.sequelize.query(
      `ALTER TABLE users ALTER COLUMN password_hash DROP NOT NULL;`
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`DROP INDEX IF EXISTS users_google_id_unique;`);
    await queryInterface.sequelize.query(`ALTER TABLE users DROP COLUMN IF EXISTS google_id;`);
    await queryInterface.sequelize.query(`ALTER TABLE users DROP COLUMN IF EXISTS auth_provider;`);
    await queryInterface.sequelize.query(`ALTER TABLE users ALTER COLUMN password_hash SET NOT NULL;`);
  },
};
