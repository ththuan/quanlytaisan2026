'use strict';

/**
 * Migration: lưu vết nguồn tài sản đang chờ thanh lý/tiêu hủy.
 * - repair: từ yêu cầu sửa chữa
 * - inventory: từ báo cáo kiểm kê
 * - manual: do admin đưa vào thủ công (nếu có)
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('assets', 'pending_disposal_source', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Nguồn chờ thanh lý: repair | inventory | manual',
    });

    await queryInterface.addColumn('assets', 'pending_disposal_source_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'ID yêu cầu sửa chữa hoặc báo cáo kiểm kê',
    });

    await queryInterface.addColumn('assets', 'pending_disposal_requested_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
      comment: 'Người đề nghị thanh lý/tiêu hủy',
    });

    await queryInterface.addColumn('assets', 'pending_disposal_requested_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Thời điểm đề nghị thanh lý/tiêu hủy',
    });

    await queryInterface.addColumn('assets', 'pending_disposal_note', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Ghi chú nguồn chờ thanh lý',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('assets', 'pending_disposal_note');
    await queryInterface.removeColumn('assets', 'pending_disposal_requested_at');
    await queryInterface.removeColumn('assets', 'pending_disposal_requested_by');
    await queryInterface.removeColumn('assets', 'pending_disposal_source_id');
    await queryInterface.removeColumn('assets', 'pending_disposal_source');
  },
};
