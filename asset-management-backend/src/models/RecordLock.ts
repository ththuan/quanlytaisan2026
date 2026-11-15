import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type RecordLockEntity = 'maintenance' | 'procurement' | 'inventory_report';

export interface RecordLockAttributes {
  id: number;
  entity_type: RecordLockEntity | string;
  entity_id: number;
  locked_by: number;
  lock_token: string;
  expires_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface RecordLockCreationAttributes
  extends Optional<RecordLockAttributes, 'id' | 'created_at' | 'updated_at'> {}

class RecordLock
  extends Model<RecordLockAttributes, RecordLockCreationAttributes>
  implements RecordLockAttributes
{
  public id!: number;
  public entity_type!: string;
  public entity_id!: number;
  public locked_by!: number;
  public lock_token!: string;
  public expires_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

RecordLock.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    entity_type: {
      type: DataTypes.STRING(50),
      allowNull: false,
    },
    entity_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    locked_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: { model: 'users', key: 'id' },
      onDelete: 'CASCADE',
    },
    lock_token: {
      type: DataTypes.STRING(64),
      allowNull: false,
    },
    expires_at: {
      type: DataTypes.DATE,
      allowNull: false,
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
    tableName: 'record_locks',
    timestamps: true,
    createdAt: 'created_at',
    updatedAt: 'updated_at',
    underscored: true,
    indexes: [
      { unique: true, fields: ['entity_type', 'entity_id'], name: 'uq_record_locks_entity' },
      { fields: ['expires_at'] },
    ],
  },
);

export default RecordLock;
