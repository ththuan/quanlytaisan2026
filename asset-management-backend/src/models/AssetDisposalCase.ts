import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type AssetDisposalCaseStatus = 'pending' | 'completed' | 'cancelled';
export type AssetDisposalSourceType = 'inventory' | 'manual' | 'maintenance';
export type AssetDisposalType = 'liquidation' | 'destruction';
export type DestructionMethod = 'chemical' | 'mechanical' | 'burial' | 'software' | 'other';
export type DisposalMethod = 'sell_auction' | 'sell_listed' | 'sell_direct' | 'demolish';

export interface AssetDisposalCaseAttributes {
  id: number;
  code: string;
  source_type: AssetDisposalSourceType;
  source_inventory_report_id?: number;
  source_maintenance_request_id?: number; // FK – tạo từ đề nghị sửa chữa có chi phí quá lớn
  origin_department_id?: number;
  status: AssetDisposalCaseStatus;
  created_by: number;
  approved_by?: number;
  approved_at?: Date;
  decision_no?: string;
  decision_date?: Date;
  decision_file_url?: string;
  notes?: string;
  // Tiêu hủy / Thanh lý
  disposal_type?: AssetDisposalType;       // 'liquidation' | 'destruction'
  destruction_method?: DestructionMethod;   // hình thức tiêu hủy
  disposal_method?: DisposalMethod;         // hình thức thanh lý
  revenue?: number;                         // tiền thu được
  created_at?: Date;
  updated_at?: Date;
}

interface AssetDisposalCaseCreationAttributes
  extends Optional<
    AssetDisposalCaseAttributes,
    'id' | 'status' | 'source_type' | 'source_inventory_report_id' | 'source_maintenance_request_id' | 'origin_department_id' | 'approved_by' | 'approved_at' | 'decision_no' | 'decision_date' | 'decision_file_url' | 'notes' | 'disposal_type' | 'destruction_method' | 'disposal_method' | 'revenue'
  > {}

class AssetDisposalCase
  extends Model<AssetDisposalCaseAttributes, AssetDisposalCaseCreationAttributes>
  implements AssetDisposalCaseAttributes
{
  public id!: number;
  public code!: string;
  public source_type!: AssetDisposalSourceType;
  public source_inventory_report_id?: number;
  public origin_department_id?: number;
  public status!: AssetDisposalCaseStatus;
  public created_by!: number;
  public source_maintenance_request_id?: number;
  public approved_by?: number;
  public approved_at?: Date;
  public decision_no?: string;
  public decision_date?: Date;
  public decision_file_url?: string;
  public notes?: string;
  public disposal_type?: AssetDisposalType;
  public destruction_method?: DestructionMethod;
  public disposal_method?: DisposalMethod;
  public revenue?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AssetDisposalCase.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
    },
    source_type: {
      type: DataTypes.ENUM('inventory', 'manual', 'maintenance'),
      allowNull: false,
      defaultValue: 'inventory',
    },
    source_inventory_report_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'inventory_reports', key: 'id' },
    },
    source_maintenance_request_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'maintenance_requests', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    origin_department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('pending', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'pending',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
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
    approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    decision_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    decision_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    decision_file_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    disposal_type: {
      type: DataTypes.STRING(30),
      allowNull: true,
      defaultValue: 'liquidation',
    },
    destruction_method: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    disposal_method: {
      type: DataTypes.STRING(30),
      allowNull: true,
    },
    revenue: {
      type: DataTypes.DECIMAL(18, 0),
      allowNull: true,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'asset_disposal_cases',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['status'] },
      { fields: ['source_inventory_report_id'] },
      { fields: ['origin_department_id'] },
      { fields: ['created_by'] },
    ],
  }
);

export default AssetDisposalCase;
