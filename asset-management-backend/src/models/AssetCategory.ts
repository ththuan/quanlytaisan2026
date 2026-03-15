import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type CategoryGroup = 
  | 'nha_cua'           // Nhà, công trình xây dựng
  | 'phuong_tien'       // Phương tiện vận tải
  | 'may_moc'           // Máy móc, thiết bị
  | 'suc_vat'           // Súc vật
  | 'cay_lau_nam'       // Cây lâu năm
  | 'tai_san_dac_thu'   // Tài sản cố định đặc thù
  | 'tai_san_huu_hinh'  // Tài sản cố định hữu hình khác
  | 'tai_san_vo_hinh'   // Tài sản cố định vô hình
  | 'ket_qua_khcn'      // Kết quả nhiệm vụ KHCN
  | 'cong_cu_dung_cu';  // Công cụ dụng cụ

export interface AssetCategoryAttributes {
  id: number;
  code: string;
  name: string;
  parent_code?: string;
  unit: string;
  category_group: CategoryGroup;
  is_depreciable: boolean;
  depreciation_rate?: number;
  useful_life_years?: number;
  description?: string;
  is_active: boolean;
  sort_order: number;
  created_at?: Date;
  updated_at?: Date;
}

interface AssetCategoryCreationAttributes extends Optional<AssetCategoryAttributes, 'id' | 'is_active' | 'sort_order'> {}

class AssetCategory extends Model<AssetCategoryAttributes, AssetCategoryCreationAttributes> implements AssetCategoryAttributes {
  public id!: number;
  public code!: string;
  public name!: string;
  public parent_code?: string;
  public unit!: string;
  public category_group!: CategoryGroup;
  public is_depreciable!: boolean;
  public depreciation_rate?: number;
  public useful_life_years?: number;
  public description?: string;
  public is_active!: boolean;
  public sort_order!: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
}

AssetCategory.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    code: {
      type: DataTypes.STRING(20),
      allowNull: false,
      unique: true,
    },
    name: {
      type: DataTypes.STRING(255),
      allowNull: false,
    },
    parent_code: {
      type: DataTypes.STRING(20),
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: false,
      defaultValue: 'Cái',
    },
    category_group: {
      type: DataTypes.ENUM(
        'nha_cua',
        'phuong_tien',
        'may_moc',
        'suc_vat',
        'cay_lau_nam',
        'tai_san_dac_thu',
        'tai_san_huu_hinh',
        'tai_san_vo_hinh',
        'ket_qua_khcn',
        'cong_cu_dung_cu'
      ),
      allowNull: false,
    },
    is_depreciable: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    depreciation_rate: {
      type: DataTypes.DECIMAL(5, 2),
      allowNull: true,
    },
    useful_life_years: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    is_active: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: true,
    },
    sort_order: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 0,
    },
  },
  {
    sequelize,
    tableName: 'asset_categories',
    timestamps: true,
    underscored: true,
    indexes: [
      { fields: ['code'] },
      { fields: ['category_group'] },
      { fields: ['parent_code'] },
    ],
  }
);

export default AssetCategory;
