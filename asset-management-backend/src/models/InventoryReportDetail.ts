import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type DetailCondition = 'good' | 'fair' | 'poor';

export interface InventoryReportDetailAttributes {
  id: number;
  inventory_report_id: number;
  asset_id: number;
  assigned_quantity: number;
  actual_quantity: number;
  quantity_discrepancy: number;
  condition?: DetailCondition;
  original_asset_condition?: string; // Lưu giá trị gốc từ frontend (good, usable, needs_repair, damaged)
  suggest_disposal: boolean;
  suggest_repair?: boolean;
  disposal_reason?: string;
  notes?: string;
  created_at?: Date;
  updated_at?: Date;
}

interface InventoryReportDetailCreationAttributes extends Optional<InventoryReportDetailAttributes, 
  'id' | 'assigned_quantity' | 'actual_quantity' | 'quantity_discrepancy' | 'suggest_disposal' | 'suggest_repair'> {}

class InventoryReportDetail extends Model<InventoryReportDetailAttributes, InventoryReportDetailCreationAttributes> 
  implements InventoryReportDetailAttributes {
  public id!: number;
  public inventory_report_id!: number;
  public asset_id!: number;
  public assigned_quantity!: number;
  public actual_quantity!: number;
  public quantity_discrepancy!: number;
  public condition?: DetailCondition;
  public original_asset_condition?: string;
  public suggest_disposal!: boolean;
  public suggest_repair?: boolean;
  public disposal_reason?: string;
  public notes?: string;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InventoryReportDetail.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    inventory_report_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'inventory_reports',
        key: 'id',
      },
      comment: 'Báo cáo kiểm kê',
    },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'assets',
        key: 'id',
      },
      comment: 'Tài sản được kiểm kê',
    },
    assigned_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Số lượng được cấp',
    },
    actual_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Số lượng kiểm kê thực tế',
    },
    quantity_discrepancy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Chênh lệch = actual - assigned (thiếu: âm, thừa: dương)',
    },
    condition: {
      type: DataTypes.ENUM('good', 'fair', 'poor'),
      allowNull: true,
      comment: 'Tình trạng tài sản',
    },
    original_asset_condition: {
      type: DataTypes.STRING(50),
      allowNull: true,
      comment: 'Giá trị asset_condition gốc từ frontend (good, usable, needs_repair, damaged)',
    },
    suggest_disposal: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Đề nghị thanh lý',
    },
    suggest_repair: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Đề nghị sửa chữa',
    },
    disposal_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Lý do đề nghị thanh lý',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú',
    },
  },
  {
    sequelize,
    tableName: 'inventory_report_details',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['inventory_report_id'],
      },
      {
        fields: ['asset_id'],
      },
      {
        fields: ['inventory_report_id', 'asset_id'],
        unique: true,
      },
    ],
  }
);

export default InventoryReportDetail;
