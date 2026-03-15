'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Guard: only add columns if they don't exist
    const table = await queryInterface.describeTable('procurements');

    if (!table.supplier_name) {
      await queryInterface.addColumn('procurements', 'supplier_name', {
        type: Sequelize.STRING(255),
        allowNull: true,
      });
    }

    if (!table.contract_no) {
      await queryInterface.addColumn('procurements', 'contract_no', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!table.invoice_no) {
      await queryInterface.addColumn('procurements', 'invoice_no', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    if (!table.order_code) {
      await queryInterface.addColumn('procurements', 'order_code', {
        type: Sequelize.STRING(100),
        allowNull: true,
      });
    }

    // Best-effort indexes (skip if already exists)
    try { await queryInterface.addIndex('procurements', ['supplier_name'], { name: 'idx_procurements_supplier_name' }); } catch {}
    try { await queryInterface.addIndex('procurements', ['contract_no'], { name: 'idx_procurements_contract_no' }); } catch {}
    try { await queryInterface.addIndex('procurements', ['invoice_no'], { name: 'idx_procurements_invoice_no' }); } catch {}
    try { await queryInterface.addIndex('procurements', ['order_code'], { name: 'idx_procurements_order_code' }); } catch {}
  },

  async down(queryInterface) {
    // Guard: only remove if exists
    const table = await queryInterface.describeTable('procurements');

    try { await queryInterface.removeIndex('procurements', 'idx_procurements_order_code'); } catch {}
    try { await queryInterface.removeIndex('procurements', 'idx_procurements_invoice_no'); } catch {}
    try { await queryInterface.removeIndex('procurements', 'idx_procurements_contract_no'); } catch {}
    try { await queryInterface.removeIndex('procurements', 'idx_procurements_supplier_name'); } catch {}

    if (table.order_code) await queryInterface.removeColumn('procurements', 'order_code');
    if (table.invoice_no) await queryInterface.removeColumn('procurements', 'invoice_no');
    if (table.contract_no) await queryInterface.removeColumn('procurements', 'contract_no');
    if (table.supplier_name) await queryInterface.removeColumn('procurements', 'supplier_name');
  },
};
