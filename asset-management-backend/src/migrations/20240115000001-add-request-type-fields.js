'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add request_type column
    await queryInterface.addColumn('maintenance_requests', 'request_type', {
      type: Sequelize.STRING(50),
      allowNull: false,
      defaultValue: 'equipment_repair',
    });

    // Add category column for procurement
    await queryInterface.addColumn('maintenance_requests', 'category', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // Add device_name column
    await queryInterface.addColumn('maintenance_requests', 'device_name', {
      type: Sequelize.STRING(500),
      allowNull: true,
    });

    // Add technical_specs column
    await queryInterface.addColumn('maintenance_requests', 'technical_specs', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add unit column
    await queryInterface.addColumn('maintenance_requests', 'unit', {
      type: Sequelize.STRING(50),
      allowNull: true,
    });

    // Add quantity column
    await queryInterface.addColumn('maintenance_requests', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
    });

    // Add unit_price column
    await queryInterface.addColumn('maintenance_requests', 'unit_price', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });

    // Add total_price column
    await queryInterface.addColumn('maintenance_requests', 'total_price', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });

    // Add norm_limit column
    await queryInterface.addColumn('maintenance_requests', 'norm_limit', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Add current_quantity column
    await queryInterface.addColumn('maintenance_requests', 'current_quantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    // Add justification column
    await queryInterface.addColumn('maintenance_requests', 'justification', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add asset_code column (for equipment repair - school asset code)
    await queryInterface.addColumn('maintenance_requests', 'asset_code_text', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    // Add serial_number column
    await queryInterface.addColumn('maintenance_requests', 'serial_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });

    // Add year_in_use column
    await queryInterface.addColumn('maintenance_requests', 'year_in_use', {
      type: Sequelize.STRING(10),
      allowNull: true,
    });

    // Add current_condition column
    await queryInterface.addColumn('maintenance_requests', 'current_condition', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add estimated_cost column
    await queryInterface.addColumn('maintenance_requests', 'estimated_cost', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });

    // Add facility_name column (for facility repair)
    await queryInterface.addColumn('maintenance_requests', 'facility_name', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Add last_repair_date column
    await queryInterface.addColumn('maintenance_requests', 'last_repair_date', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Add repair_content column
    await queryInterface.addColumn('maintenance_requests', 'repair_content', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    // Make asset_id nullable (facility repair doesn't need asset)
    await queryInterface.changeColumn('maintenance_requests', 'asset_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'assets',
        key: 'id',
      },
      onDelete: 'SET NULL',
    });

    // Add index on request_type
    await queryInterface.addIndex('maintenance_requests', ['request_type']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeIndex('maintenance_requests', ['request_type']);
    await queryInterface.removeColumn('maintenance_requests', 'request_type');
    await queryInterface.removeColumn('maintenance_requests', 'category');
    await queryInterface.removeColumn('maintenance_requests', 'device_name');
    await queryInterface.removeColumn('maintenance_requests', 'technical_specs');
    await queryInterface.removeColumn('maintenance_requests', 'unit');
    await queryInterface.removeColumn('maintenance_requests', 'quantity');
    await queryInterface.removeColumn('maintenance_requests', 'unit_price');
    await queryInterface.removeColumn('maintenance_requests', 'total_price');
    await queryInterface.removeColumn('maintenance_requests', 'norm_limit');
    await queryInterface.removeColumn('maintenance_requests', 'current_quantity');
    await queryInterface.removeColumn('maintenance_requests', 'justification');
    await queryInterface.removeColumn('maintenance_requests', 'asset_code_text');
    await queryInterface.removeColumn('maintenance_requests', 'serial_number');
    await queryInterface.removeColumn('maintenance_requests', 'year_in_use');
    await queryInterface.removeColumn('maintenance_requests', 'current_condition');
    await queryInterface.removeColumn('maintenance_requests', 'estimated_cost');
    await queryInterface.removeColumn('maintenance_requests', 'facility_name');
    await queryInterface.removeColumn('maintenance_requests', 'last_repair_date');
    await queryInterface.removeColumn('maintenance_requests', 'repair_content');
    
    // Revert asset_id to required
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
