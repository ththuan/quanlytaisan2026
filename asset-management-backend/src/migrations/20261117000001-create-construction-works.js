'use strict';

/**
 * Migration: quản lý các công trình/hạng mục sửa chữa nhỏ
 * (lót gạch, làm nền, sửa phòng, chống thấm...).
 */

module.exports = {
  async up(queryInterface, Sequelize) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('construction_works')) return;

    await queryInterface.createTable('construction_works', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
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
      asset_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'assets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      contractor: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      start_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      end_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      estimated_cost: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      actual_cost: {
        type: Sequelize.DECIMAL(15, 2),
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
        allowNull: false,
        defaultValue: 'planned',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      updated_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
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

    await queryInterface.addIndex('construction_works', ['status']);
    await queryInterface.addIndex('construction_works', ['department_id']);
    await queryInterface.addIndex('construction_works', ['asset_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('construction_works');
  },
};
