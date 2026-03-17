import api from './api';

export interface ProcurementDocumentMeta {
  id: number;
  procurement_id: number;
  file_name: string;
  mime_type: string;
  size_bytes: number;
  created_by?: number;
  created_at?: string;
}

class ProcurementDocumentsService {
  async list(procurementId: number) {
    const res: any = await api.get(`/procurements/${procurementId}/documents`);
    return res;
  }

  async upload(procurementId: number, file: File) {
    const form = new FormData();
    form.append('file', file);

    const res: any = await api.post(`/procurements/${procurementId}/documents`, form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
    return res;
  }

  async delete(procurementId: number, docId: number) {
    const res: any = await api.delete(`/procurements/${procurementId}/documents/${docId}`);
    return res;
  }

  getDownloadUrl(procurementId: number, docId: number) {
    const base = (import.meta as any).env?.VITE_API_BASE_URL || '/api';
    const token = localStorage.getItem('accessToken');
    const tokenParam = token ? `?token=${encodeURIComponent(token)}` : '';
    return `${base}/procurements/${procurementId}/documents/${docId}/download${tokenParam}`;
  }
}

export default new ProcurementDocumentsService();
