'use strict';

/**
 * Migration: Create maintenance_damage_images table
 * 
 * Tạo bảng riêng để lưu hình ảnh hư hỏng của yêu cầu sửa chữa
 * Thay vì lưu base64 trong maintenance_requests, giờ lưu file thật và đường dẫn
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('maintenance_damage_images', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      maintenance_id: {
        type: Sequelize.BIGINT,
        allowNull: false,
        references: {
          model: 'maintenance_requests',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      image_path: {
        type: Sequelize.STRING(500),
        allowNull: false,
        comment: 'Đường dẫn file hình ảnh trong storage',
      },
      order_number: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
        comment: 'Thứ tự hiển thị hình ảnh',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mô tả hình ảnh (nếu có)',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Tạo index cho maintenance_id để tăng tốc query
    await queryInterface.addIndex('maintenance_damage_images', ['maintenance_id'], {
      name: 'idx_maintenance_damage_images_maintenance_id',
    });

    // Tạo index cho order_number để sắp xếp
    await queryInterface.addIndex('maintenance_damage_images', ['maintenance_id', 'order_number'], {
      name: 'idx_maintenance_damage_images_order',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('maintenance_damage_images');
  },
};
