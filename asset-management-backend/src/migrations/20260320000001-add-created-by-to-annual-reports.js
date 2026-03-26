'use strict';

/** @param {import('sequelize').QueryInterface} queryInterface */
/** @param {import('sequelize').Sequelize} Sequelize */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('annual_reports', 'created_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('annual_reports', ['created_by']);
  },

  async down(queryInterface) {
    await queryInterface.removeColumn('annual_reports', 'created_by');
  },
};
