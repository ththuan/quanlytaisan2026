'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Helper function to check if column exists
    const columnExists = async (table, column) => {
      const result = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}'`
      );
      return result[0].length > 0;
    };

    // Add new status values for transfer approval
    await queryInterface.sequelize.query(`
      ALTER TYPE "enum_asset_transfers_status" ADD VALUE IF NOT EXISTS 'approved_by_head';
      ALTER TYPE "enum_asset_transfers_status" ADD VALUE IF NOT EXISTS 'rejected_by_head';
    `);

    // Add head approval tracking columns (idempotent)
    if (!(await columnExists('asset_transfers', 'head_approved_by'))) {
      await queryInterface.addColumn('asset_transfers', 'head_approved_by', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      });
    }

    if (!(await columnExists('asset_transfers', 'head_approved_at'))) {
      await queryInterface.addColumn('asset_transfers', 'head_approved_at', {
        type: Sequelize.DATE,
        allowNull: true,
      });
    }

    if (!(await columnExists('asset_transfers', 'head_notes'))) {
      await queryInterface.addColumn('asset_transfers', 'head_notes', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }

    if (!(await columnExists('asset_transfers', 'rejection_reason'))) {
      await queryInterface.addColumn('asset_transfers', 'rejection_reason', {
        type: Sequelize.TEXT,
        allowNull: true,
      });
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('asset_transfers', 'head_approved_by');
    await queryInterface.removeColumn('asset_transfers', 'head_approved_at');
    await queryInterface.removeColumn('asset_transfers', 'head_notes');
    await queryInterface.removeColumn('asset_transfers', 'rejection_reason');
  }
};
