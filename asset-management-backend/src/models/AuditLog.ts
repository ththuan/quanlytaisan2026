import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AuditLogAttributes {
  id: number;
  user_id?: number;
  action: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approve';
  table_name?: string;
  record_id?: number;
  old_value?: Record<string, any>;
  new_value?: Record<string, any>;
  ip_address?: string;
  user_agent?: string;
  read_at?: Date;
  created_at?: Date;
}

interface AuditLogCreationAttributes extends Optional<AuditLogAttributes, 'id'> {}

class AuditLog extends Model<AuditLogAttributes, AuditLogCreationAttributes> implements AuditLogAttributes {
  public id!: number;
  public user_id?: number;
  public action!: 'create' | 'update' | 'delete' | 'login' | 'logout' | 'approve';
  public table_name?: string;
  public record_id?: number;
  public old_value?: Record<string, any>;
  public new_value?: Record<string, any>;
  public ip_address?: string;
  public user_agent?: string;
  public read_at?: Date;
  public readonly created_at!: Date;
}

AuditLog.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    action: {
      type: DataTypes.ENUM('create', 'update', 'delete', 'login', 'logout', 'approve'),
      allowNull: false,
    },
    table_name: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    record_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    old_value: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    new_value: {
      type: DataTypes.JSONB,
      allowNull: true,
    },
    ip_address: {
      type: DataTypes.STRING(45),
      allowNull: true,
    },
    user_agent: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    read_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'audit_logs',
    timestamps: false,
    createdAt: 'created_at',
    updatedAt: false,
    underscored: true,
    indexes: [
      {
        fields: ['user_id'],
      },
      {
        fields: ['created_at'],
      },
      {
        fields: ['action'],
      },
      {
        fields: ['read_at'],
      },
    ],
  }
);

export default AuditLog;
