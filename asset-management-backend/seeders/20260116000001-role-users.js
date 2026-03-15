'use strict';
const bcrypt = require('bcryptjs');

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    const saltRounds = 10;
    const defaultPassword = await bcrypt.hash('Password123!', saltRounds);

    // Insert director user
    await queryInterface.bulkInsert('users', [
      {
        username: 'director',
        email: 'director@example.com',
        password_hash: defaultPassword,
        fullname: 'Giám Hiệu',
        role: 'director',
        is_active: true,
        created_at: new Date(),
        updated_at: new Date(),
      },
    ], {});

    // Get departments
    const departments = await queryInterface.sequelize.query(
      `SELECT id, name FROM departments WHERE name IN ('Phòng Kế toán', 'Phòng Hành chính') LIMIT 2;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    // Insert department heads
    const departmentHeads = departments.map((dept, index) => ({
      username: `truongphong${index + 1}`,
      email: `truongphong${index + 1}@example.com`,
      password_hash: defaultPassword,
      fullname: `Trưởng ${dept.name}`,
      role: 'department_head',
      department_id: dept.id,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    if (departmentHeads.length > 0) {
      await queryInterface.bulkInsert('users', departmentHeads, {});
    }

    // Insert staff users
    const staffUsers = departments.map((dept, index) => ({
      username: `nhanvien${index + 1}`,
      email: `nhanvien${index + 1}@example.com`,
      password_hash: defaultPassword,
      fullname: `Cán bộ ${dept.name}`,
      role: 'staff',
      department_id: dept.id,
      is_active: true,
      created_at: new Date(),
      updated_at: new Date(),
    }));

    if (staffUsers.length > 0) {
      await queryInterface.bulkInsert('users', staffUsers, {});
    }
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.bulkDelete('users', {
      username: {
        [Sequelize.Op.in]: ['director', 'truongphong1', 'truongphong2', 'nhanvien1', 'nhanvien2'],
      },
    }, {});
  }
};
