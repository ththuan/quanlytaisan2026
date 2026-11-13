'use strict';

/**
 * Migration: bổ sung trạng thái rejected_due_to_high_cost cho yêu cầu sửa chữa.
 * Trạng thái này được dùng khi chuyển yêu cầu sửa chữa sang thanh lý/tiêu hủy.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'rejected_due_to_high_cost';`
    );
  },

  async down() {
    // PostgreSQL không hỗ trợ xóa một giá trị enum; giữ nguyên khi rollback.
  },
};
