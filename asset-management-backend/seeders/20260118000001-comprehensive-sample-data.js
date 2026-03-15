'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const defaultPassword = await bcrypt.hash('Password123!', 10);

    // ============================================
    // 1. TẠO 16 PHÒNG BAN
    // ============================================
    console.log('📁 Creating 16 departments...');
    
    const departments = [
      { id: 1, name: 'Ngoại ngữ - Tin học', type: 'faculty', description: 'Khoa Ngoại ngữ - Tin học' },
      { id: 2, name: 'Kỹ thuật - Nông nghiệp', type: 'faculty', description: 'Khoa Kỹ thuật - Nông nghiệp' },
      { id: 3, name: 'Trợ giúp kinh doanh', type: 'faculty', description: 'Khoa Trợ giúp kinh doanh' },
      { id: 4, name: 'Công nghệ - Thủy sản', type: 'faculty', description: 'Khoa Công nghệ - Thủy sản' },
      { id: 5, name: 'Nông nghiệp', type: 'faculty', description: 'Khoa Nông nghiệp' },
      { id: 6, name: 'Quản trị kinh doanh', type: 'faculty', description: 'Khoa Quản trị kinh doanh' },
      { id: 7, name: 'Công nghệ thông tin - Truyền thông', type: 'faculty', description: 'Khoa Công nghệ thông tin - Truyền thông' },
      { id: 8, name: 'Tài chính - Kế toán', type: 'faculty', description: 'Khoa Tài chính - Kế toán' },
      { id: 9, name: 'Phòng Đào tạo', type: 'office', description: 'Phòng Đào tạo' },
      { id: 10, name: 'Phòng Công tác sinh viên', type: 'office', description: 'Phòng Công tác sinh viên' },
      { id: 11, name: 'Phòng Tổ chức - Hành chính', type: 'office', description: 'Phòng Tổ chức - Hành chính' },
      { id: 12, name: 'Phòng Kế hoạch - Tài chính', type: 'office', description: 'Phòng Kế hoạch - Tài chính' },
      { id: 13, name: 'Phòng Quản lý cơ sở vật chất', type: 'office', description: 'Phòng Quản lý cơ sở vật chất' },
      { id: 14, name: 'Phòng Khảo thí và Đảm bảo chất lượng', type: 'office', description: 'Phòng Khảo thí và Đảm bảo chất lượng' },
      { id: 15, name: 'Phòng Hợp tác quốc tế', type: 'office', description: 'Phòng Hợp tác quốc tế' },
      { id: 16, name: 'Phòng Thư viện', type: 'office', description: 'Phòng Thư viện' },
    ];

    await queryInterface.bulkInsert('departments', departments.map(dept => ({
      ...dept,
      created_at: now,
      updated_at: now,
    })), {});

    // Reset sequence for PostgreSQL
    try {
      await queryInterface.sequelize.query(
        `SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));`
      );
    } catch (e) {
      // Ignore if sequence doesn't exist
    }

    console.log('✅ Created 16 departments');

    // ============================================
    // 2. TẠO USERS VỚI TẤT CẢ PHÂN QUYỀN
    // ============================================
    console.log('👥 Creating users with all roles...');

    const users = [
      // Admin
      {
        username: 'admin',
        email: 'admin@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Nguyễn Văn Admin',
        role: 'admin',
        department_id: null,
        is_active: true,
      },
      // Director
      {
        username: 'director',
        email: 'director@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Trần Thị Giám đốc',
        role: 'director',
        department_id: null,
        is_active: true,
      },
      // Department Heads (mỗi khoa/phòng 1 trưởng)
      {
        username: 'truongkhoa_ngoaingu',
        email: 'truongkhoa.ngoaingu@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Lê Văn Trưởng Khoa',
        role: 'department_head',
        department_id: 1,
        is_active: true,
      },
      {
        username: 'truongkhoa_kythuat',
        email: 'truongkhoa.kythuat@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Phạm Thị Trưởng Khoa',
        role: 'department_head',
        department_id: 2,
        is_active: true,
      },
      {
        username: 'truongphong_daotao',
        email: 'truongphong.daotao@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Hoàng Văn Trưởng Phòng',
        role: 'department_head',
        department_id: 9,
        is_active: true,
      },
      {
        username: 'truongphong_ketoan',
        email: 'truongphong.ketoan@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Vũ Thị Trưởng Phòng',
        role: 'department_head',
        department_id: 12,
        is_active: true,
      },
      // Managers
      {
        username: 'manager1',
        email: 'manager1@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Đỗ Văn Quản lý',
        role: 'manager',
        department_id: 7,
        is_active: true,
      },
      {
        username: 'manager2',
        email: 'manager2@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Bùi Thị Quản lý',
        role: 'manager',
        department_id: 8,
        is_active: true,
      },
      // Staff (cán bộ các phòng ban)
      {
        username: 'staff1',
        email: 'staff1@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Nguyễn Thị Cán bộ',
        role: 'staff',
        department_id: 1,
        is_active: true,
      },
      {
        username: 'staff2',
        email: 'staff2@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Trần Văn Cán bộ',
        role: 'staff',
        department_id: 2,
        is_active: true,
      },
      {
        username: 'staff3',
        email: 'staff3@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Lê Thị Cán bộ',
        role: 'staff',
        department_id: 7,
        is_active: true,
      },
      {
        username: 'staff4',
        email: 'staff4@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Phạm Văn Cán bộ',
        role: 'staff',
        department_id: 9,
        is_active: true,
      },
      {
        username: 'staff5',
        email: 'staff5@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Hoàng Thị Cán bộ',
        role: 'staff',
        department_id: 12,
        is_active: true,
      },
      // Regular users
      {
        username: 'user1',
        email: 'user1@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Vũ Văn Người dùng',
        role: 'user',
        department_id: 3,
        is_active: true,
      },
      {
        username: 'user2',
        email: 'user2@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Đỗ Thị Người dùng',
        role: 'user',
        department_id: 4,
        is_active: true,
      },
    ];

    await queryInterface.bulkInsert('users', users.map(user => ({
      ...user,
      created_at: now,
      updated_at: now,
    })), {});

    // Reset sequence for PostgreSQL
    try {
      await queryInterface.sequelize.query(
        `SELECT setval('users_id_seq', (SELECT MAX(id) FROM users));`
      );
    } catch (e) {
      // Ignore if sequence doesn't exist
    }

    console.log('✅ Created users with all roles');

    // ============================================
    // 3. LẤY DANH MỤC TÀI SẢN ĐỂ TẠO TÀI SẢN MẪU
    // ============================================
    console.log('📦 Fetching asset categories...');
    
    const categories = await queryInterface.sequelize.query(
      `SELECT id, code, name, depreciation_rate, useful_life_years, is_depreciable, unit FROM asset_categories WHERE parent_code IS NOT NULL ORDER BY code;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!categories || categories.length === 0) {
      console.log('⚠️  No asset categories found. Please run asset categories migration first.');
      return;
    }

    console.log(`✅ Found ${categories.length} asset categories`);

    // ============================================
    // 4. TẠO TÀI SẢN MẪU CHI TIẾT
    // ============================================
    console.log('🏢 Creating sample assets...');

    const assetTemplates = {
      // Nhà, công trình xây dựng
      '0101': [
        { name: 'Biệt thự Hiệu trưởng', purchase_price: 5000000000, year_in_use: 2020, location: 'Khu A - Tầng 1-2' },
        { name: 'Công trình xây dựng cấp đặc biệt - Tòa nhà A', purchase_price: 15000000000, year_in_use: 2018, location: 'Khu trung tâm' },
      ],
      '0102': [
        { name: 'Nhà cấp I - Tòa nhà B', purchase_price: 8000000000, year_in_use: 2019, location: 'Khu B' },
        { name: 'Nhà cấp I - Tòa nhà C', purchase_price: 7500000000, year_in_use: 2020, location: 'Khu C' },
      ],
      '0103': [
        { name: 'Nhà cấp II - Tòa nhà D', purchase_price: 5000000000, year_in_use: 2015, location: 'Khu D' },
        { name: 'Nhà cấp II - Tòa nhà E', purchase_price: 4500000000, year_in_use: 2016, location: 'Khu E' },
      ],
      '0104': [
        { name: 'Nhà cấp III - Tòa nhà F', purchase_price: 3000000000, year_in_use: 2010, location: 'Khu F' },
        { name: 'Nhà cấp III - Tòa nhà G', purchase_price: 2800000000, year_in_use: 2011, location: 'Khu G' },
      ],
      '0105': [
        { name: 'Nhà cấp IV - Nhà kho', purchase_price: 1500000000, year_in_use: 2012, location: 'Khu kho' },
        { name: 'Nhà cấp IV - Nhà xe', purchase_price: 1200000000, year_in_use: 2013, location: 'Khu để xe' },
      ],
      // Vật kiến trúc
      '0201': [
        { name: 'Kho chứa thiết bị', purchase_price: 800000000, year_in_use: 2018, location: 'Khu kho' },
        { name: 'Bể bơi', purchase_price: 1200000000, year_in_use: 2019, location: 'Khu thể thao' },
        { name: 'Sân thể thao', purchase_price: 600000000, year_in_use: 2020, location: 'Khu thể thao' },
        { name: 'Bãi đỗ xe', purchase_price: 500000000, year_in_use: 2017, location: 'Khu để xe' },
      ],
      '0202': [
        { name: 'Tường rào bao quanh', purchase_price: 2000000000, year_in_use: 2015, location: 'Xung quanh khuôn viên' },
        { name: 'Giếng khoan nước', purchase_price: 150000000, year_in_use: 2016, location: 'Khu A' },
        { name: 'Cổng chính', purchase_price: 300000000, year_in_use: 2014, location: 'Cổng chính' },
      ],
      // Xe ô tô
      '03': [
        { name: 'Xe ô tô 7 chỗ Toyota Innova', purchase_price: 850000000, year_in_use: 2021, serial_number: 'TOY-INN-2021-001', location: 'Bãi xe' },
        { name: 'Xe ô tô 16 chỗ Ford Transit', purchase_price: 1200000000, year_in_use: 2020, serial_number: 'FORD-TRANS-2020-001', location: 'Bãi xe' },
        { name: 'Xe ô tô 4 chỗ Hyundai Accent', purchase_price: 550000000, year_in_use: 2022, serial_number: 'HYU-ACC-2022-001', location: 'Bãi xe' },
      ],
      // Phương tiện vận tải khác
      '04': [
        { name: 'Xe máy Honda Wave', purchase_price: 25000000, year_in_use: 2021, serial_number: 'HON-WAVE-2021-001', location: 'Bãi xe máy' },
        { name: 'Xe đạp điện', purchase_price: 12000000, year_in_use: 2022, serial_number: 'BIKE-ELEC-2022-001', location: 'Bãi xe máy' },
        { name: 'Xe máy Yamaha Sirius', purchase_price: 28000000, year_in_use: 2020, serial_number: 'YAM-SIR-2020-001', location: 'Bãi xe máy' },
      ],
      // Máy móc, thiết bị
      '0501': [
        { name: 'Bộ bàn ghế làm việc (10 bộ)', purchase_price: 50000000, year_in_use: 2022, location: 'Phòng làm việc' },
        { name: 'Bộ bàn ghế họp (20 bộ)', purchase_price: 80000000, year_in_use: 2021, location: 'Phòng họp' },
        { name: 'Thang máy tòa nhà A', purchase_price: 800000000, year_in_use: 2019, location: 'Tòa nhà A' },
        { name: 'Két sắt (5 cái)', purchase_price: 15000000, year_in_use: 2020, location: 'Các phòng ban' },
      ],
      '0502': [
        { name: 'Tủ đựng tài liệu (15 cái)', purchase_price: 45000000, year_in_use: 2021, location: 'Các phòng ban' },
        { name: 'Máy điều hòa Daikin (10 máy)', purchase_price: 180000000, year_in_use: 2022, location: 'Các phòng làm việc' },
        { name: 'Máy bơm nước', purchase_price: 25000000, year_in_use: 2020, location: 'Khu kỹ thuật' },
        { name: 'Bộ bàn ghế hội trường (100 bộ)', purchase_price: 200000000, year_in_use: 2019, location: 'Hội trường' },
      ],
      '0503': [
        { name: 'Máy vi tính để bàn Dell (30 máy)', purchase_price: 600000000, year_in_use: 2022, location: 'Phòng máy tính' },
        { name: 'Laptop Dell XPS (15 máy)', purchase_price: 525000000, year_in_use: 2023, location: 'Các phòng ban' },
        { name: 'Máy in HP LaserJet (10 máy)', purchase_price: 85000000, year_in_use: 2022, location: 'Các phòng ban' },
        { name: 'Máy photocopy Canon (5 máy)', purchase_price: 150000000, year_in_use: 2021, location: 'Các phòng ban' },
        { name: 'Máy scan tài liệu (3 máy)', purchase_price: 45000000, year_in_use: 2022, location: 'Phòng hành chính' },
        { name: 'Máy hủy tài liệu (2 máy)', purchase_price: 20000000, year_in_use: 2021, location: 'Phòng hành chính' },
      ],
      '0505': [
        { name: 'Máy chiếu Epson (8 máy)', purchase_price: 120000000, year_in_use: 2021, location: 'Các phòng họp' },
        { name: 'Máy phát điện', purchase_price: 150000000, year_in_use: 2020, location: 'Khu kỹ thuật' },
        { name: 'Máy cắt cỏ', purchase_price: 15000000, year_in_use: 2022, location: 'Khu vườn' },
        { name: 'Máy nén khí', purchase_price: 35000000, year_in_use: 2021, location: 'Xưởng thực hành' },
      ],
      // Tài sản cố định hữu hình khác
      '06': [
        { name: 'Tủ lạnh (5 cái)', purchase_price: 50000000, year_in_use: 2021, location: 'Các phòng ăn' },
        { name: 'Lò vi sóng (3 cái)', purchase_price: 15000000, year_in_use: 2022, location: 'Phòng ăn' },
        { name: 'Quạt trần (20 cái)', purchase_price: 40000000, year_in_use: 2020, location: 'Các phòng học' },
        { name: 'Bàn ghế phòng học (200 bộ)', purchase_price: 300000000, year_in_use: 2019, location: 'Các phòng học' },
      ],
      // Công cụ dụng cụ (không tính khấu hao)
      '07': [
        { name: 'Bộ dụng cụ sửa chữa (10 bộ)', purchase_price: 5000000, year_in_use: 2022, location: 'Kho dụng cụ' },
        { name: 'Thước đo (20 cái)', purchase_price: 2000000, year_in_use: 2021, location: 'Xưởng thực hành' },
        { name: 'Kìm, búa, tua vít (30 bộ)', purchase_price: 3000000, year_in_use: 2022, location: 'Kho dụng cụ' },
      ],
    };

    const assets = [];
    let assetCodeCounter = 1;

    // Tạo tài sản cho từng danh mục
    for (const category of categories) {
      const templates = assetTemplates[category.code];
      if (!templates) continue;

      for (const template of templates) {
        const yearsInUse = new Date().getFullYear() - template.year_in_use;
        const depreciationRate = category.depreciation_rate || 0;
        const usefulLife = category.useful_life_years || 1;
        
        // Tính khấu hao lũy kế
        let accumulatedDepreciation = 0;
        if (category.is_depreciable && depreciationRate > 0) {
          const annualDepreciation = (template.purchase_price * depreciationRate) / 100;
          accumulatedDepreciation = Math.min(annualDepreciation * yearsInUse, template.purchase_price);
        }
        
        const residualValue = template.purchase_price - accumulatedDepreciation;
        
        // Phân bổ tài sản cho các phòng ban
        const departmentId = (assetCodeCounter % 16) + 1;
        
        assets.push({
          asset_code: `TS-${String(assetCodeCounter).padStart(4, '0')}`,
          name: template.name,
          description: `Tài sản thuộc danh mục ${category.name}`,
          category_id: category.id,
          category_code: category.code,
          unit: category.unit,
          quantity: 1,
          purchase_date: new Date(`${template.year_in_use}-01-15`),
          purchase_price: template.purchase_price,
          current_value: residualValue,
          residual_value: residualValue,
          useful_life: usefulLife,
          is_depreciable: category.is_depreciable,
          depreciation_rate: depreciationRate,
          accumulated_depreciation: accumulatedDepreciation,
          depreciation_last_updated: new Date(),
          year_in_use: template.year_in_use,
          serial_number: template.serial_number || null,
          current_department_id: departmentId,
          status: yearsInUse > usefulLife ? 'inactive' : 'active',
          condition: yearsInUse > usefulLife * 0.8 ? 'fair' : 'good',
          location: template.location,
          created_at: now,
          updated_at: now,
        });

        assetCodeCounter++;
      }
    }

    // Chèn tài sản vào database
    if (assets.length > 0) {
      // Chia nhỏ để tránh lỗi quá lớn
      const batchSize = 50;
      for (let i = 0; i < assets.length; i += batchSize) {
        const batch = assets.slice(i, i + batchSize);
        await queryInterface.bulkInsert('assets', batch, {});
      }

      // Reset sequence for PostgreSQL
      try {
        await queryInterface.sequelize.query(
          `SELECT setval('assets_id_seq', (SELECT MAX(id) FROM assets));`
        );
      } catch (e) {
        // Ignore if sequence doesn't exist
      }

      console.log(`✅ Created ${assets.length} sample assets`);
    } else {
      console.log('⚠️  No assets created. Please check asset categories.');
    }

    console.log('\n🎉 Sample data seeding completed!');
    console.log('\n📋 Summary:');
    console.log(`   - Departments: 16`);
    console.log(`   - Users: ${users.length} (with all roles)`);
    console.log(`   - Assets: ${assets.length}`);
    console.log('\n🔑 Default password for all users: Password123!');
    console.log('\n👤 Test users:');
    console.log('   - admin / admin@college.edu.vn (Admin)');
    console.log('   - director / director@college.edu.vn (Director)');
    console.log('   - truongkhoa_ngoaingu / truongkhoa.ngoaingu@college.edu.vn (Department Head)');
    console.log('   - manager1 / manager1@college.edu.vn (Manager)');
    console.log('   - staff1 / staff1@college.edu.vn (Staff)');
    console.log('   - user1 / user1@college.edu.vn (User)');
  },

  async down(queryInterface, Sequelize) {
    // Xóa tài sản
    await queryInterface.bulkDelete('assets', {
      asset_code: {
        [Sequelize.Op.like]: 'TS-%'
      }
    }, {});

    // Xóa users (trừ admin nếu đã có)
    await queryInterface.bulkDelete('users', {
      username: {
        [Sequelize.Op.notIn]: ['admin']
      }
    }, {});

    // Xóa departments
    await queryInterface.bulkDelete('departments', null, {});
    
    console.log('✅ Sample data removed');
  }
};
