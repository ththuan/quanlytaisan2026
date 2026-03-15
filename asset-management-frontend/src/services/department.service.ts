import api from './api';

export interface Department {
  id: number;
  name: string;
  type?: 'center' | 'faculty' | 'room' | 'lab' | 'office';
  parent_department_id?: number;
  manager_id?: number;
  description?: string;
  created_at: string;
  updated_at: string;
}

export interface CreateDepartmentData {
  name: string;
  type?: 'center' | 'faculty' | 'room' | 'lab' | 'office';
  parent_department_id?: number;
  manager_id?: number;
  description?: string;
}

export interface UpdateDepartmentData {
  name?: string;
  type?: 'center' | 'faculty' | 'room' | 'lab' | 'office';
  parent_department_id?: number;
  manager_id?: number;
  description?: string;
}

class DepartmentService {
  async getAll(params?: any) {
    // API interceptor đã unwrap response.data
    const response: any = await api.get('/departments', { params });
    return response;
  }

  async getById(id: number) {
    const response: any = await api.get(`/departments/${id}`);
    return response;
  }

  async getTree() {
    const response: any = await api.get('/departments/tree');
    return response;
  }

  async create(data: CreateDepartmentData) {
    const response: any = await api.post('/departments', data);
    return response;
  }

  async update(id: number, data: UpdateDepartmentData) {
    const response: any = await api.put(`/departments/${id}`, data);
    return response;
  }

  async delete(id: number) {
    const response: any = await api.delete(`/departments/${id}`);
    return response;
  }

  async downloadTemplate() {
    const response: any = await api.get('/departments/import/template', {
      responseType: 'blob',
    });
    return response;
  }

  async importExcel(file: File) {
    const formData = new FormData();
    formData.append('file', file);

    const response: any = await api.post('/departments/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });

    return response;
  }
}

export default new DepartmentService();
