import api from './api';

export interface EquipmentNorm {
  id: number;
  document_no?: string | null;
  effective_date?: string | null;
  scope: 'title' | 'room' | 'digital' | 'secret' | 'other';
  position_group?: string | null;
  equipment_name: string;
  unit: string;
  max_quantity?: number | null;
  max_price?: number | null;
  note?: string | null;
  is_active: boolean;
}

export interface NormWarning {
  id: number;
  asset_id?: number | null;
  department_id?: number | null;
  norm_id?: number | null;
  warning_type: 'quantity' | 'price';
  message: string;
  asset_code?: string | null;
  asset_name?: string | null;
  purchase_price?: number | null;
  acknowledged: boolean;
  acknowledged_at?: string | null;
  created_at: string;
  department?: { id: number; name: string } | null;
  norm?: { id: number; equipment_name: string } | null;
}

const normService = {
  async listNorms(params?: { scope?: string; search?: string; is_active?: boolean }) {
    return api.get('/norms', { params });
  },
  async createNorm(data: Partial<EquipmentNorm>) {
    return api.post('/norms', data);
  },
  async updateNorm(id: number, data: Partial<EquipmentNorm>) {
    return api.put(`/norms/${id}`, data);
  },
  async deleteNorm(id: number) {
    return api.delete(`/norms/${id}`);
  },
  async listWarnings(params?: { department_id?: number; acknowledged?: boolean; limit?: number }) {
    return api.get('/norms/warnings', { params });
  },
  async acknowledgeWarning(id: number) {
    return api.post(`/norms/warnings/${id}/ack`);
  },
};

export default normService;
