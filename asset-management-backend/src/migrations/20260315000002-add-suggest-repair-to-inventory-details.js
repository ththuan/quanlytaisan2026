'use strict';

/**
 * Thêm cột suggest_repair: Đề nghị sửa chữa (phân biệt với suggest_disposal: Đề nghị thanh lý)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn(
      'inventory_report_details',
      'suggest_repair',
      {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Đề nghị sửa chữa',
      }
    );
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('inventory_report_details', 'suggest_repair');
  },
};
