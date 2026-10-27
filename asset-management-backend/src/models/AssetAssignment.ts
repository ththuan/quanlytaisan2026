import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface AssetAssignmentAttributes {
  id: number;
  asset_id: number;
  from_user_id?: number | null;
  to_user_id?: number | null;
  assigned_by?: number | null;
  department_id?: number | null;
  notes?: string | null;
  assigned_at: Date;
  created_at?: Date;
  updated_at?: Date;
}

type Creation = Optional<AssetAssignmentAttributes, 'id' | 'from_user_id' | 'to_user_id' | 'assigned_by' | 'department_id' | 'notes'>;

class AssetAssignment extends Model<AssetAssignmentAttributes, Creation> implements AssetAssignmentAttributes {
  public id!: number;
  public asset_id!: number;
  public from_user_id!: number | null;
  public to_user_id!: number | null;
  public assigned_by!: number | null;
  public department_id!: number | null;
  public notes!: string | null;
  public assigned_at!: Date;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AssetAssignment.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    asset_id: { type: DataTypes.INTEGER, allowNull: false },
    from_user_id: { type: DataTypes.INTEGER, allowNull: true },
    to_user_id: { type: DataTypes.INTEGER, allowNull: true },
    assigned_by: { type: DataTypes.INTEGER, allowNull: true },
    department_id: { type: DataTypes.INTEGER, allowNull: true },
    notes: { type: DataTypes.TEXT, allowNull: true },
    assigned_at: { type: DataTypes.DATE, allowNull: false, defaultValue: DataTypes.NOW },
  },
  {
    sequelize,
    tableName: 'asset_assignments',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['asset_id'] }, { fields: ['to_user_id'] }],
  },
);

export default AssetAssignment;
