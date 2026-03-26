/**
 * Inventory Service
 * Frontend service for inventory management
 */

import api from './api';

export interface InventoryRound {
  id: number;
  round_name: string;
  round_year: number;
  description?: string;
  start_date: string;
  end_date: string;
  status: 'not_started' | 'in_progress' | 'awaiting_approval' | 'completed';
  total_departments: number;
  completed_departments: number;
  created_by: number;
  creator?: {
    id: number;
    full_name: string;
    email: string;
  };
  reports?: InventoryReport[];
  created_at: string;
  updated_at: string;
  unsubmitted_departments?: { id: number; name: string }[];
  incomplete_departments?: { id: number; name: string }[];
}

export interface InventoryReport {
  id: number;
  round_id: number;
  department_id: number;
  department?: {
    id: number;
    name: string;
  };
  status: 'draft' | 'pending' | 'approved_by_head' | 'rejected_by_head' | 'approved_by_admin' | 'rejected_by_admin' | 'completed';
  total_assets: number;
  matched_assets: number;
  surplus_assets: number;
  missing_assets: number;
  /** Số tài sản đánh dấu cần sửa chữa (theo báo cáo kiểm kê) */
  needs_repair_assets?: number;
  damaged_assets: number;
  total_original_value: number;
  total_current_value: number;
  notes?: string;
  created_by: number;
  creator?: {
    id: number;
    full_name: string;
  };
  approved_by_dept?: number;
  approved_by_admin?: number;
  rejection_reason?: string;
  rejection_count?: number;
  head_approved_by?: number;
  head_approved_at?: string;
  head_notes?: string;
  admin_approved_by?: number;
  admin_approved_at?: string;
  admin_notes?: string;
  submitted_at?: string;
  details?: InventoryReportDetail[];
  created_at: string;
  updated_at: string;
}

export interface InventoryReportDetail {
  id: number;
  report_id: number;
  asset_id: number;
  asset?: {
    id: number;
    asset_code: string;
    name: string;
    category_code?: string;
    unit?: string;
    original_value: number;
    current_value: number;
    status: string;
  };
  book_quantity: number;
  actual_quantity: number;
  quantity_difference: number;
  book_value: number;
  actual_value: number;
  value_difference: number;
  asset_condition: 'good' | 'usable' | 'needs_repair' | 'damaged' | 'disposed';
  check_status: 'matched' | 'surplus' | 'missing' | 'damaged';
  /** Lý do / ghi chú khi duyệt thanh lý vs sửa chữa */
  disposal_reason?: string;
  notes?: string;
  checked_by?: number;
  checked_at?: string;
}

export interface CreateInventoryRoundInput {
  round_name: string;
  round_year: number;
  description?: string;
  start_date: string;
  end_date: string;
}

export interface CreateInventoryReportInput {
  round_id: number;
  department_id: number;
  notes?: string;
}

export interface AddInventoryDetailInput {
  asset_id: number;
  actual_quantity: number;
  actual_value?: number;
  asset_condition: string;
  check_status: string;
  notes?: string;
}

// Axios interceptor in api.ts returns response.data already.
// Backend typically returns { success: true, data: ... }.
const unwrapData = <T>(payload: any): T => {
  if (payload && typeof payload === 'object' && 'data' in payload) {
    return payload.data as T;
  }
  return payload as T;
};

class InventoryService {
  // ==================== INVENTORY ROUNDS ====================

  async getActiveRound(): Promise<InventoryRound | null> {
    try {
      const payload: any = await api.get('/inventory/rounds/active');
      const round = unwrapData<InventoryRound | null>(payload);
      return round || null;
    } catch (error: any) {
      if (error.response?.status === 404) {
        return null;
      }
      throw error;
    }
  }

  async getAllRounds(params?: {
    page?: number;
    limit?: number;
    year?: number;
    status?: string;
  }): Promise<{ data: InventoryRound[]; total: number; page: number; limit: number }> {
    const payload: any = await api.get('/inventory/rounds', { params });

    // backend returns { success: true, data, total, page, limit }
    const data = (payload?.data && Array.isArray(payload.data) ? payload.data : payload?.items || payload?.results || []) as InventoryRound[];
    const total = payload?.total ?? payload?.count ?? (Array.isArray(data) ? data.length : 0);
    const pageOut = payload?.page ?? params?.page ?? 1;
    const limitOut = payload?.limit ?? payload?.per_page ?? params?.limit ?? 10;

    return { data, total, page: pageOut, limit: limitOut };
  }

  async getRoundById(id: number): Promise<InventoryRound> {
    if (!id || isNaN(id) || id <= 0) {
      throw new Error(`Invalid round ID: ${id}`);
    }
    const payload: any = await api.get(`/inventory/rounds/${id}`);
    return unwrapData<InventoryRound>(payload);
  }

  async createRound(data: CreateInventoryRoundInput): Promise<InventoryRound> {
    const payload: any = await api.post('/inventory/rounds', data);
    return unwrapData<InventoryRound>(payload);
  }

  async completeRound(id: number): Promise<InventoryRound> {
    const payload: any = await api.post(`/inventory/rounds/${id}/complete`);
    return unwrapData<InventoryRound>(payload);
  }

  async extendRound(id: number, end_date: string): Promise<InventoryRound> {
    const payload: any = await api.post(`/inventory/rounds/${id}/extend`, { end_date });
    return unwrapData<InventoryRound>(payload);
  }

  // ==================== INVENTORY REPORTS ====================

  async getAssetsForInventory(params?: { department_id?: number; round_id?: number; limit?: number }): Promise<any[]> {
    const payload: any = await api.get('/inventory/assets', { params });
    const data = unwrapData<any>(payload);

    if (data?.data?.data && Array.isArray(data.data.data)) return data.data.data;
    if (data?.data && Array.isArray(data.data)) return data.data;
    if (Array.isArray(data)) return data;
    return [];
  }

  async findAssetByCode(code: string): Promise<any> {
    const payload: any = await api.get(`/inventory/assets/by-code/${encodeURIComponent(code)}`);
    return unwrapData<any>(payload);
  }

  async getPendingReportsCount(): Promise<number> {
    const payload: any = await api.get('/inventory/reports/pending');
    const data = unwrapData<any>(payload);
    return data?.count || 0;
  }

  async getReports(params?: {
    page?: number;
    limit?: number;
    round_id?: number;
    department_id?: number;
    status?: string;
  }): Promise<{ data: InventoryReport[]; total: number; page: number; limit: number }> {
    const payload: any = await api.get('/inventory/reports', { params });

    const data = (payload?.data && Array.isArray(payload.data) ? payload.data : payload?.items || payload?.results || []) as InventoryReport[];
    const total = payload?.total ?? payload?.count ?? (Array.isArray(data) ? data.length : 0);
    const pageOut = payload?.page ?? params?.page ?? 1;
    const limitOut = payload?.limit ?? payload?.per_page ?? params?.limit ?? 10;

    return { data, total, page: pageOut, limit: limitOut };
  }

  async getReportById(id: number): Promise<InventoryReport> {
    if (!id || isNaN(id) || id <= 0) {
      throw new Error(`Invalid report ID: ${id}`);
    }
    const payload: any = await api.get(`/inventory/reports/${id}`);
    return unwrapData<InventoryReport>(payload);
  }

  async createReport(data: CreateInventoryReportInput): Promise<InventoryReport> {
    const payload: any = await api.post('/inventory/reports', data);
    return unwrapData<InventoryReport>(payload);
  }

  async addDetail(reportId: number, data: AddInventoryDetailInput): Promise<InventoryReportDetail> {
    const payload: any = await api.post(`/inventory/reports/${reportId}/details`, data);
    return unwrapData<InventoryReportDetail>(payload);
  }

  async updateDetail(reportId: number, detailId: number, data: Partial<AddInventoryDetailInput>): Promise<InventoryReportDetail> {
    const payload: any = await api.patch(`/inventory/reports/${reportId}/details/${detailId}`, data);
    return unwrapData<InventoryReportDetail>(payload);
  }

  async submitReport(id: number): Promise<InventoryReport> {
    const payload: any = await api.post(`/inventory/reports/${id}/submit`);
    return unwrapData<InventoryReport>(payload);
  }

  async approveReport(
    id: number,
    approved: boolean,
    rejection_reason?: string,
    repair_approved_asset_ids?: number[]
  ): Promise<InventoryReport> {
    const payload: any = await api.post(`/inventory/reports/${id}/approve`, {
      approved,
      rejection_reason,
      repair_approved_asset_ids,
    });
    return unwrapData<InventoryReport>(payload);
  }
}

export const inventoryService = new InventoryService();
export default inventoryService;
