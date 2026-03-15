'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add new status values for multi-level approval
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'pending';
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'approved_by_head';
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'approved_by_admin';
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'approved_by_director';
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'rejected_by_head';
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'rejected_by_admin';
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'rejected_by_director';
      ALTER TYPE "enum_maintenance_requests_status" ADD VALUE IF NOT EXISTS 'completed';
    `);

    // Add approval tracking columns
    await queryInterface.addColumn('maintenance_requests', 'current_approval_level', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Current approval level: 1=Head, 2=Admin, 3=Director',
    });

    await queryInterface.addColumn('maintenance_requests', 'head_approved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    await queryInterface.addColumn('maintenance_requests', 'head_approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('maintenance_requests', 'head_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('maintenance_requests', 'admin_approved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    await queryInterface.addColumn('maintenance_requests', 'admin_approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('maintenance_requests', 'admin_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('maintenance_requests', 'director_approved_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    await queryInterface.addColumn('maintenance_requests', 'director_approved_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addColumn('maintenance_requests', 'director_notes', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('maintenance_requests', 'rejection_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
    });

    await queryInterface.addColumn('maintenance_requests', 'rejected_by', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    });

    await queryInterface.addColumn('maintenance_requests', 'rejected_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    // Create index for current_approval_level
    await queryInterface.addIndex('maintenance_requests', ['current_approval_level']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('maintenance_requests', 'current_approval_level');
    await queryInterface.removeColumn('maintenance_requests', 'head_approved_by');
    await queryInterface.removeColumn('maintenance_requests', 'head_approved_at');
    await queryInterface.removeColumn('maintenance_requests', 'head_notes');
    await queryInterface.removeColumn('maintenance_requests', 'admin_approved_by');
    await queryInterface.removeColumn('maintenance_requests', 'admin_approved_at');
    await queryInterface.removeColumn('maintenance_requests', 'admin_notes');
    await queryInterface.removeColumn('maintenance_requests', 'director_approved_by');
    await queryInterface.removeColumn('maintenance_requests', 'director_approved_at');
    await queryInterface.removeColumn('maintenance_requests', 'director_notes');
    await queryInterface.removeColumn('maintenance_requests', 'rejection_reason');
    await queryInterface.removeColumn('maintenance_requests', 'rejected_by');
    await queryInterface.removeColumn('maintenance_requests', 'rejected_at');
  }
};
