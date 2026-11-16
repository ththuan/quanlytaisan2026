'use strict';

/**
 * Migration: lưu bố cục cột bảng dùng chung cho toàn bộ tài khoản.
 * - table_key: định danh bảng (assets, users, transfers...)
 * - columns: tỷ lệ độ rộng từng cột
 * - layout_version: phiên bản cấu trúc cột; tăng khi code thay đổi cột
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('table_layouts')) return;

    await queryInterface.createTable('table_layouts', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      table_key: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      columns: {
        type: Sequelize.JSONB,
        allowNull: false,
        defaultValue: {},
      },
      layout_version: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('table_layouts');
  },
};
