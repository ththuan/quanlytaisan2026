'use strict';

/**
 * Create asset_disposal_cases and asset_disposal_items
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('asset_disposal_cases', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      code: {
        type: Sequelize.STRING(50),
        allowNull: false,
        unique: true,
      },
      source_type: {
        type: Sequelize.ENUM('inventory'),
        allowNull: false,
        defaultValue: 'inventory',
      },
      source_inventory_report_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'inventory_reports',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      origin_department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      status: {
        type: Sequelize.ENUM('pending', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'pending',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      approved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      decision_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      decision_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      decision_file_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.createTable('asset_disposal_items', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      disposal_case_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'asset_disposal_cases',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      asset_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'assets',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      inventory_report_detail_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'inventory_report_details',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      moved_from_department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      moved_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      moved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    await queryInterface.addConstraint('asset_disposal_items', {
      fields: ['disposal_case_id', 'asset_id'],
      type: 'unique',
      name: 'uq_asset_disposal_items_case_asset',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('asset_disposal_items');
    await queryInterface.dropTable('asset_disposal_cases');

    // Drop enum types (PostgreSQL)
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_asset_disposal_cases_source_type";');
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS "enum_asset_disposal_cases_status";');
  },
};
