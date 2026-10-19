'use strict';

/** Thêm ảnh hiện trạng cho kiểm kê: từng dòng tài sản + ảnh tổng thể của báo cáo/đơn vị. */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('inventory_report_details', 'image_urls', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Danh sách URL ảnh hiện trạng của tài sản khi kiểm kê',
    });

    await queryInterface.addColumn('inventory_reports', 'image_urls', {
      type: Sequelize.JSONB,
      allowNull: false,
      defaultValue: [],
      comment: 'Danh sách URL ảnh tổng thể đơn vị khi kiểm kê',
    });
  },

  async down(queryInterface) {
    try { await queryInterface.removeColumn('inventory_report_details', 'image_urls'); } catch (e) { /* ignore */ }
    try { await queryInterface.removeColumn('inventory_reports', 'image_urls'); } catch (e) { /* ignore */ }
  },
};
