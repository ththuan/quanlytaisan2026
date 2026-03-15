'use strict';

/**
 * Migration: Thêm status 'draft' vào maintenance_requests
 * 
 * Draft: Nháp, chưa gửi phê duyệt - người dùng có thể chỉnh sửa
 * Pending: Đã gửi, chờ phê duyệt cấp 1 (trưởng phòng)
 * 
 * Workflow:
 * draft -> pending (gửi phê duyệt)
 * pending -> approved_by_head (trưởng phòng duyệt)
 * approved_by_head -> approved_by_admin (admin duyệt)
 * approved_by_admin -> approved_by_director (giám đốc duyệt - hoàn tất)
 * 
 * Nếu bị từ chối ở bất kỳ cấp nào -> rejected_by_* -> có thể sửa lại và gửi lại
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add 'draft' to the enum if it doesn't exist
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'draft';
    `);
  },

  async down(queryInterface, Sequelize) {
    // Note: PostgreSQL doesn't support removing enum values directly
    // This would require recreating the enum, which is complex
    // In practice, we keep the enum value but don't use it
    console.log('Note: Cannot remove enum value directly. Keeping draft status.');
  }
};
