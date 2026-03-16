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
  /** true = kết quả từ bước "Kiểm tra lỗi", chưa ghi DB */
  validatedOnly?: boolean;
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
 * Chỉ kiểm tra file Excel, không ghi database. Trả về lỗi (nếu có) để user sửa trước khi import.
 */
export const validateAssetsFile = async (file: File): Promise<{
  success: boolean;
  message: string;
  data: ImportResult;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/import/assets?validateOnly=true', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  const res = response as any;
  if (res?.data) res.data.validatedOnly = true;
  return res;
};

/**
 * Import assets from Excel file (ghi database). Nên gọi validateAssetsFile trước, chỉ gọi khi không còn lỗi.
 */
export const importAssets = async (file: File): Promise<{
  success: boolean;
  message: string;
  data: ImportResult;
}> => {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/import/assets', formData, {
    headers: { 'Content-Type': 'multipart/form-data' },
  });
  return response as any;
};

export default {
  downloadTemplate,
  validateAssetsFile,
  importAssets,
};
