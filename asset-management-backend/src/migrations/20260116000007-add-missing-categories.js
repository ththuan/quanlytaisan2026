'use strict';

/**
 * Migration: Thêm các danh mục chi tiết còn thiếu
 * Các danh mục này đã có trong seed nhưng chưa được insert vào database
 */

/** @type {import('sequelize-cli').Migration} */
module.exports = {
    async up(queryInterface, Sequelize) {
        const now = new Date();

        // Kiểm tra và thêm các danh mục còn thiếu
        const categoriesToAdd = [
            // Nhà cấp I (đã có trong seed nhưng thiếu trong DB)
            { code: '0110201', name: 'Nhà cấp I', parent_code: '01102', unit: 'm2', category_group: 'nha_cua', is_depreciable: true, depreciation_rate: 1.25, useful_life_years: 80, description: 'Nhà cấp I - 80 năm - 1.25%/năm', sort_order: 12 },

            // Xe ô tô chi tiết
            { code: '01201', name: 'Xe ô tô', parent_code: '012', unit: 'Cái', category_group: 'phuong_tien', is_depreciable: true, depreciation_rate: 6.67, useful_life_years: 15, description: 'Xe ô tô - 15 năm - 6.67%/năm', sort_order: 110 },
            { code: '0120101', name: 'Xe ô tô 4-5 chỗ ngồi', parent_code: '01201', unit: 'Cái', category_group: 'phuong_tien', is_depreciable: true, depreciation_rate: 6.67, useful_life_years: 15, description: 'Xe ô tô 4-5 chỗ ngồi - 15 năm - 6.67%/năm', sort_order: 111 },
            { code: '0120102', name: 'Xe ô tô 7-8 chỗ ngồi', parent_code: '01201', unit: 'Cái', category_group: 'phuong_tien', is_depreciable: true, depreciation_rate: 6.67, useful_life_years: 15, description: 'Xe ô tô 7-8 chỗ ngồi - 15 năm - 6.67%/năm', sort_order: 112 },
            { code: '0120106', name: 'Xe ô tô tải', parent_code: '01201', unit: 'Cái', category_group: 'phuong_tien', is_depreciable: true, depreciation_rate: 6.67, useful_life_years: 15, description: 'Xe ô tô tải - 15 năm - 6.67%/năm', sort_order: 116 },

            // Phương tiện vận tải khác
            { code: '01202', name: 'Phương tiện vận tải khác (ngoài xe ô tô)', parent_code: '012', unit: 'Cái', category_group: 'phuong_tien', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, description: 'Phương tiện vận tải khác (ngoài xe ô tô) - 10 năm - 10%/năm', sort_order: 120 },
            { code: '0120202', name: 'Xe máy', parent_code: '01202', unit: 'Cái', category_group: 'phuong_tien', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, description: 'Xe máy - 10 năm - 10%/năm', sort_order: 121 },
            { code: '0120206', name: 'Xe đạp', parent_code: '01202', unit: 'Cái', category_group: 'phuong_tien', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, description: 'Xe đạp - 10 năm - 10%/năm', sort_order: 122 },

            // Máy móc thiết bị - Nhóm 1 (10 năm)
            { code: '01401', name: 'Bộ bàn ghế ngồi làm việc; bộ bàn ghế họp; bộ bàn ghế tiếp khách; giá dựng công văn đi, đến; thang máy; két sắt', parent_code: '014', unit: 'Bộ/Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, description: 'Bộ bàn ghế, thang máy, két sắt - 10 năm - 10%/năm', sort_order: 210 },
            { code: '0140101', name: 'Bộ bàn ghế ngồi làm việc', parent_code: '01401', unit: 'Bộ', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, description: 'Bộ bàn ghế ngồi làm việc - 10 năm - 10%/năm', sort_order: 211 },
            { code: '0140102', name: 'Bộ bàn ghế họp', parent_code: '01401', unit: 'Bộ', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, description: 'Bộ bàn ghế họp - 10 năm - 10%/năm', sort_order: 212 },
            { code: '0140103', name: 'Bộ bàn ghế tiếp khách', parent_code: '01401', unit: 'Bộ', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, description: 'Bộ bàn ghế tiếp khách - 10 năm - 10%/năm', sort_order: 213 },
            { code: '0140105', name: 'Thang máy', parent_code: '01401', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, description: 'Thang máy - 10 năm - 10%/năm', sort_order: 215 },
            { code: '0140106', name: 'Két sắt', parent_code: '01401', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 10, useful_life_years: 10, description: 'Két sắt - 10 năm - 10%/năm', sort_order: 216 },

            // Máy móc thiết bị - Nhóm 2 (8 năm)
            { code: '01402', name: 'Tủ đựng tài liệu; máy điều hòa không khí, máy bơm nước; bộ bàn ghế hội trường; bộ bàn ghế phòng ăn', parent_code: '014', unit: 'Cái/Bộ', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 12.5, useful_life_years: 8, description: 'Tủ, điều hòa, máy bơm nước, bàn ghế hội trường - 8 năm - 12.5%/năm', sort_order: 220 },
            { code: '0140201', name: 'Tủ đựng tài liệu', parent_code: '01402', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 12.5, useful_life_years: 8, description: 'Tủ đựng tài liệu - 8 năm - 12.5%/năm', sort_order: 221 },
            { code: '0140202', name: 'Máy điều hòa không khí', parent_code: '01402', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 12.5, useful_life_years: 8, description: 'Máy điều hòa không khí - 8 năm - 12.5%/năm', sort_order: 222 },
            { code: '0140203', name: 'Máy bơm nước', parent_code: '01402', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 12.5, useful_life_years: 8, description: 'Máy bơm nước - 8 năm - 12.5%/năm', sort_order: 223 },
            { code: '0140204', name: 'Bộ bàn ghế hội trường', parent_code: '01402', unit: 'Bộ', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 12.5, useful_life_years: 8, description: 'Bộ bàn ghế hội trường - 8 năm - 12.5%/năm', sort_order: 224 },
            { code: '0140205', name: 'Bộ bàn ghế phòng ăn', parent_code: '01402', unit: 'Bộ', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 12.5, useful_life_years: 8, description: 'Bộ bàn ghế phòng ăn - 8 năm - 12.5%/năm', sort_order: 225 },

            // Máy móc thiết bị - Nhóm 3 (7 năm)
            { code: '01403', name: 'Máy vi tính để bàn; máy vi tính xách tay hoặc máy tính bảng; máy in; điện thoại cố định; máy scan tài liệu; máy hủy tài liệu; máy photocopy', parent_code: '014', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 14.29, useful_life_years: 7, description: 'Máy vi tính, máy in, điện thoại, máy scan, photocopy - 7 năm - 14.29%/năm', sort_order: 230 },
            { code: '0140301', name: 'Máy vi tính để bàn', parent_code: '01403', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 14.29, useful_life_years: 7, description: 'Máy vi tính để bàn - 7 năm - 14.29%/năm', sort_order: 231 },
            { code: '0140302', name: 'Máy vi tính xách tay hoặc máy tính bảng', parent_code: '01403', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 14.29, useful_life_years: 7, description: 'Máy vi tính xách tay hoặc máy tính bảng - 7 năm - 14.29%/năm', sort_order: 232 },
            { code: '0140303', name: 'Máy in', parent_code: '01403', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 14.29, useful_life_years: 7, description: 'Máy in - 7 năm - 14.29%/năm', sort_order: 233 },
            { code: '0140304', name: 'Điện thoại cố định', parent_code: '01403', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 14.29, useful_life_years: 7, description: 'Điện thoại cố định - 7 năm - 14.29%/năm', sort_order: 234 },
            { code: '0140305', name: 'Máy scan tài liệu', parent_code: '01403', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 14.29, useful_life_years: 7, description: 'Máy scan tài liệu - 7 năm - 14.29%/năm', sort_order: 235 },
            { code: '0140306', name: 'Máy hủy tài liệu', parent_code: '01403', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 14.29, useful_life_years: 7, description: 'Máy hủy tài liệu - 7 năm - 14.29%/năm', sort_order: 236 },
            { code: '0140307', name: 'Máy photocopy', parent_code: '01403', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 14.29, useful_life_years: 7, description: 'Máy photocopy - 7 năm - 14.29%/năm', sort_order: 237 },

            // Máy móc thiết bị - Nhóm 4 (theo quy định)
            { code: '01404', name: 'Máy móc, thiết bị chuyên dùng (theo quy định pháp luật có liên quan)', parent_code: '014', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: null, useful_life_years: null, description: 'Máy móc, thiết bị chuyên dùng - Theo quy định pháp luật có liên quan', sort_order: 240 },

            // Máy móc thiết bị - Nhóm 5 (5 năm)
            { code: '01405', name: 'Máy móc, thiết bị khác (bao gồm cả máy móc, thiết bị chuyên dùng khác)', parent_code: '014', unit: 'Cái', category_group: 'may_moc', is_depreciable: true, depreciation_rate: 20, useful_life_years: 5, description: 'Máy móc, thiết bị khác - 5 năm - 20%/năm', sort_order: 250 },
        ];

        // Insert từng danh mục nếu chưa tồn tại
        for (const cat of categoriesToAdd) {
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
                console.log(`✅ Đã thêm: ${cat.code} - ${cat.name}`);
            } else {
                console.log(`⏭️  Đã tồn tại: ${cat.code} - ${cat.name}`);
            }
        }

        // Sửa lỗi Nhà cấp III (0110203)
        await queryInterface.bulkUpdate('asset_categories',
            {
                name: 'Nhà cấp III',
                useful_life_years: 25,
                depreciation_rate: 4,
                description: 'Nhà cấp III - 25 năm - 4%/năm',
                updated_at: now
            },
            { code: '0110203' }
        );
        console.log('✅ Đã sửa: 0110203 - Nhà cấp III');

        console.log('\n✅ Hoàn thành thêm các danh mục còn thiếu');
    },

    async down(queryInterface, Sequelize) {
        const codesToDelete = [
            '0110201', '01201', '0120101', '0120102', '0120106',
            '01202', '0120202', '0120206',
            '01401', '0140101', '0140102', '0140103', '0140105', '0140106',
            '01402', '0140201', '0140202', '0140203', '0140204', '0140205',
            '01403', '0140301', '0140302', '0140303', '0140304', '0140305', '0140306', '0140307',
            '01404', '01405'
        ];

        await queryInterface.bulkDelete('asset_categories', {
            code: { [Sequelize.Op.in]: codesToDelete }
        });

        console.log('✅ Đã rollback migration');
    },
};
