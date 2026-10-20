import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type NormScope = 'title' | 'room' | 'digital' | 'secret' | 'other';

export interface EquipmentNormAttributes {
  id: number;
  document_no?: string | null;
  effective_date?: string | null;
  scope: NormScope;
  position_group?: string | null;
  equipment_name: string;
  unit: string;
  max_quantity?: number | null;
  max_price?: number | null;
  note?: string | null;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

type Creation = Optional<EquipmentNormAttributes, 'id' | 'document_no' | 'effective_date' | 'position_group' | 'max_quantity' | 'max_price' | 'note' | 'is_active' | 'unit'>;

class EquipmentNorm extends Model<EquipmentNormAttributes, Creation> implements EquipmentNormAttributes {
  public id!: number;
  public document_no!: string | null;
  public effective_date!: string | null;
  public scope!: NormScope;
  public position_group!: string | null;
  public equipment_name!: string;
  public unit!: string;
  public max_quantity!: number | null;
  public max_price!: number | null;
  public note!: string | null;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

EquipmentNorm.init(
  {
    id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
    document_no: { type: DataTypes.STRING(100), allowNull: true },
    effective_date: { type: DataTypes.DATEONLY, allowNull: true },
    scope: {
      type: DataTypes.ENUM('title', 'room', 'digital', 'secret', 'other'),
      allowNull: false,
      defaultValue: 'other',
    },
    position_group: { type: DataTypes.STRING(255), allowNull: true },
    equipment_name: { type: DataTypes.STRING(255), allowNull: false },
    unit: { type: DataTypes.STRING(30), allowNull: false, defaultValue: 'bộ' },
    max_quantity: { type: DataTypes.INTEGER, allowNull: true },
    max_price: { type: DataTypes.DECIMAL(15, 2), allowNull: true },
    note: { type: DataTypes.TEXT, allowNull: true },
    is_active: { type: DataTypes.BOOLEAN, allowNull: false, defaultValue: true },
  },
  {
    sequelize,
    tableName: 'equipment_norms',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['equipment_name'] }, { fields: ['scope', 'is_active'] }],
  }
);

export default EquipmentNorm;
