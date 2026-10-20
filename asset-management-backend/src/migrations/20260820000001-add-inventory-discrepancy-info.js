'use strict';

/**
 * Bổ sung thông tin xử lý thừa/thiếu khi kiểm kê:
 * - nguyên nhân, trách nhiệm, số tiền bồi thường (nếu thiếu).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('inventory_report_details', 'discrepancy_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Nguyên nhân thừa/thiếu',
    });
    await queryInterface.addColumn('inventory_report_details', 'responsibility', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Trách nhiệm (tập thể/cá nhân)',
    });
    await queryInterface.addColumn('inventory_report_details', 'compensation_amount', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      comment: 'Số tiền bồi thường (đối với thiếu)',
    });
  },

  async down(queryInterface) {
    for (const col of ['discrepancy_reason', 'responsibility', 'compensation_amount']) {
      try { await queryInterface.removeColumn('inventory_report_details', col); } catch (e) { /* ignore */ }
    }
  },
};
