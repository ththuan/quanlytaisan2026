import { defineStore } from 'pinia';
import maintenanceService from '../services/maintenance.service';
import type {
  MaintenanceRequest,
  CreateMaintenanceData,
  UpdateMaintenanceData,
} from '../services/maintenance.service';

interface MaintenanceState {
  maintenanceRequests: MaintenanceRequest[];
  currentRequest: MaintenanceRequest | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useMaintenanceStore = defineStore('maintenance', {
  state: (): MaintenanceState => ({
    maintenanceRequests: [],
    currentRequest: null,
    loading: false,
    error: null,
    pagination: {
      total: 0,
      page: 1,
      limit: 10,
      totalPages: 0,
    },
  }),

  getters: {
    requests: (state) => state.maintenanceRequests,
  },

  actions: {
    async fetchMaintenanceRequests(params?: any) {
      this.loading = true;
      this.error = null;
      try {
        const response = await maintenanceService.getAll(params);
        this.maintenanceRequests = response.data;
        this.pagination = response.pagination;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch maintenance requests';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchRequests(params?: any) {
      return this.fetchMaintenanceRequests(params);
    },

    async approveRequest(id: number, assignedTo?: number) {
      return this.approveMaintenance(id, assignedTo);
    },

    async fetchMaintenanceById(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await maintenanceService.getById(id);
        this.currentRequest = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch maintenance request';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createMaintenance(data: CreateMaintenanceData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await maintenanceService.create(data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create maintenance request';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateMaintenance(id: number, data: UpdateMaintenanceData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await maintenanceService.update(id, data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update maintenance request';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async approveMaintenance(id: number, assignedTo?: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await maintenanceService.approve(id, assignedTo);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to approve maintenance request';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async rejectMaintenance(id: number, notes?: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await maintenanceService.reject(id, notes);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to reject maintenance request';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteMaintenance(id: number) {
      this.loading = true;
      this.error = null;
      try {
        await maintenanceService.delete(id);
        this.maintenanceRequests = this.maintenanceRequests.filter((m) => m.id !== id);
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete maintenance request';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
