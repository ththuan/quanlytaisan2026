import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type ProcurementStatus = 'draft' | 'fulfilled' | 'cancelled';

export interface ProcurementAttributes {
  id: number;
  code: string;
  title: string;
  description?: string;
  receiving_department_id: number;
  purchase_date?: Date;
  supplier_name?: string;
  contract_no?: string;
  invoice_no?: string;
  order_code?: string;
  status: ProcurementStatus;
  created_by: number;
  fulfilled_by?: number;
  fulfilled_at?: Date;
  created_asset_ids?: any; // JSONB array of created asset IDs
  maintenance_request_id?: number; // FK – tạo từ đề nghị mua sắm đã duyệt
  created_at?: Date;
  updated_at?: Date;
}

interface ProcurementCreationAttributes
  extends Optional<
    ProcurementAttributes,
    'id' | 'status' | 'description' | 'purchase_date' | 'supplier_name' | 'contract_no' | 'invoice_no' | 'order_code' | 'fulfilled_by' | 'fulfilled_at' | 'created_asset_ids' | 'maintenance_request_id'
  > {}

class Procurement extends Model<ProcurementAttributes, ProcurementCreationAttributes> implements ProcurementAttributes {
  public id!: number;
  public code!: string;
  public title!: string;
  public description?: string;
  public receiving_department_id!: number;
  public purchase_date?: Date;
  public supplier_name?: string;
  public contract_no?: string;
  public invoice_no?: string;
  public order_code?: string;
  public status!: ProcurementStatus;
  public created_by!: number;
  public fulfilled_by?: number;
  public fulfilled_at?: Date;
  public created_asset_ids?: any;
  public maintenance_request_id?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Procurement.init(
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
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    receiving_department_id: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    supplier_name: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    contract_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    invoice_no: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    order_code: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    status: {
      type: DataTypes.ENUM('draft', 'fulfilled', 'cancelled'),
      allowNull: false,
      defaultValue: 'draft',
    },
    created_by: {
      type: DataTypes.INTEGER,
      allowNull: false,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    fulfilled_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    fulfilled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    created_asset_ids: {
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
    },
    maintenance_request_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
  },
  {
    sequelize,
    tableName: 'procurements',
    timestamps: true,
    underscored: true,
    indexes: [
      { unique: true, fields: ['code'] },
      { fields: ['receiving_department_id'] },
      { fields: ['status'] },
      { fields: ['purchase_date'] },
      { fields: ['supplier_name'] },
      { fields: ['contract_no'] },
      { fields: ['invoice_no'] },
      { fields: ['order_code'] },
    ],
  }
);

export default Procurement;

