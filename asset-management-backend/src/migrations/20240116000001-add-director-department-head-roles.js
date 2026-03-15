'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Update user role enum to include director and department_head
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'director';
      ALTER TYPE "enum_users_role" ADD VALUE IF NOT EXISTS 'department_head';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Cannot remove enum values in PostgreSQL easily
    // This would require recreating the column
    console.log('Note: Cannot easily remove enum values in PostgreSQL');
  }
};
