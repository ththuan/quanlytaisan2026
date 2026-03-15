'use strict';

/**
 * Sửa công thức quantity_discrepancy: thiếu = âm (-1), thừa = dương (+1)
 * Công thức mới: actual_quantity - assigned_quantity
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE inventory_report_details
      SET quantity_discrepancy = actual_quantity - assigned_quantity
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      UPDATE inventory_report_details
      SET quantity_discrepancy = assigned_quantity - actual_quantity
    `);
  },
};
