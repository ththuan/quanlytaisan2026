import api from './api';

export type ConstructionStatus = 'planned' | 'in_progress' | 'completed' | 'cancelled';

export interface ConstructionWork {
  id: number;
  code: string;
  name: string;
  asset_id?: number | null;
  department_id?: number | null;
  location?: string | null;
  description?: string | null;
  contractor?: string | null;
  start_date?: string | null;
  end_date?: string | null;
  estimated_cost?: number | null;
  actual_cost?: number | null;
  status: ConstructionStatus;
  notes?: string | null;
  asset?: { id: number; asset_code: string; name: string; category?: string | null; location?: string | null } | null;
  department?: { id: number; name: string } | null;
  creator?: { id: number; fullname?: string; username?: string } | null;
  created_at?: string;
  updated_at?: string;
}

class ConstructionWorkService {
  async list(params?: any) {
    return api.get('/construction-works', { params });
  }

  async getById(id: number) {
    return api.get(`/construction-works/${id}`);
  }

  async create(data: Partial<ConstructionWork>) {
    return api.post('/construction-works', data);
  }

  async update(id: number, data: Partial<ConstructionWork>) {
    return api.put(`/construction-works/${id}`, data);
  }

  async remove(id: number) {
    return api.delete(`/construction-works/${id}`);
  }
}

export default new ConstructionWorkService();
