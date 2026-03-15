'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Đổi cột type từ ENUM sang VARCHAR để linh hoạt hơn
    await queryInterface.changeColumn('departments', 'type', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: đổi lại thành ENUM (cần xóa dữ liệu không hợp lệ trước)
    await queryInterface.changeColumn('departments', 'type', {
      type: Sequelize.ENUM('center', 'faculty', 'room', 'lab', 'office'),
      allowNull: true,
    });
  }
};
