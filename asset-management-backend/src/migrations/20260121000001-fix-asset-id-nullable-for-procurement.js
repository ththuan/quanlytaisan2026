'use strict';

/**
 * Migration: Fix asset_id to be nullable for procurement and facility_repair requests
 * 
 * Procurement requests (đề nghị mua sắm) không cần asset_id vì tài sản chưa tồn tại.
 * Chỉ khi nào mua xong thì mới thêm tài sản vào phần quản lý tài sản.
 * 
 * Equipment repair requests vẫn cần asset_id vì đây là sửa chữa tài sản hiện có.
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // First, drop the NOT NULL constraint if it exists
    // For PostgreSQL, we need to alter the column to allow null
    await queryInterface.sequelize.query(`
      ALTER TABLE maintenance_requests 
      ALTER COLUMN asset_id DROP NOT NULL;
    `).catch(err => {
      // If constraint doesn't exist, that's fine
      console.log('Note: asset_id may already be nullable:', err.message);
    });

    // Then update the column definition to ensure it's nullable
    await queryInterface.changeColumn('maintenance_requests', 'asset_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'assets',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });
  },

  async down(queryInterface, Sequelize) {
    // Revert: Make asset_id required again (NOT recommended for production)
    // Only use this if you're sure all records have asset_id
    await queryInterface.changeColumn('maintenance_requests', 'asset_id', {
      type: Sequelize.INTEGER,
      allowNull: false,
      references: {
        model: 'assets',
        key: 'id',
      },
      onDelete: 'CASCADE',
    });
  }
};
