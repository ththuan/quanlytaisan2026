'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Step 1: Update existing users with 'manager' or 'user' role to 'staff'
    await queryInterface.sequelize.query(`
      UPDATE users 
      SET role = 'staff' 
      WHERE role IN ('manager', 'user');
    `);

    // Step 2: Remove default value first
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN role DROP DEFAULT;
    `);

    // Step 3: Create new ENUM type with only 4 roles (if not exists)
    await queryInterface.sequelize.query(`
      -- Create new ENUM type if not exists
      DO $$ BEGIN
        CREATE TYPE "enum_users_role_new" AS ENUM ('admin', 'director', 'department_head', 'staff');
      EXCEPTION
        WHEN duplicate_object THEN null;
      END $$;
    `);

    // Step 4: Alter column to use new ENUM type
    await queryInterface.sequelize.query(`
      -- Alter column to use new type
      ALTER TABLE users 
      ALTER COLUMN role TYPE "enum_users_role_new" 
      USING role::text::"enum_users_role_new";
    `);

    // Step 5: Drop old ENUM type
    await queryInterface.sequelize.query(`
      -- Drop old ENUM type
      DROP TYPE "enum_users_role";
    `);

    // Step 6: Rename new ENUM type to original name
    await queryInterface.sequelize.query(`
      -- Rename new type to original name
      ALTER TYPE "enum_users_role_new" RENAME TO "enum_users_role";
    `);

    // Step 7: Update default value
    await queryInterface.sequelize.query(`
      -- Update default value
      ALTER TABLE users 
      ALTER COLUMN role SET DEFAULT 'staff';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Revert: Create old ENUM type with all roles
    await queryInterface.sequelize.query(`
      CREATE TYPE "enum_users_role_old" AS ENUM ('admin', 'director', 'department_head', 'manager', 'staff', 'user');
    `);

    // Convert back
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN role TYPE "enum_users_role_old" 
      USING role::text::"enum_users_role_old";
    `);

    // Drop new type
    await queryInterface.sequelize.query(`
      DROP TYPE "enum_users_role";
    `);

    // Rename old type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role_old" RENAME TO "enum_users_role";
    `);

    // Restore default
    await queryInterface.sequelize.query(`
      ALTER TABLE users 
      ALTER COLUMN role SET DEFAULT 'user';
    `);
  }
};
