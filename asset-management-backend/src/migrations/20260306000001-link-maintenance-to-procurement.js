'use strict';

/**
 * Migration: Liên kết đề nghị mua sắm (maintenance_requests) với phiếu Tăng tài sản (procurements)
 *   1. procurements.maintenance_request_id – phiếu tăng tài sản biết nó được tạo từ đề nghị nào
 *   2. maintenance_requests.linked_procurement_id – đề nghị biết phiếu tăng tài sản tương ứng
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // 1. Thêm maintenance_request_id vào bảng procurements
    await queryInterface.addColumn('procurements', 'maintenance_request_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'maintenance_requests',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK tới maintenance_requests – phiếu này được tạo tự động từ đề nghị mua sắm đã duyệt',
    });

    // 2. Thêm linked_procurement_id vào bảng maintenance_requests
    await queryInterface.addColumn('maintenance_requests', 'linked_procurement_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'procurements',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK tới procurements – phiếu tăng tài sản được tạo từ đề nghị này',
    });

    // Tạo index để tìm nhanh
    await queryInterface.addIndex('procurements', ['maintenance_request_id'], {
      name: 'idx_procurements_maintenance_request_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('procurements', 'idx_procurements_maintenance_request_id');
    await queryInterface.removeColumn('maintenance_requests', 'linked_procurement_id');
    await queryInterface.removeColumn('procurements', 'maintenance_request_id');
  },
};
