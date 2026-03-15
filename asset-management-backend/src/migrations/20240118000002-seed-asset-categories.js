'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Xóa toàn bộ danh mục cũ trước
    await queryInterface.bulkDelete('asset_categories', null, {});

    // Insert danh mục loại tài sản theo đúng Thông tư 141/2025/TT-BTC
    // Chỉ có 5 danh mục chính với các danh mục con
    const categories = [
      // ===== 1. NHÀ, CÔNG TRÌNH XÂY DỰNG =====
      { code: '01', name: 'Nhà, công trình xây dựng', parent_code: null, unit: 'm2', category_group: 'nha_cua', is_depreciable: true, depreciation_rate: null, useful_life_years: null, sort_order: 1 },
      
      // 1.1. Biệt thự, công trình xây dựng cấp đặc biệt - 80 năm, 1.25%
      { code: '0101', name: 'Biệt thự, công trình xây dựng cấp đặc biệt', parent_code: '01', unit: 'm2', category_group: 'nha_cua', is_depreciable: true, depreciation_rate: 1.25, useful_life_years: 80, sort_order: 10 },
      
      // 1.2. Nhà cấp I - 80 năm, 1.25%
      { code: '0102', name: 'Nhà cấp I', parent_code: '01', unit: 'm2', category_group: 'nha_cua', is_depreciable: true, depreciation_rate: 1.25, useful_life_years: 80, sort_order: 20 },
      
      // 1.3. Nhà cấp II - 50 năm, 2%
      { code: '0103', name: 'Nhà cấp II', parent_code: '01', unit: 'm2', category_group: 'nha_cua', is_depreciable: true, depreciation_rate: 2, useful_life_years: 50, sort_order: 30 },
      
      // 1.4. Nhà cấp III - 25 năm, 4%
      { code: '0104', name: 'Nhà cấp III', parent_code: '01', unit: 'm2', category_group: 'nha_cua', is_depreciable: true, depreciation_rate: 4, useful_life_years: 25, sort_order: 40 },
      
      // 1.5. Nhà cấp IV - 15 năm, 6.67%
      { code: '0105', name: 'Nhà cấp IV', parent_code: '01', unit: 'm2', category_group: 'nha_cua', is_depreciable: true, depreciation_rate: 6.67, useful_life_years: 15, sort_order: 50 },

      // ===== 2. VẬT KIẾN TRÚC =====
      { code: '02', name: 'Vật kiến trúc', parent_code: null, unit: 'Cái', category_group: 'nha_cua', is_depreciable: true, depreciation_rate: null, useful_life_years: null, sort_order: 100 },
      
      // 2.1. Kho chứa, bể chứa, bãi đỗ, sân phơi, sân chơi, sân thể thao, bể bơi, công trình điện - 20 năm, 5%
      { code: '0201', name: 'Kho chứa, bể chứa, bãi đỗ, sân phơi, sân chơi, sân thể thao, bể bơi, công trình điện', parent_code: '02', unit: 'm2', category_group: 'nha_cua', is_depreciable: true, depreciation_rate: 5, useful_life_years: 20, sort_order: 110 },
      
      // 2.2. Giếng khoan, giếng đào, tường rào và vật kiến trúc khác - 10 năm, 10%
      { code: '0202', name: 'Giếng khoan, giếng đào, tường rào và vật kiến trúc khác', parent_code: '02', unit: 'Cái', category_group: 'nha_cua', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, sort_order: 120 },

      // ===== 3. XE Ô TÔ =====
      { code: '03', name: 'Xe ô tô', parent_code: null, unit: 'Cái', category_group: 'phuong_tien', is_depreciable: true, depreciation_rate: 6.67, useful_life_years: 15, sort_order: 200 },

      // ===== 4. PHƯƠNG TIỆN VẬN TẢI KHÁC (ngoài xe ô tô) =====
      { code: '04', name: 'Phương tiện vận tải khác (ngoài xe ô tô)', parent_code: null, unit: 'Cái', category_group: 'phuong_tien', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, sort_order: 300 },

      // ===== 5. MÁY MÓC, THIẾT BỊ =====
      { code: '05', name: 'Máy móc, thiết bị', parent_code: null, unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: null, useful_life_years: null, sort_order: 400 },
      
      // 5.1. Bộ bàn ghế ngồi làm việc; bộ bàn ghế họp; bộ bàn ghế tiếp khách; giá dựng công văn đi, đến; thang máy; két sắt - 10 năm, 10%
      { code: '0501', name: 'Bộ bàn ghế ngồi làm việc; bộ bàn ghế họp; bộ bàn ghế tiếp khách; giá dựng công văn đi, đến; thang máy; két sắt', parent_code: '05', unit: 'Bộ/Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, sort_order: 410 },
      
      // 5.2. Tủ đựng tài liệu; máy điều hòa không khí, máy bơm nước; bộ bàn ghế hội trường; bộ bàn ghế phòng ăn - 8 năm, 12.5%
      { code: '0502', name: 'Tủ đựng tài liệu; máy điều hòa không khí, máy bơm nước; bộ bàn ghế hội trường; bộ bàn ghế phòng ăn', parent_code: '05', unit: 'Cái/Bộ', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 12.5, useful_life_years: 8, sort_order: 420 },
      
      // 5.3. Máy vi tính để bàn; máy vi tính xách tay hoặc máy tính bảng; máy in; điện thoại cố định; máy scan tài liệu; máy hủy tài liệu; máy photocopy - 7 năm, 14.29%
      { code: '0503', name: 'Máy vi tính để bàn; máy vi tính xách tay hoặc máy tính bảng; máy in; điện thoại cố định; máy scan tài liệu; máy hủy tài liệu; máy photocopy', parent_code: '05', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 14.29, useful_life_years: 7, sort_order: 430 },
      
      // 5.4. Máy móc, thiết bị chuyên dùng là máy móc, thiết bị đã có quy định về thời gian sử dụng tại pháp luật có liên quan
      { code: '0504', name: 'Máy móc, thiết bị chuyên dùng (theo quy định pháp luật có liên quan)', parent_code: '05', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: null, useful_life_years: null, sort_order: 440 },
      
      // 5.5. Máy móc, thiết bị khác (bao gồm cả máy móc, thiết bị chuyên dùng khác) - 5 năm, 20%
      { code: '0505', name: 'Máy móc, thiết bị khác (bao gồm cả máy móc, thiết bị chuyên dùng khác)', parent_code: '05', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 20, useful_life_years: 5, sort_order: 450 },

      // ===== 6. TÀI SẢN CỐ ĐỊNH HỮU HÌNH KHÁC =====
      { code: '06', name: 'Tài sản cố định hữu hình khác', parent_code: null, unit: 'Cái', category_group: 'tai_san_huu_hinh', is_depreciable: true, depreciation_rate: 12.5, useful_life_years: 8, sort_order: 500 },

      // ===== 7. CÔNG CỤ DỤNG CỤ (KHÔNG TÍNH KHẤU HAO) =====
      { code: '07', name: 'Công cụ dụng cụ', parent_code: null, unit: 'Cái', category_group: 'cong_cu_dung_cu', is_depreciable: false, depreciation_rate: null, useful_life_years: null, sort_order: 600 },
    ];

    const now = new Date();
    for (const cat of categories) {
      await queryInterface.bulkInsert('asset_categories', [{
        code: cat.code,
        name: cat.name,
        parent_code: cat.parent_code,
        unit: cat.unit,
        category_group: cat.category_group,
        is_depreciable: cat.is_depreciable,
        depreciation_rate: cat.depreciation_rate,
        useful_life_years: cat.useful_life_years,
        is_active: true,
        sort_order: cat.sort_order,
        created_at: now,
        updated_at: now,
      }]);
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('asset_categories', null, {});
  },
};
