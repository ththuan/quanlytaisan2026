'use strict';

/**
 * Migration: Cập nhật danh mục loại tài sản theo Thông tư 141/2025/TT-BTC
 * Ngày: 31/12/2025
 * 
 * Mục đích:
 * - Điều chỉnh lại cấu trúc danh mục theo đúng Phụ lục I
 * - Đảm bảo tỷ lệ khấu hao và thời gian sử dụng chính xác
 * - Cập nhật các loại tài sản còn thiếu
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ===== BƯỚC 1: Cập nhật các danh mục hiện có =====
    
    // Cập nhật Vật kiến trúc - Mục II
    await queryInterface.bulkUpdate('asset_categories',
      {
        name: 'Vật kiến trúc',
        depreciation_rate: 10,
        useful_life_years: 10,
        description: 'Vật kiến trúc - Mặc định 10 năm',
        updated_at: now
      },
      { code: '01103' }
    );

    // ===== BƯỚC 2: Thêm các danh mục chi tiết cho Vật kiến trúc =====
    const newCategories = [
      // Vật kiến trúc - Nhóm 20 năm
      {
        code: '0110301-01',
        name: 'Kho chứa',
        parent_code: '0110301',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 5,
        useful_life_years: 20,
        description: 'Kho chứa - 20 năm - 5%/năm',
        sort_order: 211
      },
      {
        code: '0110301-02',
        name: 'Bể chứa',
        parent_code: '0110301',
        unit: 'm3',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 5,
        useful_life_years: 20,
        description: 'Bể chứa - 20 năm - 5%/năm',
        sort_order: 212
      },
      {
        code: '0110301-03',
        name: 'Bãi đỗ',
        parent_code: '0110301',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 5,
        useful_life_years: 20,
        description: 'Bãi đỗ - 20 năm - 5%/năm',
        sort_order: 213
      },
      {
        code: '0110301-04',
        name: 'Sân phơi',
        parent_code: '0110301',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 5,
        useful_life_years: 20,
        description: 'Sân phơi - 20 năm - 5%/năm',
        sort_order: 214
      },
      {
        code: '0110301-05',
        name: 'Sân chơi',
        parent_code: '0110301',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 5,
        useful_life_years: 20,
        description: 'Sân chơi - 20 năm - 5%/năm',
        sort_order: 215
      },
      {
        code: '0110301-06',
        name: 'Sân thể thao',
        parent_code: '0110301',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 5,
        useful_life_years: 20,
        description: 'Sân thể thao - 20 năm - 5%/năm',
        sort_order: 216
      },
      {
        code: '0110301-07',
        name: 'Bể bơi',
        parent_code: '0110301',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 5,
        useful_life_years: 20,
        description: 'Bể bơi - 20 năm - 5%/năm',
        sort_order: 217
      },
      {
        code: '0110301-08',
        name: 'Công trình điện',
        parent_code: '0110301',
        unit: 'Công trình',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 5,
        useful_life_years: 20,
        description: 'Công trình điện - 20 năm - 5%/năm',
        sort_order: 218
      },
      
      // Vật kiến trúc - Nhóm 10 năm
      {
        code: '0110302-01',
        name: 'Giếng khoan',
        parent_code: '0110302',
        unit: 'Cái',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 10,
        useful_life_years: 10,
        description: 'Giếng khoan - 10 năm - 10%/năm',
        sort_order: 221
      },
      {
        code: '0110302-02',
        name: 'Giếng đào',
        parent_code: '0110302',
        unit: 'Cái',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 10,
        useful_life_years: 10,
        description: 'Giếng đào - 10 năm - 10%/năm',
        sort_order: 222
      },
      {
        code: '0110302-03',
        name: 'Tường rào',
        parent_code: '0110302',
        unit: 'm',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 10,
        useful_life_years: 10,
        description: 'Tường rào - 10 năm - 10%/năm',
        sort_order: 223
      },
    ];

    // Insert các danh mục mới
    for (const cat of newCategories) {
      // Kiểm tra xem đã tồn tại chưa
      const existing = await queryInterface.sequelize.query(
        `SELECT id FROM asset_categories WHERE code = :code`,
        {
          replacements: { code: cat.code },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (existing.length === 0) {
        await queryInterface.bulkInsert('asset_categories', [{
          code: cat.code,
          name: cat.name,
          parent_code: cat.parent_code,
          unit: cat.unit,
          category_group: cat.category_group,
          is_depreciable: cat.is_depreciable,
          depreciation_rate: cat.depreciation_rate,
          useful_life_years: cat.useful_life_years,
          description: cat.description,
          is_active: true,
          sort_order: cat.sort_order,
          created_at: now,
          updated_at: now,
        }]);
      }
    }

    // ===== BƯỚC 3: Cập nhật mô tả cho các danh mục hiện có =====
    const updates = [
      // Nhà cửa
      { code: '01101', description: 'Biệt thự, công trình xây dựng cấp đặc biệt - 80 năm - 1.25%/năm' },
      { code: '0110201', description: 'Nhà cấp I - 80 năm - 1.25%/năm' },
      { code: '0110202', description: 'Nhà cấp II - 50 năm - 2%/năm' },
      { code: '0110203', description: 'Nhà cấp III - 25 năm - 4%/năm' },
      { code: '0110204', description: 'Nhà cấp IV - 15 năm - 6.67%/năm' },
      
      // Xe ô tô
      { code: '01201', description: 'Xe ô tô - 15 năm - 6.67%/năm' },
      { code: '0120101', description: 'Xe ô tô 4-5 chỗ ngồi - 15 năm - 6.67%/năm' },
      { code: '0120102', description: 'Xe ô tô 7-8 chỗ ngồi - 15 năm - 6.67%/năm' },
      { code: '0120103', description: 'Xe ô tô 9-12 chỗ ngồi - 15 năm - 6.67%/năm' },
      { code: '0120104', description: 'Xe ô tô 13-16 chỗ ngồi - 15 năm - 6.67%/năm' },
      { code: '0120105', description: 'Xe ô tô bán tải - 15 năm - 6.67%/năm' },
      { code: '0120106', description: 'Xe ô tô tải - 15 năm - 6.67%/năm' },
      
      // Phương tiện vận tải khác
      { code: '01202', description: 'Phương tiện vận tải khác (ngoài xe ô tô) - 10 năm - 10%/năm' },
      { code: '0120201', description: 'Xe máy - 10 năm - 10%/năm' },
      { code: '0120202', description: 'Xe đạp - 10 năm - 10%/năm' },
      { code: '0120203', description: 'Xe chuyên dụng - 10 năm - 10%/năm' },
      
      // Máy móc thiết bị - Nhóm 1 (10 năm)
      { code: '01401', description: 'Bộ bàn ghế, thang máy, két sắt - 10 năm - 10%/năm' },
      { code: '0140101', description: 'Bộ bàn ghế ngồi làm việc - 10 năm - 10%/năm' },
      { code: '0140102', description: 'Bộ bàn ghế họp - 10 năm - 10%/năm' },
      { code: '0140103', description: 'Bộ bàn ghế tiếp khách - 10 năm - 10%/năm' },
      { code: '0140104', description: 'Giá dựng công văn đi, đến - 10 năm - 10%/năm' },
      { code: '0140105', description: 'Thang máy - 10 năm - 10%/năm' },
      { code: '0140106', description: 'Két sắt - 10 năm - 10%/năm' },
      
      // Máy móc thiết bị - Nhóm 2 (8 năm)
      { code: '01402', description: 'Tủ, điều hòa, máy bơm nước, bàn ghế hội trường - 8 năm - 12.5%/năm' },
      { code: '0140201', description: 'Tủ đựng tài liệu - 8 năm - 12.5%/năm' },
      { code: '0140202', description: 'Máy điều hòa không khí - 8 năm - 12.5%/năm' },
      { code: '0140203', description: 'Máy bơm nước - 8 năm - 12.5%/năm' },
      { code: '0140204', description: 'Bộ bàn ghế hội trường - 8 năm - 12.5%/năm' },
      { code: '0140205', description: 'Bộ bàn ghế phòng ăn - 8 năm - 12.5%/năm' },
      
      // Máy móc thiết bị - Nhóm 3 (7 năm)
      { code: '01403', description: 'Máy vi tính, máy in, điện thoại, máy scan, photocopy - 7 năm - 14.29%/năm' },
      { code: '0140301', description: 'Máy vi tính để bàn - 7 năm - 14.29%/năm' },
      { code: '0140302', description: 'Máy vi tính xách tay hoặc máy tính bảng - 7 năm - 14.29%/năm' },
      { code: '0140303', description: 'Máy in - 7 năm - 14.29%/năm' },
      { code: '0140304', description: 'Điện thoại cố định - 7 năm - 14.29%/năm' },
      { code: '0140305', description: 'Máy scan tài liệu - 7 năm - 14.29%/năm' },
      { code: '0140306', description: 'Máy hủy tài liệu - 7 năm - 14.29%/năm' },
      { code: '0140307', description: 'Máy photocopy - 7 năm - 14.29%/năm' },
      
      // Máy móc thiết bị - Nhóm 4 (theo quy định)
      { code: '01404', description: 'Máy móc, thiết bị chuyên dùng - Theo quy định pháp luật có liên quan' },
      
      // Máy móc thiết bị - Nhóm 5 (5 năm)
      { code: '01405', description: 'Máy móc, thiết bị khác - 5 năm - 20%/năm' },
      
      // Tài sản cố định hữu hình khác
      { code: '017', description: 'Tài sản cố định hữu hình khác - 8 năm - 12.5%/năm' },
      
      // Công cụ dụng cụ - KHÔNG tính khấu hao
      { code: '020', description: 'Công cụ dụng cụ - KHÔNG tính khấu hao' },
    ];

    for (const update of updates) {
      await queryInterface.bulkUpdate('asset_categories',
        { description: update.description, updated_at: now },
        { code: update.code }
      );
    }

    console.log('✅ Đã cập nhật danh mục loại tài sản theo Thông tư 141/2025/TT-BTC');
  },

  async down(queryInterface, Sequelize) {
    // Xóa các danh mục mới thêm
    const codesToDelete = [
      '0110301-01', '0110301-02', '0110301-03', '0110301-04',
      '0110301-05', '0110301-06', '0110301-07', '0110301-08',
      '0110302-01', '0110302-02', '0110302-03'
    ];

    await queryInterface.bulkDelete('asset_categories', {
      code: { [Sequelize.Op.in]: codesToDelete }
    });

    // Reset mô tả
    await queryInterface.bulkUpdate('asset_categories',
      { description: null },
      {}
    );

    console.log('✅ Đã rollback migration');
  },
};
