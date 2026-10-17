'use strict';

/**
 * Loại bỏ email + Google OAuth di sản khỏi hệ thống.
 * - users: bỏ cột email, google_id, auth_provider (và index liên quan)
 * - request_approvals: bỏ cột approver_email
 */
module.exports = {
  async up(queryInterface, Sequelize) {
    const dropColumnSafe = async (table, column) => {
      try {
        await queryInterface.removeColumn(table, column);
      } catch (e) {
        // Bỏ qua nếu cột/index không tồn tại
      }
    };

    // Bỏ index unique trên email/google_id trước (nếu còn) để tránh kẹt constraint
    try {
      await queryInterface.removeIndex('users', 'users_email_key');
    } catch (e) { /* ignore */ }
    try {
      await queryInterface.removeIndex('users', 'users_google_id_unique');
    } catch (e) { /* ignore */ }

    await dropColumnSafe('users', 'email');
    await dropColumnSafe('users', 'google_id');
    await dropColumnSafe('users', 'auth_provider');
    await dropColumnSafe('request_approvals', 'approver_email');
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.addColumn('users', 'email', {
      type: Sequelize.STRING(100),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'google_id', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
    await queryInterface.addColumn('users', 'auth_provider', {
      type: Sequelize.STRING(20),
      allowNull: false,
      defaultValue: 'local',
    });
    await queryInterface.addColumn('request_approvals', 'approver_email', {
      type: Sequelize.STRING(255),
      allowNull: true,
    });
  },
};
