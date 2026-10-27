'use strict';

/**
 * Thêm cơ sở (Trụ sở chính / Cơ sở Tân An) cho phòng ban, tài sản và lịch sử điều chuyển.
 * - Mỗi phòng ban thuộc 1 cơ sở.
 * - Tài sản lấy cơ sở theo phòng ban hiện tại (lưu kèm để lọc/thống kê).
 * - Điều chuyển lưu lại cơ sở đi/đến để tra cứu lịch sử.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('departments', 'campus', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'main',
      comment: 'Cơ sở: main = Trụ sở chính, tan_an = Cơ sở Tân An',
    });
    await queryInterface.addColumn('assets', 'campus', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'main',
      comment: 'Cơ sở của tài sản (theo phòng ban hiện tại)',
    });
    await queryInterface.addColumn('asset_transfers', 'from_campus', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Cơ sở nơi giao',
    });
    await queryInterface.addColumn('asset_transfers', 'to_campus', {
      type: Sequelize.STRING(20),
      allowNull: true,
      comment: 'Cơ sở nơi nhận',
    });

    // Đồng bộ dữ liệu cũ: tài sản theo cơ sở của phòng ban hiện tại.
    await queryInterface.sequelize.query(`
      UPDATE assets AS a
      SET campus = d.campus
      FROM departments AS d
      WHERE a.current_department_id = d.id;
    `);

    // Đồng bộ lịch sử điều chuyển cũ.
    await queryInterface.sequelize.query(`
      UPDATE asset_transfers AS t
      SET from_campus = d.campus
      FROM departments AS d
      WHERE t.from_department_id = d.id;
    `);
    await queryInterface.sequelize.query(`
      UPDATE asset_transfers AS t
      SET to_campus = d.campus
      FROM departments AS d
      WHERE t.to_department_id = d.id;
    `);

    await queryInterface.addIndex('departments', ['campus']);
    await queryInterface.addIndex('assets', ['campus']);
  },

  async down(queryInterface) {
    for (const [table, col] of [
      ['asset_transfers', 'to_campus'],
      ['asset_transfers', 'from_campus'],
      ['assets', 'campus'],
      ['departments', 'campus'],
    ]) {
      try { await queryInterface.removeColumn(table, col); } catch (e) { /* ignore */ }
    }
    try { await queryInterface.removeIndex('departments', ['campus']); } catch (e) { /* ignore */ }
    try { await queryInterface.removeIndex('assets', ['campus']); } catch (e) { /* ignore */ }
  },
};
