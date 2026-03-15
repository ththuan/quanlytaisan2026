'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.addColumn('audit_logs', 'read_at', {
      type: Sequelize.DATE,
      allowNull: true,
    });

    await queryInterface.addIndex('audit_logs', ['read_at']);
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.removeColumn('audit_logs', 'read_at');
  }
};