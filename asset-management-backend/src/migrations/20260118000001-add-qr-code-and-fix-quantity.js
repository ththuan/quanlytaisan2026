'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const columnExists = async (table, column) => {
      const result = await queryInterface.sequelize.query(
        `SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND column_name = '${column}'`
      );
      return result[0].length > 0;
    };

    // Thêm trường qr_code và qr_code_image
    if (!(await columnExists('assets', 'qr_code'))) {
      await queryInterface.addColumn('assets', 'qr_code', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Mã QR code dạng JSON string chứa thông tin: mã, tên, loại, số lượng',
      });
    }

    if (!(await columnExists('assets', 'qr_code_image'))) {
      await queryInterface.addColumn('assets', 'qr_code_image', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Base64 image của QR code đã generate',
      });
    }

    // Đảm bảo quantity luôn là 1 và không null
    // Cập nhật tất cả tài sản có quantity > 1 hoặc null thành 1
    await queryInterface.sequelize.query(`
      UPDATE assets 
      SET quantity = 1 
      WHERE quantity IS NULL OR quantity != 1;
    `);

    // Thay đổi constraint để quantity không null và mặc định là 1
    await queryInterface.changeColumn('assets', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Số lượng theo sổ kế toán (luôn luôn là 1 - mỗi tài sản là một đơn vị riêng biệt)',
    });

    // Thêm index cho qr_code để tìm kiếm nhanh
    try {
      await queryInterface.addIndex('assets', ['qr_code'], {
        name: 'assets_qr_code_idx',
        where: {
          qr_code: { [Sequelize.Op.ne]: null }
        }
      });
    } catch (e) {}
  },

  async down(queryInterface, Sequelize) {
    // Xóa index
    await queryInterface.removeIndex('assets', 'assets_qr_code_idx');

    // Xóa các cột đã thêm
    await queryInterface.removeColumn('assets', 'qr_code_image');
    await queryInterface.removeColumn('assets', 'qr_code');

    // Khôi phục quantity về nullable
    await queryInterface.changeColumn('assets', 'quantity', {
      type: Sequelize.INTEGER,
      allowNull: true,
      defaultValue: 1,
      comment: 'Số lượng theo sổ kế toán',
    });
  }
};
