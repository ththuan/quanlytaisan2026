'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('request_approvals', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      entity_type: {
        type: Sequelize.ENUM('maintenance_request', 'asset_transfer'),
        allowNull: false,
      },
      entity_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: 'ID of the maintenance_request or asset_transfer',
      },
      approver_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'users',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      approver_role: {
        type: Sequelize.ENUM('department_head', 'admin', 'director'),
        allowNull: false,
      },
      approver_name: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      approver_email: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      decision: {
        type: Sequelize.ENUM('approved', 'rejected'),
        allowNull: false,
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Reason for rejection (required if rejected)',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Additional notes',
      },
      approval_level: {
        type: Sequelize.INTEGER,
        allowNull: false,
        comment: '1=Head, 2=Admin, 3=Director',
      },
      decided_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.NOW,
      },
    });

    // Add indexes
    await queryInterface.addIndex('request_approvals', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('request_approvals', ['approver_id']);
    await queryInterface.addIndex('request_approvals', ['decided_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('request_approvals');
  }
};
