import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StockReceiptLineAttributes {
  id: number;
  receipt_id: number;
  item_id: number;
  quantity: number;
  unit_price: number;
  created_at?: Date;
  updated_at?: Date;
}

interface StockReceiptLineCreationAttributes extends Optional<StockReceiptLineAttributes, 'id'> {}

class StockReceiptLine extends Model<StockReceiptLineAttributes, StockReceiptLineCreationAttributes> implements StockReceiptLineAttributes {
  public id!: number;
  public receipt_id!: number;
  public item_id!: number;
  public quantity!: number;
  public unit_price!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

StockReceiptLine.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    receipt_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    item_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'stock_receipt_lines',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['receipt_id'] }, { fields: ['item_id'] }],
  }
);

export default StockReceiptLine;
