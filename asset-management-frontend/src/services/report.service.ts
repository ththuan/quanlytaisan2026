import api from './api';

export interface AnnualReport {
  id: number;
  department_id: number;
  year: number;
  total_assets: number;
  active_assets: number;
  damaged_assets: number;
  lost_assets: number;
  total_value: number;
  notes?: string;
  status: 'draft' | 'submitted' | 'approved' | 'rejected';
  submitted_by?: number;
  submitted_date?: string;
  approved_by?: number;
  approved_date?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateReportData {
  department_id: number;
  year: number;
  notes?: string;
}

export interface UpdateReportData {
  total_assets?: number;
  active_assets?: number;
  damaged_assets?: number;
  lost_assets?: number;
  total_value?: number;
  notes?: string;
}

class ReportService {
  async getAll(params?: any) {
    const response: any = await api.get('/reports', { params });
    return response;
  }

  async getById(id: number) {
    const response: any = await api.get(`/reports/${id}`);
    return response;
  }

  async getStatistics(params?: any) {
    const response: any = await api.get('/reports/statistics', { params });
    return response;
  }

  async create(data: CreateReportData) {
    const response: any = await api.post('/reports', data);
    return response;
  }

  async update(id: number, data: UpdateReportData) {
    const response: any = await api.put(`/reports/${id}`, data);
    return response;
  }

  async submit(id: number) {
    const response: any = await api.post(`/reports/${id}/submit`);
    return response;
  }

  async approve(id: number) {
    const response: any = await api.post(`/reports/${id}/approve`);
    return response;
  }

  async reject(id: number, notes?: string) {
    const response: any = await api.post(`/reports/${id}/reject`, { notes });
    return response;
  }

  async delete(id: number) {
    const response: any = await api.delete(`/reports/${id}`);
    return response;
  }
}

export default new ReportService();
