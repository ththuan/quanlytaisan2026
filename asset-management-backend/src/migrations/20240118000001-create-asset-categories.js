'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Tạo bảng danh mục loại tài sản theo quy định
    await queryInterface.createTable('asset_categories', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      code: {
        type: Sequelize.STRING(20),
        allowNull: false,
        unique: true,
        comment: 'Mã loại tài sản theo quy định (VD: 0110202, 0120201)',
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
        comment: 'Tên loại tài sản',
      },
      parent_code: {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Mã loại tài sản cha (để phân cấp)',
      },
      unit: {
        type: Sequelize.STRING(50),
        allowNull: false,
        defaultValue: 'Cái',
        comment: 'Đơn vị tính (m2, Cái, Con, Cây, Phần mềm, ...)',
      },
      category_group: {
        type: Sequelize.ENUM(
          'nha_cua',           // Nhà, công trình xây dựng
          'phuong_tien',       // Phương tiện vận tải
          'may_moc',           // Máy móc, thiết bị
          'suc_vat',           // Súc vật
          'cay_lau_nam',       // Cây lâu năm
          'tai_san_dac_thu',   // Tài sản cố định đặc thù
          'tai_san_huu_hinh',  // Tài sản cố định hữu hình khác
          'tai_san_vo_hinh',   // Tài sản cố định vô hình
          'ket_qua_khcn',      // Kết quả nhiệm vụ KHCN
          'cong_cu_dung_cu'    // Công cụ dụng cụ
        ),
        allowNull: false,
        comment: 'Nhóm loại tài sản',
      },
      is_depreciable: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
        comment: 'Có tính khấu hao không',
      },
      depreciation_rate: {
        type: Sequelize.DECIMAL(5, 2),
        allowNull: true,
        comment: 'Tỷ lệ khấu hao hàng năm (%)',
      },
      useful_life_years: {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Thời gian sử dụng (năm)',
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      sort_order: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
        comment: 'Thứ tự sắp xếp',
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Tạo index
    await queryInterface.addIndex('asset_categories', ['code']);
    await queryInterface.addIndex('asset_categories', ['category_group']);
    await queryInterface.addIndex('asset_categories', ['parent_code']);

    // Thêm cột category_id vào bảng assets
    const columnExists = async (table, column) => {
      const result = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}'`
      );
      return result[0].length > 0;
    };

    if (!(await columnExists('assets', 'category_id'))) {
      await queryInterface.addColumn('assets', 'category_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'asset_categories',
          key: 'id',
        },
      });
    }

    if (!(await columnExists('assets', 'category_code'))) {
      await queryInterface.addColumn('assets', 'category_code', {
        type: Sequelize.STRING(20),
        allowNull: true,
        comment: 'Mã loại tài sản',
      });
    }

    if (!(await columnExists('assets', 'unit'))) {
      await queryInterface.addColumn('assets', 'unit', {
        type: Sequelize.STRING(50),
        allowNull: true,
        defaultValue: 'Cái',
        comment: 'Đơn vị tính',
      });
    }

    if (!(await columnExists('assets', 'quantity'))) {
      await queryInterface.addColumn('assets', 'quantity', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 1,
        comment: 'Số lượng theo sổ kế toán',
      });
    }

    if (!(await columnExists('assets', 'actual_quantity'))) {
      await queryInterface.addColumn('assets', 'actual_quantity', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Số lượng theo thực tế kiểm kê',
      });
    }

    if (!(await columnExists('assets', 'quantity_difference'))) {
      await queryInterface.addColumn('assets', 'quantity_difference', {
        type: Sequelize.INTEGER,
        allowNull: true,
        defaultValue: 0,
        comment: 'Chênh lệch số lượng = actual_quantity - quantity',
      });
    }

    if (!(await columnExists('assets', 'year_in_use'))) {
      await queryInterface.addColumn('assets', 'year_in_use', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'Năm đưa vào sử dụng',
      });
    }

    if (!(await columnExists('assets', 'residual_value'))) {
      await queryInterface.addColumn('assets', 'residual_value', {
        type: Sequelize.DECIMAL(18, 2),
        allowNull: true,
        comment: 'Giá trị còn lại (đồng)',
      });
    }

    if (!(await columnExists('assets', 'asset_condition'))) {
      await queryInterface.addColumn('assets', 'asset_condition', {
        type: Sequelize.ENUM(
          'good',           // 0 - Còn sử dụng được - đang sử dụng đúng mục đích
          'usable',         // 1 - Còn sử dụng được - không sử dụng
          'needs_repair',   // 2 - Cần sửa chữa
          'damaged',        // 3 - Hư hỏng
          'disposed'        // 4 - Đã thanh lý
        ),
        allowNull: true,
        defaultValue: 'good',
        comment: 'Tình trạng của tài sản',
      });
    }

    if (!(await columnExists('assets', 'land_parcel_id'))) {
      await queryInterface.addColumn('assets', 'land_parcel_id', {
        type: Sequelize.INTEGER,
        allowNull: true,
        comment: 'ID lô đất mà tài sản gắn liền (nếu có)',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Remove columns from assets
    const columns = [
      'category_id', 'category_code', 'unit', 'quantity', 
      'actual_quantity', 'quantity_difference', 'year_in_use',
      'residual_value', 'asset_condition', 'land_parcel_id'
    ];

    for (const col of columns) {
      try {
        await queryInterface.removeColumn('assets', col);
      } catch (e) {
        console.log(`Column ${col} does not exist or could not be removed`);
      }
    }

    await queryInterface.dropTable('asset_categories');
  },
};
