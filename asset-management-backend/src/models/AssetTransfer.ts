import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type TransferStatus = 'pending' | 'approved' | 'rejected' | 'completed' | 'approved_by_head' | 'rejected_by_head';

export interface AssetTransferAttributes {
  id: number;
  asset_id: number;
  from_department_id?: number;
  to_department_id?: number;
  requested_by?: number;
  approved_by?: number;
  head_approved_by?: number;
  head_approved_at?: Date;
  head_notes?: string;
  rejection_reason?: string;
  transfer_date?: Date;
  reason?: string;
  status: TransferStatus;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface AssetTransferCreationAttributes extends Optional<AssetTransferAttributes, 'id' | 'status'> {}

class AssetTransfer extends Model<AssetTransferAttributes, AssetTransferCreationAttributes> implements AssetTransferAttributes {
  public id!: number;
  public asset_id!: number;
  public from_department_id?: number;
  public to_department_id?: number;
  public requested_by?: number;
  public approved_by?: number;
  public head_approved_by?: number;
  public head_approved_at?: Date;
  public head_notes?: string;
  public rejection_reason?: string;
  public transfer_date?: Date;
  public reason?: string;
  public status!: TransferStatus;
  public notes?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AssetTransfer.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'assets',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    from_department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    to_department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    requested_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    head_approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    head_approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    head_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    transfer_date: {
      type: DataTypes.DATE,
      allowNull: true,
      defaultValue: DataTypes.NOW,
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('pending', 'approved', 'rejected', 'completed', 'approved_by_head', 'rejected_by_head'),
      allowNull: false,
      defaultValue: 'pending',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'asset_transfers',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['asset_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['transfer_date'],
      },
    ],
  }
);

export default AssetTransfer;
