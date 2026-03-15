'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Kiểm tra xem cột qr_code_image đã tồn tại chưa
    const tableDescription = await queryInterface.describeTable('assets');
    
    if (tableDescription.qr_code_image) {
      // Luôn đổi sang TEXT để đảm bảo (vì base64 có thể rất dài)
      const colType = tableDescription.qr_code_image.type;
      const isVarchar = colType && (
        colType.includes('VARCHAR') || 
        colType.includes('CHARACTER VARYING') ||
        colType === 'VARCHAR' ||
        (colType === 'CHARACTER VARYING' && tableDescription.qr_code_image.length && tableDescription.qr_code_image.length <= 500)
      );
      
      if (isVarchar) {
        // Chạy SQL trực tiếp để đổi type
        await queryInterface.sequelize.query(`
          ALTER TABLE assets ALTER COLUMN qr_code_image TYPE TEXT;
        `);
      }
    } else {
      // Nếu cột chưa tồn tại, thêm mới
      await queryInterface.addColumn('assets', 'qr_code_image', {
        type: Sequelize.TEXT,
        allowNull: true,
        comment: 'Base64 image của QR code đã generate',
      });
    }
  },

  async down(queryInterface, Sequelize) {
    // Khôi phục về VARCHAR(500) nếu cần
    const tableDescription = await queryInterface.describeTable('assets');
    
    if (tableDescription.qr_code_image) {
      await queryInterface.changeColumn('assets', 'qr_code_image', {
        type: Sequelize.STRING(500),
        allowNull: true,
        comment: 'URL hình ảnh QR code đã generate',
      });
    }
  }
};
