'use strict';

/**
 * Migration: Mở rộng bảng asset_disposal_cases để hỗ trợ:
 *   1. source_type = 'manual' – cho phép tạo hồ sơ thủ công (tiêu hủy, xử lý đơn lẻ)
 *   2. disposal_type – phân biệt loại xử lý: 'liquidation' (thanh lý) | 'destruction' (tiêu hủy)
 *   3. destruction_method – hình thức tiêu hủy theo Điều 24 Quy chế
 *   4. disposal_method – bán | phá dỡ... (dành cho thanh lý)
 *   5. revenue – tiền thu được sau xử lý
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Mở rộng enum source_type: thêm 'manual'
    await queryInterface.sequelize.query(
      `ALTER TYPE "enum_asset_disposal_cases_source_type" ADD VALUE IF NOT EXISTS 'manual';`
    );

    // 2. Thêm cột disposal_type
    await queryInterface.addColumn('asset_disposal_cases', 'disposal_type', {
      type: Sequelize.STRING(30),
      allowNull: true,
      defaultValue: 'liquidation',
      comment: 'Loại xử lý: liquidation (thanh lý) | destruction (tiêu hủy)',
    });

    // 3. Thêm cột destruction_method
    await queryInterface.addColumn('asset_disposal_cases', 'destruction_method', {
      type: Sequelize.STRING(30),
      allowNull: true,
      comment: 'Hình thức tiêu hủy: chemical | mechanical | burial | software | other',
    });

    // 4. Thêm cột disposal_method
    await queryInterface.addColumn('asset_disposal_cases', 'disposal_method', {
      type: Sequelize.STRING(30),
      allowNull: true,
      comment: 'Hình thức thanh lý: sell_auction | sell_listed | sell_direct | demolish',
    });

    // 5. Thêm cột revenue (tiền thu được)
    await queryInterface.addColumn('asset_disposal_cases', 'revenue', {
      type: Sequelize.DECIMAL(18, 0),
      allowNull: true,
      defaultValue: 0,
      comment: 'Tiền thu được từ xử lý tài sản (đồng)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('asset_disposal_cases', 'revenue');
    await queryInterface.removeColumn('asset_disposal_cases', 'disposal_method');
    await queryInterface.removeColumn('asset_disposal_cases', 'destruction_method');
    await queryInterface.removeColumn('asset_disposal_cases', 'disposal_type');
    // Note: không rollback enum thêm value vì PostgreSQL không hỗ trợ xóa enum value
  },
};
