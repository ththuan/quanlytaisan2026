import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface ProcurementItemAttributes {
  id: number;
  procurement_id: number;
  asset_code_prefix?: string;
  name: string;
  description?: string;
  category?: string;
  category_id?: number;
  category_code?: string;
  unit?: string;
  quantity: number;
  purchase_price?: number;
  residual_value?: number;
  asset_type?: string;
  serial_number?: string;
  warranty_date?: Date;
  location?: string;
  asset_condition?: 'good' | 'usable' | 'needs_repair' | 'damaged' | 'disposed';
  land_parcel_id?: number;
  is_depreciable?: boolean;
  useful_life?: number;
  depreciation_rate?: number;
  purchase_date?: Date;
  year_in_use?: number;
  current_department_id?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface ProcurementItemCreationAttributes extends Optional<ProcurementItemAttributes, 'id'> {}

class ProcurementItem
  extends Model<ProcurementItemAttributes, ProcurementItemCreationAttributes>
  implements ProcurementItemAttributes
{
  public id!: number;
  public procurement_id!: number;
  public asset_code_prefix?: string;
  public name!: string;
  public description?: string;
  public category?: string;
  public category_id?: number;
  public category_code?: string;
  public unit?: string;
  public quantity!: number;
  public purchase_price?: number;
  public residual_value?: number;
  public asset_type?: string;
  public serial_number?: string;
  public warranty_date?: Date;
  public location?: string;
  public asset_condition?: 'good' | 'usable' | 'needs_repair' | 'damaged' | 'disposed';
  public land_parcel_id?: number;
  public is_depreciable?: boolean;
  public useful_life?: number;
  public depreciation_rate?: number;
  public purchase_date?: Date;
  public year_in_use?: number;
  public current_department_id?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

ProcurementItem.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    procurement_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'procurements',
        key: 'id',
      },
      onDelete: 'CASCADE',
    },
    asset_code_prefix: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    category: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    category_id: {
      type: DataTypes.INTEGER,
      field: 'category_id',
      allowNull: true,
      references: {
        model: 'asset_categories',
        key: 'id',
      },
    },
    category_code: {
      type: DataTypes.STRING(50),
      field: 'category_code',
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Cái',
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
    },
    purchase_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    residual_value: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      comment: 'Giá trị còn lại (đồng)',
    },
    asset_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    warranty_date: {
      type: DataTypes.DATEONLY,
      field: 'warranty_date',
      allowNull: true,
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    asset_condition: {
      type: DataTypes.ENUM('good', 'usable', 'needs_repair', 'damaged', 'disposed'),
      allowNull: true,
      defaultValue: 'good',
    },
    land_parcel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    is_depreciable: {
      type: DataTypes.BOOLEAN,
      allowNull: true,
    },
    useful_life: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    depreciation_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      field: 'purchase_date',
      allowNull: true,
    },
    year_in_use: {
      type: DataTypes.INTEGER,
      field: 'year_in_use',
      allowNull: true,
    },
    current_department_id: {
      type: DataTypes.INTEGER,
      field: 'current_department_id',
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
  },
  {
    sequelize,
    tableName: 'procurement_items',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['procurement_id'] }],
  }
);

export default ProcurementItem;

