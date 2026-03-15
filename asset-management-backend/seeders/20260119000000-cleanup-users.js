'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    console.log('🗑️  Starting cleanup: Delete all users except admin...\n');

    // Lấy ID của admin để giữ lại
    const adminUsers = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role = 'admin' LIMIT 1;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    const adminId = adminUsers && adminUsers.length > 0 ? adminUsers[0].id : null;

    if (!adminId) {
      console.log('⚠️  Warning: No admin user found!');
      return;
    }

    console.log(`✅ Found admin user with ID: ${adminId}\n`);

    // Lấy danh sách user IDs cần xóa (trừ admin)
    const usersToDelete = await queryInterface.sequelize.query(
      `SELECT id FROM users WHERE role != 'admin';`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    if (!usersToDelete || usersToDelete.length === 0) {
      console.log('ℹ️  No users to delete (only admin exists).\n');
      return;
    }

    const userIdsToDelete = usersToDelete.map(u => u.id);
    console.log(`📋 Found ${userIdsToDelete.length} users to delete (IDs: ${userIdsToDelete.join(', ')})\n`);

    // 1. Cập nhật các bản ghi liên quan trong inventory_reports (gán về admin)
    console.log('📝 Cleaning up inventory_reports...');
    await queryInterface.sequelize.query(
      `UPDATE inventory_reports SET created_by = ${adminId} WHERE created_by IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      `UPDATE inventory_reports SET head_approved_by = ${adminId} WHERE head_approved_by IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      `UPDATE inventory_reports SET admin_approved_by = ${adminId} WHERE admin_approved_by IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    console.log('✅ inventory_reports cleaned\n');

    // 2. Cập nhật các bản ghi liên quan trong maintenance_requests
    console.log('📝 Cleaning up maintenance_requests...');
    await queryInterface.sequelize.query(
      `UPDATE maintenance_requests SET requested_by = ${adminId} WHERE requested_by IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      `UPDATE maintenance_requests SET approved_by = ${adminId} WHERE approved_by IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      `UPDATE maintenance_requests SET assigned_to = NULL WHERE assigned_to IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      `UPDATE maintenance_requests SET head_approved_by = ${adminId} WHERE head_approved_by IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      `UPDATE maintenance_requests SET admin_approved_by = ${adminId} WHERE admin_approved_by IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      `UPDATE maintenance_requests SET director_approved_by = ${adminId} WHERE director_approved_by IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    await queryInterface.sequelize.query(
      `UPDATE maintenance_requests SET rejected_by = ${adminId} WHERE rejected_by IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    console.log('✅ maintenance_requests cleaned\n');

    // 3. Cập nhật các bản ghi liên quan trong audit_logs (có thể NULL)
    console.log('📝 Cleaning up audit_logs...');
    await queryInterface.sequelize.query(
      `UPDATE audit_logs SET user_id = ${adminId} WHERE user_id IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    console.log('✅ audit_logs cleaned\n');

    // 4. Cập nhật các bản ghi liên quan trong inventory_rounds
    console.log('📝 Cleaning up inventory_rounds...');
    await queryInterface.sequelize.query(
      `UPDATE inventory_rounds SET created_by = ${adminId} WHERE created_by IN (${userIdsToDelete.join(',')});`,
      { type: Sequelize.QueryTypes.RAW }
    );
    console.log('✅ inventory_rounds cleaned\n');

    // 5. Cuối cùng, xóa tất cả người dùng trừ admin
    console.log('🗑️  Deleting users...');
    await queryInterface.bulkDelete('users', {
      role: {
        [Sequelize.Op.ne]: 'admin'
      }
    }, {});

    // Kiểm tra kết quả
    const remainingUsers = await queryInterface.sequelize.query(
      `SELECT id, username, email, role FROM users;`,
      { type: Sequelize.QueryTypes.SELECT }
    );

    console.log('\n✅ Cleanup completed!');
    console.log(`📊 Remaining users: ${remainingUsers ? remainingUsers.length : 0}`);
    if (remainingUsers && remainingUsers.length > 0) {
      console.log('\nRemaining users:');
      remainingUsers.forEach(user => {
        console.log(`   - ${user.username} (${user.email}) - ${user.role}`);
      });
    }
    console.log('');
  },

  async down(queryInterface, Sequelize) {
    // Không thể rollback việc xóa dữ liệu
    // Chỉ có thể chạy lại các seeder khác để tạo lại dữ liệu
    console.log('⚠️  Cannot rollback user deletion. Please restore from backup or re-run seeders.');
  },
};
