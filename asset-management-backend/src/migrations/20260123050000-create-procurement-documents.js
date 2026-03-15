'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('procurement_documents', {
      id: {
        type: Sequelize.BIGINT,
        primaryKey: true,
        autoIncrement: true,
      },
      procurement_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'procurements',
          key: 'id',
        },
        onDelete: 'CASCADE',
        onUpdate: 'CASCADE',
      },
      file_name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      mime_type: {
        type: Sequelize.STRING(100),
        allowNull: false,
        defaultValue: 'application/pdf',
      },
      size_bytes: {
        type: Sequelize.INTEGER,
        allowNull: false,
        defaultValue: 0,
      },
      content: {
        type: Sequelize.BLOB('long'),
        allowNull: false,
      },
      created_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
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

    await queryInterface.addIndex('procurement_documents', ['procurement_id'], {
      name: 'idx_procurement_documents_procurement_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('procurement_documents');
  },
};
