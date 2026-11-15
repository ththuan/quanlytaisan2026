'use strict';

/**
 * Migration: thêm hành động 'permission' vào audit log.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface) {
    try {
      await queryInterface.sequelize.query(
        `ALTER TYPE "enum_audit_logs_action" ADD VALUE IF NOT EXISTS 'permission';`,
      );
    } catch (error) {
      // Một số phiên bản PostgreSQL cũ không hỗ trợ IF NOT EXISTS cho enum.
      if (!String(error && error.message).includes('already exists')) {
        throw error;
      }
    }
  },

  async down() {
    // PostgreSQL không hỗ trợ xóa một giá trị enum; giữ nguyên khi rollback.
  },
};
