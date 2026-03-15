'use strict';

/**
 * Migration: Liên kết đề nghị sửa chữa (maintenance_requests) với hồ sơ thanh lý/tiêu hủy (asset_disposal_cases)
 * Khi chi phí sửa chữa > giá trị tài sản, admin chuyển thẳng sang module thanh lý/tiêu hủy.
 *   1. asset_disposal_cases.source_maintenance_request_id – hồ sơ biết nó được tạo từ đề nghị nào
 *   2. maintenance_requests.linked_disposal_case_id – đề nghị biết hồ sơ thanh lý tương ứng
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Thêm source_maintenance_request_id vào bảng asset_disposal_cases
    await queryInterface.addColumn('asset_disposal_cases', 'source_maintenance_request_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'maintenance_requests', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK tới maintenance_requests – hồ sơ này được tạo từ đề nghị sửa chữa có chi phí quá lớn',
    });

    // 2. Thêm linked_disposal_case_id vào bảng maintenance_requests
    await queryInterface.addColumn('maintenance_requests', 'linked_disposal_case_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'asset_disposal_cases', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK tới asset_disposal_cases – hồ sơ thanh lý/tiêu hủy được tạo từ đề nghị này',
    });

    await queryInterface.addIndex('asset_disposal_cases', ['source_maintenance_request_id'], {
      name: 'idx_disposal_cases_maintenance_request_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('asset_disposal_cases', 'idx_disposal_cases_maintenance_request_id');
    await queryInterface.removeColumn('maintenance_requests', 'linked_disposal_case_id');
    await queryInterface.removeColumn('asset_disposal_cases', 'source_maintenance_request_id');
  },
};
