import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export interface StockReceiptAttributes {
  id: number;
  code: string;
  receipt_date: Date;
  supplier_name?: string;
  shopee_waybill?: string;
  invoice_no?: string;
  notes?: string;
  created_by?: number;
  created_at?: Date;
  updated_at?: Date;
}

interface StockReceiptCreationAttributes extends Optional<StockReceiptAttributes, 'id' | 'supplier_name' | 'shopee_waybill' | 'invoice_no' | 'notes' | 'created_by'> {}

class StockReceipt extends Model<StockReceiptAttributes, StockReceiptCreationAttributes> implements StockReceiptAttributes {
  public id!: number;
  public code!: string;
  public receipt_date!: Date;
  public supplier_name?: string;
  public shopee_waybill?: string;
  public invoice_no?: string;
  public notes?: string;
  public created_by?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

StockReceipt.init(
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
    receipt_date: {
      type: DataTypes.DATEONLY,
      allowNull: false,
    },
    supplier_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    shopee_waybill: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    invoice_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
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
  },
  {
    sequelize,
    tableName: 'stock_receipts',
    timestamps: true,
    underscored: true,
    indexes: [{ fields: ['receipt_date'] }, { fields: ['shopee_waybill'] }],
  }
);

export default StockReceipt;
