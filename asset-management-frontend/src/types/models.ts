export interface User {
  id: number;
  username: string;
  email: string;
  fullname?: string;
  role: 'admin' | 'director' | 'department_head' | 'manager' | 'staff' | 'user';
  department_id?: number;
  department?: Department;
  is_active: boolean;
  totp_enabled?: boolean;
  last_login?: string;
  created_at?: string;
  updated_at?: string;
}

export interface Department {
  id: number;
  name: string;
  type?: 'center' | 'faculty' | 'room' | 'lab' | 'office';
  parent_department_id?: number;
  manager_id?: number;
  description?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AssetCategoryInfo {
  id?: number;
  code?: string;
  name?: string;
  category_group?: string;
  unit?: string;
  is_depreciable?: boolean;
  depreciation_rate?: number;
  useful_life_years?: number;
}

export interface Asset {
  id: number;
  asset_code: string;
  name: string;
  description?: string;
  category?: string;
  category_code?: string;
  category_id?: number;
  unit?: string;
  asset_type?: string;
  quantity?: number;
  year_in_use?: number;
  purchase_date?: string;
  purchase_price?: number;
  current_value?: number;
  residual_value?: number;
  useful_life?: number;
  depreciation_rate?: number;
  accumulated_depreciation?: number;
  is_depreciable?: boolean;
  asset_condition?: string;
  serial_number?: string;
  warranty_date?: string;
  current_department_id?: number;
  status: 'active' | 'inactive' | 'damaged' | 'lost' | 'disposed';
  location?: string;
  image_url?: string;
  assetCategory?: AssetCategoryInfo;
  created_at?: string;
  updated_at?: string;
  current_department?: Department;
  depreciation_info?: DepreciationInfo;
}

export interface DepreciationInfo {
  originalValue: number;
  usefulLife?: number;
  usefulLifeYears?: number;
  depreciationRate?: number;
  annualDepreciationRate?: number;
  annualDepreciationAmount: number;
  yearsUsed: number;
  accumulatedDepreciation: number;
  remainingValue?: number;
  currentValue?: number;
  remainingUsefulLife: number;
  isFullyDepreciated: boolean;
  isDepreciable?: boolean;
  calculationMethod?: 'database' | 'custom' | 'regulation';
  calculationNotes?: string;
  categoryInfo?: {
    code: string;
    name: string;
    categoryGroup: string;
  };
}

export interface DepreciationHistory {
  year: number;
  depreciationAmount: number;
  accumulatedDepreciation: number;
  remainingValue: number;
}

export interface AssetTransfer {
  id: number;
  asset_id: number;
  from_department_id?: number;
  to_department_id?: number;
  requested_by?: number;
  approved_by?: number;
  transfer_date?: string;
  reason?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface MaintenanceRequest {
  id: number;
  asset_id: number;
  department_id?: number;
  description: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  requested_by?: number;
  approved_by?: number;
  assigned_to?: number;
  status: 'new' | 'approved' | 'in_progress' | 'done' | 'rejected';
  cost?: number;
  start_date?: string;
  completion_date?: string;
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface AnnualReport {
  id: number;
  department_id: number;
  year: number;
  total_assets?: number;
  active_assets?: number;
  damaged_assets?: number;
  lost_assets?: number;
  total_value?: number;
  submitted_by?: number;
  submitted_date?: string;
  approved_by?: number;
  approved_date?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  notes?: string;
  created_at?: string;
  updated_at?: string;
}

export interface PaginationData {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasNext: boolean;
  hasPrev: boolean;
}

export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  pagination?: PaginationData;
}
