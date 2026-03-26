import api from './api';
import type { Asset, ApiResponse } from '@/types/models';

export interface AssetQueryParams {
  page?: number;
  limit?: number;
  search?: string;
  category?: string;
  category_code?: string;
  asset_type?: string;
  status?: string;
  current_department_id?: number | string;
  /** Lọc theo phòng ban cha + tất cả phòng ban con (backend) */
  include_children?: string | boolean;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

export const assetService = {
  async getAssets(params?: AssetQueryParams): Promise<ApiResponse<Asset[]>> {
    return api.get('/assets', { params });
  },

  async getAssetById(id: number): Promise<ApiResponse<Asset>> {
    return api.get(`/assets/${id}`);
  },

  async createAsset(data: Partial<Asset>): Promise<ApiResponse<Asset>> {
    return api.post('/assets', data);
  },

  async updateAsset(id: number, data: Partial<Asset>): Promise<ApiResponse<Asset>> {
    return api.put(`/assets/${id}`, data);
  },

  async deleteAsset(id: number): Promise<ApiResponse<void>> {
    return api.delete(`/assets/${id}`);
  },

  async uploadImage(id: number, file: File): Promise<ApiResponse<{ image_url: string }>> {
    const formData = new FormData();
    formData.append('image', file);
    return api.post(`/assets/${id}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
  },

  async getAssetHistory(id: number): Promise<ApiResponse<any[]>> {
    return api.get(`/assets/${id}/history`);
  },

  async getRepairHistory(id: number): Promise<ApiResponse<any[]>> {
    return api.get(`/assets/${id}/repair-history`);
  },

  async getStatistics(params?: AssetQueryParams): Promise<ApiResponse<any>> {
    return api.get('/assets/statistics', { params });
  },

  // QR Code methods
  async getQRCode(id: number): Promise<ApiResponse<{ qr_code: string; qr_code_image: string }>> {
    return api.get(`/assets/${id}/qrcode`);
  },

  async generateQRCode(id: number): Promise<ApiResponse<{ qr_code: string; qr_code_image: string }>> {
    return api.post(`/assets/${id}/qrcode/generate`);
  },

  async decodeQRCode(qr_data: string): Promise<ApiResponse<{ asset: Asset; qr_data: any }>> {
    return api.post('/assets/qrcode/decode', { qr_data });
  },

  async generateAllQRCodes(): Promise<ApiResponse<{ generated: number; failed: number; total: number; errors: string[] }>> {
    return api.post('/assets/qrcode/generate-all');
  },
};
