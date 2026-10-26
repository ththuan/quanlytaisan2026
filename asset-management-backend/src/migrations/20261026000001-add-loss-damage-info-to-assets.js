'use strict';

/**
 * Bổ sung thông tin xử lý mất/hư hỏng trực tiếp trên tài sản:
 * - nguyên nhân, trách nhiệm, số tiền bồi thường.
 * Cho phép nhập/sửa nhanh ở form tài sản và báo cáo mất/hư hỏng mà không
 * phụ thuộc vào lần kiểm kê gần nhất.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('assets', 'discrepancy_reason', {
      type: Sequelize.TEXT,
      allowNull: true,
      comment: 'Nguyên nhân mất/hư hỏng',
    });
    await queryInterface.addColumn('assets', 'responsibility', {
      type: Sequelize.STRING(255),
      allowNull: true,
      comment: 'Trách nhiệm (tập thể/cá nhân)',
    });
    await queryInterface.addColumn('assets', 'compensation_amount', {
      type: Sequelize.DECIMAL(18, 2),
      allowNull: true,
      comment: 'Số tiền bồi thường',
    });
  },

  async down(queryInterface) {
    for (const col of ['discrepancy_reason', 'responsibility', 'compensation_amount']) {
      try { await queryInterface.removeColumn('assets', col); } catch (e) { /* ignore */ }
    }
  },
};
