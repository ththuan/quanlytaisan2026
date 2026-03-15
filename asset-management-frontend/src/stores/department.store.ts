import { defineStore } from 'pinia';
import departmentService from '../services/department.service';
import type {
  Department,
  CreateDepartmentData,
  UpdateDepartmentData,
} from '../services/department.service';

interface DepartmentState {
  departments: Department[];
  currentDepartment: Department | null;
  departmentTree: Department[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useDepartmentStore = defineStore('department', {
  state: (): DepartmentState => ({
    departments: [],
    currentDepartment: null,
    departmentTree: [],
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  }),

  actions: {
    async fetchDepartments(params?: any) {
      this.loading = true;
      this.error = null;
      try {
        const response = await departmentService.getAll(params);
        this.departments = response.data;
        this.pagination = response.pagination;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch departments';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchDepartmentById(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await departmentService.getById(id);
        this.currentDepartment = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch department';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchDepartmentTree() {
      this.loading = true;
      this.error = null;
      try {
        const response = await departmentService.getTree();
        this.departmentTree = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch department tree';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createDepartment(data: CreateDepartmentData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await departmentService.create(data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create department';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateDepartment(id: number, data: UpdateDepartmentData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await departmentService.update(id, data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update department';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteDepartment(id: number, reassignUsersAndAssets = false) {
      this.loading = true;
      this.error = null;
      try {
        await departmentService.delete(id, reassignUsersAndAssets);
        this.departments = this.departments.filter((d) => d.id !== id);
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete department';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
