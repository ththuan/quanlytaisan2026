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

  /**
   * Mở tài liệu trong tab mới (dùng Authorization header, không truyền token qua URL)
   */
  async openDocument(procurementId: number, docId: number): Promise<void> {
    const data = await api.get(`/procurements/${procurementId}/documents/${docId}/download`, {
      responseType: 'blob',
    });
    const blob = new Blob([data as unknown as BlobPart]);
    const url = window.URL.createObjectURL(blob);
    window.open(url, '_blank');
    setTimeout(() => window.URL.revokeObjectURL(url), 10000);
  }
}

export default new ProcurementDocumentsService();
