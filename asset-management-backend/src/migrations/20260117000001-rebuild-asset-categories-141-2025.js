'use strict';

/**
 * Migration: Xây dựng lại toàn bộ danh mục loại tài sản theo Thông tư 141/2025/TT-BTC
 * Ngày: 31/12/2025
 * 
 * Mục đích:
 * - Xóa toàn bộ danh mục cũ (tránh trùng lặp)
 * - Tạo lại danh mục mới theo đúng file "Nguyên tắc hao mòn khấu hao.txt"
 * - Đảm bảo cấu trúc rõ ràng, không trùng lặp
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();

    // ===== BƯỚC 1: XÓA TOÀN BỘ DANH MỤC CŨ =====
    console.log('🗑️  Đang xóa toàn bộ danh mục cũ...');
    await queryInterface.bulkDelete('asset_categories', null, {});
    console.log('✅ Đã xóa toàn bộ danh mục cũ');

    // ===== BƯỚC 2: TẠO LẠI DANH MỤC MỚI THEO THÔNG TƯ 141/2025/TT-BTC =====
    console.log('📝 Đang tạo danh mục mới...');
    
    const categories = [
      // ===== 1. NHÀ, CÔNG TRÌNH XÂY DỰNG =====
      {
        code: '01',
        name: 'Nhà, công trình xây dựng',
        parent_code: null,
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Nhà, công trình xây dựng - Nhóm cha',
        is_active: true,
        sort_order: 1,
        created_at: now,
        updated_at: now,
      },
      // 1.1. Biệt thự, công trình xây dựng cấp đặc biệt - 80 năm, 1.25%
      {
        code: '0101',
        name: 'Biệt thự, công trình xây dựng cấp đặc biệt',
        parent_code: '01',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 1.25,
        useful_life_years: 80,
        description: 'Biệt thự, công trình xây dựng cấp đặc biệt - 80 năm - 1.25%/năm',
        is_active: true,
        sort_order: 10,
        created_at: now,
        updated_at: now,
      },
      // 1.2. Nhà cấp I - 80 năm, 1.25%
      {
        code: '0102',
        name: 'Nhà cấp I',
        parent_code: '01',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 1.25,
        useful_life_years: 80,
        description: 'Nhà cấp I - 80 năm - 1.25%/năm',
        is_active: true,
        sort_order: 20,
        created_at: now,
        updated_at: now,
      },
      // 1.3. Nhà cấp II - 50 năm, 2%
      {
        code: '0103',
        name: 'Nhà cấp II',
        parent_code: '01',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 2,
        useful_life_years: 50,
        description: 'Nhà cấp II - 50 năm - 2%/năm',
        is_active: true,
        sort_order: 30,
        created_at: now,
        updated_at: now,
      },
      // 1.4. Nhà cấp III - 25 năm, 4%
      {
        code: '0104',
        name: 'Nhà cấp III',
        parent_code: '01',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 4,
        useful_life_years: 25,
        description: 'Nhà cấp III - 25 năm - 4%/năm',
        is_active: true,
        sort_order: 40,
        created_at: now,
        updated_at: now,
      },
      // 1.5. Nhà cấp IV - 15 năm, 6.67%
      {
        code: '0105',
        name: 'Nhà cấp IV',
        parent_code: '01',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 6.67,
        useful_life_years: 15,
        description: 'Nhà cấp IV - 15 năm - 6.67%/năm',
        is_active: true,
        sort_order: 50,
        created_at: now,
        updated_at: now,
      },

      // ===== 2. VẬT KIẾN TRÚC =====
      {
        code: '02',
        name: 'Vật kiến trúc',
        parent_code: null,
        unit: 'Cái',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Vật kiến trúc - Nhóm cha',
        is_active: true,
        sort_order: 100,
        created_at: now,
        updated_at: now,
      },
      // 2.1. Kho chứa, bể chứa, bãi đỗ, sân phơi, sân chơi, sân thể thao, bể bơi, công trình điện - 20 năm, 5%
      {
        code: '0201',
        name: 'Kho chứa, bể chứa, bãi đỗ, sân phơi, sân chơi, sân thể thao, bể bơi, công trình điện',
        parent_code: '02',
        unit: 'm2',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 5,
        useful_life_years: 20,
        description: 'Kho chứa, bể chứa, bãi đỗ, sân phơi, sân chơi, sân thể thao, bể bơi, công trình điện - 20 năm - 5%/năm',
        is_active: true,
        sort_order: 110,
        created_at: now,
        updated_at: now,
      },
      // 2.2. Giếng khoan, giếng đào, tường rào và vật kiến trúc khác - 10 năm, 10%
      {
        code: '0202',
        name: 'Giếng khoan, giếng đào, tường rào và vật kiến trúc khác',
        parent_code: '02',
        unit: 'Cái',
        category_group: 'nha_cua',
        is_depreciable: true,
        depreciation_rate: 10,
        useful_life_years: 10,
        description: 'Giếng khoan, giếng đào, tường rào và vật kiến trúc khác - 10 năm - 10%/năm',
        is_active: true,
        sort_order: 120,
        created_at: now,
        updated_at: now,
      },

      // ===== 3. XE Ô TÔ =====
      {
        code: '03',
        name: 'Xe ô tô',
        parent_code: null,
        unit: 'Cái',
        category_group: 'phuong_tien',
        is_depreciable: true,
        depreciation_rate: 6.67,
        useful_life_years: 15,
        description: 'Xe ô tô - 15 năm - 6.67%/năm',
        is_active: true,
        sort_order: 200,
        created_at: now,
        updated_at: now,
      },

      // ===== 4. PHƯƠNG TIỆN VẬN TẢI KHÁC (ngoài xe ô tô) =====
      {
        code: '04',
        name: 'Phương tiện vận tải khác (ngoài xe ô tô)',
        parent_code: null,
        unit: 'Cái',
        category_group: 'phuong_tien',
        is_depreciable: true,
        depreciation_rate: 10,
        useful_life_years: 10,
        description: 'Phương tiện vận tải khác (ngoài xe ô tô) - 10 năm - 10%/năm',
        is_active: true,
        sort_order: 300,
        created_at: now,
        updated_at: now,
      },

      // ===== 5. MÁY MÓC, THIẾT BỊ =====
      {
        code: '05',
        name: 'Máy móc, thiết bị',
        parent_code: null,
        unit: 'Cái',
        category_group: 'may_moc',
        is_depreciable: true,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Máy móc, thiết bị - Nhóm cha',
        is_active: true,
        sort_order: 400,
        created_at: now,
        updated_at: now,
      },
      // 5.1. Bộ bàn ghế ngồi làm việc; bộ bàn ghế họp; bộ bàn ghế tiếp khách; giá dựng công văn đi, đến; thang máy; két sắt - 10 năm, 10%
      {
        code: '0501',
        name: 'Bộ bàn ghế ngồi làm việc; bộ bàn ghế họp; bộ bàn ghế tiếp khách; giá dựng công văn đi, đến; thang máy; két sắt',
        parent_code: '05',
        unit: 'Bộ/Cái',
        category_group: 'may_moc',
        is_depreciable: true,
        depreciation_rate: 10,
        useful_life_years: 10,
        description: 'Bộ bàn ghế ngồi làm việc; bộ bàn ghế họp; bộ bàn ghế tiếp khách; giá dựng công văn đi, đến; thang máy; két sắt - 10 năm - 10%/năm',
        is_active: true,
        sort_order: 410,
        created_at: now,
        updated_at: now,
      },
      // 5.2. Tủ đựng tài liệu; máy điều hòa không khí, máy bơm nước; bộ bàn ghế hội trường; bộ bàn ghế phòng ăn - 8 năm, 12.5%
      {
        code: '0502',
        name: 'Tủ đựng tài liệu; máy điều hòa không khí, máy bơm nước; bộ bàn ghế hội trường; bộ bàn ghế phòng ăn',
        parent_code: '05',
        unit: 'Cái/Bộ',
        category_group: 'may_moc',
        is_depreciable: true,
        depreciation_rate: 12.5,
        useful_life_years: 8,
        description: 'Tủ đựng tài liệu; máy điều hòa không khí, máy bơm nước; bộ bàn ghế hội trường; bộ bàn ghế phòng ăn - 8 năm - 12.5%/năm',
        is_active: true,
        sort_order: 420,
        created_at: now,
        updated_at: now,
      },
      // 5.3. Máy vi tính để bàn; máy vi tính xách tay hoặc máy tính bảng; máy in; điện thoại cố định; máy scan tài liệu; máy hủy tài liệu; máy photocopy - 7 năm, 14.29%
      {
        code: '0503',
        name: 'Máy vi tính để bàn; máy vi tính xách tay hoặc máy tính bảng; máy in; điện thoại cố định; máy scan tài liệu; máy hủy tài liệu; máy photocopy',
        parent_code: '05',
        unit: 'Cái',
        category_group: 'may_moc',
        is_depreciable: true,
        depreciation_rate: 14.29,
        useful_life_years: 7,
        description: 'Máy vi tính để bàn; máy vi tính xách tay hoặc máy tính bảng; máy in; điện thoại cố định; máy scan tài liệu; máy hủy tài liệu; máy photocopy - 7 năm - 14.29%/năm',
        is_active: true,
        sort_order: 430,
        created_at: now,
        updated_at: now,
      },
      // 5.4. Máy móc, thiết bị chuyên dùng là máy móc, thiết bị đã có quy định về thời gian sử dụng tại pháp luật có liên quan
      {
        code: '0504',
        name: 'Máy móc, thiết bị chuyên dùng (theo quy định pháp luật có liên quan)',
        parent_code: '05',
        unit: 'Cái',
        category_group: 'may_moc',
        is_depreciable: true,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Máy móc, thiết bị chuyên dùng là máy móc, thiết bị đã có quy định về thời gian sử dụng tại pháp luật có liên quan. Thời gian sử dụng = 100/Thời gian sử dụng để tính hao mòn',
        is_active: true,
        sort_order: 440,
        created_at: now,
        updated_at: now,
      },
      // 5.5. Máy móc, thiết bị khác (bao gồm cả máy móc, thiết bị chuyên dùng khác) - 5 năm, 20%
      {
        code: '0505',
        name: 'Máy móc, thiết bị khác (bao gồm cả máy móc, thiết bị chuyên dùng khác)',
        parent_code: '05',
        unit: 'Cái',
        category_group: 'may_moc',
        is_depreciable: true,
        depreciation_rate: 20,
        useful_life_years: 5,
        description: 'Máy móc, thiết bị khác (bao gồm cả máy móc, thiết bị chuyên dùng khác) - 5 năm - 20%/năm',
        is_active: true,
        sort_order: 450,
        created_at: now,
        updated_at: now,
      },

      // ===== 6. TÀI SẢN CỐ ĐỊNH HỮU HÌNH KHÁC =====
      {
        code: '06',
        name: 'Tài sản cố định hữu hình khác',
        parent_code: null,
        unit: 'Cái',
        category_group: 'tai_san_huu_hinh',
        is_depreciable: true,
        depreciation_rate: 12.5,
        useful_life_years: 8,
        description: 'Tài sản cố định hữu hình khác - 8 năm - 12.5%/năm',
        is_active: true,
        sort_order: 500,
        created_at: now,
        updated_at: now,
      },

      // ===== 7. CÔNG CỤ DỤNG CỤ (KHÔNG TÍNH KHẤU HAO) =====
      {
        code: '07',
        name: 'Công cụ dụng cụ',
        parent_code: null,
        unit: 'Cái',
        category_group: 'cong_cu_dung_cu',
        is_depreciable: false,
        depreciation_rate: null,
        useful_life_years: null,
        description: 'Công cụ dụng cụ - Không tính khấu hao',
        is_active: true,
        sort_order: 600,
        created_at: now,
        updated_at: now,
      },
    ];

    // Insert danh mục
    await queryInterface.bulkInsert('asset_categories', categories);
    console.log(`✅ Đã tạo ${categories.length} danh mục loại tài sản mới`);
  },

  async down(queryInterface, Sequelize) {
    // Xóa toàn bộ danh mục
    await queryInterface.bulkDelete('asset_categories', null, {});
    console.log('✅ Đã xóa toàn bộ danh mục');
  },
};
