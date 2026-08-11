'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Add disposal workflow dates to asset_disposal_cases
    const disposalColumns = [
      { name: 'recovery_date', comment: 'Ngày thu hồi tài sản' },
      { name: 'sale_date', comment: 'Ngày bán tài sản' },
      { name: 'liquidation_date', comment: 'Ngày thanh lý tài sản' },
      { name: 'destruction_date', comment: 'Ngày tiêu hủy tài sản' },
      { name: 'completed_date', comment: 'Ngày hoàn tất xử lý' },
    ];

    for (const col of disposalColumns) {
      const exists = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = 'asset_disposal_cases' AND column_name = '${col.name}'`
      );
      if (exists[0].length === 0) {
        await queryInterface.addColumn('asset_disposal_cases', col.name, {
          type: Sequelize.DATEONLY,
          allowNull: true,
          comment: col.comment,
        });
      }
    }

    // Add organization_code to departments
    const deptColExists = await queryInterface.sequelize.query(
      `SELECT column_name FROM information_schema.columns WHERE table_name = 'departments' AND column_name = 'organization_code'`
    );
    if (deptColExists[0].length === 0) {
      await queryInterface.addColumn('departments', 'organization_code', {
        type: Sequelize.STRING(50),
        allowNull: true,
        comment: 'Mã đơn vị đồng bộ với CSDL Quốc gia về tài sản công',
      });
    }
  },

  async down(queryInterface) {
    // Remove disposal workflow dates
    await queryInterface.removeColumn('asset_disposal_cases', 'recovery_date');
    await queryInterface.removeColumn('asset_disposal_cases', 'sale_date');
    await queryInterface.removeColumn('asset_disposal_cases', 'liquidation_date');
    await queryInterface.removeColumn('asset_disposal_cases', 'destruction_date');
    await queryInterface.removeColumn('asset_disposal_cases', 'completed_date');
    // Remove organization_code
    await queryInterface.removeColumn('departments', 'organization_code');
  }
};
