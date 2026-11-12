'use strict';

/**
 * Migration: cho phép hồ sơ thanh lý/tiêu hủy có nguồn gốc từ yêu cầu sửa chữa.
 * PostgreSQL enum source_type trước đó chỉ có 'inventory' và 'manual'.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_asset_disposal_cases_source_type" ADD VALUE IF NOT EXISTS 'maintenance';`
    );
  },

  async down() {
    // PostgreSQL không hỗ trợ xóa một giá trị enum; giữ nguyên khi rollback.
  },
};
