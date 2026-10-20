import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type NormWarningType = 'quantity' | 'price';

export interface NormWarningAttributes {
  id: number;
  asset_id?: number | null;
  department_id?: number | null;
  norm_id?: number | null;
  warning_type: NormWarningType;
  message: string;
  asset_code?: string | null;
  asset_name?: string | null;
  purchase_price?: number | null;
  created_by?: number | null;
  acknowledged: boolean;
  acknowledged_by?: number | null;
  acknowledged_at?: Date | null;
  created_at?: Date;
  updated_at?: Date;
}

type Creation = Optional<
  NormWarningAttributes,
  'id' | 'asset_id' | 'department_id' | 'norm_id' | 'asset_code' | 'asset_name' | 'purchase_price' | 'created_by' | 'acknowledged' | 'acknowledged_by' | 'acknowledged_at'
>;

class NormWarning extends Model<NormWarningAttributes, Creation> implements NormWarningAttributes {
  public id!: number;
  public asset_id!: number | null;
  public department_id!: number | null;
  public norm_id!: number | null;
  public warning_type!: NormWarningType;
  public message!: string;
  public asset_code!: string | null;
  public asset_name!: string | null;
  public purchase_price!: number | null;
  public created_by!: number | null;
  public acknowledged!: boolean;
  public acknowledged_by!: number | null;
  public acknowledged_at!: Date | null;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

NormWarning.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    asset_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'assets', key: 'id' } },
    department_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'departments', key: 'id' } },
    norm_id: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'equipment_norms', key: 'id' } },
    warning_type: { type: DataTypes.STRING(20), allowNull: false },
    message: { type: DataTypes.TEXT, allowNull: false },
    asset_code: { type: DataTypes.STRING(100), allowNull: true },
    asset_name: { type: DataTypes.STRING(255), allowNull: true },
    purchase_price: { type: DataTypes.DECIMAL(18, 2), allowNull: true },
    created_by: { type: DataTypes.INTEGER, allowNull: true, references: { model: 'users', key: 'id' } },
    acknowledged: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: false },
    acknowledged_by: { type: DataTypes.INTEGER, allowNull: true },
    acknowledged_at: { type: DataTypes.DATE, allowNull: true },
  },
  {
    sequelize,
    tableName: 'norm_warnings',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['department_id', 'acknowledged'] }, { fields: ['asset_id'] }, { fields: ['created_at'] }],
  }
);

export default NormWarning;
