'use strict';

/**
 * Tối ưu hiệu năng cho dữ liệu lớn (15k–20k+ tài sản):
 * - Thêm index cho các cột lọc/sắp xếp phổ biến.
 * - Bật pg_trgm + GIN index để tìm kiếm ILIKE (%term%) nhanh.
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const addIndexSafe = async (table, fields, options = {}) => {
      try {
        await queryInterface.addIndex(table, fields, options);
      } catch (e) {
        // index đã tồn tại → bỏ qua
      }
    };

    // assets: lọc/sắp xếp
    await addIndexSafe('assets', ['name']);
    await addIndexSafe('assets', ['category_id']);
    await addIndexSafe('assets', ['category_code']);
    await addIndexSafe('assets', ['created_at']);
    await addIndexSafe('assets', ['updated_at']);
    await addIndexSafe('assets', ['current_department_id', 'status'], {
      name: 'assets_dept_status_idx',
    });

    // audit_logs: tra cứu theo thời gian
    await addIndexSafe('audit_logs', ['created_at']);
    await addIndexSafe('audit_logs', ['user_id', 'created_at'], {
      name: 'audit_logs_user_created_idx',
    });

    // inventory_reports / details tra cứu theo đơn vị & trạng thái
    await addIndexSafe('inventory_reports', ['department_id', 'status'], {
      name: 'inventory_reports_dept_status_idx',
    });
    await addIndexSafe('inventory_report_details', ['asset_id']);

    // Tìm kiếm ILIKE nhanh bằng trigram (Postgres)
    try {
      await queryInterface.sequelize.query('CREATE EXTENSION IF NOT EXISTS pg_trgm;');
      await queryInterface.sequelize.query(
        'CREATE INDEX IF NOT EXISTS assets_name_trgm_idx ON assets USING gin (name gin_trgm_ops);'
      );
      await queryInterface.sequelize.query(
        'CREATE INDEX IF NOT EXISTS assets_code_trgm_idx ON assets USING gin (asset_code gin_trgm_ops);'
      );
    } catch (e) {
      // Một số môi trường không cho phép tạo extension — bỏ qua, app vẫn chạy
    }
  },

  async down(queryInterface) {
    const removeIndexSafe = async (table, nameOrFields) => {
      try {
        await queryInterface.removeIndex(table, nameOrFields);
      } catch (e) {
        // ignore
      }
    };
    await removeIndexSafe('assets', 'assets_name_trgm_idx');
    await removeIndexSafe('assets', 'assets_code_trgm_idx');
    await removeIndexSafe('assets', 'assets_dept_status_idx');
    await removeIndexSafe('assets', ['name']);
    await removeIndexSafe('assets', ['category_id']);
    await removeIndexSafe('assets', ['category_code']);
    await removeIndexSafe('assets', ['created_at']);
    await removeIndexSafe('assets', ['updated_at']);
    await removeIndexSafe('audit_logs', 'audit_logs_user_created_idx');
    await removeIndexSafe('audit_logs', ['created_at']);
    await removeIndexSafe('inventory_reports', 'inventory_reports_dept_status_idx');
    await removeIndexSafe('inventory_report_details', ['asset_id']);
  },
};
