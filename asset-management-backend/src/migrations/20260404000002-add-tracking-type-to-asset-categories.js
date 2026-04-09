'use strict';

/**
 * Thêm cột tracking_type vào asset_categories
 *
 * tracking_type:
 *   'individual' (default) – Mỗi tài sản được theo dõi riêng lẻ bằng mã QR.
 *   'batch'               – Tài sản được theo dõi theo nhóm/số lượng (công cụ dụng cụ nhỏ).
 *
 * Tự động đặt tracking_type = 'batch' cho toàn bộ danh mục thuộc nhóm 'cong_cu_dung_cu'
 * vì đây là nhóm công cụ dụng cụ nhỏ (quạt, đèn, ...) thường không dán QR từng cái.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('asset_categories', 'tracking_type', {
      type: Sequelize.ENUM('individual', 'batch'),
      allowNull: false,
      defaultValue: 'individual',
    });

    // Đặt mặc định 'batch' cho nhóm công cụ dụng cụ
    await queryInterface.sequelize.query(`
      UPDATE asset_categories
      SET tracking_type = 'batch'
      WHERE category_group = 'cong_cu_dung_cu'
    `);
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('asset_categories', 'tracking_type');
    // Xóa ENUM type do PostgreSQL tạo
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_asset_categories_tracking_type"`
    );
  },
};
