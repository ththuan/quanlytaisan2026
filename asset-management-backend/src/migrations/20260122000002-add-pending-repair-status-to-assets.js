'use strict';

/**
 * Migration: Add 'pending_repair' status to assets table
 * 
 * Thêm trạng thái 'pending_repair' để đánh dấu tài sản đang có yêu cầu sửa chữa chờ phê duyệt
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // For PostgreSQL, we need to alter the ENUM type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_assets_status" ADD VALUE IF NOT EXISTS 'pending_repair';
    `).catch(err => {
      // If enum doesn't exist or value already exists, that's fine
      console.log('Note: pending_repair status may already exist:', err.message);
    });
  },

  async down(queryInterface, Sequelize) {
    // Note: Removing enum values is complex in PostgreSQL
    // In practice, we usually don't remove enum values
    console.log('Note: Removing enum values is not recommended. Skipping rollback.');
  },
};
