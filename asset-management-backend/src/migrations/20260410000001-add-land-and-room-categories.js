'use strict';

/**
 * Migration: Thêm danh mục Đất, Phòng học, Phòng thực hành
 * Ngày: 10/04/2026
 *
 * Mục đích:
 * - Thêm danh mục "Đất" (không khấu hao) làm nhóm cha mới
 * - Thêm "Phòng học", "Phòng thực hành" vào nhóm "Nhà, công trình xây dựng"
 * - Chỉ INSERT nếu code chưa tồn tại để tránh trùng lặp
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    const newCategories = [
      // ===== NHÓM CHA: ĐẤT (không khấu hao theo quy định) =====
      {
        code: '08',
        name: 'Đất',
        parent_code: null,
        unit: 'm2',
        category_group: 'nha_cua',
        tracking_type: 'individual',
        is_depreciable: false,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Đất - Không tính khấu hao theo quy định',
        is_active: true,
        sort_order: 700,
        created_at: now,
        updated_at: now,
      },
      // 8.1. Đất khuôn viên, sân trường
      {
        code: '0801',
        name: 'Đất khuôn viên, sân trường',
        parent_code: '08',
        unit: 'm2',
        category_group: 'nha_cua',
        tracking_type: 'individual',
        is_depreciable: false,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Đất khuôn viên, sân trường - Không tính khấu hao',
        is_active: true,
        sort_order: 710,
        created_at: now,
        updated_at: now,
      },
      // 8.2. Đất cơ sở (các cơ sở của nhà trường)
      {
        code: '0802',
        name: 'Đất cơ sở',
        parent_code: '08',
        unit: 'm2',
        category_group: 'nha_cua',
        tracking_type: 'individual',
        is_depreciable: false,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Đất cơ sở nhà trường - Không tính khấu hao',
        is_active: true,
        sort_order: 720,
        created_at: now,
        updated_at: now,
      },
      // 8.3. Đất nông nghiệp / thực nghiệm
      {
        code: '0803',
        name: 'Đất nông nghiệp, thực nghiệm',
        parent_code: '08',
        unit: 'm2',
        category_group: 'nha_cua',
        tracking_type: 'individual',
        is_depreciable: false,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Đất nông nghiệp, đất thực nghiệm - Không tính khấu hao',
        is_active: true,
        sort_order: 730,
        created_at: now,
        updated_at: now,
      },

      // ===== PHÒNG HỌC (con của "01" - Nhà, công trình xây dựng) =====
      {
        code: '0106',
        name: 'Phòng học',
        parent_code: '01',
        unit: 'm2',
        category_group: 'nha_cua',
        tracking_type: 'individual',
        is_depreciable: false,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Phòng học lý thuyết - Chỉ quản lý diện tích, không tính khấu hao riêng (tòa nhà đã khấu hao tổng thể)',
        is_active: true,
        sort_order: 60,
        created_at: now,
        updated_at: now,
      },
      // ===== PHÒNG THỰC HÀNH (con của "01") =====
      {
        code: '0107',
        name: 'Phòng thực hành',
        parent_code: '01',
        unit: 'm2',
        category_group: 'nha_cua',
        tracking_type: 'individual',
        is_depreciable: false,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Phòng thực hành, phòng thí nghiệm - Chỉ quản lý diện tích, không tính khấu hao riêng',
        is_active: true,
        sort_order: 70,
        created_at: now,
        updated_at: now,
      },
      // ===== PHÒNG LÝ THUYẾT / HỘI TRƯỜNG (con của "01") =====
      {
        code: '0108',
        name: 'Hội trường, phòng đa chức năng',
        parent_code: '01',
        unit: 'm2',
        category_group: 'nha_cua',
        tracking_type: 'individual',
        is_depreciable: false,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Hội trường, phòng đa chức năng - Chỉ quản lý diện tích, không tính khấu hao riêng',
        is_active: true,
        sort_order: 80,
        created_at: now,
        updated_at: now,
      },
    ];

    // INSERT từng danh mục - chỉ thêm nếu code chưa tồn tại
    for (const cat of newCategories) {
      const [existing] = await queryInterface.sequelize.query(
        `SELECT id FROM asset_categories WHERE code = :code LIMIT 1`,
        { replacements: { code: cat.code }, type: queryInterface.sequelize.QueryTypes.SELECT }
      );

      if (!existing) {
        await queryInterface.bulkInsert('asset_categories', [cat]);
        console.log(`✅ Đã thêm danh mục: ${cat.code} - ${cat.name}`);
      } else {
        console.log(`⚠️  Danh mục ${cat.code} đã tồn tại, bỏ qua.`);
      }
    }

    console.log('✅ Migration thêm danh mục Đất, Phòng học, Phòng thực hành hoàn tất');
  },

  async down(queryInterface, Sequelize) {
    const codes = ['08', '0801', '0802', '0803', '0106', '0107', '0108'];
    await queryInterface.bulkDelete('asset_categories', {
      code: codes,
    }, {});
    console.log('✅ Đã xóa các danh mục được thêm bởi migration này');
  },
};
