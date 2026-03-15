import api from './api';

export interface User {
  id: number;
  username: string;
  email: string;
  fullname?: string;
  role: 'admin' | 'director' | 'department_head' | 'staff';
  department_id?: number;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface CreateUserData {
  username: string;
  email: string;
  password: string;
  fullname?: string;
  role?: 'admin' | 'manager' | 'staff' | 'user';
  department_id?: number;
}

export interface UpdateUserData {
  email?: string;
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
}

export default new UserService();
