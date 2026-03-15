import { defineStore } from 'pinia';
import transferService from '../services/transfer.service';
import type { Transfer, CreateTransferData } from '../services/transfer.service';

interface TransferState {
  transfers: Transfer[];
  currentTransfer: Transfer | null;
  transferHistory: Transfer[];
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useTransferStore = defineStore('transfer', {
  state: (): TransferState => ({
    transfers: [],
    currentTransfer: null,
    transferHistory: [],
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
    async fetchTransfers(params?: any) {
      this.loading = true;
      this.error = null;
      try {
        const response = await transferService.getAll(params);
        this.transfers = response.data;
        this.pagination = response.pagination;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch transfers';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchTransferById(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await transferService.getById(id);
        this.currentTransfer = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch transfer';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async fetchTransferHistory(assetId: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await transferService.getHistory(assetId);
        this.transferHistory = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch transfer history';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createTransfer(data: CreateTransferData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await transferService.create(data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create transfer';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async approveTransfer(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await transferService.approve(id);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to approve transfer';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async rejectTransfer(id: number, notes?: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await transferService.reject(id, notes);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to reject transfer';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
