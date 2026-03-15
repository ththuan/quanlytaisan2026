'use strict';

/**
 * Migration: Add repair_completed and repair_approved statuses to maintenance_requests
 * 
 * Thêm các trạng thái mới:
 * - repair_completed: Đã hoàn thành sửa chữa, chờ admin duyệt
 * - repair_approved: Admin đã duyệt hoàn thành sửa chữa
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // For PostgreSQL, we need to alter the ENUM type
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'repair_completed';
    `).catch(err => {
      console.log('Note: repair_completed status may already exist:', err.message);
    });

    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'repair_approved';
    `).catch(err => {
      console.log('Note: repair_approved status may already exist:', err.message);
    });
  },

  async down(queryInterface, Sequelize) {
    // Note: Removing enum values is complex in PostgreSQL
    // In practice, we usually don't remove enum values
    console.log('Note: Removing enum values is not recommended. Skipping rollback.');
  },
};
