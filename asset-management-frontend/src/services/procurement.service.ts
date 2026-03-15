import api from './api';

export interface ProcurementItemInput {
  asset_code_prefix?: string | null;
  name: string;
  description?: string | null;
  category?: string | null;
  category_id?: number | null;
  category_code?: string | null;
  unit?: string | null;
  quantity: number;
  purchase_price?: number | null;
  is_depreciable?: boolean;
  useful_life?: number | null;
  depreciation_rate?: number | null;
}

export interface ProcurementInput {
  code?: string | null;
  title: string;
  description?: string | null;
  receiving_department_id: number;
  purchase_date?: string | null;
  items: ProcurementItemInput[];
}

class ProcurementService {
  async getAll(params?: any) {
    const response: any = await api.get('/procurements', { params });
    return response;
  }

  async getYearlySummary(params: { year: number; receiving_department_id?: number } | any) {
    const response: any = await api.get('/procurements/summary/yearly', { params });
    return response;
  }

  async exportExcel(params: { year: number; receiving_department_id?: number } | any) {
    const response: any = await api.get('/procurements/export/excel', { params, responseType: 'blob' });
    return response;
  }

  async getById(id: number) {
    const response: any = await api.get(`/procurements/${id}`);
    return response;
  }

  async create(data: ProcurementInput) {
    const response: any = await api.post('/procurements', data);
    return response;
  }

  async update(id: number, data: Partial<ProcurementInput> & { status?: 'draft' | 'cancelled' }) {
    const response: any = await api.put(`/procurements/${id}`, data);
    return response;
  }

  async delete(id: number) {
    const response: any = await api.delete(`/procurements/${id}`);
    return response;
  }

  async fulfill(id: number, payload?: { purchase_date?: string | null }) {
    const response: any = await api.post(`/procurements/${id}/fulfill`, payload || {});
    return response;
  }

  async createFromMaintenance(maintenanceId: number) {
    const response: any = await api.post(`/procurements/from-maintenance/${maintenanceId}`);
    return response;
  }
}

export default new ProcurementService();

