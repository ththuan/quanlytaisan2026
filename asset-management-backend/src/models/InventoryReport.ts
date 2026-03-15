import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type InventoryReportStatus = 
  'draft' | 'pending' | 'approved_by_head' | 'rejected_by_head' | 
  'approved_by_admin' | 'rejected_by_admin' | 'completed';

export interface InventoryReportAttributes {
  id: number;
  report_code: string;
  inventory_round_id: number;
  created_by: number;
  department_id: number;
  total_assigned_quantity: number;
  total_actual_quantity: number;
  total_discrepancy: number;
  total_disposal_suggestions: number;
  status: InventoryReportStatus;
  head_approved_by?: number;
  head_approved_at?: Date;
  head_notes?: string;
  admin_approved_by?: number;
  admin_approved_at?: Date;
  admin_notes?: string;
  rejection_reason?: string;
  rejection_count?: number;
  submitted_at?: Date;
  completed_at?: Date;
  created_at?: Date;
  updated_at?: Date;
}

interface InventoryReportCreationAttributes extends Optional<InventoryReportAttributes, 
  'id' | 'total_assigned_quantity' | 'total_actual_quantity' | 'total_discrepancy' | 
  'total_disposal_suggestions' | 'status'> {}

class InventoryReport extends Model<InventoryReportAttributes, InventoryReportCreationAttributes> 
  implements InventoryReportAttributes {
  public id!: number;
  public report_code!: string;
  public inventory_round_id!: number;
  public created_by!: number;
  public department_id!: number;
  public total_assigned_quantity!: number;
  public total_actual_quantity!: number;
  public total_discrepancy!: number;
  public total_disposal_suggestions!: number;
  public status!: InventoryReportStatus;
  public head_approved_by?: number;
  public head_approved_at?: Date;
  public head_notes?: string;
  public admin_approved_by?: number;
  public admin_approved_at?: Date;
  public admin_notes?: string;
  public rejection_reason?: string;
  public rejection_count?: number;
  public submitted_at?: Date;
  public completed_at?: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InventoryReport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    report_code: {
      type: DataTypes.STRING(50),
      allowNull: false,
      unique: true,
      comment: 'Mã báo cáo kiểm kê (duy nhất)',
    },
    inventory_round_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'inventory_rounds',
        key: 'id',
      },
      comment: 'Đợt kiểm kê',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Cán bộ tạo báo cáo',
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id',
      },
      comment: 'Phòng ban',
    },
    total_assigned_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Tổng số tài sản được cấp',
    },
    total_actual_quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Tổng số kiểm kê thực tế',
    },
    total_discrepancy: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Tổng chênh lệch',
    },
    total_disposal_suggestions: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Tổng đề nghị thanh lý',
    },
    status: {
      type: DataTypes.ENUM(
        'draft', 'pending', 'approved_by_head', 'rejected_by_head',
        'approved_by_admin', 'rejected_by_admin', 'completed'
      ),
      allowNull: false,
      defaultValue: 'draft',
      comment: 'Trạng thái duyệt',
    },
    head_approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Trưởng đơn vị duyệt',
    },
    head_approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    head_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú của trưởng đơn vị',
    },
    admin_approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Admin duyệt',
    },
    admin_approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Ghi chú của admin',
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Lý do từ chối',
    },
    rejection_count: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Số lần bị từ chối (cho phép gửi lại)',
    },
    submitted_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Thời gian nộp báo cáo',
    },
    completed_at: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Thời gian hoàn tất',
    },
  },
  {
    sequelize,
    tableName: 'inventory_reports',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['inventory_round_id'],
      },
      {
        fields: ['created_by'],
      },
      {
        fields: ['department_id'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default InventoryReport;
