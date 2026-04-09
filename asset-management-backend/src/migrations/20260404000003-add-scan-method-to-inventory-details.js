'use strict';

/**
 * Thêm scan_method và manual_reason vào inventory_report_details
 *
 * scan_method:
 *   'qr_scan'       – Tài sản được xác nhận bằng cách quét QR code thực tế.
 *   'manual_confirm'– Người kiểm kê xác nhận thủ công vì mã QR không đọc được.
 *   'area_manual'   – Tài sản diện tích (m², ha...) luôn kiểm thủ công.
 *   'batch'         – Kiểm kê theo nhóm (công cụ dụng cụ nhỏ).
 *
 * manual_reason: Bắt buộc điền khi scan_method = 'manual_confirm'.
 * Lưu vết để kiểm tra gian lận: giám sát viên / kiểm toán có thể lọc
 * tất cả tài sản "xác nhận thủ công" và xem xét lý do.
 */
module.exports = {
  up: async (queryInterface, Sequelize) => {
    await queryInterface.addColumn('inventory_report_details', 'scan_method', {
      type: Sequelize.ENUM('qr_scan', 'manual_confirm', 'area_manual', 'batch'),
      allowNull: true, // null = dữ liệu cũ trước khi có tính năng này
      defaultValue: null,
    });

    await queryInterface.addColumn('inventory_report_details', 'manual_reason', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Lý do không quét được QR - bắt buộc khi scan_method = manual_confirm',
    });
  },

  down: async (queryInterface) => {
    await queryInterface.removeColumn('inventory_report_details', 'scan_method');
    await queryInterface.removeColumn('inventory_report_details', 'manual_reason');
    await queryInterface.sequelize.query(
      `DROP TYPE IF EXISTS "enum_inventory_report_details_scan_method"`
    );
  },
};
