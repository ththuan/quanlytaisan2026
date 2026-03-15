'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create sample departments
    await queryInterface.bulkInsert('departments', [
      {
        id: 1,
        name: 'Phòng Công nghệ thông tin',
        type: 'room',
        description: 'Phòng quản lý hệ thống công nghệ thông tin',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 2,
        name: 'Phòng Kế toán',
        type: 'room',
        description: 'Phòng kế toán tài chính',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 3,
        name: 'Phòng Nhân sự',
        type: 'room',
        description: 'Phòng quản lý nhân sự',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 4,
        name: 'Phòng Marketing',
        type: 'room',
        description: 'Phòng tiếp thị và truyền thông',
        created_at: new Date(),
        updated_at: new Date(),
      },
      {
        id: 5,
        name: 'Phòng Hành chính',
        type: 'room',
        description: 'Phòng hành chính tổng hợp',
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});

    // Reset sequence for PostgreSQL
    await queryInterface.sequelize.query(
      `SELECT setval('departments_id_seq', (SELECT MAX(id) FROM departments));`
    );

    console.log('✅ Departments seeded successfully');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('departments', null, {});
  }
};
