import { defineStore } from 'pinia';
import reportService from '../services/report.service';
import type {
  AnnualReport,
  CreateReportData,
  UpdateReportData,
} from '../services/report.service';

interface ReportState {
  reports: AnnualReport[];
  currentReport: AnnualReport | null;
  statistics: any | null;
  loading: boolean;
  error: string | null;
  pagination: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  };
}

export const useReportStore = defineStore('report', {
  state: (): ReportState => ({
    reports: [],
    currentReport: null,
    statistics: null,
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
    async fetchReports(params?: any) {
      this.loading = true;
      this.error = null;
      try {
        const clean: Record<string, unknown> = {
          page: params?.page ?? this.pagination.page,
          limit: params?.limit ?? 50,
        };
        if (params?.year != null && params.year !== '') {
          clean.year = params.year;
        }
        if (params?.status) {
          clean.status = params.status;
        }
        if (params?.department_id != null && params.department_id !== '') {
          clean.department_id = params.department_id;
        }
        const response = await reportService.getAll(clean);
        this.reports = response.data;
        this.pagination = response.pagination;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch reports';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    /** Không set `loading` — tránh phủ loading cả bảng danh sách khi mở chi tiết. */
    async fetchReportById(id: number) {
      this.error = null;
      try {
        const response = await reportService.getById(id);
        this.currentReport = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch report';
        throw error;
      }
    },

    async fetchStatistics(params?: any) {
      this.loading = true;
      this.error = null;
      try {
        const response = await reportService.getStatistics(params);
        this.statistics = response.data;
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to fetch statistics';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async createReport(data: CreateReportData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await reportService.create(data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to create report';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async updateReport(id: number, data: UpdateReportData) {
      this.loading = true;
      this.error = null;
      try {
        const response = await reportService.update(id, data);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to update report';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async submitReport(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await reportService.submit(id);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to submit report';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async approveReport(id: number) {
      this.loading = true;
      this.error = null;
      try {
        const response = await reportService.approve(id);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to approve report';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async bulkApproveReports(ids: number[]) {
      this.loading = true;
      this.error = null;
      try {
        const response = await reportService.bulkApprove(ids);
        return response.data as {
          approved: number[];
          skipped: number[];
          failed: { id: number; reason: string }[];
        };
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to bulk approve';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async rejectReport(id: number, notes?: string) {
      this.loading = true;
      this.error = null;
      try {
        const response = await reportService.reject(id, notes);
        return response.data;
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to reject report';
        throw error;
      } finally {
        this.loading = false;
      }
    },

    async deleteReport(id: number) {
      this.loading = true;
      this.error = null;
      try {
        await reportService.delete(id);
        this.reports = this.reports.filter((r) => r.id !== id);
      } catch (error: any) {
        this.error = error.response?.data?.message || 'Failed to delete report';
        throw error;
      } finally {
        this.loading = false;
      }
    },
  },
});
