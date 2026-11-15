'use strict';

/**
 * Migration: thêm cột version cho các bảng nghiệp vụ chính.
 * Dùng cho optimistic locking (chống ghi đè khi nhiều người cùng sửa).
 */

const TABLES = ['maintenance_requests', 'procurements', 'inventory_reports'];

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    for (const tableName of TABLES) {
      const columns = await queryInterface.describeTable(tableName);
      if (!columns.version) {
        await queryInterface.addColumn(tableName, 'version', {
          type: Sequelize.INTEGER,
          allowNull: false,
          defaultValue: 0,
        });
      }
    }
  },

  async down(queryInterface) {
    for (const tableName of TABLES) {
      const columns = await queryInterface.describeTable(tableName);
      if (columns.version) {
        await queryInterface.removeColumn(tableName, 'version');
      }
    }
  },
};
