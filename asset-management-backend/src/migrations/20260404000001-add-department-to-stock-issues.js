'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('stock_issues', 'department_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    });
    await queryInterface.addIndex('stock_issues', ['department_id']);
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('stock_issues', ['department_id']);
    await queryInterface.removeColumn('stock_issues', 'department_id');
  },
};
