'use strict';

/**
 * Cho phép số lượng kiểm kê là số lẻ (tài sản diện tích m², ha...).
 * Chuyển các cột số lượng từ INTEGER sang DOUBLE PRECISION.
 */
module.exports = {
  async up(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE inventory_report_details
        ALTER COLUMN assigned_quantity TYPE double precision USING assigned_quantity::double precision,
        ALTER COLUMN actual_quantity TYPE double precision USING actual_quantity::double precision,
        ALTER COLUMN quantity_discrepancy TYPE double precision USING quantity_discrepancy::double precision
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE inventory_reports
        ALTER COLUMN total_assigned_quantity TYPE double precision USING total_assigned_quantity::double precision,
        ALTER COLUMN total_actual_quantity TYPE double precision USING total_actual_quantity::double precision,
        ALTER COLUMN total_discrepancy TYPE double precision USING total_discrepancy::double precision
    `);
  },

  async down(queryInterface) {
    await queryInterface.sequelize.query(`
      ALTER TABLE inventory_report_details
        ALTER COLUMN assigned_quantity TYPE integer USING round(assigned_quantity)::integer,
        ALTER COLUMN actual_quantity TYPE integer USING round(actual_quantity)::integer,
        ALTER COLUMN quantity_discrepancy TYPE integer USING round(quantity_discrepancy)::integer
    `);
    await queryInterface.sequelize.query(`
      ALTER TABLE inventory_reports
        ALTER COLUMN total_assigned_quantity TYPE integer USING round(total_assigned_quantity)::integer,
        ALTER COLUMN total_actual_quantity TYPE integer USING round(total_actual_quantity)::integer,
        ALTER COLUMN total_discrepancy TYPE integer USING round(total_discrepancy)::integer
    `);
  },
};
