import api from './api';

export interface TableLayoutData {
  table_key: string;
  columns: Record<string, number>;
  layout_version: number;
  updated_at?: string;
}

class TableLayoutService {
  async get(tableKey: string) {
    return api.get(`/table-layouts/${tableKey}`);
  }

  async save(
    tableKey: string,
    payload: { columns: Record<string, number>; layout_version: number },
  ) {
    return api.put(`/table-layouts/${tableKey}`, payload);
  }
}

export default new TableLayoutService();
