'use strict';

/**
 * Composite indexes phục vụ danh sách tài sản theo đơn vị và thống kê kiểm kê.
 * CREATE INDEX IF NOT EXISTS để chạy lại an toàn trên môi trường đã có index.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS idx_assets_department_status ON assets (current_department_id, status)'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS idx_assets_department_code ON assets (current_department_id, asset_code)'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS idx_inventory_reports_round_status ON inventory_reports (inventory_round_id, status)'
    );
    await queryInterface.sequelize.query(
      'CREATE INDEX IF NOT EXISTS idx_inventory_reports_department_status ON inventory_reports (department_id, status)'
    );
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_assets_department_status');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_assets_department_code');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_inventory_reports_round_status');
    await queryInterface.sequelize.query('DROP INDEX IF EXISTS idx_inventory_reports_department_status');
  },
};
