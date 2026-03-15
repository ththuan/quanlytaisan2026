'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('procurement_items', 'purchase_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });

    await queryInterface.addColumn('procurement_items', 'year_in_use', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addColumn('procurement_items', 'current_department_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
    });

    await queryInterface.addIndex('procurement_items', ['purchase_date'], { name: 'idx_procurement_items_purchase_date' });
    await queryInterface.addIndex('procurement_items', ['year_in_use'], { name: 'idx_procurement_items_year_in_use' });
    await queryInterface.addIndex('procurement_items', ['current_department_id'], { name: 'idx_procurement_items_current_department_id' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('procurement_items', 'idx_procurement_items_current_department_id');
    await queryInterface.removeIndex('procurement_items', 'idx_procurement_items_year_in_use');
    await queryInterface.removeIndex('procurement_items', 'idx_procurement_items_purchase_date');

    await queryInterface.removeColumn('procurement_items', 'current_department_id');
    await queryInterface.removeColumn('procurement_items', 'year_in_use');
    await queryInterface.removeColumn('procurement_items', 'purchase_date');
  },
};
