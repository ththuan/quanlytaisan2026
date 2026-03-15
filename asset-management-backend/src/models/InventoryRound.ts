import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type InventoryRoundStatus = 'not_started' | 'in_progress' | 'awaiting_approval' | 'completed';

export interface InventoryRoundAttributes {
  id: number;
  round_name: string;
  round_year: number;
  description?: string;
  start_date: Date;
  end_date: Date;
  total_departments: number;
  completed_reports: number;
  pending_reports: number;
  rejected_reports: number;
  status: InventoryRoundStatus;
  created_by: number;
  created_at?: Date;
  updated_at?: Date;
}

interface InventoryRoundCreationAttributes extends Optional<InventoryRoundAttributes, 
  'id' | 'total_departments' | 'completed_reports' | 'pending_reports' | 'rejected_reports' | 'status'> {}

class InventoryRound extends Model<InventoryRoundAttributes, InventoryRoundCreationAttributes> 
  implements InventoryRoundAttributes {
  public id!: number;
  public round_name!: string;
  public round_year!: number;
  public description?: string;
  public start_date!: Date;
  public end_date!: Date;
  public total_departments!: number;
  public completed_reports!: number;
  public pending_reports!: number;
  public rejected_reports!: number;
  public status!: InventoryRoundStatus;
  public created_by!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

InventoryRound.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    round_name: {
      type: DataTypes.STRING(255),
      allowNull: false,
      comment: 'Tên đợt kiểm kê, VD: Kiểm Kê Năm 2026',
    },
    round_year: {
      type: DataTypes.INTEGER,
      allowNull: false,
      comment: 'Năm kiểm kê',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mô tả đợt kiểm kê',
    },
    start_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Ngày bắt đầu kiểm kê',
    },
    end_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
      comment: 'Hạn chót nộp báo cáo',
    },
    total_departments: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Tổng số phòng ban tham gia',
    },
    completed_reports: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Số báo cáo đã hoàn tất',
    },
    pending_reports: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Số báo cáo chờ duyệt',
    },
    rejected_reports: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
      comment: 'Số báo cáo bị từ chối',
    },
    status: {
      type: DataTypes.ENUM('not_started', 'in_progress', 'awaiting_approval', 'completed'),
      allowNull: false,
      defaultValue: 'not_started',
      comment: 'Trạng thái đợt kiểm kê',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
      comment: 'Admin tạo đợt kiểm kê',
    },
  },
  {
    sequelize,
    tableName: 'inventory_rounds',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['round_year'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default InventoryRound;
