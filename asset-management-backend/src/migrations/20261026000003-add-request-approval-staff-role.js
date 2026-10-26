'use strict';

/**
 * Cho phép viên chức (staff) cũng là người ký/duyệt bước đơn vị nhận
 * trong luồng điều chuyển tài sản.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_request_approvals_approver_role" ADD VALUE IF NOT EXISTS 'staff';
    `);
  },

  async down() {
    // PostgreSQL không hỗ trợ xóa một giá trị khỏi ENUM một cách an toàn.
  },
};
