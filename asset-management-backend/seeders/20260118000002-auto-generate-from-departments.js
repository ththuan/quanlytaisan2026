'use strict';

const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const now = new Date();
    const defaultPassword = await bcrypt.hash('Password123!', 10);

    console.log('🚀 Starting automatic data generation from existing departments...\n');

    // ============================================
    // 1. LẤY TẤT CẢ PHÒNG BAN HIỆN CÓ
    // ============================================
    console.log('📁 Fetching existing departments...');
    
    const departments = await queryInterface.sequelize.query(
      `SELECT id, name, type FROM departments ORDER BY id;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!departments || departments.length === 0) {
      console.log('❌ No departments found! Please run department seeder first.');
      console.log('   Run: npx sequelize-cli db:seed --seed 20260112000001-departments.js');
      return;
    }

    console.log(`✅ Found ${departments.length} departments:\n`);
    departments.forEach((dept, index) => {
      console.log(`   ${index + 1}. ${dept.name} (ID: ${dept.id}, Type: ${dept.type || 'N/A'})`);
    });
    console.log('');

    // ============================================
    // 2. TẠO ADMIN VÀ DIRECTOR (NẾU CHƯA CÓ)
    // ============================================
    console.log('👤 Creating admin and director users...');

    const [existingAdmin] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!existingAdmin) {
      await queryInterface.bulkInsert('users', [{
        username: 'admin',
        email: 'admin@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Nguyễn Văn Admin',
        role: 'admin',
        department_id: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      }], {});
      console.log('   ✅ Created admin user');
    } else {
      console.log('   ℹ️  Admin user already exists');
    }

    const [existingDirector] = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'director' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!existingDirector) {
      await queryInterface.bulkInsert('users', [{
        username: 'director',
        email: 'director@college.edu.vn',
        password_hash: defaultPassword,
        fullname: 'Trần Thị Giám đốc',
        role: 'director',
        department_id: null,
        is_active: true,
        created_at: now,
        updated_at: now,
      }], {});
      console.log('   ✅ Created director user');
    } else {
      console.log('   ℹ️  Director user already exists');
    }

    // ============================================
    // 3. TẠO USERS CHO MỖI PHÒNG BAN
    // ============================================
    console.log('\n👥 Creating users for each department...');

    const usersToInsert = [];
    const departmentUserMap = {}; // Lưu user_id của trưởng phòng để cập nhật manager_id

    for (const dept of departments) {
      // Tạo username từ tên phòng ban (loại bỏ dấu, chuyển thành lowercase)
      const deptSlug = dept.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);

      // 1. Department Head (Trưởng phòng/khoa)
      const deptHeadUsername = `truong_${deptSlug}`;
      const deptHeadEmail = `truong.${deptSlug}@college.edu.vn`;
      
      // Kiểm tra xem đã có user này chưa
      const [existingDeptHead] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1;`,
        {
          replacements: { username: deptHeadUsername, email: deptHeadEmail },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (!existingDeptHead) {
        const deptHeadId = usersToInsert.length + 1; // Tạm thời, sẽ được set sau khi insert
        usersToInsert.push({
          username: deptHeadUsername,
          email: deptHeadEmail,
          password_hash: defaultPassword,
          fullname: `Trưởng ${dept.name}`,
          role: 'department_head',
          department_id: dept.id,
          is_active: true,
          created_at: now,
          updated_at: now,
        });
        departmentUserMap[dept.id] = { headId: deptHeadId, headUsername: deptHeadUsername };
        console.log(`   ✅ Created department head for: ${dept.name}`);
      } else {
        console.log(`   ℹ️  Department head already exists for: ${dept.name}`);
      }

      // 2. Manager (Quản lý) - 1 người cho mỗi phòng ban
      const managerUsername = `ql_${deptSlug}`;
      const managerEmail = `ql.${deptSlug}@college.edu.vn`;
      
      const [existingManager] = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1;`,
        {
          replacements: { username: managerUsername, email: managerEmail },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (!existingManager) {
        usersToInsert.push({
          username: managerUsername,
          email: managerEmail,
          password_hash: defaultPassword,
          fullname: `Quản lý ${dept.name}`,
          role: 'manager',
          department_id: dept.id,
          is_active: true,
          created_at: now,
          updated_at: now,
        });
        console.log(`   ✅ Created manager for: ${dept.name}`);
      }

      // 3. Staff (Cán bộ) - 2 người cho mỗi phòng ban
      for (let i = 1; i <= 2; i++) {
        const staffUsername = `nv_${deptSlug}_${i}`;
        const staffEmail = `nv${i}.${deptSlug}@college.edu.vn`;
        
        const [existingStaff] = await queryInterface.sequelize.query(
          `SELECT id FROM users WHERE username = :username OR email = :email LIMIT 1;`,
          {
            replacements: { username: staffUsername, email: staffEmail },
            type: Sequelize.QueryTypes.SELECT
          }
        );

        if (!existingStaff) {
          usersToInsert.push({
            username: staffUsername,
            email: staffEmail,
            password_hash: defaultPassword,
            fullname: `Cán bộ ${i} - ${dept.name}`,
            role: 'staff',
            department_id: dept.id,
            is_active: true,
            created_at: now,
            updated_at: now,
          });
        }
      }
      console.log(`   ✅ Created 2 staff users for: ${dept.name}`);
    }

    // Insert tất cả users
    if (usersToInsert.length > 0) {
      await queryInterface.bulkInsert('users', usersToInsert, {});
      console.log(`\n✅ Created ${usersToInsert.length} new users`);
    } else {
      console.log('\nℹ️  No new users to create (all already exist)');
    }

    // Cập nhật manager_id cho departments
    console.log('\n🔗 Updating department managers...');
    for (const dept of departments) {
      const deptSlug = dept.name
        .toLowerCase()
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/[^a-z0-9\s]/g, '')
        .replace(/\s+/g, '_')
        .substring(0, 30);
      
      const headUsername = `truong_${deptSlug}`;
      
      const headUsers = await queryInterface.sequelize.query(
        `SELECT id FROM users WHERE username = :username AND department_id = :deptId LIMIT 1;`,
        {
          replacements: { username: headUsername, deptId: dept.id },
          type: Sequelize.QueryTypes.SELECT
        }
      );

      if (headUsers && headUsers.length > 0) {
        const headUser = headUsers[0];
        await queryInterface.sequelize.query(
          `UPDATE departments SET manager_id = :managerId WHERE id = :deptId;`,
          {
            replacements: { managerId: headUser.id, deptId: dept.id }
          }
        );
        console.log(`   ✅ Updated manager for: ${dept.name}`);
      } else {
        console.log(`   ⚠️  Could not find department head for: ${dept.name}`);
      }
    }

    // ============================================
    // 4. LẤY DANH MỤC TÀI SẢN
    // ============================================
    console.log('\n📦 Fetching asset categories...');
    
    const categories = await queryInterface.sequelize.query(
      `SELECT id, code, name, depreciation_rate, useful_life_years, is_depreciable, unit 
       FROM asset_categories 
       WHERE parent_code IS NOT NULL 
       ORDER BY code;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!categories || categories.length === 0) {
      console.log('⚠️  No asset categories found. Please run asset categories migration first.');
      console.log('   Run: npm run migrate');
      return;
    }

    console.log(`✅ Found ${categories.length} asset categories`);

    // ============================================
    // 5. TẠO TÀI SẢN MẪU CHO MỖI PHÒNG BAN
    // ============================================
    console.log('\n🏢 Creating sample assets for each department...');

    // Template tài sản theo từng loại danh mục
    const assetTemplates = {
      // Nhà, công trình
      '0101': [{ name: 'Biệt thự Hiệu trưởng', basePrice: 5000000000, year: 2020 }],
      '0102': [{ name: 'Tòa nhà A', basePrice: 8000000000, year: 2019 }],
      '0103': [{ name: 'Tòa nhà B', basePrice: 5000000000, year: 2015 }],
      '0104': [{ name: 'Tòa nhà C', basePrice: 3000000000, year: 2010 }],
      '0105': [{ name: 'Nhà kho', basePrice: 1500000000, year: 2012 }],
      // Vật kiến trúc
      '0201': [
        { name: 'Kho chứa thiết bị', basePrice: 800000000, year: 2018 },
        { name: 'Bể bơi', basePrice: 1200000000, year: 2019 },
        { name: 'Sân thể thao', basePrice: 600000000, year: 2020 }
      ],
      '0202': [
        { name: 'Tường rào', basePrice: 2000000000, year: 2015 },
        { name: 'Giếng khoan', basePrice: 150000000, year: 2016 }
      ],
      // Xe ô tô
      '03': [
        { name: 'Xe ô tô 7 chỗ', basePrice: 850000000, year: 2021 },
        { name: 'Xe ô tô 16 chỗ', basePrice: 1200000000, year: 2020 }
      ],
      // Phương tiện khác
      '04': [
        { name: 'Xe máy Honda', basePrice: 25000000, year: 2021 },
        { name: 'Xe đạp điện', basePrice: 12000000, year: 2022 }
      ],
      // Máy móc thiết bị
      '0501': [
        { name: 'Bộ bàn ghế làm việc (10 bộ)', basePrice: 50000000, year: 2022 },
        { name: 'Bộ bàn ghế họp (20 bộ)', basePrice: 80000000, year: 2021 },
        { name: 'Thang máy', basePrice: 800000000, year: 2019 }
      ],
      '0502': [
        { name: 'Tủ đựng tài liệu (15 cái)', basePrice: 45000000, year: 2021 },
        { name: 'Máy điều hòa (10 máy)', basePrice: 180000000, year: 2022 },
        { name: 'Máy bơm nước', basePrice: 25000000, year: 2020 }
      ],
      '0503': [
        { name: 'Máy vi tính để bàn (30 máy)', basePrice: 600000000, year: 2022 },
        { name: 'Laptop Dell (15 máy)', basePrice: 525000000, year: 2023 },
        { name: 'Máy in HP (10 máy)', basePrice: 85000000, year: 2022 },
        { name: 'Máy photocopy (5 máy)', basePrice: 150000000, year: 2021 }
      ],
      '0505': [
        { name: 'Máy chiếu Epson (8 máy)', basePrice: 120000000, year: 2021 },
        { name: 'Máy phát điện', basePrice: 150000000, year: 2020 }
      ],
      // Tài sản khác
      '06': [
        { name: 'Tủ lạnh (5 cái)', basePrice: 50000000, year: 2021 },
        { name: 'Quạt trần (20 cái)', basePrice: 40000000, year: 2020 }
      ],
      // Công cụ dụng cụ
      '07': [
        { name: 'Bộ dụng cụ sửa chữa (10 bộ)', basePrice: 5000000, year: 2022 },
        { name: 'Thước đo (20 cái)', basePrice: 2000000, year: 2021 }
      ],
    };

    const assets = [];
    let assetCodeCounter = 1;

    // Phân bổ tài sản cho các phòng ban
    for (const category of categories) {
      const templates = assetTemplates[category.code];
      if (!templates) continue;

      for (const template of templates) {
        // Phân bổ cho mỗi phòng ban ít nhất 1 tài sản của mỗi loại
        for (let i = 0; i < departments.length; i++) {
          const dept = departments[i];
          
          // Tính giá dựa trên phòng ban (variation)
          const priceVariation = 0.8 + (Math.random() * 0.4); // 80% - 120%
          const purchasePrice = Math.round(template.basePrice * priceVariation);
          
          const yearsInUse = new Date().getFullYear() - template.year;
          const depreciationRate = category.depreciation_rate || 0;
          const usefulLife = category.useful_life_years || 1;
          
          // Tính khấu hao
          let accumulatedDepreciation = 0;
          if (category.is_depreciable && depreciationRate > 0) {
            const annualDepreciation = (purchasePrice * depreciationRate) / 100;
            accumulatedDepreciation = Math.min(annualDepreciation * yearsInUse, purchasePrice);
          }
          
          const residualValue = purchasePrice - accumulatedDepreciation;
          
          // Tạo tên tài sản với phòng ban
          const assetName = `${template.name} - ${dept.name}`;
          
          assets.push({
            asset_code: `TS-${String(assetCodeCounter).padStart(5, '0')}`,
            name: assetName,
            description: `Tài sản thuộc danh mục ${category.name}, phòng ban ${dept.name}`,
            category_id: category.id,
            category_code: category.code,
            unit: category.unit,
            quantity: 1,
            purchase_date: new Date(`${template.year}-${String(Math.floor(Math.random() * 12) + 1).padStart(2, '0')}-15`),
            purchase_price: purchasePrice,
            current_value: residualValue,
            residual_value: residualValue,
            useful_life: usefulLife,
            is_depreciable: category.is_depreciable,
            depreciation_rate: depreciationRate,
            accumulated_depreciation: accumulatedDepreciation,
            depreciation_last_updated: new Date(),
            year_in_use: template.year,
            serial_number: category.code.startsWith('03') || category.code.startsWith('04') 
              ? `${category.code.toUpperCase()}-${assetCodeCounter}` 
              : null,
            current_department_id: dept.id,
            status: yearsInUse > usefulLife ? 'inactive' : (Math.random() > 0.9 ? 'damaged' : 'active'),
            condition: yearsInUse > usefulLife * 0.8 ? 'fair' : 'good',
            location: `${dept.name} - Tầng ${Math.floor(Math.random() * 5) + 1}`,
            created_at: now,
            updated_at: now,
          });

          assetCodeCounter++;
        }
      }
    }

    // Chèn tài sản vào database (chia nhỏ batch)
    if (assets.length > 0) {
      const batchSize = 100;
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
    }

    // ============================================
    // TỔNG KẾT
    // ============================================
    console.log('\n' + '='.repeat(60));
    console.log('🎉 AUTOMATIC DATA GENERATION COMPLETED!');
    console.log('='.repeat(60));
    console.log(`\n📊 Summary:`);
    console.log(`   - Departments: ${departments.length}`);
    console.log(`   - Users created: ${usersToInsert.length} new users`);
    console.log(`   - Assets created: ${assets.length}`);
    console.log(`\n🔑 Default password for all users: Password123!`);
    console.log(`\n👤 Sample login credentials:`);
    console.log(`   - admin / admin@college.edu.vn (Admin)`);
    console.log(`   - director / director@college.edu.vn (Director)`);
    console.log(`   - truong_[department_slug] (Department Head)`);
    console.log(`   - ql_[department_slug] (Manager)`);
    console.log(`   - nv_[department_slug]_1 (Staff)`);
    console.log(`\n💡 Each department has:`);
    console.log(`   - 1 Department Head`);
    console.log(`   - 1 Manager`);
    console.log(`   - 2 Staff members`);
    console.log(`   - Multiple assets distributed across all departments`);
    console.log('\n✅ Ready for comprehensive testing!');
  },

  async down(queryInterface, Sequelize) {
    console.log('🗑️  Removing auto-generated data...');
    
    // Xóa tài sản được tạo tự động
    await queryInterface.sequelize.query(
      `DELETE FROM assets WHERE asset_code LIKE 'TS-%';`
    );
    console.log('   ✅ Removed auto-generated assets');

    // Xóa users (trừ admin và director)
    await queryInterface.sequelize.query(
      `DELETE FROM users WHERE username LIKE 'truong_%' OR username LIKE 'ql_%' OR username LIKE 'nv_%';`
    );
    console.log('   ✅ Removed auto-generated users');

    // Reset manager_id trong departments
    await queryInterface.sequelize.query(
      `UPDATE departments SET manager_id = NULL;`
    );
    console.log('   ✅ Reset department managers');
    
    console.log('✅ Auto-generated data removed');
  }
};
