import api from './api';

export interface MaintenanceRequest {
  id: number;
  asset_id: number;
  department_id?: number;
  requested_by: number;
  approved_by?: number;
  assigned_to?: number;
  description: string;
  urgency: 'low' | 'normal' | 'high' | 'critical';
  status:
    | 'draft' | 'new' | 'pending'
    | 'approved_by_head' | 'approved_by_admin' | 'approved_by_director'
    | 'rejected_by_head' | 'rejected_by_admin' | 'rejected_by_director'
    | 'in_progress' | 'repair_completed' | 'repair_approved'
    | 'completed' | 'done' | 'rejected';
  cost?: number;
  start_date?: string;
  completion_date?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateMaintenanceData {
  asset_id: number;
  department_id?: number;
  description: string;
  urgency?: 'low' | 'normal' | 'high' | 'critical';
  cost?: number;
  notes?: string;
  damage_images?: string | null;
}

export interface UpdateMaintenanceData {
  description?: string;
  urgency?: 'low' | 'normal' | 'high' | 'critical';
  status?:
    | 'draft' | 'new' | 'pending'
    | 'approved_by_head' | 'approved_by_admin' | 'approved_by_director'
    | 'in_progress' | 'repair_completed' | 'completed';
  cost?: number;
  assigned_to?: number;
  notes?: string;
}

class MaintenanceService {
  async getAll(params?: any) {
    const response: any = await api.get('/maintenance', { params });
    return response;
  }

  async getById(id: number) {
    const response: any = await api.get(`/maintenance/${id}`);
    return response;
  }

  async create(data: CreateMaintenanceData) {
    const response: any = await api.post('/maintenance', data);
    return response;
  }

  async update(id: number, data: UpdateMaintenanceData) {
    const response: any = await api.put(`/maintenance/${id}`, data);
    return response;
  }

  async approve(id: number, assignedTo?: number) {
    const response: any = await api.post(`/maintenance/${id}/approve`, { assigned_to: assignedTo });
    return response;
  }

  async reject(id: number, notes?: string) {
    const response: any = await api.post(`/maintenance/${id}/reject`, { notes });
    return response;
  }

  async delete(id: number) {
    const response: any = await api.delete(`/maintenance/${id}`);
    return response;
  }
}

export default new MaintenanceService();
