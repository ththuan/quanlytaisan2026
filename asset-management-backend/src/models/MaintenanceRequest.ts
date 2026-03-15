import { Model, DataTypes, Optional } from 'sequelize';
import sequelize from '../config/database';

export type RequestType = 'procurement' | 'repair';
export type MaintenanceStatus = 
  | 'draft'        // Nháp, chưa gửi phê duyệt
  | 'new'          // Mới tạo (deprecated, dùng pending thay thế)
  | 'pending'      // Đã gửi, chờ phê duyệt cấp 1 (trưởng phòng)
  | 'approved'     // Đã phê duyệt (deprecated)
  | 'approved_by_head'    // Đã phê duyệt cấp 1, chờ cấp 2
  | 'approved_by_admin'   // Đã phê duyệt cấp 2, chờ cấp 3
  | 'approved_by_director' // Đã phê duyệt cấp 3 (giám hiệu duyệt)
  | 'in_progress'  // Đang thực hiện sửa chữa
  | 'repair_completed' // Đã hoàn thành sửa chữa, chờ admin duyệt
  | 'repair_approved' // Admin đã duyệt hoàn thành sửa chữa
  | 'completed'    // Hoàn thành
  | 'rejected'     // Bị từ chối (deprecated, dùng rejected_by_* thay thế)
  | 'rejected_by_head'    // Bị từ chối cấp 1
  | 'rejected_by_admin'   // Bị từ chối cấp 2
  | 'rejected_by_director' // Bị từ chối cấp 3
  | 'rejected_due_to_high_cost'; // Từ chối do chi phí > 30% nguyên giá

export interface MaintenanceRequestAttributes {
  id: number;
  request_type: RequestType;
  asset_id?: number;
  department_id?: number;
  receiving_department_id?: number; // phòng ban nhận khi hoàn tất mua sắm/cấp phát
  description?: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  requested_by?: number;
  approved_by?: number;
  assigned_to?: number;
  status: MaintenanceStatus;
  cost?: number;
  start_date?: Date;
  completion_date?: Date;
  notes?: string;
  // Procurement fields
  category?: string;
  device_name?: string;
  technical_specs?: string;
  unit?: string;
  quantity?: number;
  estimated_unit_price?: number;
  unit_price?: number;
  total_price?: number;
  product_link?: string;
  product_image?: string;
  norm_limit?: number;
  current_quantity?: number;
  justification?: string;
  // Procurement fulfillment fields
  procurement_fulfilled?: boolean;
  fulfilled_at?: Date;
  fulfilled_by?: number;
  created_asset_ids?: any; // JSONB array of created asset IDs
  procurement_year?: number;
  // Equipment repair fields
  asset_code_text?: string;
  serial_number?: string;
  year_in_use?: string;
  current_condition?: string;
  estimated_cost?: number;
  // QUAN TRỌNG: damage_images là hình ảnh hư hỏng cho YÊU CẦU SỬA CHỮA,
  // KHÔNG phải hình ảnh của tài sản. Hình ảnh này chỉ lưu trong maintenance_requests,
  // hoàn toàn tách biệt với hình ảnh của tài sản trong bảng assets.
  damage_images?: string; // JSON array of base64 images for repair request (NOT for asset)
  // Facility repair fields
  facility_name?: string;
  last_repair_date?: Date;
  repair_content?: string;
  // Multi-level approval fields
  current_approval_level?: number;
  head_approved_by?: number;
  head_approved_at?: Date;
  head_notes?: string;
  admin_approved_by?: number;
  admin_approved_at?: Date;
  admin_notes?: string;
  director_approved_by?: number;
  director_approved_at?: Date;
  director_notes?: string;
  rejection_reason?: string;
  rejected_by?: number;
  rejected_at?: Date;
  linked_procurement_id?: number; // FK – phiếu Tăng tài sản được tạo từ đề nghị này
  linked_disposal_case_id?: number; // FK – hồ sơ thanh lý/tiêu hủy được tạo từ đề nghị này
  created_at?: Date;
  updated_at?: Date;
}

interface MaintenanceRequestCreationAttributes extends Optional<MaintenanceRequestAttributes, 'id' | 'urgency' | 'status' | 'request_type' | 'current_approval_level'> {}

class MaintenanceRequest extends Model<MaintenanceRequestAttributes, MaintenanceRequestCreationAttributes> implements MaintenanceRequestAttributes {
  public id!: number;
  public request_type!: RequestType;
  public asset_id?: number;
  public department_id?: number;
  public receiving_department_id?: number;
  public description?: string;
  public urgency!: 'low' | 'normal' | 'high' | 'critical';
  public requested_by?: number;
  public approved_by?: number;
  public assigned_to?: number;
  public status!: MaintenanceStatus;
  public cost?: number;
  public start_date?: Date;
  public completion_date?: Date;
  public notes?: string;
  // Procurement fields
  public category?: string;
  public device_name?: string;
  public technical_specs?: string;
  public unit?: string;
  public quantity?: number;
  public estimated_unit_price?: number;
  public unit_price?: number;
  public total_price?: number;
  public product_link?: string;
  public product_image?: string;
  public norm_limit?: number;
  public current_quantity?: number;
  public justification?: string;
  public procurement_fulfilled?: boolean;
  public fulfilled_at?: Date;
  public fulfilled_by?: number;
  public created_asset_ids?: any;
  public procurement_year?: number;
  // Equipment repair fields
  public asset_code_text?: string;
  public serial_number?: string;
  public year_in_use?: string;
  public current_condition?: string;
  public estimated_cost?: number;
  // QUAN TRỌNG: damage_images là hình ảnh hư hỏng cho YÊU CẦU SỬA CHỮA,
  // KHÔNG phải hình ảnh của tài sản. Hình ảnh này chỉ lưu trong maintenance_requests,
  // hoàn toàn tách biệt với hình ảnh của tài sản trong bảng assets.
  // Khi chọn tài sản (asset_id), chúng ta chỉ lấy THÔNG TIN từ tài sản,
  // KHÔNG bao giờ cập nhật hình ảnh vào tài sản.
  public damage_images?: string; // JSON array of base64 images for repair request (NOT for asset)
  // Facility repair fields
  public facility_name?: string;
  public last_repair_date?: Date;
  public repair_content?: string;
  // Multi-level approval fields
  public current_approval_level?: number;
  public head_approved_by?: number;
  public head_approved_at?: Date;
  public head_notes?: string;
  public admin_approved_by?: number;
  public admin_approved_at?: Date;
  public admin_notes?: string;
  public director_approved_by?: number;
  public director_approved_at?: Date;
  public director_notes?: string;
  public rejection_reason?: string;
  public rejected_by?: number;
  public rejected_at?: Date;
  public linked_procurement_id?: number;
  public linked_disposal_case_id?: number;
  public readonly created_at!: Date;
  public readonly updated_at!: Date;
  
  // Association declarations
  public damageImages?: import('./MaintenanceDamageImage').default[];
}

MaintenanceRequest.init(
  {
    id: {
      type: DataTypes.INTEGER,
      autoIncrement: true,
      primaryKey: true,
    },
    request_type: {
      type: DataTypes.ENUM('procurement', 'repair'),
      allowNull: false,
      defaultValue: 'procurement',
    },
    asset_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'assets',
        key: 'id',
      },
      onDelete: 'SET NULL',
    },
    department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
    },
    receiving_department_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'departments',
        key: 'id',
      },
      comment: 'Phòng ban nhận khi hoàn tất mua sắm/cấp phát',
    },
    description: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    urgency: {
      type: DataTypes.ENUM('low', 'normal', 'high', 'critical'),
      allowNull: false,
      defaultValue: 'normal',
    },
    requested_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    assigned_to: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    status: {
      type: DataTypes.ENUM(
        'draft', 'new', 'pending', 'approved', 
        'approved_by_head', 'approved_by_admin', 'approved_by_director',
        'in_progress', 'repair_completed', 'repair_approved',
        'done', 'completed',
        'rejected', 'rejected_by_head', 'rejected_by_admin', 'rejected_by_director',
        'rejected_due_to_high_cost'
      ),
      allowNull: false,
      defaultValue: 'draft', // Mặc định là draft để người dùng có thể chỉnh sửa trước khi gửi
    },
    cost: {
      type: DataTypes.DECIMAL(10, 2),
      allowNull: true,
    },
    start_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    completion_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Procurement fields
    category: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    device_name: {
      type: DataTypes.STRING(500),
      allowNull: true,
    },
    technical_specs: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    unit: {
      type: DataTypes.STRING(50),
      allowNull: true,
    },
    quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
      defaultValue: 1,
    },
    estimated_unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    unit_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    total_price: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    product_link: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    product_image: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    norm_limit: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    current_quantity: {
      type: DataTypes.INTEGER,
      allowNull: true,
    },
    justification: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Procurement fulfillment fields
    procurement_fulfilled: {
      type: DataTypes.BOOLEAN,
      allowNull: false,
      defaultValue: false,
      comment: 'Đã hoàn tất mua sắm và tạo tài sản hay chưa',
    },
    fulfilled_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    fulfilled_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    created_asset_ids: {
      // Postgres JSONB
      type: DataTypes.JSONB,
      allowNull: true,
      defaultValue: [],
      comment: 'Danh sách ID tài sản đã được tạo từ đề nghị mua sắm (tránh tạo trùng)',
    },
    procurement_year: {
      type: DataTypes.INTEGER,
      allowNull: true,
      comment: 'Năm mua sắm (phục vụ báo cáo nhanh)',
    },
    // Equipment repair fields
    asset_code_text: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    serial_number: {
      type: DataTypes.STRING(100),
      allowNull: true,
    },
    year_in_use: {
      type: DataTypes.STRING(10),
      allowNull: true,
    },
    current_condition: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    estimated_cost: {
      type: DataTypes.DECIMAL(15, 2),
      allowNull: true,
    },
    damage_images: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'JSON array of base64 encoded damage images for repair request. IMPORTANT: These images are for the repair request, NOT for the asset. They are stored separately in maintenance_requests table, completely independent from asset images in assets table.',
    },
    // Facility repair fields
    facility_name: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    last_repair_date: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    repair_content: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    // Multi-level approval fields
    current_approval_level: {
      type: DataTypes.INTEGER,
      allowNull: false,
      defaultValue: 1,
      comment: 'Current approval level: 1=Head, 2=Admin, 3=Director',
    },
    head_approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    head_approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    head_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    admin_approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    admin_approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    admin_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    director_approved_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    director_approved_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    director_notes: {
      type: DataTypes.TEXT,
      allowNull: true,
    },
    rejection_reason: {
      type: DataTypes.TEXT,
      allowNull: true,
      comment: 'Reason for rejection (required if rejected)',
    },
    rejected_by: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: {
        model: 'users',
        key: 'id',
      },
    },
    rejected_at: {
      type: DataTypes.DATE,
      allowNull: true,
    },
    linked_procurement_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'procurements', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK tới procurements – phiếu tăng tài sản được tạo từ đề nghị này',
    },
    linked_disposal_case_id: {
      type: DataTypes.INTEGER,
      allowNull: true,
      references: { model: 'asset_disposal_cases', key: 'id' },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
      comment: 'FK tới asset_disposal_cases – hồ sơ thanh lý/tiêu hủy được tạo từ đề nghị này',
    },
  },
  {
    sequelize,
    tableName: 'maintenance_requests',
    timestamps: true,
    underscored: true,
    indexes: [
      {
        fields: ['asset_id'],
      },
      {
        fields: ['status'],
      },
      {
        fields: ['urgency'],
      },
      {
        fields: ['request_type'],
      },
      {
        fields: ['procurement_fulfilled'],
      },
      {
        fields: ['procurement_year'],
      },
      {
        fields: ['receiving_department_id'],
      },
      {
        fields: ['current_approval_level'],
      },
    ],
  }
);

export default MaintenanceRequest;
