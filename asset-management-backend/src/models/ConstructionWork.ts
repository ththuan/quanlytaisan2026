import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ConstructionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface ConstructionWorkAttributes {
  id: number;
  code: string;
  name: string;
  asset_id?: number | null;
  department_id?: number | null;
  location?: string | null;
  description?: string | null;
  contractor?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  status: ConstructionStatus;
  notes?: string | null;
  created_by?: number | null;
  updated_by?: number | null;
  created_at?: Date;
  updated_at?: Date;
}

type Creation = Optional<
  ConstructionWorkAttributes,
  | 'id'
  | 'asset_id'
  | 'department_id'
  | 'location'
  | 'description'
  | 'contractor'
  | 'start_date'
  | 'end_date'
  | 'estimated_cost'
  | 'actual_cost'
  | 'status'
  | 'notes'
  | 'created_by'
  | 'updated_by'
>;

class ConstructionWork
  extends Model<ConstructionWorkAttributes, Creation>
  implements ConstructionWorkAttributes
{
  public id!: number;
  public code!: string;
  public name!: string;
  public asset_id!: number | null;
  public department_id!: number | null;
  public location!: string | null;
  public description!: string | null;
  public contractor!: string | null;
  public start_date!: string | null;
  public end_date!: string | null;
  public estimated_cost!: number | null;
  public actual_cost!: number | null;
  public status!: ConstructionStatus;
  public notes!: string | null;
  public created_by!: number | null;
  public updated_by!: number | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ConstructionWork.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    code: { type: DataTypes.STRING(50), allowNull: false, unique: true },
    name: { type: DataTypes.STRING(255), allowNull: false },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'assets', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'departments', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    location: { type: DataTypes.STRING(255), allowNull: true },
    description: { type: DataTypes.TEXT, allowNull: true },
    contractor: { type: DataTypes.STRING(255), allowNull: true },
    start_date: { type: DataTypes.DATEONLY, allowNull: true },
    end_date: { type: DataTypes.DATEONLY, allowNull: true },
    estimated_cost: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    actual_cost: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    status: {
      type: DataTypes.ENUM('planned', 'in_progress', 'completed', 'cancelled'),
      allowNull: false,
      defaultValue: 'planned',
    },
    notes: { type: DataTypes.TEXT, allowNull: true },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
    updated_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'users', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  },
  {
    sequelize,
    tableName: 'construction_works',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['status'] },
      { fields: ['department_id'] },
      { fields: ['asset_id'] },
    ],
  },
);

export default ConstructionWork;
