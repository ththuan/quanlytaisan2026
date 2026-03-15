/**
 * Export Service
 * Frontend service for exporting assets to Excel
 */

import api from './api';

export interface ExportQueryParams {
  search?: string;
  category_code?: string;
  status?: string;
  current_department_id?: number;
}

/**
 * Export assets to Excel file
 * @param params - Query parameters for filtering assets
 */
export const exportAssets = async (params?: ExportQueryParams): Promise<void> => {
  // Build query string
  const queryParams = new URLSearchParams();
  if (params) {
    if (params.search) queryParams.append('search', params.search);
    if (params.category_code) queryParams.append('category_code', params.category_code);
    if (params.status) queryParams.append('status', params.status);
    if (params.current_department_id) queryParams.append('current_department_id', String(params.current_department_id));
  }

  const queryString = queryParams.toString();
  const url = `/assets/export${queryString ? `?${queryString}` : ''}`;

  // Call API with blob response type
  // Note: API interceptor returns response.data, so with responseType: 'blob',
  // the data will be a Blob directly
  const data = await api.get(url, {
    responseType: 'blob',
  });

  // Create blob and download
  // data is already a Blob from the interceptor (response.data)
  const blob = new Blob([data as unknown as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  });
  const url_obj = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url_obj;
  
  // Generate filename with current date
  const date = new Date().toISOString().split('T')[0];
  link.download = `Danh_sach_tai_san_${date}.xlsx`;
  
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url_obj);
};

export default {
  exportAssets,
};
