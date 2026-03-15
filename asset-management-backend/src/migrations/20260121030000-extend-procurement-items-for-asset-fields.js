'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('procurement_items', 'asset_type', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('procurement_items', 'residual_value', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      comment: 'Giá trị còn lại (đồng)',
    });
    await queryInterface.addColumn('procurement_items', 'serial_number', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('procurement_items', 'warranty_date', {
      type: Sequelize.DATEONLY,
      allowNull: true,
    });
    await queryInterface.addColumn('procurement_items', 'location', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('procurement_items', 'asset_condition', {
      type: Sequelize.ENUM('good', 'usable', 'needs_repair', 'damaged', 'disposed'),
      allowNull: true,
      defaultValue: 'good',
    });
    await queryInterface.addColumn('procurement_items', 'land_parcel_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
    });

    await queryInterface.addIndex('procurement_items', ['category_id'], { name: 'idx_procurement_items_category_id' });
    await queryInterface.addIndex('procurement_items', ['category_code'], { name: 'idx_procurement_items_category_code' });
  },

  async down(queryInterface) {
    await queryInterface.removeIndex('procurement_items', 'idx_procurement_items_category_code');
    await queryInterface.removeIndex('procurement_items', 'idx_procurement_items_category_id');

    await queryInterface.removeColumn('procurement_items', 'land_parcel_id');
    await queryInterface.removeColumn('procurement_items', 'asset_condition');
    await queryInterface.removeColumn('procurement_items', 'location');
    await queryInterface.removeColumn('procurement_items', 'warranty_date');
    await queryInterface.removeColumn('procurement_items', 'serial_number');
    await queryInterface.removeColumn('procurement_items', 'residual_value');
    await queryInterface.removeColumn('procurement_items', 'asset_type');

    // Cleanup enum type in Postgres
    await queryInterface.sequelize.query('DROP TYPE IF EXISTS \"enum_procurement_items_asset_condition\";');
  },
};

