'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('push_subscriptions', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: { model: 'users', key: 'id' },
        onDelete: 'CASCADE',
      },
      endpoint: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      p256dh: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      auth: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
      updated_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.fn('NOW'),
      },
    });

    await queryInterface.addIndex('push_subscriptions', ['endpoint'], {
      unique: true,
      name: 'push_subscriptions_endpoint_unique',
    });
    await queryInterface.addIndex('push_subscriptions', ['user_id'], {
      name: 'push_subscriptions_user_id',
    });
  },

  async down(queryInterface) {
    await queryInterface.dropTable('push_subscriptions');
  },
};
