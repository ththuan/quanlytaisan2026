import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';
import type { PermissionScope } from '../constants/permissions';

export interface UserPermissionAttributes {
  id: number;
  user_id: number;
  permission_code: string;
  scope: PermissionScope;
  granted_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

interface UserPermissionCreationAttributes
  extends Optional<UserPermissionAttributes, 'id' | 'scope' | 'granted_by'> {}

class UserPermission
  extends Model<UserPermissionAttributes, UserPermissionCreationAttributes>
  implements UserPermissionAttributes
{
  public id!: number;
  public user_id!: number;
  public permission_code!: string;
  public scope!: PermissionScope;
  public granted_by?: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

UserPermission.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    user_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    permission_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
    },
    scope: {
      type: DataTypes.ENUM('own', 'department', 'all'),
      allowNull: false,
      defaultValue: 'department',
    },
    granted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onDelete: 'SET NULL',
    },
    created_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
    updated_at: {
      type: DataTypes.DATE,
      allowNull: false,
      defaultValue: DataTypes.NOW,
    },
  },
  {
    sequelize,
    tableName: 'user_permissions',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      { fields: ['user_id'] },
      { fields: ['permission_code'] },
      { unique: true, fields: ['user_id', 'permission_code'], name: 'uq_user_permissions_user_code' },
    ],
  },
);

export default UserPermission;
