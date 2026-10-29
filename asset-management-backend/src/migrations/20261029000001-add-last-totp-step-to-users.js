'use strict';

/** Lưu bước thời gian TOTP đã dùng gần nhất để chặn phát lại mã trong cùng cửa sổ. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'last_totp_step', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: null,
    });
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('users', 'last_totp_step');
  },
};
