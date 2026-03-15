/**
 * Import Service
 * Frontend service for bulk asset import
 */

import api from './api';

export interface ImportResult {
  success?: boolean;
  total: number;
  imported: number;
  failed: number;
  errors: ImportError[];
}

export interface ImportError {
  row: number;
  assetCode?: string;
  field: string;
  message: string;
}

/**
 * Download template Excel file
 * Sử dụng axios với responseType blob
 * Lưu ý: api interceptor trả về response.data nên ta cần lấy trực tiếp response
 */
export const downloadTemplate = async (): Promise<void> => {
  // Gọi trực tiếp và lấy data (interceptor đã unwrap response.data)
  const data = await api.get('/import/template', {
    responseType: 'blob',
  });
  
  // data chính là blob vì interceptor trả về response.data
  const blob = new Blob([data as unknown as BlobPart], { 
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' 
  });
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'mau_import_tai_san.xlsx';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  window.URL.revokeObjectURL(url);
};

/**
 * Import assets from Excel file
 */
export const importAssets = async (file: File): Promise<{
  success: boolean;
  message: string;
  data: ImportResult;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  
  const response = await api.post('/import/assets', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  
  // api interceptor đã unwrap response.data (axios), nên response = { success, message, data }
  return response as any;
};

export default {
  downloadTemplate,
  importAssets,
};
