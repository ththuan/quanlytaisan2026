'use strict';

const bcrypt = require('bcryptjs');

module.exports = {
  async up(queryInterface) {
    const passwordHash = await bcrypt.hash('Admin@123', 10);
    await queryInterface.bulkInsert(
      'users',
      [
        {
          username: 'admin',
          email: 'admin@example.com',
          password_hash: passwordHash,
          fullname: 'System Admin',
          role: 'admin',
          department_id: null,
          is_active: true,
          created_at: new Date(),
          updated_at: new Date(),
        },
      ],
      {}
    );
  },

  async down(queryInterface) {
    await queryInterface.bulkDelete('users', { username: 'admin' }, {});
  },
};
