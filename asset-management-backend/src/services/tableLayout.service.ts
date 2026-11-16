import TableLayout from '../models/TableLayout';

export interface TableLayoutPayload {
  columns: Record<string, number>;
  layout_version: number;
  updated_by?: number | null;
}

class TableLayoutService {
  async getLayout(tableKey: string) {
    return TableLayout.findOne({
      where: { table_key: tableKey },
      raw: true,
    });
  }

  async saveLayout(tableKey: string, payload: TableLayoutPayload) {
    const existing = await TableLayout.findOne({ where: { table_key: tableKey } });

    if (existing) {
      await existing.update({
        columns: payload.columns,
        layout_version: payload.layout_version,
        updated_by: payload.updated_by ?? null,
      });
      return existing;
    }

    return TableLayout.create({
      table_key: tableKey,
      columns: payload.columns,
      layout_version: payload.layout_version,
      updated_by: payload.updated_by ?? null,
    });
  }
}

export default new TableLayoutService();
