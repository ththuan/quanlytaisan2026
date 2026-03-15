'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('stock_items', {
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
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Cái',
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      min_stock: {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
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

    await queryInterface.createTable('stock_receipts', {
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
      receipt_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      supplier_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      shopee_waybill: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      invoice_no: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
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

    await queryInterface.createTable('stock_receipt_lines', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      receipt_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'stock_receipts', key: 'id' },
        onDelete: 'CASCADE',
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'stock_items', key: 'id' },
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      unit_price: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: false,
        defaultValue: 0,
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

    await queryInterface.createTable('stock_issues', {
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
      issue_date: {
        type: Sequelize.DATEONLY,
        allowNull: false,
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      purpose: {
        type: Sequelize.STRING(500),
        allowNull: false,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
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

    await queryInterface.createTable('stock_issue_lines', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      issue_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'stock_issues', key: 'id' },
        onDelete: 'CASCADE',
      },
      item_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'stock_items', key: 'id' },
      },
      quantity: {
        type: Sequelize.INTEGER,
        allowNull: false,
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

    await queryInterface.addIndex('stock_items', ['code'], { name: 'idx_stock_items_code', unique: true });
    await queryInterface.addIndex('stock_items', ['name'], { name: 'idx_stock_items_name' });

    await queryInterface.addIndex('stock_receipts', ['receipt_date'], { name: 'idx_stock_receipts_date' });
    await queryInterface.addIndex('stock_receipts', ['shopee_waybill'], { name: 'idx_stock_receipts_shopee_waybill' });

    await queryInterface.addIndex('stock_receipt_lines', ['receipt_id'], { name: 'idx_stock_receipt_lines_receipt_id' });
    await queryInterface.addIndex('stock_receipt_lines', ['item_id'], { name: 'idx_stock_receipt_lines_item_id' });

    await queryInterface.addIndex('stock_issues', ['issue_date'], { name: 'idx_stock_issues_date' });

    await queryInterface.addIndex('stock_issue_lines', ['issue_id'], { name: 'idx_stock_issue_lines_issue_id' });
    await queryInterface.addIndex('stock_issue_lines', ['item_id'], { name: 'idx_stock_issue_lines_item_id' });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('stock_issue_lines');
    await queryInterface.dropTable('stock_issues');
    await queryInterface.dropTable('stock_receipt_lines');
    await queryInterface.dropTable('stock_receipts');
    await queryInterface.dropTable('stock_items');
  },
};
