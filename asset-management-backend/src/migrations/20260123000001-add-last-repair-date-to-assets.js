'use strict';

/**
 * Migration: Add last_repair_date to assets table
 * 
 * Thêm trường last_repair_date để lưu ngày sửa chữa gần nhất của tài sản
 * Giúp theo dõi và tránh việc sửa chữa thường xuyên
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('assets', 'last_repair_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
      comment: 'Ngày sửa chữa gần nhất của tài sản',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('assets', 'last_repair_date');
  },
};
