'use strict';

/**
 * Migration: Tạo bảng inventory_report_details (Chi tiết kiểm kê)
 * Lưu chi tiết từng tài sản trong báo cáo kiểm kê
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_report_details', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      inventory_report_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventory_reports',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Báo cáo kiểm kê'
      },
      asset_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'assets',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Tài sản được kiểm kê'
      },
      assigned_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Số lượng được cấp'
      },
      actual_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Số lượng kiểm kê thực tế'
      },
      quantity_discrepancy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Chênh lệch = assigned - actual'
      },
      condition: {
        type: Sequelize.ENUM('good', 'fair', 'poor'),
        allowNull: true,
        comment: 'Tình trạng tài sản: good=tốt, fair=trung bình, poor=kém'
      },
      suggest_disposal: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
        comment: 'Đề nghị thanh lý'
      },
      disposal_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Lý do đề nghị thanh lý'
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú'
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
    await queryInterface.addIndex('inventory_report_details', ['inventory_report_id'], {
      name: 'idx_inventory_details_report'
    });
    await queryInterface.addIndex('inventory_report_details', ['asset_id'], {
      name: 'idx_inventory_details_asset'
    });

    // Unique constraint: mỗi tài sản chỉ xuất hiện 1 lần trong 1 báo cáo
    await queryInterface.addIndex('inventory_report_details', ['inventory_report_id', 'asset_id'], {
      name: 'idx_inventory_details_unique',
      unique: true
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inventory_report_details');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inventory_report_details_condition";');
  }
};
