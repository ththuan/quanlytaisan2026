'use strict';

/**
 * Thêm trạng thái "đơn vị nhận đã ký/duyệt" cho điều chuyển tài sản.
 * Luồng: pending (đơn vị giao duyệt) → approved_by_head (chờ đơn vị nhận ký)
 *        → approved_by_destination (chờ quản trị viên ký) → completed.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_asset_transfers_status" ADD VALUE IF NOT EXISTS 'approved_by_destination';
    `);
  },

  async down() {
    // PostgreSQL không hỗ trợ xóa một giá trị khỏi ENUM một cách an toàn.
  },
};
