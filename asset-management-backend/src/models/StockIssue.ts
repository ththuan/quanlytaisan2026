import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StockIssueAttributes {
  id: number;
  code: string;
  issue_date: Date;
  location: string;
  purpose: string;
  notes?: string;
  created_by?: number;
  department_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface StockIssueCreationAttributes extends Optional<StockIssueAttributes, 'id' | 'notes' | 'created_by' | 'department_id'> {}

class StockIssue extends Model<StockIssueAttributes, StockIssueCreationAttributes> implements StockIssueAttributes {
  public id!: number;
  public code!: string;
  public issue_date!: Date;
  public location!: string;
  public purpose!: string;
  public notes?: string;
  public created_by?: number;
  public department_id?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

StockIssue.init(
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
    issue_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    purpose: {
      type: DataTypes.STRING(500),
      allowNull: false,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
    },
  },
  {
    sequelize,
    tableName: 'stock_issues',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['issue_date'] }],
  }
);

export default StockIssue;
