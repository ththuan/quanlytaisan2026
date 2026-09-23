import Joi from 'joi';

// User validation schemas
// Public registration: chỉ cho phép staff, KHÔNG nhận role/department_id từ client
// (chống leo thang đặc quyền - department_head chỉ được tạo bởi admin)
export const registerSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  fullname: Joi.string().max(255).optional(),
});

export const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

export const changePasswordSchema = Joi.object({
  old_password: Joi.string().required(),
  new_password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .required()
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
});

// Asset validation schemas
export const createAssetSchema = Joi.object({
  asset_code: Joi.string().max(100).required(),
  name: Joi.string().max(255).required(),
  description: Joi.string().allow('', null).optional(),
  // Cho phép tên loại tài sản dài hơn (tên đầy đủ có thể > 100 ký tự)
  category: Joi.string().max(255).allow('', null).optional(),
  category_id: Joi.number().integer().positive().allow(null).optional(),
  category_code: Joi.string().max(50).allow('', null).optional(),
  unit: Joi.string().max(50).allow('', null).optional(),
  asset_type: Joi.string().max(100).allow('', null).optional(),
  purchase_date: Joi.date().allow(null).optional(),
  purchase_price: Joi.number().min(0).precision(2).allow(null).optional(),
  current_value: Joi.number().min(0).precision(2).allow(null).optional(),
  residual_value: Joi.number().min(0).precision(2).allow(null).optional(),
  serial_number: Joi.string().max(100).allow('', null).optional(),
  warranty_date: Joi.date().allow(null).optional(),
  current_department_id: Joi.number().integer().positive().allow(null).optional(),
  status: Joi.string().valid('active', 'inactive', 'damaged', 'lost', 'disposed', 'pending_disposal', 'pending_repair').optional(),
  location: Joi.string().max(255).allow('', null).optional(),
  year_in_use: Joi.number().integer().min(1990).max(2100).allow(null).optional(),
  quantity: Joi.when('unit', {
    is: Joi.string().valid('m2', 'm²', 'M2', 'M²'),
    then: Joi.number().integer().min(1).required()
      .messages({
        'any.required': 'Số lượng là bắt buộc khi đơn vị tính là m2',
        'number.base': 'Số lượng phải là số nguyên',
        'number.min': 'Số lượng phải lớn hơn hoặc bằng 1',
      }),
    otherwise: Joi.number().integer().min(1).optional(),
  }),
  is_depreciable: Joi.boolean().optional(),
  depreciation_rate: Joi.number().min(0).max(100).precision(2).allow(null).optional(),
  useful_life: Joi.number().integer().min(1).max(100).allow(null).optional(),
  asset_condition: Joi.string().valid('good', 'usable', 'needs_repair', 'damaged', 'disposed').optional(),
  land_parcel_id: Joi.number().integer().min(0).allow(null).optional(),
});

export const updateAssetSchema = Joi.object({
  asset_code: Joi.string().max(100).optional(),
  name: Joi.string().max(255).optional(),
  description: Joi.string().allow('', null).optional(),
  // Cho phép tên loại tài sản dài hơn (tên đầy đủ có thể > 100 ký tự)
  category: Joi.string().max(255).allow('', null).optional(),
  category_id: Joi.number().integer().positive().allow(null).optional(),
  category_code: Joi.string().max(50).allow('', null).optional(),
  unit: Joi.string().max(50).allow('', null).optional(),
  asset_type: Joi.string().max(100).allow('', null).optional(),
  purchase_date: Joi.date().allow(null).optional(),
  purchase_price: Joi.number().min(0).precision(2).allow(null).optional(),
  current_value: Joi.number().min(0).precision(2).allow(null).optional(),
  residual_value: Joi.number().min(0).precision(2).allow(null).optional(),
  serial_number: Joi.string().max(100).allow('', null).optional(),
  warranty_date: Joi.date().allow(null).optional(),
  current_department_id: Joi.number().integer().positive().allow(null).optional(),
  status: Joi.string().valid('active', 'inactive', 'damaged', 'lost', 'disposed', 'pending_disposal', 'pending_repair').optional(),
  location: Joi.string().max(255).allow('', null).optional(),
  year_in_use: Joi.number().integer().min(1990).max(2100).allow(null).optional(),
  quantity: Joi.when('unit', {
    is: Joi.string().valid('m2', 'm²', 'M2', 'M²'),
    then: Joi.number().integer().min(1).required()
      .messages({
        'any.required': 'Số lượng là bắt buộc khi đơn vị tính là m2',
        'number.base': 'Số lượng phải là số nguyên',
        'number.min': 'Số lượng phải lớn hơn hoặc bằng 1',
      }),
    otherwise: Joi.number().integer().min(1).optional(),
  }),
  is_depreciable: Joi.boolean().optional(),
  depreciation_rate: Joi.number().min(0).max(100).precision(2).allow(null).optional(),
  useful_life: Joi.number().integer().min(1).max(100).allow(null).optional(),
  asset_condition: Joi.string().valid('good', 'usable', 'needs_repair', 'damaged', 'disposed').optional(),
  land_parcel_id: Joi.number().integer().min(0).allow(null).optional(),
}).min(1);

// Transfer validation schemas
export const createTransferSchema = Joi.object({
  asset_id: Joi.number().integer().positive().required(),
  from_department_id: Joi.number().integer().positive().optional(),
  to_department_id: Joi.number().integer().positive().required(),
  reason: Joi.string().allow('', null).optional(),
  notes: Joi.string().allow('', null).optional(),
});

// Maintenance validation schemas
export const createMaintenanceSchema = Joi.object({
  request_type: Joi.string().valid('procurement', 'repair').optional(),
  asset_id: Joi.number().integer().positive().allow(null).optional(),
  department_id: Joi.number().integer().positive().optional().allow(null),
  description: Joi.string().allow('', null).optional(),
  justification: Joi.string().allow('', null).optional(),
  urgency: Joi.string().valid('low', 'normal', 'high', 'critical').optional(),
  status: Joi.string().valid('draft', 'new', 'pending', 'approved', 'approved_by_head', 'approved_by_admin', 'approved_by_director', 'in_progress', 'repair_completed', 'repair_approved', 'done', 'completed', 'rejected', 'rejected_by_head', 'rejected_by_admin', 'rejected_by_director').optional(),
  cost: Joi.number().positive().precision(2).optional().allow(null),
  notes: Joi.string().allow('', null).optional(),
  // Procurement fields
  category: Joi.string().max(50).allow('', null).optional(),
  device_name: Joi.string().max(500).allow('', null).optional(),
  technical_specs: Joi.string().allow('', null).optional(),
  unit: Joi.string().max(50).allow('', null).optional(),
  quantity: Joi.number().integer().min(1).optional(),
  estimated_unit_price: Joi.number().min(0).precision(2).optional().allow(null),
  unit_price: Joi.number().min(0).precision(2).optional().allow(null),
  total_price: Joi.number().min(0).precision(2).optional().allow(null),
  product_link: Joi.string().allow('', null).optional(),
  product_image: Joi.string().allow('', null).optional(),
  norm_limit: Joi.number().integer().min(0).optional().allow(null),
  current_quantity: Joi.number().integer().min(0).optional().allow(null),
  // Equipment repair fields
  asset_code_text: Joi.string().max(100).allow('', null).optional(),
  serial_number: Joi.string().max(100).allow('', null).optional(),
  year_in_use: Joi.string().max(10).allow('', null).optional(),
  current_condition: Joi.string().allow('', null).optional(),
  estimated_cost: Joi.number().min(0).precision(2).optional().allow(null),
  // Facility repair fields
  facility_name: Joi.string().allow('', null).optional(),
  last_repair_date: Joi.date().optional().allow(null),
  repair_content: Joi.string().allow('', null).optional(),
  damage_images: Joi.alternatives().try(
    Joi.string().allow('', null),
    Joi.array().items(Joi.string())
  ).optional(),
}).or('description', 'justification', 'device_name'); // At least one of these must be provided

export const updateMaintenanceSchema = Joi.object({
  description: Joi.string().allow('', null).optional(),
  urgency: Joi.string().valid('low', 'normal', 'high', 'critical').optional(),
  status: Joi.string().valid(
    'draft', 'new', 'pending', 'approved', 
    'approved_by_head', 'approved_by_admin', 'approved_by_director',
    'in_progress', 'repair_completed', 'repair_approved',
    'done', 'completed',
    'rejected', 'rejected_by_head', 'rejected_by_admin', 'rejected_by_director'
  ).optional(),
  cost: Joi.number().positive().precision(2).optional().allow(null),
  assigned_to: Joi.number().integer().positive().optional().allow(null),
  start_date: Joi.date().optional().allow(null),
  completion_date: Joi.date().optional().allow(null),
  notes: Joi.string().allow('', null).optional(),
  // Procurement fields
  category: Joi.string().max(50).allow('', null).optional(),
  device_name: Joi.string().max(500).allow('', null).optional(),
  technical_specs: Joi.string().allow('', null).optional(),
  unit: Joi.string().max(50).allow('', null).optional(),
  quantity: Joi.number().integer().min(1).optional(),
  estimated_unit_price: Joi.number().min(0).precision(2).optional().allow(null),
  unit_price: Joi.number().min(0).precision(2).optional().allow(null),
  total_price: Joi.number().min(0).precision(2).optional().allow(null),
  product_link: Joi.string().allow('', null).optional(),
  product_image: Joi.string().allow('', null).optional(),
  norm_limit: Joi.number().integer().min(0).optional().allow(null),
  current_quantity: Joi.number().integer().min(0).optional().allow(null),
  justification: Joi.string().allow('', null).optional(),
  damage_images: Joi.alternatives().try(
    Joi.string().allow('', null),
    Joi.array().items(Joi.string())
  ).optional(),
}).min(1);

// Fulfill procurement (create assets & allocate to department)
export const fulfillProcurementSchema = Joi.object({
  department_id: Joi.number().integer().positive().allow(null).optional(), // receiving department
  purchase_date: Joi.date().allow(null).optional(),
  assets: Joi.array().items(
    Joi.object({
      asset_code: Joi.string().max(100).allow('', null).optional(), // prefix or exact code
      asset_code_prefix: Joi.string().max(100).allow('', null).optional(), // optional alias for clarity
      name: Joi.string().max(255).required(),
      description: Joi.string().allow('', null).optional(),
      category: Joi.string().max(255).allow('', null).optional(),
      category_id: Joi.number().integer().positive().allow(null).optional(),
      category_code: Joi.string().max(50).allow('', null).optional(),
      unit: Joi.string().max(50).allow('', null).optional(),
      asset_type: Joi.string().max(100).allow('', null).optional(),
      year_in_use: Joi.number().integer().min(1990).max(2100).allow(null).optional(),
      quantity: Joi.number().integer().min(1).default(1),
      purchase_price: Joi.number().min(0).precision(2).allow(null).optional(),
      current_value: Joi.number().min(0).precision(2).allow(null).optional(),
      residual_value: Joi.number().min(0).precision(2).allow(null).optional(),
      useful_life: Joi.number().integer().min(1).max(100).allow(null).optional(),
      is_depreciable: Joi.boolean().optional(),
      depreciation_rate: Joi.number().min(0).max(100).precision(2).allow(null).optional(),
      serial_number: Joi.string().max(100).allow('', null).optional(),
      warranty_date: Joi.date().allow(null).optional(),
      location: Joi.string().max(255).allow('', null).optional(),
      asset_condition: Joi.string().valid('good', 'usable', 'needs_repair', 'damaged', 'disposed').optional(),
      land_parcel_id: Joi.number().integer().min(0).allow(null).optional(),
    })
  ).min(1).required(),
}).required();

// Department validation schemas
export const createDepartmentSchema = Joi.object({
  name: Joi.string().max(255).required(),
  type: Joi.string().valid('department', 'faculty', 'center', 'classroom', 'lab', 'meeting_room', 'hall').optional(),
  parent_department_id: Joi.number().integer().positive().optional().allow(null),
  manager_id: Joi.number().integer().positive().optional().allow(null),
  description: Joi.string().allow('', null).optional(),
});

export const updateDepartmentSchema = Joi.object({
  name: Joi.string().max(255).optional(),
  type: Joi.string().valid('department', 'faculty', 'center', 'classroom', 'lab', 'meeting_room', 'hall').optional(),
  parent_department_id: Joi.number().integer().positive().optional().allow(null),
  manager_id: Joi.number().integer().positive().optional().allow(null),
  description: Joi.string().allow('', null).optional(),
}).min(1);

// Annual Report validation schemas
export const createReportSchema = Joi.object({
  department_id: Joi.number().integer().positive().required(),
  year: Joi.number().integer().min(2000).max(2100).required(),
  notes: Joi.string().allow('', null).optional(),
});

export const updateReportSchema = Joi.object({
  total_assets: Joi.number().integer().min(0).optional(),
  active_assets: Joi.number().integer().min(0).optional(),
  damaged_assets: Joi.number().integer().min(0).optional(),
  lost_assets: Joi.number().integer().min(0).optional(),
  total_value: Joi.number().positive().precision(2).optional().allow(null),
  notes: Joi.string().allow('', null).optional(),
}).min(1);

// User CRUD validation schemas
export const createUserSchema = Joi.object({
  username: Joi.string().alphanum().min(3).max(100).required(),
  email: Joi.string().email().required(),
  password: Joi.string()
    .min(8)
    .pattern(new RegExp('^(?=.*[a-z])(?=.*[A-Z])(?=.*\\d)'))
    .optional()
    .allow('', null)
    .messages({
      'string.pattern.base': 'Password must contain at least one uppercase letter, one lowercase letter, and one number',
    }),
  fullname: Joi.string().max(255).optional(),
  role: Joi.string().valid('admin', 'director', 'department_head', 'staff').optional(),
  department_id: Joi.number().integer().positive().optional(),
  is_active: Joi.boolean().optional(),
});

export const updateUserSchema = Joi.object({
  email: Joi.string().email().optional(),
  fullname: Joi.string().max(255).optional(),
  role: Joi.string().valid('admin', 'director', 'department_head', 'staff').optional(),
  department_id: Joi.number().integer().positive().optional(),
  is_active: Joi.boolean().optional(),
}).min(1);

// Profile tự cập nhật — CHỈ cho phép trường an toàn (không role/department_id/is_active)
// để tránh leo thang đặc quyền.
export const updateProfileSchema = Joi.object({
  email: Joi.string().email().optional(),
  fullname: Joi.string().max(255).optional(),
}).min(1);

// Procurement/Cấp phát (admin-only) schemas
export const createProcurementSchema = Joi.object({
  code: Joi.string().max(50).allow('', null).optional(),
  title: Joi.string().max(255).required(),
  description: Joi.string().allow('', null).optional(),
  receiving_department_id: Joi.number().integer().positive().required(),
  purchase_date: Joi.date().allow(null).optional(),
  supplier_name: Joi.string().max(255).allow('', null).optional(),
  contract_no: Joi.string().max(100).allow('', null).optional(),
  invoice_no: Joi.string().max(100).allow('', null).optional(),
  order_code: Joi.string().max(100).allow('', null).optional(),
  items: Joi.array().items(
    Joi.object({
      asset_code_prefix: Joi.string().max(100).allow('', null).optional(),
      name: Joi.string().max(255).required(),
      description: Joi.string().allow('', null).optional(),
      category: Joi.string().max(255).allow('', null).optional(),
      category_id: Joi.number().integer().positive().allow(null).optional(),
      category_code: Joi.string().max(50).allow('', null).optional(),
      unit: Joi.string().max(50).allow('', null).optional(),
      quantity: Joi.number().integer().min(1).required(),
      purchase_price: Joi.number().min(0).precision(2).allow(null).optional(),
      residual_value: Joi.number().min(0).precision(2).allow(null).optional(),
      asset_type: Joi.string().max(100).allow('', null).optional(),
      serial_number: Joi.string().max(100).allow('', null).optional(),
      warranty_date: Joi.date().allow(null).optional(),
      location: Joi.string().max(255).allow('', null).optional(),
      asset_condition: Joi.string().valid('good', 'usable', 'needs_repair', 'damaged', 'disposed').optional(),
      land_parcel_id: Joi.number().integer().min(0).allow(null).optional(),
      is_depreciable: Joi.boolean().optional(),
      useful_life: Joi.number().integer().min(1).max(100).allow(null).optional(),
      depreciation_rate: Joi.number().min(0).max(100).precision(2).allow(null).optional(),
      purchase_date: Joi.date().allow(null).optional(),
      year_in_use: Joi.number().integer().min(1990).max(2100).allow(null).optional(),
      current_department_id: Joi.number().integer().positive().allow(null).optional(),
    })
  ).min(1).required(),
});

export const updateProcurementSchema = Joi.object({
  title: Joi.string().max(255).optional(),
  description: Joi.string().allow('', null).optional(),
  receiving_department_id: Joi.number().integer().positive().optional(),
  purchase_date: Joi.date().allow(null).optional(),
  supplier_name: Joi.string().max(255).allow('', null).optional(),
  contract_no: Joi.string().max(100).allow('', null).optional(),
  invoice_no: Joi.string().max(100).allow('', null).optional(),
  order_code: Joi.string().max(100).allow('', null).optional(),
  status: Joi.string().valid('draft', 'cancelled').optional(),
  items: Joi.array().items(
    Joi.object({
      id: Joi.number().integer().positive().optional(),
      asset_code_prefix: Joi.string().max(100).allow('', null).optional(),
      name: Joi.string().max(255).required(),
      description: Joi.string().allow('', null).optional(),
      category: Joi.string().max(255).allow('', null).optional(),
      category_id: Joi.number().integer().positive().allow(null).optional(),
      category_code: Joi.string().max(50).allow('', null).optional(),
      unit: Joi.string().max(50).allow('', null).optional(),
      quantity: Joi.number().integer().min(1).required(),
      purchase_price: Joi.number().min(0).precision(2).allow(null).optional(),
      residual_value: Joi.number().min(0).precision(2).allow(null).optional(),
      asset_type: Joi.string().max(100).allow('', null).optional(),
      serial_number: Joi.string().max(100).allow('', null).optional(),
      warranty_date: Joi.date().allow(null).optional(),
      location: Joi.string().max(255).allow('', null).optional(),
      asset_condition: Joi.string().valid('good', 'usable', 'needs_repair', 'damaged', 'disposed').optional(),
      land_parcel_id: Joi.number().integer().min(0).allow(null).optional(),
      is_depreciable: Joi.boolean().optional(),
      useful_life: Joi.number().integer().min(1).max(100).allow(null).optional(),
      depreciation_rate: Joi.number().min(0).max(100).precision(2).allow(null).optional(),
    })
  ).optional(),
}).min(1);

export const fulfillProcurementOnlyAdminSchema = Joi.object({
  // Optional overrides for created assets
  purchase_date: Joi.date().allow(null).optional(),
  items: Joi.array().items(
    Joi.object({
      procurement_item_id: Joi.number().integer().positive().required(),
      asset_code_prefix: Joi.string().max(100).allow('', null).optional(),
      quantity: Joi.number().integer().min(1).optional(),
      purchase_price: Joi.number().min(0).precision(2).allow(null).optional(),
    })
  ).optional(),
}).optional();

// Process approval validation schema
export const processApprovalSchema = Joi.object({
  decision: Joi.string().valid('approved', 'rejected').required(),
  reason: Joi.string().when('decision', {
    is: 'rejected',
    then: Joi.string().min(1).required().messages({
      'any.required': 'Lý do từ chối là bắt buộc',
      'string.min': 'Lý do từ chối không được để trống',
    }),
    otherwise: Joi.string().allow('', null).optional(),
  }),
  notes: Joi.string().allow('', null).optional(),
  assigned_to: Joi.number().integer().positive().optional().allow(null),
});
