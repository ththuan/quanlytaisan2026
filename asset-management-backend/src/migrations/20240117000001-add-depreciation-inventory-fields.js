'use strict';

/**
 * Migration: Thêm các trường khấu hao và kiểm kê vào bảng assets
 * Theo Thông tư 141/2025/TT-BTC của Bộ Tài chính
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to check if column exists
    const columnExists = async (table, column) => {
      const result = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}'`
      );
      return result[0].length > 0;
    };

    // Thêm các trường khấu hao
    if (!(await columnExists('assets', 'is_depreciable'))) {
      await queryInterface.addColumn('assets', 'is_depreciable', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Có tính khấu hao không (false = công cụ dụng cụ)'
      });
    }

    if (!(await columnExists('assets', 'depreciation_rate'))) {
      await queryInterface.addColumn('assets', 'depreciation_rate', {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Tỷ lệ khấu hao hàng năm (%)'
      });
    }

    if (!(await columnExists('assets', 'accumulated_depreciation'))) {
      await queryInterface.addColumn('assets', 'accumulated_depreciation', {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
        defaultValue: 0,
        comment: 'Khấu hao lũy kế (VND)'
      });
    }

    if (!(await columnExists('assets', 'depreciation_last_updated'))) {
      await queryInterface.addColumn('assets', 'depreciation_last_updated', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Lần cập nhật khấu hao gần nhất'
      });
    }

    // Thêm các trường kiểm kê
    if (!(await columnExists('assets', 'last_inventory_date'))) {
      await queryInterface.addColumn('assets', 'last_inventory_date', {
        type: Sequelize.DATE,
        allowNull: true,
        comment: 'Ngày kiểm kê gần nhất'
      });
    }

    if (!(await columnExists('assets', 'inventory_status'))) {
      await queryInterface.addColumn('assets', 'inventory_status', {
        type: Sequelize.ENUM('verified', 'discrepancy', 'missing', 'pending'),
        allowNull: true,
        comment: 'Trạng thái kiểm kê: verified=đã xác minh, discrepancy=có chênh lệch, missing=mất, pending=chờ kiểm kê'
      });
    }

    // Thêm trường tình trạng tài sản
    if (!(await columnExists('assets', 'condition'))) {
      await queryInterface.addColumn('assets', 'condition', {
        type: Sequelize.ENUM('good', 'fair', 'poor'),
        allowNull: true,
        defaultValue: 'good',
        comment: 'Tình trạng tài sản: good=tốt, fair=trung bình, poor=kém'
      });
    }

    // Thêm trường phân loại chi tiết
    if (!(await columnExists('assets', 'sub_category'))) {
      await queryInterface.addColumn('assets', 'sub_category', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Phân loại chi tiết tài sản'
      });
    }

    // Thêm index cho các trường mới (cố gắng tạo, nếu đã có thì bỏ qua)
    try {
      await queryInterface.addIndex('assets', ['is_depreciable'], {
        name: 'idx_assets_is_depreciable'
      });
    } catch (e) {}

    try {
      await queryInterface.addIndex('assets', ['inventory_status'], {
        name: 'idx_assets_inventory_status'
      });
    } catch (e) {}

    try {
      await queryInterface.addIndex('assets', ['condition'], {
        name: 'idx_assets_condition'
      });
    } catch (e) {}
  },

  async down(queryInterface, Sequelize) {
    // Xóa indexes
    await queryInterface.removeIndex('assets', 'idx_assets_is_depreciable');
    await queryInterface.removeIndex('assets', 'idx_assets_inventory_status');
    await queryInterface.removeIndex('assets', 'idx_assets_condition');

    // Xóa các cột
    await queryInterface.removeColumn('assets', 'is_depreciable');
    await queryInterface.removeColumn('assets', 'depreciation_rate');
    await queryInterface.removeColumn('assets', 'accumulated_depreciation');
    await queryInterface.removeColumn('assets', 'depreciation_last_updated');
    await queryInterface.removeColumn('assets', 'last_inventory_date');
    await queryInterface.removeColumn('assets', 'inventory_status');
    await queryInterface.removeColumn('assets', 'condition');
    await queryInterface.removeColumn('assets', 'sub_category');

    // Xóa ENUM types
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_assets_inventory_status";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_assets_condition";');
  }
};
