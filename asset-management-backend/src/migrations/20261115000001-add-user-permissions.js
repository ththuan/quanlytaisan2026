'use strict';

/**
 * Migration: phân quyền chức năng theo người dùng.
 * - users.permissions_customized: đánh dấu user đã được admin cấu hình quyền riêng.
 * - user_permissions: danh sách quyền + phạm vi (own/department/all).
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const users = await queryInterface.describeTable('users');
    if (!users.permissions_customized) {
      await queryInterface.addColumn('users', 'permissions_customized', {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: false,
      });
    }

    const tables = await queryInterface.showAllTables();
    if (tables.includes('user_permissions')) return;

    await queryInterface.createTable('user_permissions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      permission_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
      },
      scope: {
        type: Sequelize.ENUM('own', 'department', 'all'),
        allowNull: false,
        defaultValue: 'department',
      },
      granted_by: {
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

    await queryInterface.addIndex('user_permissions', ['user_id'], {
      name: 'idx_user_permissions_user_id',
    });
    await queryInterface.addIndex('user_permissions', ['permission_code'], {
      name: 'idx_user_permissions_code',
    });
    await queryInterface.addConstraint('user_permissions', {
      fields: ['user_id', 'permission_code'],
      type: 'unique',
      name: 'uq_user_permissions_user_code',
    });
  },

  async down(queryInterface) {
    const tables = await queryInterface.showAllTables();
    if (tables.includes('user_permissions')) {
      await queryInterface.dropTable('user_permissions');
    }
    const users = await queryInterface.describeTable('users');
    if (users.permissions_customized) {
      await queryInterface.removeColumn('users', 'permissions_customized');
    }
  },
};
