import api from './api';
import { saveBlob } from '@/utils/download';

export interface User {
  id: number;
  username: string;
  fullname?: string;
  role: 'admin' | 'director' | 'department_head' | 'staff';
  department_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  username: string;
  password: string;
  fullname?: string;
  role?: 'admin' | 'manager' | 'staff' | 'user';
  department_id?: number;
}

export interface UpdateUserData {
  fullname?: string;
  role?: 'admin' | 'manager' | 'staff' | 'user';
  department_id?: number;
  is_active?: boolean;
}

class UserService {
  async getAll(params?: any) {
    const response: any = await api.get('/users', { params });
    return response;
  }

  async getById(id: number) {
    const response: any = await api.get(`/users/${id}`);
    return response;
  }

  async getProfile() {
    const response: any = await api.get('/users/profile');
    return response;
  }

  async updateProfile(data: UpdateUserData) {
    const response: any = await api.put('/users/profile', data);
    return response;
  }

  async create(data: CreateUserData) {
    const response: any = await api.post('/users', data);
    return response;
  }

  async update(id: number, data: UpdateUserData) {
    const response: any = await api.put(`/users/${id}`, data);
    return response;
  }

  async delete(id: number) {
    const response: any = await api.delete(`/users/${id}`);
    return response;
  }

  async resetPassword(id: number) {
    const response: any = await api.post(`/users/${id}/reset-password`);
    return response;
  }

  async downloadImportTemplate(): Promise<void> {
    const data = await api.get('/users/import/template', { responseType: 'blob' });
    const blob = new Blob([data as unknown as BlobPart], {
      type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    });
    await saveBlob(blob, 'mau_import_nguoi_dung.xlsx');
  }

  async validateUsersFile(file: File): Promise<{ success: boolean; message: string; data: UserImportResult }> {
    const formData = new FormData();
    formData.append('file', file);
    const response: any = await api.post('/users/import?validateOnly=true', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    if (response?.data) response.data.validatedOnly = true;
    return response;
  }

  async importUsers(file: File): Promise<{ success: boolean; message: string; data: UserImportResult }> {
    const formData = new FormData();
    formData.append('file', file);
    return api.post('/users/import', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    }) as Promise<any>;
  }
}

export interface UserImportResult {
  total: number;
  imported: number;
  failed: number;
  errors: Array<{ row: number; field: string; message: string }>;
  validatedOnly?: boolean;
}

export default new UserService();
