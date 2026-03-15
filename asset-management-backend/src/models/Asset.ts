import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

// Enum types
export type AssetCondition = 'good' | 'fair' | 'poor' | 'usable' | 'needs_repair' | 'damaged' | 'disposed';
export type InventoryStatus = 'verified' | 'discrepancy' | 'missing' | 'pending';
export type AssetStatus = 'active' | 'inactive' | 'damaged' | 'lost' | 'disposed' | 'pending_disposal' | 'pending_repair';

export interface AssetAttributes {
  id: number;
  asset_code: string;
  name: string;
  description?: string;
  category?: string;
  sub_category?: string;
  asset_type?: string;
  
  // Liên kết với danh mục loại tài sản
  category_id?: number;
  category_code?: string; // Mã loại tài sản (tự động từ danh mục)
  unit?: string; // Đơn vị tính (tự động từ danh mục)
  
  // Số lượng và kiểm kê
  quantity?: number; // Số lượng theo sổ kế toán
  actual_quantity?: number; // Số lượng theo thực tế kiểm kê
  quantity_difference?: number; // Chênh lệch = actual_quantity - quantity
  year_in_use?: number; // Năm đưa vào sử dụng
  
  purchase_date?: Date;
  purchase_price?: number;
  current_value?: number;
  residual_value?: number; // Giá trị còn lại
  useful_life?: number; // Thời gian sử dụng để tính hao mòn (năm)
  
  // Khấu hao fields (theo Thông tư 141/2025/TT-BTC)
  is_depreciable: boolean; // Có tính khấu hao không (false = công cụ dụng cụ)
  depreciation_rate?: number; // Tỷ lệ khấu hao hàng năm (%)
  accumulated_depreciation?: number; // Khấu hao lũy kế (VND)
  depreciation_last_updated?: Date; // Lần cập nhật khấu hao gần nhất
  
  // Kiểm kê fields
  last_inventory_date?: Date; // Ngày kiểm kê gần nhất
  inventory_status?: InventoryStatus; // Trạng thái kiểm kê
  condition?: AssetCondition; // Tình trạng tài sản (chi tiết hơn)
  asset_condition?: AssetCondition; // Alias cho tình trạng tài sản
  
  // Tài sản gắn liền với đất
  land_parcel_id?: number; // ID lô đất
  
  serial_number?: string;
  warranty_date?: Date;
  last_repair_date?: Date; // Ngày sửa chữa gần nhất
  current_department_id?: number;
  status: AssetStatus;
  location?: string;
  image_url?: string;
  qr_code?: string; // Mã QR code của tài sản (chứa thông tin: mã, tên, loại, số lượng)
  qr_code_image?: string; // URL hình ảnh QR code đã generate
  created_at?: Date;
  updated_at?: Date;
}

interface AssetCreationAttributes extends Optional<AssetAttributes, 'id' | 'status' | 'is_depreciable'> {}

class Asset extends Model<AssetAttributes, AssetCreationAttributes> implements AssetAttributes {
  public id!: number;
  public asset_code!: string;
  public name!: string;
  public description?: string;
  public category?: string;
  public sub_category?: string;
  public asset_type?: string;
  
  // Liên kết danh mục
  public category_id?: number;
  public category_code?: string;
  public unit?: string;
  
  // Số lượng
  public quantity?: number;
  public actual_quantity?: number;
  public quantity_difference?: number;
  public year_in_use?: number;
  
  public purchase_date?: Date;
  public purchase_price?: number;
  public current_value?: number;
  public residual_value?: number;
  public useful_life?: number;
  
  // Khấu hao
  public is_depreciable!: boolean;
  public depreciation_rate?: number;
  public accumulated_depreciation?: number;
  public depreciation_last_updated?: Date;
  
  // Kiểm kê
  public last_inventory_date?: Date;
  public inventory_status?: InventoryStatus;
  public condition?: AssetCondition;
  public asset_condition?: AssetCondition;
  
  // Đất
  public land_parcel_id?: number;
  
  public serial_number?: string;
  public warranty_date?: Date;
  public last_repair_date?: Date;
  public current_department_id?: number;
  public status!: AssetStatus;
  public location?: string;
  public image_url?: string;
  public qr_code?: string;
  public qr_code_image?: string;

  // Associations (added for TS support)
  public current_department?: any;
  public assetCategory?: any;

  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

Asset.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    asset_code: {
      type: DataTypes.STRING(100),
      allowNull: false,
      unique: true,
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
      comment: 'Tên loại tài sản đầy đủ (có thể dài > 100 ký tự)',
    },
    sub_category: {
      type: DataTypes.STRING(100),
      allowNull: true,
      comment: 'Phân loại chi tiết tài sản',
    },
    asset_type: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    // Liên kết với danh mục loại tài sản
    category_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'asset_categories',
        key: 'id',
      },
    },
    category_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
      comment: 'Mã loại tài sản (tự động từ danh mục)',
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
      defaultValue: 'Cái',
      comment: 'Đơn vị tính (tự động từ danh mục)',
    },
    // Số lượng và kiểm kê
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Số lượng theo sổ kế toán. Mặc định = 1 cho cái/bộ; với đơn vị m2 dùng để lưu diện tích tài sản.',
    },
    actual_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Số lượng theo thực tế kiểm kê',
    },
    quantity_difference: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 0,
      comment: 'Chênh lệch = actual_quantity - quantity',
    },
    year_in_use: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Năm đưa vào sử dụng',
    },
    purchase_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    purchase_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    current_value: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    residual_value: {
      type: DataTypes.DECIMAL(18, 2),
      allowNull: true,
      comment: 'Giá trị còn lại (đồng)',
    },
    useful_life: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Thời gian sử dụng để tính hao mòn (năm)',
    },
    // Khấu hao fields (theo Thông tư 141/2025/TT-BTC)
    is_depreciable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
      comment: 'Có tính khấu hao không (false = công cụ dụng cụ)',
    },
    depreciation_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
      comment: 'Tỷ lệ khấu hao hàng năm (%)',
    },
    accumulated_depreciation: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
      defaultValue: 0,
      comment: 'Khấu hao lũy kế (VND)',
    },
    depreciation_last_updated: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Lần cập nhật khấu hao gần nhất',
    },
    // Kiểm kê fields
    last_inventory_date: {
      type: DataTypes.DATE,
      allowNull: true,
      comment: 'Ngày kiểm kê gần nhất',
    },
    inventory_status: {
      type: DataTypes.ENUM('verified', 'discrepancy', 'missing', 'pending'),
      allowNull: true,
      comment: 'Trạng thái kiểm kê',
    },
    condition: {
      type: DataTypes.ENUM('good', 'fair', 'poor', 'usable', 'needs_repair', 'damaged', 'disposed'),
      allowNull: true,
      defaultValue: 'good',
      comment: 'Tình trạng tài sản',
    },
    asset_condition: {
      type: DataTypes.ENUM('good', 'usable', 'needs_repair', 'damaged', 'disposed'),
      allowNull: true,
      defaultValue: 'good',
      comment: 'Tình trạng chi tiết: 0=good, 1=usable, 2=needs_repair, 3=damaged, 4=disposed',
    },
    land_parcel_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'ID lô đất mà tài sản gắn liền (nếu có)',
    },
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    warranty_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
    },
    last_repair_date: {
      type: DataTypes.DATEONLY,
      allowNull: true,
      comment: 'Ngày sửa chữa gần nhất của tài sản',
    },
    current_department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM('active', 'inactive', 'damaged', 'lost', 'disposed', 'pending_disposal', 'pending_repair'),
      allowNull: false,
      defaultValue: 'active',
    },
    location: {
      type: DataTypes.STRING(255),
      allowNull: true,
    },
    image_url: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    qr_code: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Mã QR code dạng JSON string chứa thông tin: mã, tên, loại, số lượng',
    },
    qr_code_image: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Base64 image của QR code đã generate',
    },
  },
  {
    sequelize,
    tableName: 'assets',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        unique: true,
        fields: ['asset_code'],
      },
      {
        fields: ['current_department_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['category'],
      },
      {
        fields: ['is_depreciable'],
      },
      {
        fields: ['inventory_status'],
      },
      {
        fields: ['condition'],
      },
    ],
  }
);

export default Asset;
