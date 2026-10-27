'use strict';

/**
 * Quản lý tài sản theo cá nhân:
 * - users.job_title: chức danh (nhập tự do, dùng để đối chiếu định mức theo nhóm chức danh).
 * - assets.assigned_user_id / assigned_at: người đang sử dụng tài sản.
 * - asset_assignments: lịch sử bàn giao (từ ai → cho ai, ai thực hiện, ghi chú).
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'job_title', {
      type: Sequelize.STRING(150),
      allowNull: true,
      comment: 'Chức danh (Trưởng phòng, Giảng viên, Nhân viên...)',
    });
    await queryInterface.addColumn('assets', 'assigned_user_id', {
      type: Sequelize.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'Người đang sử dụng tài sản',
    });
    await queryInterface.addColumn('assets', 'assigned_at', {
      type: Sequelize.DATE,
      allowNull: true,
      comment: 'Thời điểm bàn giao cho người sử dụng hiện tại',
    });

    await queryInterface.createTable('asset_assignments', {
      id: { type: Sequelize.INTEGER, primaryKey: true, autoIncrement: true },
      asset_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'assets', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'CASCADE',
      },
      from_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      to_user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'SET NULL',
      },
      assigned_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: { model: 'users', key: 'id' },
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
      notes: { type: Sequelize.TEXT, allowNull: true },
      assigned_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      created_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
      updated_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
    });

    await queryInterface.addIndex('assets', ['assigned_user_id']);
    await queryInterface.addIndex('asset_assignments', ['asset_id']);
    await queryInterface.addIndex('asset_assignments', ['to_user_id']);
    await queryInterface.addIndex('asset_assignments', ['assigned_at']);
  },

  async down(queryInterface) {
    try { await queryInterface.dropTable('asset_assignments'); } catch (e) { /* ignore */ }
    for (const [table, col] of [
      ['assets', 'assigned_at'],
      ['assets', 'assigned_user_id'],
      ['users', 'job_title'],
    ]) {
      try { await queryInterface.removeColumn(table, col); } catch (e) { /* ignore */ }
    }
  },
};
