import api from './api';

export interface AssetDisposalCaseListParams {
  page?: number;
  limit?: number;
  status?: 'pending' | 'completed' | 'cancelled';
  origin_department_id?: number;
  search?: string;
}

export interface CompleteDisposalCasePayload {
  decision_no: string;
  decision_date?: string | null;
  decision_file_url?: string | null;
  notes?: string | null;
}

export interface CreateManualCasePayload {
  disposal_type: 'liquidation' | 'destruction';
  origin_department_id?: number | null;
  destruction_method?: string | null;
  disposal_method?: string | null;
  notes?: string | null;
  asset_ids: number[];
}

class AssetDisposalService {
  async listByAsset(assetId: number) {
    const response: any = await api.get('/asset-disposals', { params: { asset_id: assetId, limit: 50 } });
    return (response?.data || response?.rows || []) as any[];
  }

  async listCases(params?: AssetDisposalCaseListParams) {
    const response: any = await api.get('/asset-disposals', { params });
    return response;
  }

  async getCaseById(id: number) {
    const response: any = await api.get(`/asset-disposals/${id}`);
    return response;
  }

  async uploadDecisionFile(caseId: number, file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response: any = await api.post(`/asset-disposals/${caseId}/decision-file`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });

    return response;
  }

  async completeCase(id: number, payload: CompleteDisposalCasePayload) {
    const response: any = await api.post(`/asset-disposals/${id}/complete`, payload);
    return response;
  }

  async getPendingDisposalGrouped(): Promise<any[]> {
    const response: any = await api.get('/assets/pending-disposal-grouped');
    return response?.data || response || [];
  }

  /** Tạo hồ sơ tiêu hủy/thanh lý thủ công (Điều 23, 24 Quy chế 2026) */
  async createManualCase(payload: CreateManualCasePayload) {
    const response: any = await api.post('/asset-disposals/manual', payload);
    return response;
  }

  /** Chuyển đề nghị sửa chữa sang hồ sơ thanh lý/tiêu hủy khi chi phí > giá trị tài sản */
  async createFromMaintenance(maintenanceId: number, disposalType: 'liquidation' | 'destruction' = 'liquidation') {
    const response: any = await api.post(`/asset-disposals/from-maintenance/${maintenanceId}`, { disposal_type: disposalType });
    return response;
  }
}

export default new AssetDisposalService();
