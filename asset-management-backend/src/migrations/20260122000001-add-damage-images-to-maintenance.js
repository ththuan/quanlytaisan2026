'use strict';

/**
 * Migration: Add damage_images field to maintenance_requests table
 * 
 * Thêm trường damage_images để lưu hình ảnh hư hỏng của thiết bị trong yêu cầu sửa chữa
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('maintenance_requests', 'damage_images', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'JSON array of base64 encoded damage images',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('maintenance_requests', 'damage_images');
  },
};
