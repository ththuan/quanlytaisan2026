import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StockItemAttributes {
  id: number;
  code: string;
  name: string;
  unit: string;
  category?: string;
  min_stock?: number;
  is_active: boolean;
  created_at?: Date;
  updated_at?: Date;
}

interface StockItemCreationAttributes extends Optional<StockItemAttributes, 'id' | 'category' | 'min_stock'> {}

class StockItem extends Model<StockItemAttributes, StockItemCreationAttributes> implements StockItemAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public unit!: string;
  public category?: string;
  public min_stock?: number;
  public is_active!: boolean;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

StockItem.init(
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
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Cái',
    },
    category: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    min_stock: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
  },
  {
    sequelize,
    tableName: 'stock_items',
    timestamps: true,
    underscored: true,
    indexes: [{ unique: true, fields: ['code'] }, { fields: ['name'] }],
  }
);

export default StockItem;
