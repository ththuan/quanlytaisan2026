'use strict';

/**
 * Migration: Tạo bảng inventory_rounds (Đợt kiểm kê)
 * Theo quy trình kiểm kê hàng năm
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_rounds', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      round_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Tên đợt kiểm kê, VD: Kiểm Kê Năm 2026'
      },
      round_year: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'Năm kiểm kê'
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mô tả đợt kiểm kê'
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Ngày bắt đầu kiểm kê'
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
        comment: 'Hạn chót nộp báo cáo'
      },
      total_departments: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng số phòng ban tham gia'
      },
      completed_reports: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số báo cáo đã hoàn tất'
      },
      pending_reports: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số báo cáo chờ duyệt'
      },
      rejected_reports: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Số báo cáo bị từ chối'
      },
      status: {
        type: Sequelize.ENUM('not_started', 'in_progress', 'awaiting_approval', 'completed'),
        allowNull: false,
        defaultValue: 'not_started',
        comment: 'Trạng thái đợt kiểm kê'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Admin tạo đợt kiểm kê'
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP')
      }
    });

    // Indexes
    await queryInterface.addIndex('inventory_rounds', ['round_year'], {
      name: 'idx_inventory_rounds_year'
    });
    await queryInterface.addIndex('inventory_rounds', ['status'], {
      name: 'idx_inventory_rounds_status'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inventory_rounds');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inventory_rounds_status";');
  }
};
