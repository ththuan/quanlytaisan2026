'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('maintenance_requests', 'receiving_department_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    });

    await queryInterface.addColumn('maintenance_requests', 'procurement_fulfilled', {
      type: Sequelize.BOOLEAN,
      allowNull: false,
      defaultValue: false,
    });

    await queryInterface.addColumn('maintenance_requests', 'fulfilled_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('maintenance_requests', 'fulfilled_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    await queryInterface.addColumn('maintenance_requests', 'created_asset_ids', {
      // PostgreSQL: JSONB
      type: Sequelize.JSONB,
      allowNull: true,
      defaultValue: [],
    });

    await queryInterface.addColumn('maintenance_requests', 'procurement_year', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Helpful indexes for reporting and querying
    await queryInterface.addIndex('maintenance_requests', ['request_type', 'procurement_fulfilled'], {
      name: 'idx_maintenance_procurement_fulfilled',
    });
    await queryInterface.addIndex('maintenance_requests', ['procurement_year'], {
      name: 'idx_maintenance_procurement_year',
    });
    await queryInterface.addIndex('maintenance_requests', ['receiving_department_id'], {
      name: 'idx_maintenance_receiving_department_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('maintenance_requests', 'idx_maintenance_receiving_department_id');
    await queryInterface.removeIndex('maintenance_requests', 'idx_maintenance_procurement_year');
    await queryInterface.removeIndex('maintenance_requests', 'idx_maintenance_procurement_fulfilled');

    await queryInterface.removeColumn('maintenance_requests', 'procurement_year');
    await queryInterface.removeColumn('maintenance_requests', 'created_asset_ids');
    await queryInterface.removeColumn('maintenance_requests', 'fulfilled_by');
    await queryInterface.removeColumn('maintenance_requests', 'fulfilled_at');
    await queryInterface.removeColumn('maintenance_requests', 'procurement_fulfilled');
    await queryInterface.removeColumn('maintenance_requests', 'receiving_department_id');
  },
};

