'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add estimated_unit_price column
    await queryInterface.addColumn('maintenance_requests', 'estimated_unit_price', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      comment: 'Đơn giá dự toán (nếu có)',
    });

    // Add product_link column
    await queryInterface.addColumn('maintenance_requests', 'product_link', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Link sản phẩm (nếu có)',
    });

    // Add product_image column
    await queryInterface.addColumn('maintenance_requests', 'product_image', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Hình ảnh sản phẩm (base64 hoặc URL)',
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('maintenance_requests', 'estimated_unit_price');
    await queryInterface.removeColumn('maintenance_requests', 'product_link');
    await queryInterface.removeColumn('maintenance_requests', 'product_image');
  }
};
