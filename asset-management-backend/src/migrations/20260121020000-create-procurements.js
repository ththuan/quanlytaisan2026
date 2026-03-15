'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('procurements', {
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
      title: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      receiving_department_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'departments', key: 'id' },
      },
      purchase_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'fulfilled', 'cancelled'),
        allowNull: false,
        defaultValue: 'draft',
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
      },
      fulfilled_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
      },
      fulfilled_at: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      created_asset_ids: {
        type: Sequelize.JSONB,
        allowNull: true,
        defaultValue: [],
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.createTable('procurement_items', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      procurement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'procurements', key: 'id' },
        onDelete: 'CASCADE',
      },
      asset_code_prefix: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      category_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'asset_categories', key: 'id' },
      },
      category_code: {
        type: Sequelize.STRING(50),
        allowNull: true,
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'Cái',
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 1,
      },
      purchase_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      is_depreciable: {
        type: Sequelize.BOOLEAN,
        allowNull: true,
      },
      useful_life: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      depreciation_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('procurements', ['status'], { name: 'idx_procurements_status' });
    await queryInterface.addIndex('procurements', ['receiving_department_id'], { name: 'idx_procurements_receiving_department_id' });
    await queryInterface.addIndex('procurements', ['purchase_date'], { name: 'idx_procurements_purchase_date' });
    await queryInterface.addIndex('procurement_items', ['procurement_id'], { name: 'idx_procurement_items_procurement_id' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('procurement_items', 'idx_procurement_items_procurement_id');
    await queryInterface.removeIndex('procurements', 'idx_procurements_purchase_date');
    await queryInterface.removeIndex('procurements', 'idx_procurements_receiving_department_id');
    await queryInterface.removeIndex('procurements', 'idx_procurements_status');

    await queryInterface.dropTable('procurement_items');
    await queryInterface.dropTable('procurements');

    // Cleanup enum type in Postgres
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS \"enum_procurements_status\";');
  },
};

