import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AnnualReportAttributes {
  id: number;
  department_id: number;
  year: number;
  total_assets?: number;
  active_assets?: number;
  damaged_assets?: number;
  lost_assets?: number;
  total_value?: number;
  submitted_by?: number;
  submitted_date?: Date;
  approved_by?: number;
  approved_date?: Date;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface AnnualReportCreationAttributes extends Optional<AnnualReportAttributes, 'id' | 'status'> {}

class AnnualReport extends Model<AnnualReportAttributes, AnnualReportCreationAttributes> implements AnnualReportAttributes {
  public id!: number;
  public department_id!: number;
  public year!: number;
  public total_assets?: number;
  public active_assets?: number;
  public damaged_assets?: number;
  public lost_assets?: number;
  public total_value?: number;
  public submitted_by?: number;
  public submitted_date?: Date;
  public approved_by?: number;
  public approved_date?: Date;
  public status!: 'draft' | 'submitted' | 'approved' | 'rejected';
  public notes?: string;
  public created_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AnnualReport.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    year: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    total_assets: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    active_assets: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    damaged_assets: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    lost_assets: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    total_value: {
      type: DataTypes.DECIMAL(14, 2),
      allowNull: true,
    },
    submitted_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    submitted_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'submitted', 'approved', 'rejected'),
      allowNull: false,
      defaultValue: 'draft',
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'annual_reports',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['department_id', 'year'],
      },
      {
        fields: ['status'],
      },
    ],
  }
);

export default AnnualReport;
