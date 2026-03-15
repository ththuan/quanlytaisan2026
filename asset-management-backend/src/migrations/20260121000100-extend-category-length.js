'use strict';

/**
 * Mục tiêu: tăng độ dài cột category của bảng assets từ VARCHAR(100) lên VARCHAR(255)
 * để tránh lỗi "value too long for type character varying(100)" khi lưu tên loại tài sản dài.
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra cột đã tồn tại trước khi đổi
    const table = await queryInterface.describeTable('assets');
    if (table.category) {
      await queryInterface.changeColumn('assets', 'category', {
        type: Sequelize.STRING(255),
        allowNull: true,
        comment: 'Tên loại tài sản đầy đủ (có thể dài > 100 ký tự)',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Trả về VARCHAR(100) nếu cần rollback
    const table = await queryInterface.describeTable('assets');
    if (table.category) {
      await queryInterface.changeColumn('assets', 'category', {
        type: Sequelize.STRING(100),
        allowNull: true,
        comment: 'Tên loại tài sản',
      });
    }
  },
};
