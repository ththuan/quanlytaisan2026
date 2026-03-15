'use strict';

/**
 * Migration: Thêm trường original_asset_condition vào inventory_report_details
 * Để lưu giá trị asset_condition gốc từ frontend (good, usable, needs_repair, damaged)
 * vì backend chỉ lưu condition (good, fair, poor) nên cần lưu thêm giá trị gốc
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('inventory_report_details', 'original_asset_condition', {
      type: Sequelize.STRING(50),
      allowNull: true,
      comment: 'Giá trị asset_condition gốc từ frontend (good, usable, needs_repair, damaged) để đọc lại chính xác'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('inventory_report_details', 'original_asset_condition');
  }
};
