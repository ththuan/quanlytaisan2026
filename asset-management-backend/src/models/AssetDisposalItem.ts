import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AssetDisposalItemAttributes {
  id: number;
  disposal_case_id: number;
  asset_id: number;
  inventory_report_detail_id?: number;
  moved_from_department_id?: number;
  moved_at?: Date;
  moved_by?: number;
  reason?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface AssetDisposalItemCreationAttributes
  extends Optional<
    AssetDisposalItemAttributes,
    'id' | 'inventory_report_detail_id' | 'moved_from_department_id' | 'moved_at' | 'moved_by' | 'reason'
  > {}

class AssetDisposalItem
  extends Model<AssetDisposalItemAttributes, AssetDisposalItemCreationAttributes>
  implements AssetDisposalItemAttributes
{
  public id!: number;
  public disposal_case_id!: number;
  public asset_id!: number;
  public inventory_report_detail_id?: number;
  public moved_from_department_id?: number;
  public moved_at?: Date;
  public moved_by?: number;
  public reason?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AssetDisposalItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    disposal_case_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'asset_disposal_cases',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'assets',
        key: 'id',
      },
    },
    inventory_report_detail_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'inventory_report_details',
        key: 'id',
      },
    },
    moved_from_department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    moved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    moved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    reason: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'asset_disposal_items',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['disposal_case_id'] },
      { fields: ['asset_id'] },
      { fields: ['inventory_report_detail_id'] },
      { fields: ['moved_from_department_id'] },
    ],
  }
);

export default AssetDisposalItem;
