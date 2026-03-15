'use strict';

/** @type {import('sequelize-cli').Migration} */
module.exports = {
  async up(queryInterface, Sequelize) {
    // Create departments table
    await queryInterface.createTable('departments', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      type: {
        type: Sequelize.ENUM('center', 'faculty', 'room', 'lab', 'office'),
        allowNull: true,
      },
      parent_department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
      },
      manager_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Create users table
    await queryInterface.createTable('users', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      username: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      email: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      password_hash: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      fullname: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      role: {
        type: Sequelize.ENUM('admin', 'manager', 'staff', 'user'),
        allowNull: false,
        defaultValue: 'user',
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
      },
      is_active: {
        type: Sequelize.BOOLEAN,
        allowNull: false,
        defaultValue: true,
      },
      last_login: {
        type: Sequelize.DATE,
        allowNull: true,
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

    // Create assets table
    await queryInterface.createTable('assets', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      asset_code: {
        type: Sequelize.STRING(100),
        allowNull: false,
        unique: true,
      },
      name: {
        type: Sequelize.STRING(255),
        allowNull: false,
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      category: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      asset_type: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      purchase_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      purchase_price: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      current_value: {
        type: Sequelize.DECIMAL(12, 2),
        allowNull: true,
      },
      serial_number: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      warranty_date: {
        type: Sequelize.DATEONLY,
        allowNull: true,
      },
      current_department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
      },
      status: {
        type: Sequelize.ENUM('active', 'inactive', 'damaged', 'lost', 'disposed'),
        allowNull: false,
        defaultValue: 'active',
      },
      location: {
        type: Sequelize.STRING(255),
        allowNull: true,
      },
      image_url: {
        type: Sequelize.STRING(500),
        allowNull: true,
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

    // Create asset_transfers table
    await queryInterface.createTable('asset_transfers', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      asset_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'assets',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      from_department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
      },
      to_department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
      },
      requested_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      transfer_date: {
        type: Sequelize.DATE,
        allowNull: true,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
      reason: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('pending', 'approved', 'rejected', 'completed'),
        allowNull: false,
        defaultValue: 'pending',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Create maintenance_requests table
    await queryInterface.createTable('maintenance_requests', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      asset_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'assets',
          key: 'id',
        },
        onDelete: 'CASCADE',
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'departments',
          key: 'id',
        },
      },
      description: {
        type: Sequelize.TEXT,
        allowNull: false,
      },
      urgency: {
        type: Sequelize.ENUM('low', 'normal', 'high', 'critical'),
        allowNull: false,
        defaultValue: 'normal',
      },
      requested_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      assigned_to: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      status: {
        type: Sequelize.ENUM('new', 'approved', 'in_progress', 'done', 'rejected'),
        allowNull: false,
        defaultValue: 'new',
      },
      cost: {
        type: Sequelize.DECIMAL(10, 2),
        allowNull: true,
      },
      start_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      completion_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Create annual_reports table
    await queryInterface.createTable('annual_reports', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      department_id: {
        type: Sequelize.INTEGER,
        allowNull: false,
        references: {
          model: 'departments',
          key: 'id',
        },
      },
      year: {
        type: Sequelize.INTEGER,
        allowNull: false,
      },
      total_assets: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      active_assets: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      damaged_assets: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      lost_assets: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      total_value: {
        type: Sequelize.DECIMAL(14, 2),
        allowNull: true,
      },
      submitted_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      submitted_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      approved_by: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      approved_date: {
        type: Sequelize.DATE,
        allowNull: true,
      },
      status: {
        type: Sequelize.ENUM('draft', 'submitted', 'approved', 'rejected'),
        allowNull: false,
        defaultValue: 'draft',
      },
      notes: {
        type: Sequelize.TEXT,
        allowNull: true,
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

    // Create audit_logs table
    await queryInterface.createTable('audit_logs', {
      id: {
        type: Sequelize.INTEGER,
        autoIncrement: true,
        primaryKey: true,
      },
      user_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
        references: {
          model: 'users',
          key: 'id',
        },
      },
      action: {
        type: Sequelize.ENUM('create', 'update', 'delete', 'login', 'logout', 'approve'),
        allowNull: false,
      },
      table_name: {
        type: Sequelize.STRING(100),
        allowNull: true,
      },
      record_id: {
        type: Sequelize.INTEGER,
        allowNull: true,
      },
      old_value: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      new_value: {
        type: Sequelize.JSONB,
        allowNull: true,
      },
      ip_address: {
        type: Sequelize.STRING(45),
        allowNull: true,
      },
      user_agent: {
        type: Sequelize.TEXT,
        allowNull: true,
      },
      created_at: {
        type: Sequelize.DATE,
        allowNull: false,
        defaultValue: Sequelize.literal('CURRENT_TIMESTAMP'),
      },
    });

    // Create indexes
    await queryInterface.addIndex('users', ['username'], { unique: true });
    await queryInterface.addIndex('users', ['email'], { unique: true });
    await queryInterface.addIndex('users', ['department_id']);
    await queryInterface.addIndex('assets', ['asset_code'], { unique: true });
    await queryInterface.addIndex('assets', ['current_department_id']);
    await queryInterface.addIndex('assets', ['status']);
    await queryInterface.addIndex('asset_transfers', ['asset_id']);
    await queryInterface.addIndex('asset_transfers', ['status']);
    await queryInterface.addIndex('asset_transfers', ['transfer_date']);
    await queryInterface.addIndex('maintenance_requests', ['asset_id']);
    await queryInterface.addIndex('maintenance_requests', ['status']);
    await queryInterface.addIndex('audit_logs', ['user_id']);
    await queryInterface.addIndex('audit_logs', ['created_at']);
    await queryInterface.addIndex('annual_reports', ['department_id', 'year'], { unique: true });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('audit_logs');
    await queryInterface.dropTable('annual_reports');
    await queryInterface.dropTable('maintenance_requests');
    await queryInterface.dropTable('asset_transfers');
    await queryInterface.dropTable('assets');
    await queryInterface.dropTable('users');
    await queryInterface.dropTable('departments');
  },
};
