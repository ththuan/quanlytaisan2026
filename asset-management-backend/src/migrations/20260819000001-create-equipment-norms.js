'use strict';

/**
 * Module Định mức sử dụng máy móc, thiết bị (QĐ 15/2025/QĐ-TTg, sửa đổi bởi QĐ 10/2026/QĐ-TTg)
 * - equipment_norms: danh mục định mức (số lượng tối đa, mức giá tối đa)
 * - norm_warnings: cảnh báo khi thêm/sửa tài sản vượt định mức (chỉ cảnh báo, không chặn)
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('equipment_norms', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      document_no: { type: Sequelize.STRING(100), allowNull: true },
      effective_date: { type: Sequelize.DATEONLY, allowNull: true },
      scope: {
        type: Sequelize.ENUM('title', 'room', 'digital', 'secret', 'other'),
        allowNull: false,
        defaultValue: 'other',
        comment: 'Phạm vi: theo chức danh / phòng làm việc / thiết bị số / bảo mật / khác',
      },
      position_group: { type: Sequelize.STRING(255), allowNull: true, comment: 'Nhóm/bậc chức danh (nếu có)' },
      equipment_name: { type: Sequelize.STRING(255), allowNull: false, comment: 'Tên máy móc, thiết bị' },
      unit: { type: Sequelize.STRING(30), allowNull: false, defaultValue: 'bộ' },
      max_quantity: { type: Sequelize.INTEGER, allowNull: true, comment: 'Số lượng tối đa' },
      max_price: { type: Sequelize.DECIMAL(15, 2), allowNull: true, comment: 'Mức giá tối đa (triệu đồng/chiếc hoặc bộ)' },
      note: { type: Sequelize.TEXT, allowNull: true },
      is_active: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('equipment_norms', ['equipment_name']);
    await queryInterface.addIndex('equipment_norms', ['scope', 'is_active']);

    await queryInterface.createTable('norm_warnings', {
      id: { type: Sequelize.INTEGER, autoIncrement: true, primaryKey: true, allowNull: false },
      asset_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'assets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'departments', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      norm_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'equipment_norms', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      warning_type: { type: Sequelize.STRING(20), allowNull: false, comment: 'quantity | price' },
      message: { type: Sequelize.TEXT, allowNull: false },
      asset_code: { type: Sequelize.STRING(100), allowNull: true },
      asset_name: { type: Sequelize.STRING(255), allowNull: true },
      purchase_price: { type: Sequelize.DECIMAL(18, 2), allowNull: true },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      acknowledged: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      acknowledged_by: { type: Sequelize.INTEGER, allowNull: true },
      acknowledged_at: { type: Sequelize.DATE, allowNull: true },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });
    await queryInterface.addIndex('norm_warnings', ['department_id', 'acknowledged']);
    await queryInterface.addIndex('norm_warnings', ['asset_id']);
    await queryInterface.addIndex('norm_warnings', ['created_at']);
  },

  async down(queryInterface) {
    try { await queryInterface.dropTable('norm_warnings'); } catch (e) { /* ignore */ }
    try { await queryInterface.dropTable('equipment_norms'); } catch (e) { /* ignore */ }
  },
};
