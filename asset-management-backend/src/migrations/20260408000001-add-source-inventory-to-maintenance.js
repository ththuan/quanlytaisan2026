'use strict';

/**
 * Migration: Add source_inventory_report_id to maintenance_requests
 * Mục đích: Liên kết đề nghị sửa chữa được tạo tự động từ kiểm kê định kỳ
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Use IF NOT EXISTS to safely handle case where column already exists
    await queryInterface.sequelize.query(
      `ALTER TABLE maintenance_requests ADD COLUMN IF NOT EXISTS source_inventory_report_id INTEGER REFERENCES inventory_reports(id) ON DELETE SET NULL;`
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('maintenance_requests', 'source_inventory_report_id');
  },
};
