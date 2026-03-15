'use strict';

/**
 * Migration: Thêm giá trị 'pending_disposal' vào ENUM status của bảng assets
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Thêm giá trị mới vào ENUM type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_assets_status" ADD VALUE IF NOT EXISTS 'pending_disposal';
    `);
  },

  async down(queryInterface, Sequelize) {
    // PostgreSQL không hỗ trợ xóa giá trị từ ENUM type một cách trực tiếp
    // Cần tạo lại ENUM type nếu muốn rollback
    console.log('Cannot remove enum value in PostgreSQL. Skipping...');
  }
};
