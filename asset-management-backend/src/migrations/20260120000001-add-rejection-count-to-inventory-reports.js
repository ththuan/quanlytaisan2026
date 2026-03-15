'use strict';

/**
 * Migration: Thêm trường rejection_count vào inventory_reports
 * Để đếm số lần báo cáo bị từ chối và cho phép gửi lại
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('inventory_reports', 'rejection_count', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Số lần bị từ chối (cho phép gửi lại)'
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('inventory_reports', 'rejection_count');
  }
};
