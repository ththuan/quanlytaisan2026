'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('signatures', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
        allowNull: false,
      },
      entity_type: {
        type: Sequelize.STRING(50),
        allowNull: false,
        comment: 'inventory_report | asset_disposal_case | asset_transfer',
      },
      entity_id: { type: Sequelize.INTEGER, allowNull: false },
      action: {
        type: Sequelize.STRING(30),
        allowNull: false,
        comment: 'submit | approve | reject | create | complete',
      },
      signer_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onUpdate: 'CASCADE',
        onDelete: 'RESTRICT',
      },
      signer_name: { type: Sequelize.STRING(255), allowNull: false },
      signer_role: { type: Sequelize.STRING(30), allowNull: true },
      signature_image: {
        type: Sequelize.TEXT,
        allowNull: false,
        comment: 'Ảnh chữ ký sống (data URL base64)',
      },
      ip_address: { type: Sequelize.STRING(45), allowNull: true },
      user_agent: { type: Sequelize.TEXT, allowNull: true },
      signed_at: { type: Sequelize.DATE, allowNull: false, defaultValue: Sequelize.literal('CURRENT_TIMESTAMP') },
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

    await queryInterface.addIndex('signatures', ['entity_type', 'entity_id']);
    await queryInterface.addIndex('signatures', ['signer_id']);
  },

  async down(queryInterface) {
    await queryInterface.dropTable('signatures');
  },
};
