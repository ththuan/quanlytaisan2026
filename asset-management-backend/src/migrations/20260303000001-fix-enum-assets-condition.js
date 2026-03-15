'use strict';

/**
 * Migration: Fix enum_assets_condition
 * Thêm các giá trị còn thiếu vào ENUM condition của bảng assets.
 * Ban đầu migration chỉ tạo: good, fair, poor
 * Model yêu cầu: good, fair, poor, usable, needs_repair, damaged, disposed
 *
 * Không có IF NOT EXISTS sẵn trong Sequelize queryInterface nên dùng raw SQL.
 */
module.exports = {
  async up(queryInterface) {
    // Kiểm tra và thêm từng giá trị còn thiếu
    const missingValues = ['usable', 'needs_repair', 'damaged', 'disposed'];

    for (const value of missingValues) {
      // Kiểm tra giá trị đã tồn tại chưa
      const [rows] = await queryInterface.sequelize.query(
        `SELECT 1 FROM pg_enum
         JOIN pg_type ON pg_enum.enumtypid = pg_type.oid
         WHERE typname = 'enum_assets_condition' AND enumlabel = :value`,
        { replacements: { value } }
      );

      if (rows.length === 0) {
        await queryInterface.sequelize.query(
          `ALTER TYPE "enum_assets_condition" ADD VALUE '${value}'`
        );
        console.log(`Added ENUM value '${value}' to enum_assets_condition`);
      } else {
        console.log(`ENUM value '${value}' already exists in enum_assets_condition, skipping`);
      }
    }
  },

  async down() {
    // PostgreSQL không hỗ trợ xóa giá trị khỏi ENUM trực tiếp.
    // Nếu cần rollback phải recreate bảng - bỏ qua.
    console.log('Cannot remove ENUM values in PostgreSQL. Rollback skipped.');
  },
};
