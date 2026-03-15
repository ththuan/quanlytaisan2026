'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('assets', 'useful_life', {
      type: Sequelize.INTEGER,
      allowNull: true,
      comment: 'Thời gian sử dụng để tính hao mòn (năm)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('assets', 'useful_life');
  }
};
