'use strict';

/**
 * Migration: Tạo bảng inventory_reports (Báo cáo kiểm kê)
 * Mỗi cán bộ tạo một báo cáo kiểm kê trong đợt kiểm kê
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('inventory_reports', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true
      },
      report_code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
        comment: 'Mã báo cáo kiểm kê (duy nhất)'
      },
      inventory_round_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'inventory_rounds',
          key: 'id'
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
        comment: 'Đợt kiểm kê'
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Cán bộ tạo báo cáo'
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'departments',
          key: 'id'
        },
        comment: 'Phòng ban'
      },
      total_assigned_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng số tài sản được cấp'
      },
      total_actual_quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng số kiểm kê thực tế'
      },
      total_discrepancy: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng chênh lệch'
      },
      total_disposal_suggestions: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Tổng đề nghị thanh lý'
      },
      status: {
        type: Sequelize.ENUM(
          'draft',
          'pending',
          'approved_by_head',
          'rejected_by_head',
          'approved_by_admin',
          'rejected_by_admin',
          'completed'
        ),
        allowNull: false,
        defaultValue: 'draft',
        comment: 'Trạng thái duyệt'
      },
      head_approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Trưởng đơn vị duyệt'
      },
      head_approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      head_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú của trưởng đơn vị'
      },
      admin_approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id'
        },
        comment: 'Admin duyệt'
      },
      admin_approved_at: {
        type: Sequelize.DATE,
        allowNull: true
      },
      admin_notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Ghi chú của admin'
      },
      rejection_reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Lý do từ chối'
      },
      submitted_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian nộp báo cáo'
      },
      completed_at: {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Thời gian hoàn tất'
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
    await queryInterface.addIndex('inventory_reports', ['inventory_round_id'], {
      name: 'idx_inventory_reports_round'
    });
    await queryInterface.addIndex('inventory_reports', ['created_by'], {
      name: 'idx_inventory_reports_creator'
    });
    await queryInterface.addIndex('inventory_reports', ['department_id'], {
      name: 'idx_inventory_reports_department'
    });
    await queryInterface.addIndex('inventory_reports', ['status'], {
      name: 'idx_inventory_reports_status'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('inventory_reports');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_inventory_reports_status";');
  }
};
