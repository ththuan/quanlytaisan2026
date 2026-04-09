'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Cho phép email NULL (email không bắt buộc vì chưa có chức năng gửi email)
    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING(100),
      allowNull: true,
      unique: true,
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback: đặt lại NOT NULL (cần đảm bảo không có row nào email = NULL trước khi rollback)
    await queryInterface.changeColumn('users', 'email', {
      type: Sequelize.STRING(100),
      allowNull: false,
      unique: true,
    });
  },
};
