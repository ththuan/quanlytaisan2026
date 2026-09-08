import api from './api';

export interface Transfer {
  id: number;
  asset_id: number;
  from_department_id?: number;
  to_department_id: number;
  requested_by: number;
  approved_by?: number;
  transfer_date: string;
  reason?: string;
  notes?: string;
  status: 'pending' | 'approved' | 'rejected' | 'completed' | 'approved_by_head' | 'rejected_by_head';
  created_at: string;
  updated_at: string;
}

export interface CreateTransferData {
  asset_id: number;
  from_department_id?: number;
  to_department_id: number;
  reason?: string;
  notes?: string;
}

class TransferService {
  async getAll(params?: any) {
    // API interceptor đã unwrap response.data, nên response đã là { success, data, pagination }
    const response: any = await api.get('/transfers', { params });
    return response;
  }

  async getById(id: number) {
    const response: any = await api.get(`/transfers/${id}`);
    return response;
  }

  async getHistory(assetId: number) {
    const response: any = await api.get(`/transfers/asset/${assetId}/history`);
    return response;
  }

  async create(data: CreateTransferData) {
    const response: any = await api.post('/transfers', data);
    return response;
  }

  async approve(id: number) {
    const response: any = await api.post(`/transfers/${id}/approve`);
    return response;
  }

  async reject(id: number, notes?: string) {
    const response: any = await api.post(`/transfers/${id}/reject`, { notes });
    return response;
  }

  async processApproval(id: number, decision: 'approved' | 'rejected', reason?: string, notes?: string) {
    const response: any = await api.post(`/transfers/${id}/process-approval`, {
      decision,
      reason,
      notes,
    });
    return response;
  }
}

export default new TransferService();
