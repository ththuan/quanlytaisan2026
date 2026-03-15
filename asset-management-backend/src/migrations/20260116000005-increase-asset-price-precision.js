'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tăng precision cho các field giá trị từ DECIMAL(12,2) lên DECIMAL(15,2) 
    // để chứa được giá trị tài sản lớn hơn 10 tỷ
    await queryInterface.changeColumn('assets', 'purchase_price', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });

    await queryInterface.changeColumn('assets', 'current_value', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
    });

    await queryInterface.changeColumn('assets', 'residual_value', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      comment: 'Giá trị còn lại (đồng)',
    });

    await queryInterface.changeColumn('assets', 'accumulated_depreciation', {
      type: Sequelize.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Khấu hao lũy kế (VND)',
    });
  },

  async down(queryInterface, Sequelize) {
    // Rollback về DECIMAL(12,2)
    await queryInterface.changeColumn('assets', 'purchase_price', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });

    await queryInterface.changeColumn('assets', 'current_value', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });

    await queryInterface.changeColumn('assets', 'residual_value', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
    });

    await queryInterface.changeColumn('assets', 'accumulated_depreciation', {
      type: Sequelize.DECIMAL(12, 2),
      allowNull: true,
      defaultValue: 0,
    });
  }
};
